import { buildContext } from "./build-context";
import { ksefNumberFromFilename } from "./parser";
import { renderInvoice } from "./render";
import type { RenderContext } from "./types";

const xmlFileInput = document.getElementById("xml-file") as HTMLInputElement;
const ksefIdInput = document.getElementById("ksef-id") as HTMLInputElement;
const statusMsg = document.getElementById("status-msg") as HTMLDivElement;
const uploadPanel = document.getElementById("upload-panel") as HTMLDivElement;
const invoiceRoot = document.getElementById("invoice-root") as HTMLDivElement;
const pdfBtn = document.getElementById("pdf-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;

let currentContext: RenderContext | null = null;

function showStatus(msg: string, kind: "error" | "info" = "error") {
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
  // Auto-fill KSeF ID from filename if pattern matches and field is empty
  const detected = ksefNumberFromFilename(file.name);
  if (detected && !ksefIdInput.value) {
    ksefIdInput.value = detected;
  }
  void loadFile(file);
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
  uploadPanel.hidden = false;
  invoiceRoot.hidden = true;
  invoiceRoot.innerHTML = "";
  pdfBtn.hidden = true;
  resetBtn.hidden = true;
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
