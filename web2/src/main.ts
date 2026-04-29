import { buildContext } from "./build-context";
import { ksefNumberFromFilename } from "./parser";
import { renderInvoice } from "./render";
import type { RenderContext } from "./types";

const xmlFileInput = document.getElementById("xml-file") as HTMLInputElement;
const ksefIdInput = document.getElementById("ksef-id") as HTMLInputElement;
const statusMsg = document.getElementById("status-msg") as HTMLDivElement;
const formActions = document.getElementById("form-actions") as HTMLDivElement;
const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
const skipKsefBtn = document.getElementById("skip-ksef-btn") as HTMLButtonElement;
const uploadPanel = document.getElementById("upload-panel") as HTMLDivElement;
const invoiceRoot = document.getElementById("invoice-root") as HTMLDivElement;
const pdfBtn = document.getElementById("pdf-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;

let pendingFile: File | null = null;
let currentContext: RenderContext | null = null;

const KSEF_REGEX = /^\d{10}-\d{8}-[A-Z0-9]{12}-\d{2}$/;

function showStatus(msg: string, kind: "error" | "info" | "warn" = "error") {
  statusMsg.textContent = msg;
  statusMsg.className = `status-msg ${kind}`;
  statusMsg.hidden = false;
}
function clearStatus() {
  statusMsg.hidden = true;
  statusMsg.textContent = "";
}

xmlFileInput.addEventListener("change", () => {
  const file = xmlFileInput.files?.[0];
  if (!file) return;
  clearStatus();

  const detected = ksefNumberFromFilename(file.name);
  if (detected) {
    if (!ksefIdInput.value) ksefIdInput.value = detected;
    void loadFile(file);
  } else {
    // Filename doesn't match — require user to either type the KSeF ID or
    // explicitly skip it. Don't render until they choose.
    pendingFile = file;
    showStatus(
      'Nazwa pliku nie zawiera numeru KSeF. Wpisz go ręcznie albo kliknij ' +
        '"Generuj bez numeru KSeF" jeśli faktura nie była wysłana do KSeF.',
      "warn",
    );
    formActions.hidden = false;
    updateGenerateButton();
    ksefIdInput.focus();
  }
});

function updateGenerateButton() {
  const value = ksefIdInput.value.trim();
  generateBtn.disabled = value.length === 0;
  generateBtn.textContent = KSEF_REGEX.test(value) || value.length === 0
    ? "Generuj fakturę"
    : "Generuj (numer ma nietypowy format)";
}

ksefIdInput.addEventListener("input", updateGenerateButton);

generateBtn.addEventListener("click", () => {
  if (!pendingFile) return;
  void loadFile(pendingFile);
});

skipKsefBtn.addEventListener("click", () => {
  if (!pendingFile) return;
  ksefIdInput.value = "";
  void loadFile(pendingFile);
});

async function loadFile(file: File) {
  clearStatus();
  try {
    const xmlBytes = new Uint8Array(await file.arrayBuffer());
    const xmlString = new TextDecoder("utf-8").decode(xmlBytes);
    const ksefNumber = ksefIdInput.value.trim();
    const ctx = await buildContext(xmlString, xmlBytes, ksefNumber);

    invoiceRoot.innerHTML = renderInvoice(ctx);
    document.title = `Faktura ${ctx.invoice.invoice_number}`;
    currentContext = ctx;
    pendingFile = null;

    uploadPanel.hidden = true;
    invoiceRoot.hidden = false;
    pdfBtn.hidden = false;
    resetBtn.hidden = false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showStatus(`Nie udało się wczytać faktury: ${message}`);
  }
}

resetBtn.addEventListener("click", () => {
  currentContext = null;
  pendingFile = null;
  uploadPanel.hidden = false;
  invoiceRoot.hidden = true;
  invoiceRoot.innerHTML = "";
  pdfBtn.hidden = true;
  resetBtn.hidden = true;
  formActions.hidden = true;
  xmlFileInput.value = "";
  ksefIdInput.value = "";
  clearStatus();
  document.title = "KSeF PDF — generator faktur";
});

pdfBtn.addEventListener("click", async () => {
  if (!currentContext) return;
  pdfBtn.disabled = true;
  const original = pdfBtn.textContent;
  pdfBtn.textContent = "Generowanie...";
  try {
    const [pdfMakeModule, fontsModule, { buildDocDefinition }] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("./fonts.generated"),
      import("./render-pdf"),
    ]);
    const pdfMake = (pdfMakeModule as { default?: unknown }).default ?? pdfMakeModule;
    (pdfMake as { vfs: unknown }).vfs = fontsModule.vfs;

    const filename = `Faktura_${currentContext.invoice.invoice_number.replace(/[/\\]/g, "_")}.pdf`;
    (pdfMake as { createPdf: (def: unknown) => { download: (n: string) => void } })
      .createPdf(buildDocDefinition(currentContext))
      .download(filename);
  } finally {
    pdfBtn.disabled = false;
    pdfBtn.textContent = original;
  }
});
