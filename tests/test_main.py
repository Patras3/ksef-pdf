from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

FIXTURE = Path(__file__).parent / "fixtures" / "sample_invoice.xml"


@pytest.mark.anyio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_generate_pdf():
    xml_bytes = FIXTURE.read_bytes()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/generate",
            files={"file": ("1111111111-20260421-ABCDEF123456-01.xml", xml_bytes, "application/xml")},
        )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:5] == b"%PDF-"


@pytest.mark.anyio
async def test_generate_no_file():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/generate")
    assert resp.status_code == 422
