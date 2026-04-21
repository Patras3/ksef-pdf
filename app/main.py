import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response

from app.parser import parse_invoice
from app.render import render_pdf

app = FastAPI(title="KSeF PDF Generator")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(file: UploadFile = File(...)):
    xml_bytes = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".xml", prefix=file.filename.rsplit(".", 1)[0] if file.filename else "invoice", delete=False) as tmp:
        tmp.write(xml_bytes)
        tmp_path = Path(tmp.name)

    try:
        stem = Path(file.filename).stem if file.filename else "invoice"
        renamed = tmp_path.parent / f"{stem}.xml"
        tmp_path.rename(renamed)
        invoice = parse_invoice(renamed)
        pdf_bytes = render_pdf(invoice)
    finally:
        renamed.unlink(missing_ok=True)
        tmp_path.unlink(missing_ok=True)

    pdf_filename = f"{stem}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{pdf_filename}"'},
    )
