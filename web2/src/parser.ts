// KSeF FA(3) XML parser — port of app/parser.py.
// Browser-only: relies on DOMParser.

import type {
  Address,
  Annotations,
  BankAccount,
  Buyer,
  InvoiceData,
  LineItem,
  Party,
  Payment,
  PaymentTerms,
  TaxSummaryRow,
} from "./types";

const NS = "http://crd.gov.pl/wzor/2025/06/25/13775/";

/** Maps (P_13_x net field, corresponding P_14_x tax field or null). */
const TAX_SUMMARY_FIELDS: Array<[string, string | null]> = [
  ["P_13_1", "P_14_1"],
  ["P_13_2", "P_14_2"],
  ["P_13_3", "P_14_3"],
  ["P_13_4", "P_14_4"],
  ["P_13_5", "P_14_5"],
  ["P_13_6", "P_14_6"],
  ["P_13_7", "P_14_7"],
  ["P_13_8", null],
  ["P_13_9", null],
  ["P_13_10", null],
  ["P_13_11", null],
];

/** Direct-child element by local name. */
function child(parent: Element | null, localName: string): Element | null {
  if (!parent) return null;
  for (const node of parent.children) {
    if (node.localName === localName && node.namespaceURI === NS) return node;
  }
  return null;
}

/** All direct children with given local name. */
function children(parent: Element | null, localName: string): Element[] {
  if (!parent) return [];
  const out: Element[] = [];
  for (const node of parent.children) {
    if (node.localName === localName && node.namespaceURI === NS) out.push(node);
  }
  return out;
}

function text(parent: Element | null, localName: string): string {
  const el = child(parent, localName);
  return el?.textContent?.trim() ?? "";
}

function parseAddress(el: Element | null): Address {
  return {
    country_code: text(el, "KodKraju"),
    line1: text(el, "AdresL1"),
    line2: text(el, "AdresL2"),
  };
}

function parseSeller(podmiot1: Element): Party {
  const dane = child(podmiot1, "DaneIdentyfikacyjne");
  const adres = child(podmiot1, "Adres");
  return {
    nip: text(dane, "NIP"),
    name: text(dane, "Nazwa"),
    vat_prefix: text(podmiot1, "PrefiksPodatnika"),
    address: parseAddress(adres),
    no_identifier: false,
  };
}

function parseBuyer(podmiot2: Element): Buyer {
  const dane = child(podmiot2, "DaneIdentyfikacyjne");
  const adres = child(podmiot2, "Adres");
  return {
    nip: text(dane, "NIP"),
    name: text(dane, "Nazwa"),
    vat_prefix: "",
    address: parseAddress(adres),
    no_identifier: text(dane, "BrakID") === "1",
    jst: text(podmiot2, "JST") === "1",
    gv: text(podmiot2, "GV") === "1",
  };
}

function parseLineItems(fa: Element): LineItem[] {
  return children(fa, "FaWiersz").map((wiersz) => {
    const lineNumberStr = text(wiersz, "NrWierszaFa");
    return {
      line_number: parseInt(lineNumberStr, 10) || 0,
      name: text(wiersz, "P_7"),
      unit: text(wiersz, "P_8A"),
      quantity: text(wiersz, "P_8B"),
      unit_net_price: text(wiersz, "P_9A"),
      net_value: text(wiersz, "P_11"),
      tax_rate: text(wiersz, "P_12"),
      exchange_rate: text(wiersz, "KursWaluty"),
      // Filled in build-context (formatted strings):
      unit_net_price_fmt: "",
      net_value_fmt: "",
      tax_rate_display: "",
    };
  });
}

function parseTaxSummary(fa: Element): TaxSummaryRow[] {
  const rows: TaxSummaryRow[] = [];
  for (const [netTag, taxTag] of TAX_SUMMARY_FIELDS) {
    const netEl = child(fa, netTag);
    if (!netEl?.textContent) continue;
    const netAmount = netEl.textContent.trim();
    let taxAmount = "0.00";
    if (taxTag) {
      const taxEl = child(fa, taxTag);
      if (taxEl?.textContent) taxAmount = taxEl.textContent.trim();
    }
    // gross = net + tax (best-effort; values are decimal strings, JS Number is fine
    // for typical 2-decimal monetary precision)
    const net = Number(netAmount);
    const tax = Number(taxAmount);
    let gross = netAmount;
    if (Number.isFinite(net) && Number.isFinite(tax)) {
      gross = (Math.round((net + tax) * 100) / 100).toFixed(2);
    }
    rows.push({
      rate_code: netTag,
      net_amount: netAmount,
      tax_amount: taxAmount,
      gross_amount: gross,
      net_amount_fmt: "",
      tax_amount_fmt: "",
      gross_amount_fmt: "",
      label: "",
    });
  }
  return rows;
}

function parseAnnotations(adnotacje: Element | null): Annotations {
  return {
    // Field mapping mirrors app/parser.py exactly (P_18 → reverse_charge etc.)
    reverse_charge: text(adnotacje, "P_18") === "1",
    cash_method: text(adnotacje, "P_16") === "1",
    split_payment: text(adnotacje, "P_17") === "1",
    self_invoicing: text(adnotacje, "P_18A") === "1",
    simplified_triangular: text(adnotacje, "P_23") === "1",
  };
}

function parsePayment(platnosc: Element | null): Payment {
  if (!platnosc) {
    return { form_code: "", paid: "", terms: null, bank_account: null };
  }
  let terms: PaymentTerms | null = null;
  const termin = child(platnosc, "TerminPlatnosci");
  const terminOpis = child(termin, "TerminOpis");
  if (terminOpis) {
    terms = {
      quantity: text(terminOpis, "Ilosc"),
      unit: text(terminOpis, "Jednostka"),
      starting_event: text(terminOpis, "ZdarzeniePoczatkowe"),
    };
  }
  let bankAccount: BankAccount | null = null;
  const rachunek = child(platnosc, "RachunekBankowy");
  if (rachunek) {
    bankAccount = {
      iban: text(rachunek, "NrRB"),
      swift: text(rachunek, "SWIFT"),
      bank_name: text(rachunek, "NazwaBanku"),
      description: text(rachunek, "OpisRachunku"),
    };
  }
  return {
    form_code: text(platnosc, "FormaPlatnosci"),
    paid: text(platnosc, "Zaplacono"),
    terms,
    bank_account: bankAccount,
  };
}

/** Parses a KSeF FA(3) XML string into InvoiceData (without _fmt fields filled). */
export function parseInvoiceXml(xml: string, ksefNumber = ""): InvoiceData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML parse error: ${parseError.textContent ?? "unknown"}`);
  }
  const root = doc.documentElement;
  if (root.localName !== "Faktura" || root.namespaceURI !== NS) {
    throw new Error(
      `Expected root <Faktura> in namespace ${NS}, got <${root.localName}> in ${root.namespaceURI}`,
    );
  }

  const podmiot1 = child(root, "Podmiot1");
  const podmiot2 = child(root, "Podmiot2");
  const fa = child(root, "Fa");

  const seller = podmiot1
    ? parseSeller(podmiot1)
    : ({ nip: "", name: "", vat_prefix: "", address: parseAddress(null), no_identifier: false } as Party);
  const buyer = podmiot2
    ? parseBuyer(podmiot2)
    : ({ nip: "", name: "", vat_prefix: "", address: parseAddress(null), no_identifier: false, jst: false, gv: false } as Buyer);

  const lineItems = fa ? parseLineItems(fa) : [];
  const totalAmount = fa ? text(fa, "P_15") : "0.00";
  const taxSummary = fa ? parseTaxSummary(fa) : [];
  const annotations = parseAnnotations(child(fa, "Adnotacje"));
  const payment = parsePayment(child(fa, "Platnosc"));

  // Exchange rate: try Fa/KursWaluty first, fall back to first line item's KursWaluty
  let exchangeRate = fa ? text(fa, "KursWaluty") : "";
  if (!exchangeRate && lineItems.length > 0) {
    exchangeRate = lineItems[0]!.exchange_rate;
  }

  return {
    invoice_number: fa ? text(fa, "P_2") : "",
    invoice_type: fa ? text(fa, "RodzajFaktury") : "",
    invoice_date: fa ? text(fa, "P_1") : "",
    sale_date: fa ? text(fa, "P_6") : "",
    currency: fa ? text(fa, "KodWaluty") : "",
    exchange_rate: exchangeRate,
    total_amount: totalAmount,
    total_amount_fmt: "",
    seller,
    buyer,
    line_items: lineItems,
    tax_summary: taxSummary,
    annotations,
    payment,
    ksef_number: ksefNumber,
  };
}

/** Detect KSeF number from filename — matches NIP-YYYYMMDD-XXXXXXXXXXXX-NN format. */
export function ksefNumberFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "");
  return /^\d{10}-\d{8}-[A-Z0-9]{12}-\d{2}$/.test(stem) ? stem : "";
}
