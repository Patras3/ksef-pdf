// Polish number formatting — port of app/formatting.py.
//
// Wartości przychodzą z XML jako stringi (już z poprawną precyzją).
// Tutaj tylko reformatowanie do polskiego zapisu (spacja jako separator
// tysięcy, przecinek jako dziesiętny).

function thousands(intStr: string): string {
  const negative = intStr.startsWith("-");
  let digits = negative ? intStr.slice(1) : intStr;
  const groups: string[] = [];
  while (digits.length > 3) {
    groups.push(digits.slice(-3));
    digits = digits.slice(0, -3);
  }
  groups.push(digits);
  const result = groups.reverse().join(" ");
  return negative ? `-${result}` : result;
}

function quantize(valueStr: string, decimals: number): string {
  // Manual half-up rounding on string to avoid Number precision issues
  // for typical 2-decimal currency / 6-decimal exchange rate inputs.
  const n = Number(valueStr);
  if (!Number.isFinite(n)) return valueStr;
  const factor = Math.pow(10, decimals);
  const rounded = Math.sign(n) * Math.round(Math.abs(n) * factor) / factor;
  return rounded.toFixed(decimals);
}

/** "1234.56" → "1 234,56", "1000" → "1 000,00", "0.00" → "0,00". */
export function formatAmount(value: string): string {
  const fixed = quantize(value, 2);
  const [intPart, fracPart = "00"] = fixed.split(".");
  return `${thousands(intPart!)},${fracPart}`;
}

/** "4.2346" → "4,234600", "4.234600" → "4,234600". */
export function formatExchangeRate(value: string): string {
  const fixed = quantize(value, 6);
  return fixed.replace(".", ",");
}
