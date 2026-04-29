# ksef-pdf-web2 — alternatywa: pdfmake (vector PDF, zaznaczalny tekst)

Identyczny preview na ekranie co `web/`, ale **PDF generowany deklaratywnie przez `pdfmake`** zamiast przez `window.print()`.

## Po co druga wersja?

- `web/` używa `window.print()` — wynik zależy od ustawień przeglądarki użytkownika; Chrome domyślnie dodaje header/footer (URL, datę, numer strony) i większość użytkowników tego nie wyłącza. UX = 2 kliki + ręczne odznaczenie checkboxa.
- `web2/` używa `pdfmake` — buduje PDF wektorowo z deklaratywnego DocDefinition, bez dialogu drukowania. **Jeden klik → pobrany plik**. Tekst pełni zaznaczalny i przeszukiwalny, polskie znaki OK (Roboto TTF embedowany).

## Trade-offy względem web/

| | web/ (window.print) | web2/ (pdfmake) |
|--|--|--|
| Zaznaczalny tekst | tak | tak |
| Bundle initial | 5 kB gzipped | 6 kB gzipped |
| Bundle po kliknięciu | 0 (browser print) | +1.05 MB gzipped (pdfmake + fonts, lazy) |
| Header/footer browsera | tak (user musi odhaczyć) | nie ma dialogu |
| Layout z CSS | tak (`templates/styles.css`) | nie — DSL pdfmake (manualny port) |
| Cross-browser konsystencja | różnice fontów Chrome/FF/Safari | identyczny PDF wszędzie |
| Czas generacji | natychmiast | ~200-500 ms |
| Łatwość zmian layoutu | edycja HTML/CSS | edycja kodu TS |

## Uruchomienie

```bash
cd web2
npm install
npm run dev
# http://localhost:5173 — kliknij zielony przycisk "Pobierz PDF (pdfmake)"
```

Pierwsze kliknięcie pobiera lazy-loaded chunk pdfmake (~1 MB gzipped), kolejne są natychmiastowe (cache).

## Struktura

```
web2/
├── src/
│   ├── main.ts          # bootstrap: HTML preview + lazy-load pdfmake na klik
│   ├── render.ts        # IDENTYCZNY z web/ — HTML preview na ekran
│   ├── render-pdf.ts    # NOWY: buduje pdfmake DocDefinition z RenderContext
│   ├── mock-data.ts     # IDENTYCZNY z web/
│   ├── types.ts         # IDENTYCZNY z web/
│   ├── styles.css       # IDENTYCZNY z web/ — tylko dla preview
│   └── app.css          # screen styles (button, podgląd) + ostrzeżenie o różnicy preview vs PDF
├── public/sample_invoice.xml
├── index.html
└── package.json
```

## Status / acceptance

Wstępny test (Node, sample_invoice.xml):
- ✅ wektorowy PDF, tekst zaznaczalny i przeszukiwalny (`pdftotext` zwraca pełną treść)
- ✅ polskie znaki w fontach (Roboto TTF z vfs_fonts)
- ✅ link weryfikacyjny QR jest klikalny (pdfmake `link:` field)
- ✅ QR jako embedded image z data URI
- ⚠ layout 3-stronicowy (web/ = 2 strony) — wymaga dostrojenia spacingu / `dontBreakRows` na tabelach. Funkcjonalnie OK.

Do porównania manualnego: w `web/` klikasz print → save as PDF, w `web2/` klikasz Pobierz PDF. Otwórz oba w PDF reader-ze i porównaj.
