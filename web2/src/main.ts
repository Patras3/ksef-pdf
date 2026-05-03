import { buildContext } from "./build-context";
import { KSEF_NUMBER_REGEX, ksefNumberFromFilename } from "./parser";
import { renderInvoice } from "./render";
import type { RenderContext } from "./types";

// DOM element helpers with null checks
function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Brak elementu #${id} w HTML`);
  return el as T;
}

const xmlFileInput = getElement<HTMLInputElement>("xml-file");
const ksefIdInput = getElement<HTMLInputElement>("ksef-id");
const statusMsg = getElement<HTMLDivElement>("status-msg");
const formActions = getElement<HTMLDivElement>("form-actions");
const generateBtn = getElement<HTMLButtonElement>("generate-btn");
const skipKsefBtn = getElement<HTMLButtonElement>("skip-ksef-btn");
const uploadPanel = getElement<HTMLDivElement>("upload-panel");
const invoiceRoot = getElement<HTMLDivElement>("invoice-root");
const pdfBtn = getElement<HTMLButtonElement>("pdf-btn");
const resetBtn = getElement<HTMLButtonElement>("reset-btn");
const toastContainer = getElement<HTMLDivElement>("toast-container");

// Toast notification system
export function showToast(message: string, kind: "warn" | "error" | "info" = "warn", autoClose = 8000): void {
  const toast = document.createElement("div");
  toast.className = `toast ${kind}`;

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  toastContainer.appendChild(toast);

  if (autoClose > 0) {
    setTimeout(() => toast.remove(), autoClose);
  }
}

let pendingFile: File | null = null;
let currentContext: RenderContext | null = null;

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
  generateBtn.textContent = KSEF_NUMBER_REGEX.test(value) || value.length === 0
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
  // Clear previous toasts
  toastContainer.innerHTML = "";

  try {
    // File size limit (10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showStatus("Plik jest zbyt duży (max 10 MB).");
      return;
    }

    const xmlBytes = new Uint8Array(await file.arrayBuffer());
    const xmlString = new TextDecoder("utf-8").decode(xmlBytes);
    const ksefNumber = ksefIdInput.value.trim();
    const { context: ctx, warnings } = await buildContext(xmlString, xmlBytes, ksefNumber);

    // Show validation warnings as toasts
    for (const warn of warnings) {
      showToast(warn.message, "warn");
    }

    invoiceRoot.innerHTML = renderInvoice(ctx);
    document.title = `Faktura ${ctx.invoice.invoice_number || "bez numeru"}`;
    currentContext = ctx;
    pendingFile = null;

    uploadPanel.hidden = true;
    invoiceRoot.hidden = false;
    pdfBtn.hidden = false;
    resetBtn.hidden = false;
    document.body.classList.add("invoice-visible");
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
  document.body.classList.remove("invoice-visible");
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

// Assemble the contact email in-runtime so static scrapers don't pick it up.
const emailLink = document.getElementById("contact-email") as HTMLAnchorElement | null;
if (emailLink) {
  const user = emailLink.dataset.user;
  const domain = emailLink.dataset.domain;
  if (user && domain) {
    const addr = `${user}@${domain}`;
    emailLink.textContent = addr;
    emailLink.href = `mailto:${addr}`;
  }
}
