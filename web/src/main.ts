import { mockContext } from "./mock-data";
import { renderInvoice } from "./render";

const root = document.getElementById("invoice-root");
if (root) {
  root.innerHTML = renderInvoice(mockContext);
  document.title = `Faktura ${mockContext.invoice.invoice_number}`;
}

const printBtn = document.getElementById("print-btn");
printBtn?.addEventListener("click", () => {
  window.print();
});
