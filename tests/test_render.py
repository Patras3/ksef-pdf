from pathlib import Path
from app.parser import parse_invoice
from app.render import render_pdf

FIXTURE = Path(__file__).parent / "fixtures" / "sample_invoice.xml"


def test_render_pdf_returns_bytes():
    invoice = parse_invoice(FIXTURE)
    pdf_bytes = render_pdf(invoice)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes[:5] == b"%PDF-"
    assert len(pdf_bytes) > 1000


def test_render_pdf_to_file(tmp_path):
    invoice = parse_invoice(FIXTURE)
    output = tmp_path / "test.pdf"
    render_pdf(invoice, output_path=output)
    assert output.exists()
    assert output.read_bytes()[:5] == b"%PDF-"
