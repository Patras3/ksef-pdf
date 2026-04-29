// Orchestrator: parsed XML + lookups + computed strings → RenderContext.
// Port of app/render.py:_build_context (in our naming) — pure data,
// no PDF rendering here.

import { formatAmount, formatExchangeRate } from "./formatting";
import {
  getCountryName,
  getInvoiceType,
  getPaymentForm,
  getTaxRateDisplay,
  getTaxRateFootnote,
  getTaxSummaryLabel,
} from "./mappings";
import { amountInWords } from "./num-words";
import { parseInvoiceXml } from "./parser";
import { buildVerificationUrl, generateQrDataUrl } from "./qr";
import type { Annotations, RenderContext } from "./types";

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface BuildResult {
  context: RenderContext;
  warnings: ValidationWarning[];
}

function buildAnnotationLines(a: Annotations): string[] {
  const out: string[] = [];
  if (a.reverse_charge) out.push("Odwrotne obciążenie / Reverse charge");
  if (a.cash_method) out.push("Metoda kasowa / Cash accounting method");
  if (a.split_payment) out.push("Mechanizm podzielonej płatności / Split payment mechanism");
  if (a.self_invoicing) out.push("Samofakturowanie / Self-invoicing");
  if (a.simplified_triangular) {
    out.push(
      "Uproszczenie w wewnątrzwspólnotowej transakcji trójstronnej / " +
        "Simplified procedure in intra-EU triangular transaction",
    );
  }
  return out;
}

function collectFootnotes(taxRates: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const rate of taxRates) {
    const note = getTaxRateFootnote(rate);
    if (note && !seen.has(note)) {
      seen.add(note);
      out.push(note);
    }
  }
  return out;
}

/**
 * Parse XML and build full RenderContext (with formatted strings, QR, etc.).
 *
 * Consumer must pass the XML as both a string (for parsing) and bytes
 * (for QR hashing — must be the original on-disk bytes, not re-serialised).
 */
export async function buildContext(
  xmlString: string,
  xmlBytes: Uint8Array,
  ksefNumber: string,
): Promise<BuildResult> {
  const warnings: ValidationWarning[] = [];
  const invoice = parseInvoiceXml(xmlString, ksefNumber);

  // Validate critical fields
  if (!invoice.invoice_number) {
    warnings.push({ field: "invoice_number", message: "Brak numeru faktury w pliku XML." });
  }
  if (!invoice.invoice_date) {
    warnings.push({ field: "invoice_date", message: "Brak daty wystawienia faktury." });
  }
  if (!invoice.seller.nip && !invoice.seller.name) {
    warnings.push({ field: "seller", message: "Brak danych sprzedawcy w pliku XML." });
  }
  if (!invoice.buyer.nip && !invoice.buyer.name && !invoice.buyer.no_identifier) {
    warnings.push({ field: "buyer", message: "Brak danych nabywcy w pliku XML." });
  }
  if (!invoice.currency) {
    warnings.push({ field: "currency", message: "Brak waluty — przyjęto PLN." });
    invoice.currency = "PLN";
  }
  if (invoice.line_items.length === 0) {
    warnings.push({ field: "line_items", message: "Faktura nie zawiera żadnych pozycji." });
  }

  // Format amounts
  invoice.total_amount_fmt = formatAmount(invoice.total_amount);
  for (const item of invoice.line_items) {
    item.unit_net_price_fmt = formatAmount(item.unit_net_price);
    item.net_value_fmt = formatAmount(item.net_value);
    item.tax_rate_display = getTaxRateDisplay(item.tax_rate);
  }
  for (const row of invoice.tax_summary) {
    row.net_amount_fmt = formatAmount(row.net_amount);
    row.tax_amount_fmt = formatAmount(row.tax_amount);
    row.gross_amount_fmt = formatAmount(row.gross_amount);
    row.label = getTaxSummaryLabel(row.rate_code);
  }

  const [invoiceTypePl, invoiceTypeEn] = getInvoiceType(invoice.invoice_type);
  const [sellerCountryPl, sellerCountryEn] = getCountryName(invoice.seller.address.country_code);
  const [buyerCountryPl, buyerCountryEn] = getCountryName(invoice.buyer.address.country_code);
  const [paymentFormPl, paymentFormEn] = getPaymentForm(invoice.payment.form_code);
  const [amountWordsPl, amountWordsEn] = amountInWords(invoice.total_amount, invoice.currency);

  const exchangeRateFormatted = invoice.exchange_rate ? formatExchangeRate(invoice.exchange_rate) : "";
  const exchangeRateIsGlobal = Boolean(invoice.exchange_rate);

  const paid = invoice.payment.paid === "1";
  const paymentStatusPl = paid ? "Zapłacono" : "Brak zapłaty";
  const paymentStatusEn = paid ? "Paid" : "Not yet paid";

  const annotationLines = buildAnnotationLines(invoice.annotations);
  const footnotes = collectFootnotes(invoice.line_items.map((i) => i.tax_rate));

  const qrUrl = await buildVerificationUrl(invoice.seller.nip, invoice.invoice_date, xmlBytes);
  const qrImage = await generateQrDataUrl(qrUrl);

  const context: RenderContext = {
    invoice,
    invoice_type_pl: invoiceTypePl,
    invoice_type_en: invoiceTypeEn,
    seller_country_pl: sellerCountryPl,
    seller_country_en: sellerCountryEn,
    buyer_country_pl: buyerCountryPl,
    buyer_country_en: buyerCountryEn,
    payment_form_pl: paymentFormPl,
    payment_form_en: paymentFormEn,
    payment_status_pl: paymentStatusPl,
    payment_status_en: paymentStatusEn,
    amount_words_pl: amountWordsPl,
    amount_words_en: amountWordsEn,
    exchange_rate_formatted: exchangeRateFormatted,
    exchange_rate_is_global: exchangeRateIsGlobal,
    annotation_lines: annotationLines,
    footnotes,
    qr_url: qrUrl,
    qr_image: qrImage,
  };

  return { context, warnings };
}
