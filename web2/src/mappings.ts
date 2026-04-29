// Lookup tables for KSeF invoice data — port of app/mappings.py.

export const COUNTRIES: Record<string, [string, string]> = {
  AD: ["Andora", "Andorra"],
  AE: ["Zjednoczone Emiraty Arabskie", "United Arab Emirates"],
  AL: ["Albania", "Albania"],
  AM: ["Armenia", "Armenia"],
  AT: ["Austria", "Austria"],
  AU: ["Australia", "Australia"],
  AZ: ["Azerbejdżan", "Azerbaijan"],
  BA: ["Bośnia i Hercegowina", "Bosnia and Herzegovina"],
  BE: ["Belgia", "Belgium"],
  BG: ["Bułgaria", "Bulgaria"],
  BR: ["Brazylia", "Brazil"],
  BY: ["Białoruś", "Belarus"],
  CA: ["Kanada", "Canada"],
  CH: ["Szwajcaria", "Switzerland"],
  CN: ["Chiny", "China"],
  CY: ["Cypr", "Cyprus"],
  CZ: ["Czechy", "Czech Republic"],
  DE: ["Niemcy", "Germany"],
  DK: ["Dania", "Denmark"],
  EE: ["Estonia", "Estonia"],
  EG: ["Egipt", "Egypt"],
  ES: ["Hiszpania", "Spain"],
  FI: ["Finlandia", "Finland"],
  FR: ["Francja", "France"],
  GB: ["Wielka Brytania", "United Kingdom"],
  GE: ["Gruzja", "Georgia"],
  GR: ["Grecja", "Greece"],
  HR: ["Chorwacja", "Croatia"],
  HU: ["Węgry", "Hungary"],
  ID: ["Indonezja", "Indonesia"],
  IE: ["Irlandia", "Ireland"],
  IL: ["Izrael", "Israel"],
  IN: ["Indie", "India"],
  IS: ["Islandia", "Iceland"],
  IT: ["Włochy", "Italy"],
  JP: ["Japonia", "Japan"],
  KR: ["Korea Południowa", "South Korea"],
  KZ: ["Kazachstan", "Kazakhstan"],
  LI: ["Liechtenstein", "Liechtenstein"],
  LT: ["Litwa", "Lithuania"],
  LU: ["Luksemburg", "Luxembourg"],
  LV: ["Łotwa", "Latvia"],
  MD: ["Mołdawia", "Moldova"],
  ME: ["Czarnogóra", "Montenegro"],
  MK: ["Macedonia Północna", "North Macedonia"],
  MT: ["Malta", "Malta"],
  MX: ["Meksyk", "Mexico"],
  NL: ["Holandia", "Netherlands"],
  NO: ["Norwegia", "Norway"],
  NZ: ["Nowa Zelandia", "New Zealand"],
  PL: ["Polska", "Poland"],
  PT: ["Portugalia", "Portugal"],
  RO: ["Rumunia", "Romania"],
  RS: ["Serbia", "Serbia"],
  RU: ["Rosja", "Russia"],
  SA: ["Arabia Saudyjska", "Saudi Arabia"],
  SE: ["Szwecja", "Sweden"],
  SG: ["Singapur", "Singapore"],
  SI: ["Słowenia", "Slovenia"],
  SK: ["Słowacja", "Slovakia"],
  TR: ["Turcja", "Turkey"],
  UA: ["Ukraina", "Ukraine"],
  US: ["Stany Zjednoczone Ameryki", "United States"],
  UZ: ["Uzbekistan", "Uzbekistan"],
  XK: ["Kosowo", "Kosovo"],
  ZA: ["Republika Południowej Afryki", "South Africa"],
};

export function getCountryName(code: string): [string, string] {
  return COUNTRIES[code.toUpperCase()] ?? [code, code];
}

export const INVOICE_TYPES: Record<string, [string, string]> = {
  VAT: ["Faktura podstawowa", "Standard Invoice"],
  KOR: ["Faktura korygująca", "Corrective Invoice"],
  ZAL: ["Faktura zaliczkowa", "Advance Invoice"],
  ROZ: ["Faktura rozliczeniowa", "Settlement Invoice"],
  UPR: ["Faktura uproszczona", "Simplified Invoice"],
  KOR_ZAL: ["Korekta faktury zaliczkowej", "Corrective Advance Invoice"],
  KOR_ROZ: ["Korekta faktury rozliczeniowej", "Corrective Settlement Invoice"],
};

export function getInvoiceType(code: string): [string, string] {
  return INVOICE_TYPES[code] ?? [code, code];
}

export const PAYMENT_FORMS: Record<string, [string, string]> = {
  "1": ["Gotówka", "Cash"],
  "2": ["Karta", "Card"],
  "3": ["Bon", "Voucher"],
  "4": ["Czek", "Cheque"],
  "5": ["Kredyt", "Credit"],
  "6": ["Przelew", "Bank transfer"],
  "7": ["Mobilna", "Mobile payment"],
};

export function getPaymentForm(code: string): [string, string] {
  return PAYMENT_FORMS[code] ?? [code, code];
}

const TAX_RATE_DISPLAY: Record<string, string> = {
  "23": "23%",
  "22": "22%",
  "8": "8%",
  "7": "7%",
  "5": "5%",
  "4": "4%",
  "3": "3%",
  "0": "0%",
  zw: "zw.*",
  oo: "oo.*",
  np: "np.*",
  "np I": "np.I*",
  "np II": "np.II*",
  "np III": "np.III*",
  "np IV": "np.IV*",
  "np V": "np.V*",
};

const TAX_SUMMARY_RATE_DISPLAY: Record<string, string> = {
  P_13_1: "23%",
  P_13_2: "8%",
  P_13_3: "5%",
  P_13_4: "4%",
  P_13_5: "3%",
  P_13_6: "0%",
  P_13_7: "zw.*",
  P_13_8: "np.*",
  P_13_9: "np.*",
  P_13_10: "np.*",
  P_13_11: "-",
};

export function getTaxRateDisplay(rate: string): string {
  if (rate in TAX_RATE_DISPLAY) return TAX_RATE_DISPLAY[rate]!;
  if (rate in TAX_SUMMARY_RATE_DISPLAY) return TAX_SUMMARY_RATE_DISPLAY[rate]!;
  if (!Number.isNaN(parseFloat(rate)) && /^-?\d+(\.\d+)?$/.test(rate)) {
    return `${rate}%`;
  }
  return rate;
}

const TAX_RATE_FOOTNOTES: Record<string, string> = {
  zw: "zw. - Zwolnienie od podatku VAT. / VAT exemption.",
  oo: "oo. - Odwrotne obciążenie. / Reverse charge.",
  np: "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
  "np I": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
  "np II": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
  "np III": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
  "np IV": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
  "np V": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
};

export function getTaxRateFootnote(rate: string): string | null {
  return TAX_RATE_FOOTNOTES[rate] ?? null;
}

const TAX_SUMMARY_LABELS: Record<string, string> = {
  P_13_1: "Podstawa opodatkowania – stawka 22% albo 23%\nTax base – 22% or 23%",
  P_13_2: "Podstawa opodatkowania – stawka 7% albo 8%\nTax base – 7% or 8%",
  P_13_3: "Podstawa opodatkowania – stawka 5%\nTax base – 5%",
  P_13_4: "Podstawa opodatkowania – stawka 4%\nTax base – 4%",
  P_13_5: "Podstawa opodatkowania – stawka 3%\nTax base – 3%",
  P_13_6: "Podstawa opodatkowania – stawka 0%\nTax base – 0%",
  P_13_7: "Dostawa towarów oraz świadczenie usług zwolnionych od podatku\nExempt from tax",
  P_13_8: "np z wyłączeniem art. 100 ust 1 pkt 4 ustawy\nNot subject to tax in Poland",
  P_13_9: "Świadczenie usług, o których mowa w art. 100 ust. 1 pkt 4 ustawy\nIntra-EU services",
  P_13_10: "Dostawa towarów oraz świadczenie usług poza terytorium kraju\nOutside Poland",
  P_13_11: "Inne\nOther",
};

export function getTaxSummaryLabel(rateCode: string): string {
  return TAX_SUMMARY_LABELS[rateCode] ?? rateCode;
}
