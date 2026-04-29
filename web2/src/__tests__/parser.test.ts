// Port of tests/test_parser.py
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ksefNumberFromFilename, parseInvoiceXml } from "../parser";

const FIXTURE = resolve(__dirname, "../../../tests/fixtures/sample_invoice.xml");
const xmlString = readFileSync(FIXTURE, "utf8");

describe("parseInvoiceXml — top-level fields", () => {
  it("returns invoice basics", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.invoice_number).toBe("FV/04/2026/001");
    expect(r.invoice_type).toBe("VAT");
    expect(r.invoice_date).toBe("2026-04-21");
    expect(r.sale_date).toBe("2026-04-30");
    expect(r.currency).toBe("EUR");
    expect(r.total_amount).toBe("1234.56");
  });
});

describe("parseInvoiceXml — seller", () => {
  it("parses NIP, name, vat_prefix, address", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.seller.nip).toBe("1111111111");
    expect(r.seller.name).toBe("PRZYKŁADOWA FIRMA SP. Z O.O.");
    expect(r.seller.vat_prefix).toBe("PL");
    expect(r.seller.address.country_code).toBe("PL");
    expect(r.seller.address.line1).toBe("ul. Testowa 42/1");
    expect(r.seller.address.line2).toBe("00-001 Warszawa");
  });
});

describe("parseInvoiceXml — buyer", () => {
  it("parses no_identifier, name, address, JST/GV", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.buyer.name).toBe("Example Corp");
    expect(r.buyer.no_identifier).toBe(true);
    expect(r.buyer.nip).toBe("");
    expect(r.buyer.address.country_code).toBe("US");
    expect(r.buyer.jst).toBe(false);
    expect(r.buyer.gv).toBe(false);
  });
});

describe("parseInvoiceXml — line items", () => {
  it("parses single line item with all fields", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.line_items.length).toBe(1);
    const item = r.line_items[0]!;
    expect(item.line_number).toBe(1);
    expect(item.name).toBe("Usługi informatyczne / IT services");
    expect(item.unit).toBe("usługa/service");
    expect(item.quantity).toBe("1");
    expect(item.unit_net_price).toBe("1234.56");
    expect(item.net_value).toBe("1234.56");
    expect(item.tax_rate).toBe("np I");
    expect(item.exchange_rate).toBe("4.2346");
  });
});

describe("parseInvoiceXml — tax summary", () => {
  it("parses single P_13_8 row with computed gross", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.tax_summary.length).toBe(1);
    const row = r.tax_summary[0]!;
    expect(row.rate_code).toBe("P_13_8");
    expect(row.net_amount).toBe("1234.56");
    expect(row.tax_amount).toBe("0.00");
    expect(row.gross_amount).toBe("1234.56");
  });
});

describe("parseInvoiceXml — annotations", () => {
  it("maps P_18=1 → reverse_charge true, others false", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.annotations.reverse_charge).toBe(true);
    expect(r.annotations.cash_method).toBe(false);
    expect(r.annotations.split_payment).toBe(false);
    expect(r.annotations.self_invoicing).toBe(false);
    expect(r.annotations.simplified_triangular).toBe(false);
  });
});

describe("parseInvoiceXml — payment", () => {
  it("parses form, terms, bank account", () => {
    const r = parseInvoiceXml(xmlString);
    expect(r.payment.form_code).toBe("6");
    expect(r.payment.terms).not.toBeNull();
    expect(r.payment.terms!.quantity).toBe("14");
    expect(r.payment.terms!.unit).toBe("dni / days");
    expect(r.payment.bank_account).not.toBeNull();
    expect(r.payment.bank_account!.iban).toBe("PL00123456780000000000000001");
    expect(r.payment.bank_account!.swift).toBe("EXMPPLPW");
    expect(r.payment.bank_account!.bank_name).toBe("Example Bank SA");
  });
});

describe("ksefNumberFromFilename", () => {
  it("returns the stem when filename matches NIP-DATE-ID-NN.xml", () => {
    expect(
      ksefNumberFromFilename("1111111111-20260421-ABCDEF123456-01.xml"),
    ).toBe("1111111111-20260421-ABCDEF123456-01");
  });
  it("returns empty for non-matching filename (stricter than Python: regex-based)", () => {
    expect(ksefNumberFromFilename("invoice-foo.xml")).toBe("");
    expect(ksefNumberFromFilename("sample_invoice.xml")).toBe("");
  });
});
