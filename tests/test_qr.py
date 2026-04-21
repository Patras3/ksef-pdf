import base64
import hashlib
from pathlib import Path

from app.qr import build_verification_url, generate_qr_base64

FIXTURE = Path(__file__).parent / "fixtures" / "sample_invoice.xml"


def test_build_verification_url():
    xml_bytes = FIXTURE.read_bytes()
    sha = hashlib.sha256(xml_bytes).digest()
    expected_hash = base64.urlsafe_b64encode(sha).rstrip(b"=").decode()
    url = build_verification_url(
        nip="1111111111",
        invoice_date="2026-04-21",
        xml_bytes=xml_bytes,
    )
    assert url.startswith("https://qr.ksef.mf.gov.pl/invoice/")
    assert "1111111111" in url
    assert "21-04-2026" in url
    assert expected_hash in url


def test_build_verification_url_date_format():
    url = build_verification_url(
        nip="1111111111",
        invoice_date="2026-01-15",
        xml_bytes=b"<test/>",
    )
    assert "/15-01-2026/" in url


def test_generate_qr_base64():
    result = generate_qr_base64("https://example.com")
    assert result.startswith("data:image/png;base64,")
    png_b64 = result.split(",")[1]
    decoded = base64.b64decode(png_b64)
    assert decoded[:4] == b"\x89PNG"
