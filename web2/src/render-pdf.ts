import type { Content, ContentTable, StyleDictionary, TDocumentDefinitions } from "pdfmake/interfaces";

import type { RenderContext } from "./types";

/* ------------------------------------------------------------------ *
 * Constants — colors and metric conversions
 *
 * pdfmake uses points natively (1 pt = 1/72 inch). Source HTML is in
 * millimetres; convert with mm() so values stay readable.
 * ------------------------------------------------------------------ */

const mm = (n: number) => n * 2.83465;

const COLOR_PRIMARY = "#1a5276";
const COLOR_PRIMARY_E = "#c0392b";
const COLOR_TABLE_HEAD_BG = "#ecf0f1";
const COLOR_TABLE_BORDER = "#bdc3c7";
const COLOR_BOX_BORDER = "#dddddd";
const COLOR_LABEL = "#777777";
const COLOR_LABEL_EN = "#999999";
const COLOR_LABEL_MUTED = "#888888";
const COLOR_SUBDUED_TEXT = "#555555";
const COLOR_SOFT_BG = "#f8f9fa";
const COLOR_QR_GREEN = "#27ae60";
const COLOR_LINK = "#2980b9";

const styles: StyleDictionary = {
  headerTitle: { fontSize: 14, bold: true, color: COLOR_PRIMARY },
  invoiceNumber: { fontSize: 13, bold: true, color: COLOR_PRIMARY },
  sectionTitle: { fontSize: 9, bold: true, color: COLOR_PRIMARY, margin: [0, 0, 0, 1] },
  labelField: { fontSize: 7, color: COLOR_LABEL },
  labelEn: { fontSize: 7, color: COLOR_LABEL_EN },
  bold: { bold: true, color: "#000" },
  totalAmount: { fontSize: 11, bold: true },
  qrHeader: { fontSize: 8.5, bold: true, color: COLOR_QR_GREEN },
  qrLink: { fontSize: 7, color: COLOR_LINK },
  footnote: { fontSize: 7, color: COLOR_SUBDUED_TEXT },
  italic: { italics: true },
  enHead: { color: COLOR_LABEL_MUTED, italics: false },
};

/* ------------------------------------------------------------------ *
 * Tiny formatting helpers
 * ------------------------------------------------------------------ */

function formatDate(d: string): string {
  if (!d || d.length < 10) return d || "";
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}

const yesNo = (b: boolean) => (b ? "TAK / YES" : "NIE / NO");

/* ------------------------------------------------------------------ *
 * Section builders
 * ------------------------------------------------------------------ */

function buildHeader(ctx: RenderContext): Content {
  const { invoice } = ctx;

  const rightStack: Content[] = [
    { text: "Numer Faktury / Invoice Number:", style: "labelField", alignment: "right" },
    { text: invoice.invoice_number, style: "invoiceNumber", alignment: "right" },
    {
      text: `${ctx.invoice_type_pl} / ${ctx.invoice_type_en}`,
      fontSize: 8,
      alignment: "right",
      margin: [0, 1, 0, 0],
    },
  ];
  if (invoice.ksef_number) {
    rightStack.push(
      { text: "Numer KSeF / KSeF Number:", style: "labelField", alignment: "right", margin: [0, 1, 0, 0] },
      { text: invoice.ksef_number, fontSize: 7.5, bold: true, alignment: "right" },
    );
  }

  return {
    table: {
      widths: ["*", "auto"],
      body: [
        [
          {
            text: [
              "Krajowy System ",
              { text: "e", color: COLOR_PRIMARY_E },
              "-Faktur",
            ],
            style: "headerTitle",
            border: [false, false, false, true],
            borderColor: [COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY],
          },
          {
            stack: rightStack,
            border: [false, false, false, true],
            borderColor: [COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY],
          },
        ],
      ],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: (i: number) => (i === 1 ? 1.5 : 0),
      hLineColor: () => COLOR_PRIMARY,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 4],
  };
}

function buildPartyStack(
  title: string,
  items: Content[],
): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: title, style: "sectionTitle" },
              ...items,
            ],
            border: [true, false, false, false],
            borderColor: [COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY, COLOR_PRIMARY],
          },
        ],
      ],
    },
    layout: {
      defaultBorder: false,
      vLineWidth: (i: number) => (i === 0 ? 1.5 : 0),
      vLineColor: () => COLOR_PRIMARY,
      paddingLeft: () => 6,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

function buildParties(ctx: RenderContext): Content {
  const { invoice } = ctx;

  const sellerItems: Content[] = [];
  if (invoice.seller.vat_prefix) {
    sellerItems.push({
      text: [
        { text: "Prefiks VAT / VAT Prefix: ", style: "labelField" },
        { text: invoice.seller.vat_prefix, color: "#000" },
      ],
    });
  }
  if (invoice.seller.nip) {
    sellerItems.push({
      text: [
        { text: "NIP: ", style: "labelField" },
        { text: invoice.seller.nip, bold: true, color: "#000" },
      ],
    });
  }
  sellerItems.push({
    text: [
      { text: "Nazwa / Name: ", style: "labelField" },
      { text: invoice.seller.name, bold: true, color: "#000" },
    ],
  });
  sellerItems.push({ text: "Adres / Address:", style: "labelField", margin: [0, 4, 0, 0] });
  sellerItems.push({ text: invoice.seller.address.line1, fontSize: 8, margin: [6, 0, 0, 0] });
  if (invoice.seller.address.line2) {
    sellerItems.push({ text: invoice.seller.address.line2, fontSize: 8, margin: [6, 0, 0, 0] });
  }
  sellerItems.push({
    text: `${ctx.seller_country_pl} / ${ctx.seller_country_en}`,
    fontSize: 8,
    margin: [6, 0, 0, 0],
  });

  const buyerItems: Content[] = [];
  if (invoice.buyer.nip) {
    buyerItems.push({
      text: [
        { text: "NIP: ", style: "labelField" },
        { text: invoice.buyer.nip, bold: true, color: "#000" },
      ],
    });
  } else if (invoice.buyer.no_identifier) {
    buyerItems.push({ text: "Brak identyfikatora / No identifier", style: "labelField" });
  }
  buyerItems.push({
    text: [
      { text: "Nazwa / Name: ", style: "labelField" },
      { text: invoice.buyer.name, bold: true, color: "#000" },
    ],
  });
  buyerItems.push({ text: "Adres / Address:", style: "labelField", margin: [0, 4, 0, 0] });
  buyerItems.push({ text: invoice.buyer.address.line1, fontSize: 8, margin: [6, 0, 0, 0] });
  if (invoice.buyer.address.line2) {
    buyerItems.push({ text: invoice.buyer.address.line2, fontSize: 8, margin: [6, 0, 0, 0] });
  }
  buyerItems.push({
    text: `${ctx.buyer_country_pl} / ${ctx.buyer_country_en}`,
    fontSize: 8,
    margin: [6, 0, 0, 0],
  });
  buyerItems.push({
    text: [
      { text: "Jednostka podrzędna JST / JST subsidiary: ", style: "labelField" },
      { text: yesNo(invoice.buyer.jst), color: "#000" },
    ],
    margin: [0, 4, 0, 0],
  });
  buyerItems.push({
    text: [
      { text: "Członek grupy GV / GV group member: ", style: "labelField" },
      { text: yesNo(invoice.buyer.gv), color: "#000" },
    ],
  });

  return {
    columns: [
      buildPartyStack("Sprzedawca / Seller", sellerItems),
      buildPartyStack("Nabywca / Buyer", buyerItems),
    ],
    columnGap: 12,
    margin: [0, 0, 0, 4],
  };
}

function buildDetailsBox(ctx: RenderContext): Content {
  const { invoice } = ctx;

  const leftStack: Content[] = [
    {
      text: "Data wystawienia, z zastrzeżeniem art. 106na ust. 1 ustawy:",
      style: "labelField",
    },
    { text: "Invoice date:", style: "labelEn" },
    { text: formatDate(invoice.invoice_date), bold: true, fontSize: 8.5, margin: [0, 1, 0, 0] },
    {
      text: [
        { text: "Kod waluty / Currency code: ", style: "labelField" },
        { text: invoice.currency, bold: true, color: "#000" },
      ],
      margin: [0, 6, 0, 0],
    },
  ];
  if (invoice.exchange_rate) {
    if (ctx.exchange_rate_is_global) {
      leftStack.push({
        columns: [
          {
            width: "auto",
            text: [
              { text: "Kurs waluty / Exchange rate: ", style: "labelField" },
              { text: ctx.exchange_rate_formatted, color: "#000" },
            ],
          },
          {
            width: "*",
            stack: [
              { text: "wspólny dla wszystkich wierszy faktury", style: "labelEn", italics: true },
              { text: "common for all invoice lines", style: "labelEn", italics: true },
            ],
            margin: [8, 0, 0, 0],
          },
        ],
      });
    } else {
      leftStack.push({
        text: [
          { text: "Kurs waluty / Exchange rate: ", style: "labelField" },
          { text: ctx.exchange_rate_formatted, color: "#000" },
        ],
      });
    }
  }

  const rightStack: Content[] = [];
  if (invoice.sale_date) {
    rightStack.push(
      {
        text: "Data dokonania lub zakończenia dostawy towarów lub wykonania usługi:",
        style: "labelField",
      },
      { text: "Date of supply / service completion:", style: "labelEn" },
      { text: formatDate(invoice.sale_date), bold: true, fontSize: 8.5, margin: [0, 1, 0, 0] },
    );
  }

  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: "Szczegóły / Details", style: "sectionTitle" },
              {
                columns: [{ stack: leftStack }, { stack: rightStack }],
                columnGap: 12,
              },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLOR_BOX_BORDER,
      vLineColor: () => COLOR_BOX_BORDER,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 4],
  };
}

function buildLineItemsTable(ctx: RenderContext): Content {
  const { invoice } = ctx;

  const headerCell = (pl: string, en: string, alignment: "left" | "center" = "center"): Content => ({
    stack: [
      { text: pl, alignment, fontSize: 7, bold: true },
      { text: en, alignment, fontSize: 6.5, color: COLOR_LABEL_MUTED },
    ],
    fillColor: COLOR_TABLE_HEAD_BG,
  });

  const headerRow: Content[] = [
    headerCell("Lp.", "No"),
    headerCell("Nazwa towaru lub usługi", "Name of goods/services", "left"),
    headerCell("Cena jedn. netto", "Unit net price"),
    headerCell("Ilość", "Qty"),
    headerCell("Miara", "Unit"),
    headerCell("Stawka podatku", "Tax rate"),
    headerCell("Wartość sprzedaży netto", "Net sales value"),
  ];

  const body: Content[][] = [headerRow];
  for (const item of invoice.line_items) {
    body.push([
      { text: String(item.line_number), alignment: "center", fontSize: 7 },
      { text: item.name, fontSize: 7 },
      { text: item.unit_net_price_fmt, alignment: "right", fontSize: 7 },
      { text: item.quantity, alignment: "center", fontSize: 7 },
      { text: item.unit, alignment: "center", fontSize: 7 },
      { text: item.tax_rate_display, alignment: "center", fontSize: 7 },
      { text: item.net_value_fmt, alignment: "right", fontSize: 7 },
    ]);
  }

  const itemsTable: ContentTable = {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      widths: [18, "*", 55, 25, 45, 38, 60],
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLOR_TABLE_BORDER,
      vLineColor: () => COLOR_TABLE_BORDER,
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
    margin: [0, 0, 0, 4],
  };

  return {
    stack: [
      { text: "Pozycje / Line Items", style: "sectionTitle" },
      {
        text: `Faktura wystawiona w walucie ${invoice.currency} / Invoice issued in ${invoice.currency}`,
        fontSize: 8,
        color: COLOR_SUBDUED_TEXT,
        italics: true,
        margin: [0, 0, 0, 4],
      },
      itemsTable,
      {
        text: [
          { text: "Kwota należności ogółem / Total amount due:  " },
          {
            text: `${invoice.total_amount_fmt} ${invoice.currency}`,
            style: "totalAmount",
          },
        ],
        alignment: "right",
        fontSize: 8.5,
        margin: [0, 4, 0, 0],
      },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildTaxSummary(ctx: RenderContext): Content | null {
  const rows = ctx.invoice.tax_summary;
  if (rows.length === 0) return null;

  const headerCell = (pl: string, en: string, alignment: "left" | "center" = "center"): Content => ({
    stack: [
      { text: pl, alignment, fontSize: 7, bold: true },
      { text: en, alignment, fontSize: 6.5, color: COLOR_LABEL_MUTED },
    ],
    fillColor: COLOR_TABLE_HEAD_BG,
  });

  const body: Content[][] = [
    [
      headerCell("Lp.", "No"),
      headerCell("Stawka podatku", "Tax rate", "left"),
      headerCell("Kwota netto", "Net amount"),
      headerCell("Kwota podatku", "Tax amount"),
      headerCell("Kwota brutto", "Gross amount"),
    ],
  ];

  rows.forEach((row, i) => {
    const parts = row.label.split("\n");
    const labelStack: Content = {
      stack: [
        { text: parts[0] ?? "", fontSize: 7.5 },
        ...(parts.length > 1
          ? [{ text: parts[1] ?? "", fontSize: 6.5, color: COLOR_LABEL_MUTED }]
          : []),
      ],
    };
    body.push([
      { text: String(i + 1), alignment: "center", fontSize: 7 },
      labelStack,
      { text: row.net_amount_fmt, alignment: "right", fontSize: 7 },
      { text: row.tax_amount_fmt, alignment: "right", fontSize: 7 },
      { text: row.gross_amount_fmt, alignment: "right", fontSize: 7 },
    ]);
  });

  return {
    unbreakable: true,
    stack: [
      { text: "Podsumowanie stawek podatku / VAT Tax Summary", style: "sectionTitle" },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [18, "*", 65, 60, 65],
          body,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLOR_TABLE_BORDER,
          vLineColor: () => COLOR_TABLE_BORDER,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildAmountInWords(ctx: RenderContext): Content {
  return {
    unbreakable: true,
    stack: [
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { text: "Słownie / In words:", style: "labelField" },
                  { text: ctx.amount_words_pl, bold: true, fontSize: 8 },
                  { text: ctx.amount_words_en, bold: true, fontSize: 8, color: COLOR_SUBDUED_TEXT },
                ],
                fillColor: COLOR_SOFT_BG,
              },
            ],
          ],
        },
        layout: "noBorders",
      },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildAnnotations(ctx: RenderContext): Content | null {
  if (ctx.annotation_lines.length === 0) return null;
  return {
    unbreakable: true,
    stack: [
      { text: "Adnotacje / Annotations", style: "sectionTitle" },
      ...ctx.annotation_lines.map((line) => ({
        text: line,
        fontSize: 8,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      })),
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildPaymentBlock(ctx: RenderContext): Content {
  const { invoice } = ctx;

  // Left column: status + forma + (terms if present)
  const leftStack: Content[] = [
    { text: "Informacja o płatności / Payment status:", style: "labelField" },
    {
      text: `${ctx.payment_status_pl} / ${ctx.payment_status_en}`,
      color: "#000",
      margin: [0, 0, 0, 4],
    },
    { text: "Forma płatności / Payment method:", style: "labelField" },
    {
      text: `${ctx.payment_form_pl} / ${ctx.payment_form_en}`,
      color: "#000",
    },
  ];
  if (invoice.payment.terms) {
    const t = invoice.payment.terms;
    leftStack.push({
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                { text: "Opis płatności / Payment terms:", style: "labelField" },
                {
                  text:
                    `${t.quantity} ${t.unit}` +
                    (t.starting_event ? ` ${t.starting_event}` : ""),
                  fontSize: 7,
                  margin: [0, 1, 0, 0],
                },
              ],
              fillColor: COLOR_SOFT_BG,
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 4, 0, 0],
    });
  }

  // Right column: bank account
  const acc = invoice.payment.bank_account;
  const rightStack: Content[] = [];
  if (acc) {
    const rows: Content[][] = [];
    const labelCell = (pl: string, en: string): Content => ({
      stack: [
        { text: pl, bold: true, fontSize: 7 },
        { text: en, fontSize: 6.5, color: COLOR_LABEL_MUTED },
      ],
      fillColor: COLOR_TABLE_HEAD_BG,
    });
    if (acc.iban)
      rows.push([labelCell("Pełny numer rachunku", "Account number (IBAN)"), { text: acc.iban, fontSize: 7.5 }]);
    if (acc.swift) rows.push([labelCell("Kod SWIFT", "SWIFT code"), { text: acc.swift, fontSize: 7.5 }]);
    if (acc.bank_name) rows.push([labelCell("Nazwa banku", "Bank name"), { text: acc.bank_name, fontSize: 7.5 }]);
    if (acc.description)
      rows.push([labelCell("Opis rachunku", "Account description"), { text: acc.description, fontSize: 7.5 }]);
    if (rows.length > 0) {
      rightStack.push(
        {
          text: "Numer rachunku bankowego / Bank Account Number",
          style: "labelField",
          bold: true,
          color: COLOR_PRIMARY,
          fontSize: 8,
          margin: [0, 0, 0, 2],
        },
        {
          table: {
            dontBreakRows: true,
            widths: [105, "*"],
            body: rows,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => COLOR_TABLE_BORDER,
            vLineColor: () => COLOR_TABLE_BORDER,
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
        },
      );
    }
  }

  return {
    unbreakable: true,
    stack: [
      { text: "Płatność / Payment", style: "sectionTitle" },
      {
        columns: [
          { width: 195, stack: leftStack },
          { width: "*", stack: rightStack.length > 0 ? rightStack : [{ text: "" }] },
        ],
        columnGap: 14,
      },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildFootnotes(ctx: RenderContext): Content | null {
  if (ctx.footnotes.length === 0) return null;
  return {
    unbreakable: true,
    stack: [
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: ctx.footnotes.map((n) => ({ text: `*${n}`, style: "footnote" })),
                border: [false, true, false, false],
                borderColor: [COLOR_BOX_BORDER, COLOR_BOX_BORDER, COLOR_BOX_BORDER, COLOR_BOX_BORDER],
              },
            ],
          ],
        },
        layout: {
          defaultBorder: false,
          hLineWidth: (i: number) => (i === 0 ? 0.5 : 0),
          hLineColor: () => COLOR_BOX_BORDER,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 2,
          paddingBottom: () => 0,
        },
      },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildQrSection(ctx: RenderContext): Content {
  const { invoice } = ctx;

  const rightStack: Content[] = [
    {
      text: [
        { text: "Sprawdź, czy Twoja faktura znajduje się w KSeF!", style: "qrHeader" },
      ],
    },
    {
      text: "Check if your invoice is registered in KSeF!",
      fontSize: 7,
      color: COLOR_SUBDUED_TEXT,
      margin: [0, 0, 0, 3],
    },
    { text: "Link weryfikacyjny / Verification link:", style: "labelField" },
    { text: ctx.qr_url, link: ctx.qr_url, style: "qrLink", margin: [0, 0, 0, 2] },
  ];
  if (invoice.ksef_number) {
    rightStack.push({
      text: [
        { text: "Nr KSeF / KSeF Number: ", bold: true },
        { text: invoice.ksef_number },
      ],
      fontSize: 7,
    });
  }

  return {
    unbreakable: true,
    stack: [
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: mm(184), y2: 0, lineWidth: 1, lineColor: COLOR_PRIMARY }],
        margin: [0, 0, 0, 3],
      },
      {
        columns: [
          { image: ctx.qr_image, width: mm(28), height: mm(28) },
          { stack: rightStack },
        ],
        columnGap: 10,
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Top-level
 * ------------------------------------------------------------------ */

export function buildDocDefinition(ctx: RenderContext): TDocumentDefinitions {
  const content: Content[] = [
    buildHeader(ctx),
    buildParties(ctx),
    buildDetailsBox(ctx),
    buildLineItemsTable(ctx),
  ];
  const taxSummary = buildTaxSummary(ctx);
  if (taxSummary) content.push(taxSummary);
  content.push(buildAmountInWords(ctx));
  const annotations = buildAnnotations(ctx);
  if (annotations) content.push(annotations);
  content.push(buildPaymentBlock(ctx));
  const footnotes = buildFootnotes(ctx);
  if (footnotes) content.push(footnotes);
  content.push(buildQrSection(ctx));

  return {
    pageSize: "A4",
    pageMargins: [mm(13), mm(12), mm(13), mm(16)],
    defaultStyle: { fontSize: 7, color: "#000", lineHeight: 1.15 },
    styles,
    info: {
      title: `Faktura ${ctx.invoice.invoice_number}`,
      author: ctx.invoice.seller.name,
      subject: `${ctx.invoice_type_pl} — ${ctx.invoice.invoice_number}`,
    },
    content,
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} z ${pageCount}`,
      alignment: "right",
      fontSize: 6.5,
      color: COLOR_LABEL_MUTED,
      margin: [0, 0, mm(13), mm(8)],
    }),
  };
}
