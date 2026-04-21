"""QR code generation for KSeF invoice verification."""

import base64
import hashlib
import io

import qrcode
import qrcode.constants

_BASE_URL = "https://qr.ksef.mf.gov.pl/invoice"


def build_verification_url(nip: str, invoice_date: str, xml_bytes: bytes) -> str:
    """Build the KSeF QR verification URL.

    Args:
        nip: Taxpayer NIP number.
        invoice_date: Invoice date in ISO format (YYYY-MM-DD).
        xml_bytes: Raw XML bytes of the invoice.

    Returns:
        URL of the form: https://qr.ksef.mf.gov.pl/invoice/{nip}/{DD-MM-YYYY}/{hash}
    """
    # SHA-256 → Base64URL (no padding)
    digest = hashlib.sha256(xml_bytes).digest()
    hash_b64url = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()

    # Convert date from YYYY-MM-DD to DD-MM-YYYY
    year, month, day = invoice_date.split("-")
    date_formatted = f"{day}-{month}-{year}"

    return f"{_BASE_URL}/{nip}/{date_formatted}/{hash_b64url}"


def generate_qr_base64(url: str) -> str:
    """Generate a QR code PNG and return it as a base64 data URI.

    Args:
        url: The URL to encode in the QR code.

    Returns:
        Data URI string: "data:image/png;base64,<base64-encoded PNG>"
    """
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    encoded = base64.b64encode(png_bytes).decode()
    return f"data:image/png;base64,{encoded}"
