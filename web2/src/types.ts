export interface Address {
  country_code: string;
  line1: string;
  line2: string;
}

export interface Party {
  nip: string;
  name: string;
  address: Address;
  vat_prefix: string;
  no_identifier: boolean;
}

export interface Buyer extends Party {
  jst: boolean;
  gv: boolean;
}

export interface LineItem {
  line_number: number;
  name: string;
  unit: string;
  quantity: string;
  unit_net_price: string;
  net_value: string;
  tax_rate: string;
  exchange_rate: string;
  unit_net_price_fmt: string;
  net_value_fmt: string;
  tax_rate_display: string;
}

export interface TaxSummaryRow {
  rate_code: string;
  net_amount: string;
  tax_amount: string;
  gross_amount: string;
  net_amount_fmt: string;
  tax_amount_fmt: string;
  gross_amount_fmt: string;
  /** Bilingual label, "\n" separates PL from EN. */
  label: string;
}

export interface BankAccount {
  iban: string;
  swift: string;
  bank_name: string;
  description: string;
}

export interface PaymentTerms {
  quantity: string;
  unit: string;
  starting_event: string;
}

export interface Payment {
  form_code: string;
  paid: string;
  terms: PaymentTerms | null;
  bank_account: BankAccount | null;
}

export interface Annotations {
  reverse_charge: boolean;
  cash_method: boolean;
  split_payment: boolean;
  self_invoicing: boolean;
  simplified_triangular: boolean;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_type: string;
  invoice_date: string;
  sale_date: string;
  currency: string;
  exchange_rate: string;
  total_amount: string;
  total_amount_fmt: string;
  seller: Party;
  buyer: Buyer;
  line_items: LineItem[];
  tax_summary: TaxSummaryRow[];
  annotations: Annotations;
  payment: Payment;
  ksef_number: string;
}

export interface RenderContext {
  invoice: InvoiceData;
  invoice_type_pl: string;
  invoice_type_en: string;
  seller_country_pl: string;
  seller_country_en: string;
  buyer_country_pl: string;
  buyer_country_en: string;
  payment_form_pl: string;
  payment_form_en: string;
  payment_status_pl: string;
  payment_status_en: string;
  amount_words_pl: string;
  amount_words_en: string;
  exchange_rate_formatted: string;
  exchange_rate_is_global: boolean;
  annotation_lines: string[];
  footnotes: string[];
  qr_url: string;
  /** Data URI of QR PNG. */
  qr_image: string;
}
