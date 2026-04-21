"""KSeF FA(3) XML parser — extracts invoice data into InvoiceData dataclasses."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path

from app.models import (
    Address,
    Annotations,
    BankAccount,
    Buyer,
    InvoiceData,
    LineItem,
    Party,
    Payment,
    PaymentTerms,
    TaxSummaryRow,
)

NS = "http://crd.gov.pl/wzor/2025/06/25/13775/"
_NS = f"{{{NS}}}"

# Maps (P_13_x tag, corresponding P_14_x tax tag or None)
TAX_SUMMARY_FIELDS = [
    ("P_13_1", "P_14_1"),
    ("P_13_2", "P_14_2"),
    ("P_13_3", "P_14_3"),
    ("P_13_4", "P_14_4"),
    ("P_13_5", "P_14_5"),
    ("P_13_6", "P_14_6"),
    ("P_13_7", "P_14_7"),
    ("P_13_8", None),   # np — no tax
    ("P_13_9", None),   # zw — no tax
    ("P_13_10", None),  # oo — no tax
    ("P_13_11", None),  # brak — no tax
]


def _tag(name: str) -> str:
    return f"{_NS}{name}"


def _text(el: ET.Element | None, path: str, default: str = "") -> str:
    if el is None:
        return default
    found = el.find(path, {"": NS})
    if found is None or found.text is None:
        return default
    return found.text.strip()


def _find(el: ET.Element | None, path: str) -> ET.Element | None:
    if el is None:
        return None
    return el.find(path, {"": NS})


def _parse_address(el: ET.Element | None) -> Address:
    return Address(
        country_code=_text(el, "KodKraju"),
        line1=_text(el, "AdresL1"),
        line2=_text(el, "AdresL2"),
    )


def _parse_seller(podmiot1: ET.Element) -> Party:
    dane = _find(podmiot1, "DaneIdentyfikacyjne")
    adres = _find(podmiot1, "Adres")
    return Party(
        nip=_text(dane, "NIP"),
        name=_text(dane, "Nazwa"),
        vat_prefix=_text(podmiot1, "PrefiksPodatnika"),
        address=_parse_address(adres),
    )


def _parse_buyer(podmiot2: ET.Element) -> Buyer:
    dane = _find(podmiot2, "DaneIdentyfikacyjne")
    adres = _find(podmiot2, "Adres")
    no_id_text = _text(dane, "BrakID")
    no_identifier = no_id_text == "1"
    # JST and GV: value "1" = yes, "2" = no
    jst_text = _text(podmiot2, "JST")
    gv_text = _text(podmiot2, "GV")
    return Buyer(
        nip=_text(dane, "NIP"),
        name=_text(dane, "Nazwa"),
        address=_parse_address(adres),
        no_identifier=no_identifier,
        jst=jst_text == "1",
        gv=gv_text == "1",
    )


def _parse_line_items(fa: ET.Element) -> list[LineItem]:
    items = []
    for wiersz in fa.findall(_tag("FaWiersz")):
        exchange_rate = _text(wiersz, "KursWaluty")
        items.append(LineItem(
            line_number=int(_text(wiersz, "NrWierszaFa") or "0"),
            name=_text(wiersz, "P_7"),
            unit=_text(wiersz, "P_8A"),
            quantity=_text(wiersz, "P_8B"),
            unit_net_price=_text(wiersz, "P_9A"),
            net_value=_text(wiersz, "P_11"),
            tax_rate=_text(wiersz, "P_12"),
            exchange_rate=exchange_rate,
        ))
    return items


def _parse_tax_summary(fa: ET.Element, total_gross: str) -> list[TaxSummaryRow]:
    rows = []
    for net_tag, tax_tag in TAX_SUMMARY_FIELDS:
        net_el = fa.find(_tag(net_tag))
        if net_el is None or not net_el.text:
            continue
        net_amount = net_el.text.strip()
        tax_amount = "0.00"
        if tax_tag:
            tax_el = fa.find(_tag(tax_tag))
            if tax_el is not None and tax_el.text:
                tax_amount = tax_el.text.strip()
        # gross = net + tax
        try:
            from decimal import Decimal
            gross = str(Decimal(net_amount) + Decimal(tax_amount))
            # preserve two decimal places
            gross = f"{Decimal(gross):.2f}"
        except Exception:
            gross = net_amount
        rows.append(TaxSummaryRow(
            rate_code=net_tag,
            net_amount=net_amount,
            tax_amount=tax_amount,
            gross_amount=gross,
        ))
    return rows


def _parse_annotations(adnotacje: ET.Element | None) -> Annotations:
    if adnotacje is None:
        return Annotations()
    # P_16: reverse charge (odwrotne obciążenie) — "1" = yes
    # P_17: cash method — "1" = yes
    # P_18: split payment — "1" = yes
    # P_18A: self-invoicing — "1" = yes
    # P_23: simplified triangular — "1" = yes
    return Annotations(
        reverse_charge=_text(adnotacje, "P_18") == "1",
        cash_method=_text(adnotacje, "P_16") == "1",
        split_payment=_text(adnotacje, "P_17") == "1",
        self_invoicing=_text(adnotacje, "P_18A") == "1",
        simplified_triangular=_text(adnotacje, "P_23") == "1",
    )


def _parse_payment(platnosc: ET.Element | None) -> Payment:
    if platnosc is None:
        return Payment()

    form_code = _text(platnosc, "FormaPlatnosci")
    paid = _text(platnosc, "Zaplacono")

    # Payment terms
    terms = None
    termin = _find(platnosc, "TerminPlatnosci")
    if termin is not None:
        termin_opis = _find(termin, "TerminOpis")
        if termin_opis is not None:
            terms = PaymentTerms(
                quantity=_text(termin_opis, "Ilosc"),
                unit=_text(termin_opis, "Jednostka"),
                starting_event=_text(termin_opis, "ZdarzeniePoczatkowe"),
            )

    # Bank account
    bank_account = None
    rachunek = _find(platnosc, "RachunekBankowy")
    if rachunek is not None:
        bank_account = BankAccount(
            iban=_text(rachunek, "NrRB"),
            swift=_text(rachunek, "SWIFT"),
            bank_name=_text(rachunek, "NazwaBanku"),
            description=_text(rachunek, "OpisRachunku"),
        )

    return Payment(form_code=form_code, paid=paid, terms=terms, bank_account=bank_account)


def parse_invoice(path: Path) -> InvoiceData:
    """Parse a KSeF FA(3) XML file and return an InvoiceData instance."""
    xml_bytes = path.read_bytes()
    root = ET.fromstring(xml_bytes)

    # KSeF number from filename stem (only if it looks like a KSeF reference)
    stem = path.stem
    ksef_number = stem if "-" in stem else ""

    podmiot1 = root.find(_tag("Podmiot1"))
    podmiot2 = root.find(_tag("Podmiot2"))
    fa = root.find(_tag("Fa"))

    seller = _parse_seller(podmiot1) if podmiot1 is not None else Party()
    buyer = _parse_buyer(podmiot2) if podmiot2 is not None else Buyer()

    line_items = _parse_line_items(fa) if fa is not None else []

    total_gross = _text(fa, "P_15") if fa is not None else "0.00"
    tax_summary = _parse_tax_summary(fa, total_gross) if fa is not None else []

    adnotacje = _find(fa, "Adnotacje") if fa is not None else None
    annotations = _parse_annotations(adnotacje)

    platnosc = _find(fa, "Platnosc") if fa is not None else None
    payment = _parse_payment(platnosc)

    # Exchange rate: try Fa/KursWaluty first, fall back to first FaWiersz/KursWaluty
    exchange_rate = ""
    if fa is not None:
        exchange_rate = _text(fa, "KursWaluty")
        if not exchange_rate and line_items:
            exchange_rate = line_items[0].exchange_rate

    return InvoiceData(
        invoice_number=_text(fa, "P_2") if fa is not None else "",
        invoice_type=_text(fa, "RodzajFaktury") if fa is not None else "",
        invoice_date=_text(fa, "P_1") if fa is not None else "",
        sale_date=_text(fa, "P_6") if fa is not None else "",
        currency=_text(fa, "KodWaluty") if fa is not None else "",
        exchange_rate=exchange_rate,
        total_amount=total_gross,
        seller=seller,
        buyer=buyer,
        line_items=line_items,
        tax_summary=tax_summary,
        annotations=annotations,
        payment=payment,
        ksef_number=ksef_number,
        xml_bytes=xml_bytes,
    )
