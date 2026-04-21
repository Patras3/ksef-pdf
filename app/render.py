"""PDF rendering for KSeF invoices using Jinja2 + WeasyPrint."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from jinja2 import Environment, FileSystemLoader

from app.formatting import format_amount, format_exchange_rate
from app.mappings import (
    get_country_name,
    get_invoice_type,
    get_payment_form,
    get_tax_rate_display,
    get_tax_rate_footnote,
    get_tax_summary_label,
)
from app.num_words import amount_in_words
from app.qr import build_verification_url, generate_qr_base64

if TYPE_CHECKING:
    from app.models import Annotations, InvoiceData

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def _build_annotation_lines(annotations: Annotations) -> list[str]:
    """Map boolean annotation flags to bilingual display strings."""
    lines: list[str] = []
    if annotations.reverse_charge:
        lines.append(
            "Odwrotne obciążenie / Reverse charge"
        )
    if annotations.cash_method:
        lines.append(
            "Metoda kasowa / Cash accounting method"
        )
    if annotations.split_payment:
        lines.append(
            "Mechanizm podzielonej płatności / Split payment mechanism"
        )
    if annotations.self_invoicing:
        lines.append(
            "Samofakturowanie / Self-invoicing"
        )
    if annotations.simplified_triangular:
        lines.append(
            "Uproszczenie w wewnątrzwspólnotowej transakcji trójstronnej / "
            "Simplified procedure in intra-EU triangular transaction"
        )
    return lines


def _collect_footnotes(invoice: InvoiceData) -> list[str]:
    """Collect unique tax rate footnotes from line items (order-preserving)."""
    seen: set[str] = set()
    footnotes: list[str] = []
    for item in invoice.line_items:
        note = get_tax_rate_footnote(item.tax_rate)
        if note and note not in seen:
            seen.add(note)
            footnotes.append(note)
    return footnotes


def render_pdf(
    invoice: InvoiceData,
    output_path: Path | None = None,
) -> bytes:
    """Render an InvoiceData object to PDF bytes.

    Args:
        invoice: Parsed invoice data.
        output_path: If provided, write PDF to this path in addition to
            returning the bytes.

    Returns:
        PDF file contents as bytes.
    """
    # --- Build context variables ---
    invoice_type_pl, invoice_type_en = get_invoice_type(invoice.invoice_type)
    seller_country_pl, seller_country_en = get_country_name(
        invoice.seller.address.country_code
    )
    buyer_country_pl, buyer_country_en = get_country_name(
        invoice.buyer.address.country_code
    )
    payment_form_pl, payment_form_en = get_payment_form(invoice.payment.form_code)

    amount_words_pl, amount_words_en = amount_in_words(
        invoice.total_amount, invoice.currency
    )

    exchange_rate_formatted = (
        format_exchange_rate(invoice.exchange_rate)
        if invoice.exchange_rate
        else ""
    )

    # Exchange rate is "global" (from Fa/KursWaluty or shared across lines)
    # when it's set at the invoice level rather than per-line
    exchange_rate_is_global = bool(invoice.exchange_rate)

    # Payment status from Zaplacono field: "1" = paid, "2" = not paid
    if invoice.payment.paid == "1":
        payment_status_pl = "Zapłacono"
        payment_status_en = "Paid"
    else:
        payment_status_pl = "Brak zapłaty"
        payment_status_en = "Not yet paid"

    annotation_lines = _build_annotation_lines(invoice.annotations)
    footnotes = _collect_footnotes(invoice)

    qr_url = build_verification_url(
        nip=invoice.seller.nip,
        invoice_date=invoice.invoice_date,
        xml_bytes=invoice.xml_bytes,
    )
    qr_image = generate_qr_base64(qr_url)

    context = {
        "invoice": invoice,
        "invoice_type_pl": invoice_type_pl,
        "invoice_type_en": invoice_type_en,
        "seller_country_pl": seller_country_pl,
        "seller_country_en": seller_country_en,
        "buyer_country_pl": buyer_country_pl,
        "buyer_country_en": buyer_country_en,
        "payment_form_pl": payment_form_pl,
        "payment_form_en": payment_form_en,
        "payment_status_pl": payment_status_pl,
        "payment_status_en": payment_status_en,
        "amount_words_pl": amount_words_pl,
        "amount_words_en": amount_words_en,
        "exchange_rate_formatted": exchange_rate_formatted,
        "exchange_rate_is_global": exchange_rate_is_global,
        "annotation_lines": annotation_lines,
        "footnotes": footnotes,
        "qr_url": qr_url,
        "qr_image": qr_image,
        "format_amount": format_amount,
        "tax_rate_display": get_tax_rate_display,
        "tax_summary_label": get_tax_summary_label,
    }

    # --- Render HTML ---
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )
    template = env.get_template("invoice.html")
    html_str = template.render(**context)

    # --- Convert to PDF ---
    from weasyprint import HTML  # local import to keep startup fast

    pdf_bytes = HTML(
        string=html_str,
        base_url=str(TEMPLATES_DIR),
    ).write_pdf()

    if output_path is not None:
        output_path.write_bytes(pdf_bytes)

    return pdf_bytes
