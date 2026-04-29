// Convert monetary amounts to bilingual (Polish/English) word form.
// Port of app/num_words.py — uses n2words instead of Python's num2words.
//
// Drobna różnica formatu względem Pythonowego num2words:
//   Python (en) wstawia przecinek po "thousand": "one thousand, two hundred…"
//   n2words (en-GB) tylko spację: "one thousand two hundred and …"
// Treściowo identyczne, więc akceptujemy.

import { toCardinal as toCardinalPL } from "n2words/pl-PL";
import { toCardinal as toCardinalEN } from "n2words/en-GB";

/** Polish noun forms: pick correct form based on number. */
function plForm(n: number, forms: [string, string, string]): string {
  const [form1, form2_4, form5] = forms;
  if (n === 1) return form1;
  const lastTwo = n % 100;
  const lastOne = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return form5;
  if (lastOne >= 2 && lastOne <= 4) return form2_4;
  return form5;
}

interface CurrencySpec {
  pl: [string, string, string];
  plSubunit: string;
  en: string;
  enSubunit: string;
}

const CURRENCIES: Record<string, CurrencySpec> = {
  EUR: { pl: ["euro", "euro", "euro"], plSubunit: "centów", en: "euro", enSubunit: "cent" },
  PLN: { pl: ["złoty", "złote", "złotych"], plSubunit: "groszy", en: "złoty", enSubunit: "grosz" },
  USD: { pl: ["dolar", "dolary", "dolarów"], plSubunit: "centów", en: "dollar", enSubunit: "cent" },
  GBP: { pl: ["funt", "funty", "funtów"], plSubunit: "pensów", en: "pound", enSubunit: "penny" },
};

/** Returns [polish, english] word representation of a monetary amount. */
export function amountInWords(amountStr: string, currency: string): [string, string] {
  const value = Number(amountStr);
  if (!Number.isFinite(value)) return ["", ""];
  const whole = Math.trunc(value);
  const cents = Math.round(Math.abs(value - whole) * 100);

  const plWords = toCardinalPL(whole);
  const enWords = toCardinalEN(whole);

  const spec = CURRENCIES[currency.toUpperCase()];
  if (spec) {
    const plCurrency = plForm(whole, spec.pl);
    const plResult = `${plWords} ${plCurrency} ${cents}/100`;
    const enSubunitPlural = cents === 1 ? spec.enSubunit : `${spec.enSubunit}s`;
    const enCentWords = toCardinalEN(cents);
    const enResult = `${enWords} ${spec.en} and ${enCentWords} ${enSubunitPlural}`;
    return [plResult, enResult];
  }

  // Unknown currency: use ISO code as-is
  const enCentWords = toCardinalEN(cents);
  return [
    `${plWords} ${currency} ${cents}/100`,
    `${enWords} ${currency} and ${enCentWords} cents`,
  ];
}
