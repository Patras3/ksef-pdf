// Port of tests/test_qr.py
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildVerificationUrl, generateQrDataUrl } from "../qr";

const FIXTURE = resolve(__dirname, "../../../tests/fixtures/sample_invoice.xml");

async function base64UrlOfSha256(bytes: Uint8Array): Promise<string> {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const arr = new Uint8Array(digest);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("buildVerificationUrl", () => {
  it("matches MF format and contains NIP, date, hash", async () => {
    const xmlBytes = new Uint8Array(readFileSync(FIXTURE));
    const expectedHash = await base64UrlOfSha256(xmlBytes);
    const url = await buildVerificationUrl("1111111111", "2026-04-21", xmlBytes);
    expect(url.startsWith("https://qr.ksef.mf.gov.pl/invoice/")).toBe(true);
    expect(url).toContain("1111111111");
    expect(url).toContain("21-04-2026");
    expect(url).toContain(expectedHash);
  });

  it("formats date as DD-MM-YYYY", async () => {
    const url = await buildVerificationUrl(
      "1111111111",
      "2026-01-15",
      new TextEncoder().encode("<test/>"),
    );
    expect(url).toContain("/15-01-2026/");
  });
});

describe("generateQrDataUrl", () => {
  it("produces a PNG data URI", async () => {
    const result = await generateQrDataUrl("https://example.com");
    expect(result.startsWith("data:image/png;base64,")).toBe(true);
    const b64 = result.split(",")[1]!;
    const decoded = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    // PNG signature: 0x89 'P' 'N' 'G'
    expect(decoded[0]).toBe(0x89);
    expect(decoded[1]).toBe(0x50);
    expect(decoded[2]).toBe(0x4e);
    expect(decoded[3]).toBe(0x47);
  });
});
