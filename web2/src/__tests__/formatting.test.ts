// Port of tests/test_formatting.py
import { describe, expect, it } from "vitest";

import { formatAmount, formatExchangeRate } from "../formatting";

describe("formatAmount", () => {
  it("inserts space thousands separator", () => {
    expect(formatAmount("1234.56")).toBe("1 234,56");
  });

  it("no separator below 1000", () => {
    expect(formatAmount("123.45")).toBe("123,45");
  });

  it("zero", () => {
    expect(formatAmount("0.00")).toBe("0,00");
  });

  it("large number with multiple separators", () => {
    expect(formatAmount("1234567.89")).toBe("1 234 567,89");
  });

  it("integer pads two decimals", () => {
    expect(formatAmount("1000")).toBe("1 000,00");
  });
});

describe("formatExchangeRate", () => {
  it("pads to six decimals", () => {
    expect(formatExchangeRate("4.2346")).toBe("4,234600");
  });

  it("preserves already-six-decimal value", () => {
    expect(formatExchangeRate("4.234600")).toBe("4,234600");
  });
});
