# ksef-pdf-web — browser-side MVP (Phase A)

100% browser-side renderer dla faktur KSeF FA(3). Cel: użytkownicy generują PDF lokalnie w przeglądarce — żadne dane nie wychodzą poza ich urządzenie.

## Status: Phase A (MVP)

Aktualnie renderuje **tylko jedną fakturę** (`tests/fixtures/sample_invoice.xml` z głównego repo, skopiowaną do `public/`) z zhardcodowanymi danymi w `src/mock-data.ts`. Cel tej fazy: zwalidować że jakość `window.print()` → "Save as PDF" w Chrome jest porównywalna z obecnym output-em WeasyPrint (`docs/example_invoice.pdf` w głównym repo).

Phase B (po walidacji) doda: parser XML w przeglądarce (DOMParser), generację QR (`crypto.subtle` + qrcode lib), kwotę słownie, mapowania krajów/stawek, upload UI dla XML + KSeF ID.

## Uruchomienie lokalne

```bash
cd web
npm install
npm run dev
# otwórz http://localhost:5173 w Chrome
```

Klikając przycisk "Drukuj / Zapisz jako PDF" w prawym dolnym rogu otwiera się dialog drukowania — wybierz "Save as PDF".

## Build (statyczny output)

```bash
npm run build       # → dist/
npm run preview     # serwuje dist/ lokalnie
```

`dist/` można hostować na dowolnym statycznym hostingu (GitHub Pages, Cloudflare Pages, Netlify).

## Struktura

```
web/
├── public/
│   └── sample_invoice.xml     # referencyjna faktura (z tests/fixtures/)
├── src/
│   ├── main.ts                # bootstrap
│   ├── render.ts              # port templates/invoice.html → template literals
│   ├── mock-data.ts           # zhardcodowany kontekst dla sample_invoice.xml
│   ├── types.ts               # TS odpowiedniki dataclass z app/models.py
│   ├── styles.css             # port templates/styles.css (bez @bottom-right)
│   └── app.css                # style ekranu (cień strony, button print) — chowane @media print
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Walidacja jakości (Phase A acceptance)

1. Otwórz dev server → strona renderuje się wizualnie zgodnie z `docs/example_page1.png`
2. Print → Save as PDF → porównaj side-by-side z `docs/example_invoice.pdf`
3. Sprawdź: typografia, łamanie tabeli pozycji, page break przed sekcją QR, marginesy A4, czytelność QR

Jeśli jakość OK → Phase B (pełny port). Jeśli nie — rozważyć `html2pdf.js` lub `pdf-lib`.
