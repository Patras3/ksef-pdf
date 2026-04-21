from pathlib import Path
from app.parser import parse_invoice

FIXTURE = Path(__file__).parent / "fixtures" / "sample_invoice.xml"


def test_parse_returns_invoice_data():
    result = parse_invoice(FIXTURE)
    assert result.invoice_number == "FV/04/2026/001"
    assert result.invoice_type == "VAT"
    assert result.invoice_date == "2026-04-21"
    assert result.sale_date == "2026-04-30"
    assert result.currency == "EUR"
    assert result.total_amount == "1234.56"


def test_parse_seller():
    result = parse_invoice(FIXTURE)
    assert result.seller.nip == "1111111111"
    assert result.seller.name == "PRZYKŁADOWA FIRMA SP. Z O.O."
    assert result.seller.vat_prefix == "PL"
    assert result.seller.address.country_code == "PL"
    assert result.seller.address.line1 == "ul. Testowa 42/1"
    assert result.seller.address.line2 == "00-001 Warszawa"


def test_parse_buyer():
    result = parse_invoice(FIXTURE)
    assert result.buyer.name == "Example Corp"
    assert result.buyer.no_identifier is True
    assert result.buyer.nip == ""
    assert result.buyer.address.country_code == "US"
    assert result.buyer.jst is False
    assert result.buyer.gv is False


def test_parse_line_items():
    result = parse_invoice(FIXTURE)
    assert len(result.line_items) == 1
    item = result.line_items[0]
    assert item.line_number == 1
    assert item.name == "Usługi informatyczne / IT services"
    assert item.unit == "usługa/service"
    assert item.quantity == "1"
    assert item.unit_net_price == "1234.56"
    assert item.net_value == "1234.56"
    assert item.tax_rate == "np I"
    assert item.exchange_rate == "4.2346"


def test_parse_tax_summary():
    result = parse_invoice(FIXTURE)
    assert len(result.tax_summary) == 1
    row = result.tax_summary[0]
    assert row.rate_code == "P_13_8"
    assert row.net_amount == "1234.56"
    assert row.tax_amount == "0.00"
    assert row.gross_amount == "1234.56"


def test_parse_annotations():
    result = parse_invoice(FIXTURE)
    assert result.annotations.reverse_charge is True
    assert result.annotations.cash_method is False
    assert result.annotations.split_payment is False
    assert result.annotations.self_invoicing is False
    assert result.annotations.simplified_triangular is False


def test_parse_payment():
    result = parse_invoice(FIXTURE)
    assert result.payment.form_code == "6"
    assert result.payment.terms is not None
    assert result.payment.terms.quantity == "14"
    assert result.payment.terms.unit == "dni / days"
    assert result.payment.bank_account is not None
    assert result.payment.bank_account.iban == "PL00123456780000000000000001"
    assert result.payment.bank_account.swift == "EXMPPLPW"
    assert result.payment.bank_account.bank_name == "Example Bank SA"


def test_parse_ksef_number_from_filename():
    fixture_with_name = FIXTURE.parent / "1111111111-20260421-ABCDEF123456-01.xml"
    fixture_with_name.write_bytes(FIXTURE.read_bytes())
    try:
        result = parse_invoice(fixture_with_name)
        assert result.ksef_number == "1111111111-20260421-ABCDEF123456-01"
    finally:
        fixture_with_name.unlink()


def test_parse_stores_xml_bytes():
    result = parse_invoice(FIXTURE)
    assert len(result.xml_bytes) > 0
    assert b"<Faktura" in result.xml_bytes
