import { mockContext } from "./mock-data";
import { renderInvoice } from "./render";

const root = document.getElementById("invoice-root");
if (root) {
  const note = document.createElement("div");
  note.className = "preview-note";
  note.textContent =
    "Podgląd ekranu = ten sam HTML co w web/. Pobrany PDF generowany jest przez pdfmake (wektor, zaznaczalny tekst). Layout PDF może się drobnie różnić od podglądu.";
  root.parentElement?.insertBefore(note, root);
  root.innerHTML = renderInvoice(mockContext);
  document.title = `Faktura ${mockContext.invoice.invoice_number}`;
}

const pdfBtn = document.getElementById("pdf-btn") as HTMLButtonElement | null;
pdfBtn?.addEventListener("click", async () => {
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

    const filename = `Faktura_${mockContext.invoice.invoice_number.replace(/\//g, "_")}.pdf`;
    (pdfMake as { createPdf: (def: unknown) => { download: (n: string) => void } })
      .createPdf(buildDocDefinition(mockContext))
      .download(filename);
  } finally {
    pdfBtn.disabled = false;
    pdfBtn.textContent = original;
  }
});
