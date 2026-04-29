# ksef-pdf-web2 — browser-side generator PDF dla faktur KSeF FA(3)

100% client-side: wczytujesz XML faktury, dostajesz wektorowy PDF z zaznaczalnym tekstem. **Żadne dane nie wychodzą z Twojej przeglądarki** — nie ma backendu, nie ma uploadu na serwer.

## Uruchomienie

```bash
cd web2
npm install
npm run dev   # → http://localhost:5173
```

## Build (statyczny output)

```bash
npm run build       # → dist/
npm run preview     # serwuje dist/ lokalnie
```

`dist/` można hostować na dowolnym statycznym hostingu (GitHub Pages, Cloudflare Pages, Netlify) — bez Node-a / backendu.

## Jak to działa

1. Wczytujesz plik `.xml` (FA(3) z KSeF)
2. **Numer KSeF** auto-fill z nazwy pliku jeśli pasuje do wzoru `NIP-YYYYMMDD-XXXXXXXXXXXX-NN.xml`, inaczej wpisujesz ręcznie (lub zostawiasz pusty)
3. Klik **Pobierz PDF** → pdfmake buduje wektorowy PDF lokalnie i pobiera plik

QR kod weryfikacyjny KSeF jest generowany na podstawie SHA-256 oryginalnych bajtów XML (`crypto.subtle.digest`) zgodnie z formatem `https://qr.ksef.mf.gov.pl/invoice/{NIP}/{DD-MM-YYYY}/{base64url(sha256(xml))}` — identycznie jak Pythonowy backend.

## Architektura

```
web2/src/
├── main.ts             # bootstrap UI + obsługa upload/download
├── parser.ts           # DOMParser-based parser FA(3) (port app/parser.py)
├── mappings.ts         # tabele krajów, stawek, form płatności (port app/mappings.py)
├── formatting.ts       # format_amount, format_exchange_rate (port app/formatting.py)
├── num-words.ts        # kwota słownie PL/EN (port app/num_words.py + n2words)
├── qr.ts               # SHA-256 + base64url + qrcode npm (port app/qr.py)
├── build-context.ts    # orchestrator: parser + helpers → RenderContext
├── render.ts           # screen preview HTML
├── render-pdf.ts       # pdfmake DocDefinition (port templates/invoice.html)
├── types.ts            # TS odpowiedniki dataclass z app/models.py
├── styles.css          # CSS dla preview (port templates/styles.css)
├── app.css             # styling formularza upload + przyciski
└── fonts.generated.ts  # auto-generowane (gitignore) — Roboto TTF base64
```

## Bundle size

- Initial JS: ~21 kB gzipped
- Lazy chunk po kliknięciu Pobierz PDF: ~1 MB gzipped (pdfmake ~585 kB + Roboto fonts ~465 kB)

## Znane różnice względem Pythonowego output-u

- **`amount_words_en`**: używamy `n2words/en-GB` zamiast `num2words` z Pythona. Różnica: brak przecinka po "thousand" (n2words: "one thousand two hundred and thirty-four"; Python: "one thousand, two hundred and thirty-four"). Treściowo identyczne, czytelnie poprawne.
- **Layout PDF**: pdfmake składa treść inaczej niż WeasyPrint. Layout został dostrojony na sample fakturze; możliwe drobne różnice spacing-u.

## Testowanie lokalne

Sample faktury są w `tests/fixtures/` w głównym katalogu repo. Przeciągnij `sample_invoice.xml` do upload form aby zobaczyć rendering.
