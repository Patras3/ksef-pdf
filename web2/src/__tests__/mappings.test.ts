// Port of tests/test_mappings.py
import { describe, expect, it } from "vitest";

import {
  getCountryName,
  getInvoiceType,
  getPaymentForm,
  getTaxRateDisplay,
  getTaxRateFootnote,
  getTaxSummaryLabel,
} from "../mappings";

describe("getCountryName", () => {
  it("PL", () => {
    expect(getCountryName("PL")).toEqual(["Polska", "Poland"]);
  });
  it("US", () => {
    expect(getCountryName("US")).toEqual(["Stany Zjednoczone Ameryki", "United States"]);
  });
  it("unknown code falls back to itself", () => {
    expect(getCountryName("XX")).toEqual(["XX", "XX"]);
  });
});

describe("getInvoiceType", () => {
  it("VAT", () => {
    expect(getInvoiceType("VAT")).toEqual(["Faktura podstawowa", "Standard Invoice"]);
  });
});

describe("getPaymentForm", () => {
  it("transfer (6)", () => {
    expect(getPaymentForm("6")).toEqual(["Przelew", "Bank transfer"]);
  });
});

describe("getTaxRateDisplay", () => {
  it('"np I" → "np.I*"', () => {
    expect(getTaxRateDisplay("np I")).toBe("np.I*");
  });
  it('"23" → "23%"', () => {
    expect(getTaxRateDisplay("23")).toBe("23%");
  });
});

describe("getTaxRateFootnote", () => {
  it("returns text for np I", () => {
    expect(getTaxRateFootnote("np I")).toBe(
      "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    );
  });
  it("returns null for plain 23%", () => {
    expect(getTaxRateFootnote("23")).toBeNull();
  });
});

describe("getTaxSummaryLabel", () => {
  it("P_13_8 contains both PL and EN parts", () => {
    const label = getTaxSummaryLabel("P_13_8");
    expect(label).toContain("np z wyłączeniem art. 100 ust 1 pkt 4 ustawy");
    expect(label).toContain("Not subject to tax");
  });
});
