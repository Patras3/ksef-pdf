// Port of tests/test_num_words.py
//
// Drobna różnica względem Pythonowego num2words:
// n2words/en-GB nie wstawia przecinka po "thousand" — "one thousand two
// hundred" zamiast "one thousand, two hundred". Treściowo identyczne.

import { describe, expect, it } from "vitest";

import { amountInWords } from "../num-words";

describe("amountInWords", () => {
  it("EUR — Polish form", () => {
    const [pl] = amountInWords("1234.56", "EUR");
    expect(pl).toContain("tysiąc dwieście trzydzieści cztery");
    expect(pl).toContain("euro");
    expect(pl).toContain("56/100");
  });

  it("EUR — English form", () => {
    const [, en] = amountInWords("1234.56", "EUR");
    expect(en.toLowerCase()).toContain("one thousand");
    expect(en.toLowerCase()).toContain("euro");
  });

  it("PLN — both languages", () => {
    const [pl, en] = amountInWords("100.00", "PLN");
    expect(pl).toContain("sto");
    expect(pl).toMatch(/złot/);
    expect(en.toLowerCase()).toContain("hundred");
  });

  it("USD", () => {
    const [pl, en] = amountInWords("50.25", "USD");
    expect(pl).toContain("pięćdziesiąt");
    expect(pl).toContain("dolar");
    expect(en.toLowerCase()).toContain("fifty");
  });

  it("zero", () => {
    const [pl, en] = amountInWords("0.00", "EUR");
    expect(pl).toContain("zero");
    expect(en.toLowerCase()).toContain("zero");
  });
});
