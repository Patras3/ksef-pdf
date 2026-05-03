import type { RenderContext } from "./types";

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escape(s: string | number): string {
  return String(s).replace(/[&<>"']/g, (c) => escapeMap[c]!);
}

/** Reformat YYYY-MM-DD → DD.MM.YYYY (matches Jinja2 d[8:10].d[5:7].d[0:4]). */
function formatDate(d: string): string {
  if (!d || d.length < 10) return escape(d);
  return `${escape(d.slice(8, 10))}.${escape(d.slice(5, 7))}.${escape(d.slice(0, 4))}`;
}

const yesNo = (b: boolean) => (b ? "TAK / YES" : "NIE / NO");

export function renderInvoice(ctx: RenderContext): string {
  const { invoice } = ctx;

  const sellerVatPrefix = invoice.seller.vat_prefix
    ? `<div class="label-field">Prefiks VAT / VAT Prefix: <span style="color: #000;">${escape(invoice.seller.vat_prefix)}</span></div>`
    : "";
  const sellerNip = invoice.seller.nip
    ? `<div class="label-field">NIP: <span style="color: #000; font-weight: bold;">${escape(invoice.seller.nip)}</span></div>`
    : "";
  const sellerLine2 = invoice.seller.address.line2
    ? `<div style="font-size: 10px; margin-left: 8px;">${escape(invoice.seller.address.line2)}</div>`
    : "";

  let buyerId: string;
  if (invoice.buyer.nip) {
    buyerId = `<div class="label-field">NIP: <span style="color: #000; font-weight: bold;">${escape(invoice.buyer.nip)}</span></div>`;
  } else if (invoice.buyer.no_identifier) {
    buyerId = `<div class="label-field">Brak identyfikatora / No identifier</div>`;
  } else {
    buyerId = "";
  }
  const buyerLine2 = invoice.buyer.address.line2
    ? `<div style="font-size: 10px; margin-left: 8px;">${escape(invoice.buyer.address.line2)}</div>`
    : "";

  const ksefHeader = invoice.ksef_number
    ? `
        <div class="label-field" style="margin-top: 2px;">Numer KSeF / KSeF Number:</div>
        <div style="font-size: 10px; font-weight: bold;">${escape(invoice.ksef_number)}</div>`
    : "";

  const currencyRow = invoice.exchange_rate
    ? `<div style="display: flex; gap: 14px; align-items: flex-start; margin-top: 6px; flex-wrap: wrap;">
         <div class="label-field" style="white-space: nowrap;">Kod waluty / Currency code: <span style="color: #000; font-weight: bold;">${escape(invoice.currency)}</span></div>
         <div class="label-field" style="white-space: nowrap;">Kurs waluty / Exchange rate: <span style="color: #000;">${escape(ctx.exchange_rate_formatted)}</span></div>
         ${
           ctx.exchange_rate_is_global
             ? `<div style="flex: 1 1 auto; min-width: 0;">
                  <div class="label-en" style="font-style: italic;">wspólny dla wszystkich wierszy faktury</div>
                  <div class="label-en" style="font-style: italic;">common for all invoice lines</div>
                </div>`
             : ""
         }
       </div>`
    : `<div class="label-field" style="margin-top: 6px;">Kod waluty / Currency code: <span style="color: #000; font-weight: bold;">${escape(invoice.currency)}</span></div>`;

  const saleDateBlock = invoice.sale_date
    ? `<div class="label-field">Data dokonania lub zakończenia dostawy towarów lub wykonania usługi:</div>
       <div class="label-en">Date of supply / service completion:</div>
       <div class="bold" style="margin-top: 2px;">${formatDate(invoice.sale_date)}</div>`
    : "";

  const itemsRows = invoice.line_items
    .map(
      (item) => `
        <tr>
          <td class="text-center">${escape(item.line_number)}</td>
          <td>${escape(item.name)}</td>
          <td class="text-right">${escape(item.unit_net_price_fmt)}</td>
          <td class="text-center">${escape(item.quantity)}</td>
          <td class="text-center">${escape(item.unit)}</td>
          <td class="text-center">${escape(item.tax_rate_display)}</td>
          <td class="text-right">${escape(item.net_value_fmt)}</td>
        </tr>`,
    )
    .join("");

  const taxSummaryBlock =
    invoice.tax_summary.length > 0
      ? `
        <div class="section tax-summary-compact">
          <div class="section-subtitle">Podsumowanie stawek podatku / VAT Tax Summary</div>
          <table class="items compact">
            <thead>
              <tr>
                <th style="width:22px;">Lp.<br /><span class="en">No</span></th>
                <th style="text-align: left;">Stawka podatku<br /><span class="en">Tax rate</span></th>
                <th style="width:80px;">Kwota netto<br /><span class="en">Net amount</span></th>
                <th style="width:75px;">Kwota podatku<br /><span class="en">Tax amount</span></th>
                <th style="width:80px;">Kwota brutto<br /><span class="en">Gross amount</span></th>
              </tr>
            </thead>
            <tbody>
              ${invoice.tax_summary
                .map((row, i) => {
                  const parts = row.label.split("\n");
                  const labelHtml =
                    parts.length > 1
                      ? `${escape(parts[0]!)}<br /><span class="en">${escape(parts[1]!)}</span>`
                      : escape(parts[0]!);
                  return `
                    <tr>
                      <td class="text-center">${i + 1}</td>
                      <td>${labelHtml}</td>
                      <td class="text-right">${escape(row.net_amount_fmt)}</td>
                      <td class="text-right">${escape(row.tax_amount_fmt)}</td>
                      <td class="text-right">${escape(row.gross_amount_fmt)}</td>
                    </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
      : "";

  const annotationsBlock =
    ctx.annotation_lines.length > 0
      ? `
        <div class="section">
          <div class="section-title">Adnotacje / Annotations</div>
          ${ctx.annotation_lines
            .map(
              (line) =>
                `<div style="font-size: 10px; padding: 6px 0;">${escape(line)}</div>`,
            )
            .join("")}
        </div>`
      : "";

  const paymentTermsBlock = invoice.payment.terms
    ? `<div class="payment-terms-box" style="margin-top: 6px;">
         <div class="label-field" style="margin-bottom: 2px;">Opis płatności / Payment terms:</div>
         <div style="font-size: 10px;">
           ${escape(invoice.payment.terms.quantity)} ${escape(invoice.payment.terms.unit)}
           ${invoice.payment.terms.starting_event ? escape(invoice.payment.terms.starting_event) : ""}
         </div>
       </div>`
    : "";

  const bankAccountInline = invoice.payment.bank_account
    ? (() => {
        const acc = invoice.payment.bank_account!;
        const row = (label: string, en: string, val: string) =>
          val
            ? `<tr>
                 <td class="label">${label}<br /><span style="color: #888; font-weight: normal;">${en}</span></td>
                 <td>${escape(val)}</td>
               </tr>`
            : "";
        return `
          <div class="bank-subsection">
            <div class="label-field" style="font-weight: bold; color: #1a5276; margin-bottom: 3px;">Numer rachunku bankowego / Bank Account Number</div>
            <table class="bank">
              ${row("Pełny numer rachunku", "Account number (IBAN)", acc.iban)}
              ${row("Kod SWIFT", "SWIFT code", acc.swift)}
              ${row("Nazwa banku", "Bank name", acc.bank_name)}
              ${row("Opis rachunku", "Account description", acc.description)}
            </table>
          </div>`;
      })()
    : "";

  const footnotesBlock =
    ctx.footnotes.length > 0
      ? `<div class="footnotes">
           ${ctx.footnotes.map((n) => `<div>*${escape(n)}</div>`).join("")}
         </div>`
      : "";

  // Spec KSeF 2.0: pod QR jest numer KSeF lub "OFFLINE" gdy go nie ma.
  const ksefInQr = invoice.ksef_number
    ? `<div style="font-size: 10px;">
         <strong>Nr KSeF / KSeF Number:</strong> ${escape(invoice.ksef_number)}
       </div>`
    : `<div style="font-size: 10px;">
         <strong>Nr KSeF / KSeF Number:</strong>
         <span style="color: #c0392b; font-weight: bold;">OFFLINE</span>
         <span style="color: #555;">(faktura niewysłana do KSeF / not yet registered)</span>
       </div>`;

  return `
<div class="header">
  <div>
    <div class="header-title">Krajowy System <span class="e">e</span>-Faktur</div>
  </div>
  <div class="header-right">
    <div class="label-field">Numer Faktury / Invoice Number:</div>
    <div class="invoice-number">${escape(invoice.invoice_number)}</div>
    <div style="font-size: 11px; margin-top: 2px;">${escape(ctx.invoice_type_pl)} / ${escape(ctx.invoice_type_en)}</div>
    ${ksefHeader}
  </div>
</div>

<div class="parties">
  <div class="party">
    <div class="section-title">Sprzedawca / Seller</div>
    ${sellerVatPrefix}
    ${sellerNip}
    <div class="label-field">Nazwa / Name: <span style="color: #000; font-weight: bold;">${escape(invoice.seller.name)}</span></div>
    <div class="label-field" style="margin-top: 6px;">Adres / Address:</div>
    <div style="font-size: 10px; margin-left: 8px;">${escape(invoice.seller.address.line1)}</div>
    ${sellerLine2}
    <div style="font-size: 10px; margin-left: 8px;">${escape(ctx.seller_country_pl)} / ${escape(ctx.seller_country_en)}</div>
  </div>

  <div class="party">
    <div class="section-title">Nabywca / Buyer</div>
    ${buyerId}
    <div class="label-field">Nazwa / Name: <span style="color: #000; font-weight: bold;">${escape(invoice.buyer.name)}</span></div>
    <div class="label-field" style="margin-top: 6px;">Adres / Address:</div>
    <div style="font-size: 10px; margin-left: 8px;">${escape(invoice.buyer.address.line1)}</div>
    ${buyerLine2}
    <div style="font-size: 10px; margin-left: 8px;">${escape(ctx.buyer_country_pl)} / ${escape(ctx.buyer_country_en)}</div>
    <div class="label-field" style="margin-top: 6px;">
      Jednostka podrzędna JST / JST subsidiary:
      <span style="color: #000;">${yesNo(invoice.buyer.jst)}</span>
    </div>
    <div class="label-field">
      Członek grupy GV / GV group member:
      <span style="color: #000;">${yesNo(invoice.buyer.gv)}</span>
    </div>
  </div>
</div>

<div class="details-box">
  <div class="section-title">Szczegóły / Details</div>
  <div class="details-grid">
    <div>
      <div class="label-field">Data wystawienia, z zastrzeżeniem art. 106na ust. 1 ustawy:</div>
      <div class="label-en">Invoice date:</div>
      <div class="bold" style="margin-top: 2px;">${formatDate(invoice.invoice_date)}</div>
    </div>
    <div>
      ${saleDateBlock}
    </div>
  </div>
  ${currencyRow}
</div>

<div class="section">
  <div class="section-title">Pozycje / Line Items</div>
  <div style="font-size: 10px; color: #555; margin-bottom: 6px; font-style: italic;">
    Faktura wystawiona w walucie ${escape(invoice.currency)} / Invoice issued in ${escape(invoice.currency)}
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:25px;">Lp.<br /><span class="en">No</span></th>
        <th style="text-align: left;">Nazwa towaru lub usługi<br /><span class="en">Name of goods/services</span></th>
        <th style="width:80px;">Cena jedn. netto<br /><span class="en">Unit net price</span></th>
        <th style="width:35px;">Ilość<br /><span class="en">Qty</span></th>
        <th style="width:65px;">Miara<br /><span class="en">Unit</span></th>
        <th style="width:55px;">Stawka podatku<br /><span class="en">Tax rate</span></th>
        <th style="width:85px;">Wartość sprzedaży netto<br /><span class="en">Net sales value</span></th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>
  <div class="total-row">
    <span>Kwota należności ogółem / Total amount due:</span>
    <span class="total-amount">${escape(invoice.total_amount_fmt)} ${escape(invoice.currency)}</span>
  </div>
</div>

${taxSummaryBlock}

<div class="words-box section">
  <div>
    <span class="label-field">Słownie / In words:</span>
  </div>
  <div class="bold">${escape(ctx.amount_words_pl)}</div>
  <div class="bold" style="color: #555;">${escape(ctx.amount_words_en)}</div>
</div>

${annotationsBlock}

<div class="section payment-block">
  <div class="section-title">Płatność / Payment</div>
  <div class="payment-grid">
    <div class="payment-left">
      <div class="label-field">Informacja o płatności / Payment status:</div>
      <div style="margin-bottom: 4px;">${escape(ctx.payment_status_pl)} / ${escape(ctx.payment_status_en)}</div>
      <div class="label-field">Forma płatności / Payment method:</div>
      <div>${escape(ctx.payment_form_pl)} / ${escape(ctx.payment_form_en)}</div>
      ${paymentTermsBlock}
    </div>
    <div class="payment-right">
      ${bankAccountInline}
    </div>
  </div>
</div>

${footnotesBlock}

<div class="qr-section">
  <div class="qr-content">
    <div class="qr-image">
      <img src="${escape(ctx.qr_image)}" alt="QR kod weryfikacyjny KSeF" />
    </div>
    <div>
      <div class="qr-header">
        Sprawdź, czy Twoja faktura znajduje się w KSeF!<br />
        <span style="font-size: 9px; font-weight: normal; color: #555;">Check if your invoice is registered in KSeF!</span>
      </div>
      <div class="label-field" style="margin-top: 4px; margin-bottom: 1px;">Link weryfikacyjny / Verification link:</div>
      <div class="qr-link"><a href="${escape(ctx.qr_url)}">${escape(ctx.qr_url)}</a></div>
      ${ksefInQr}
    </div>
  </div>
</div>

<div class="invoice-footer">
  Wygenerowano / Generated with
  <a href="https://patras3.github.io/ksef-pdf/" target="_blank" rel="noopener noreferrer">patras3.github.io/ksef-pdf</a>
</div>
`;
}
