// Port of tests/test_render.py
//
// Pełny pipeline: XML → buildContext → buildDocDefinition → PdfPrinter
// (server-side pdfmake) → PDF bytes. Sprawdza że produkt jest validnym PDF.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildContext } from "../build-context";
import { vfs } from "../fonts.generated";
import { buildDocDefinition } from "../render-pdf";

const FIXTURE = resolve(__dirname, "../../../tests/fixtures/sample_invoice.xml");

async function renderPdfBytes(): Promise<Uint8Array> {
  const xmlString = readFileSync(FIXTURE, "utf8");
  const xmlBytes = new Uint8Array(readFileSync(FIXTURE));
  const ctx = await buildContext(xmlString, xmlBytes, "");

  // PdfPrinter (server-side) needs fonts on disk — write Roboto from vfs.
  const fontDir = mkdtempSync(join(tmpdir(), "ksef-fonts-"));
  for (const name of [
    "Roboto-Regular.ttf",
    "Roboto-Medium.ttf",
    "Roboto-Italic.ttf",
    "Roboto-MediumItalic.ttf",
  ]) {
    writeFileSync(join(fontDir, name), Buffer.from(vfs[name]!, "base64"));
  }
  const fonts = {
    Roboto: {
      normal: join(fontDir, "Roboto-Regular.ttf"),
      bold: join(fontDir, "Roboto-Medium.ttf"),
      italics: join(fontDir, "Roboto-Italic.ttf"),
      bolditalics: join(fontDir, "Roboto-MediumItalic.ttf"),
    },
  };

  // Dynamic import keeps pdfmake out of jsdom test env startup.
  // pdfmake/src/printer.js has no types — test-only, runtime checked.
  // @ts-expect-error untyped server-side pdfmake module
  const { default: PdfPrinter } = await import("pdfmake/src/printer.js");
  const printer = new PdfPrinter(fonts);
  const doc = printer.createPdfKitDocument(buildDocDefinition(ctx));

  const chunks: Buffer[] = [];
  return new Promise((resolveBytes, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolveBytes(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
    doc.end();
  });
}

describe("render-pdf integration", () => {
  it("produces non-trivial PDF bytes with %PDF- header", async () => {
    const bytes = await renderPdfBytes();
    // PDF magic bytes: "%PDF-"
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x44);
    expect(bytes[3]).toBe(0x46);
    expect(bytes[4]).toBe(0x2d);
    expect(bytes.length).toBeGreaterThan(1000);
  }, 30_000);
});
