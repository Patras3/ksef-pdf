// QR code generation for KSeF invoice verification — port of app/qr.py.

import QRCode from "qrcode";

const BASE_URL = "https://qr.ksef.mf.gov.pl/invoice";

/** Base64URL (RFC 4648 §5) — like base64 but +/= replaced by -_ and padding stripped. */
function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Validate ISO date format YYYY-MM-DD */
function isValidIsoDate(dateStr: string): boolean {
  if (!dateStr || dateStr.length !== 10) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  // Check if it's a valid date
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day;
}

/**
 * Build the KSeF QR verification URL.
 *
 * Format: https://qr.ksef.mf.gov.pl/invoice/{nip}/{DD-MM-YYYY}/{sha256_b64url(xml)}
 */
export async function buildVerificationUrl(
  nip: string,
  invoiceDateIso: string,
  xmlBytes: Uint8Array,
): Promise<string> {
  // Validate date format
  if (!isValidIsoDate(invoiceDateIso)) {
    throw new Error(`Nieprawidłowy format daty: "${invoiceDateIso}". Oczekiwano YYYY-MM-DD.`);
  }

  // Copy bytes into a fresh ArrayBuffer — TS narrows Uint8Array.buffer to
  // ArrayBuffer | SharedArrayBuffer and digest only accepts the former.
  const buf = new ArrayBuffer(xmlBytes.byteLength);
  new Uint8Array(buf).set(xmlBytes);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const hash = base64UrlEncode(new Uint8Array(digest));
  const [year, month, day] = invoiceDateIso.split("-");
  const date = `${day}-${month}-${year}`;
  return `${BASE_URL}/${nip}/${date}/${hash}`;
}

/** Generate QR code as PNG data URI. */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 270,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
