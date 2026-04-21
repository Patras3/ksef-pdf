"""Lookup tables for KSeF invoice data: countries, invoice types, payment forms, tax rates."""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Countries: ISO-3166 alpha-2 → (Polish name, English name)
# ---------------------------------------------------------------------------
COUNTRIES: dict[str, tuple[str, str]] = {
    "AD": ("Andora", "Andorra"),
    "AE": ("Zjednoczone Emiraty Arabskie", "United Arab Emirates"),
    "AL": ("Albania", "Albania"),
    "AM": ("Armenia", "Armenia"),
    "AT": ("Austria", "Austria"),
    "AU": ("Australia", "Australia"),
    "AZ": ("Azerbejdżan", "Azerbaijan"),
    "BA": ("Bośnia i Hercegowina", "Bosnia and Herzegovina"),
    "BE": ("Belgia", "Belgium"),
    "BG": ("Bułgaria", "Bulgaria"),
    "BR": ("Brazylia", "Brazil"),
    "BY": ("Białoruś", "Belarus"),
    "CA": ("Kanada", "Canada"),
    "CH": ("Szwajcaria", "Switzerland"),
    "CN": ("Chiny", "China"),
    "CY": ("Cypr", "Cyprus"),
    "CZ": ("Czechy", "Czech Republic"),
    "DE": ("Niemcy", "Germany"),
    "DK": ("Dania", "Denmark"),
    "EE": ("Estonia", "Estonia"),
    "EG": ("Egipt", "Egypt"),
    "ES": ("Hiszpania", "Spain"),
    "FI": ("Finlandia", "Finland"),
    "FR": ("Francja", "France"),
    "GB": ("Wielka Brytania", "United Kingdom"),
    "GE": ("Gruzja", "Georgia"),
    "GR": ("Grecja", "Greece"),
    "HR": ("Chorwacja", "Croatia"),
    "HU": ("Węgry", "Hungary"),
    "ID": ("Indonezja", "Indonesia"),
    "IE": ("Irlandia", "Ireland"),
    "IL": ("Izrael", "Israel"),
    "IN": ("Indie", "India"),
    "IS": ("Islandia", "Iceland"),
    "IT": ("Włochy", "Italy"),
    "JP": ("Japonia", "Japan"),
    "KR": ("Korea Południowa", "South Korea"),
    "KZ": ("Kazachstan", "Kazakhstan"),
    "LI": ("Liechtenstein", "Liechtenstein"),
    "LT": ("Litwa", "Lithuania"),
    "LU": ("Luksemburg", "Luxembourg"),
    "LV": ("Łotwa", "Latvia"),
    "MD": ("Mołdawia", "Moldova"),
    "ME": ("Czarnogóra", "Montenegro"),
    "MK": ("Macedonia Północna", "North Macedonia"),
    "MT": ("Malta", "Malta"),
    "MX": ("Meksyk", "Mexico"),
    "NL": ("Holandia", "Netherlands"),
    "NO": ("Norwegia", "Norway"),
    "NZ": ("Nowa Zelandia", "New Zealand"),
    "PL": ("Polska", "Poland"),
    "PT": ("Portugalia", "Portugal"),
    "RO": ("Rumunia", "Romania"),
    "RS": ("Serbia", "Serbia"),
    "RU": ("Rosja", "Russia"),
    "SA": ("Arabia Saudyjska", "Saudi Arabia"),
    "SE": ("Szwecja", "Sweden"),
    "SG": ("Singapur", "Singapore"),
    "SI": ("Słowenia", "Slovenia"),
    "SK": ("Słowacja", "Slovakia"),
    "TR": ("Turcja", "Turkey"),
    "UA": ("Ukraina", "Ukraine"),
    "US": ("Stany Zjednoczone Ameryki", "United States"),
    "UZ": ("Uzbekistan", "Uzbekistan"),
    "XK": ("Kosowo", "Kosovo"),
    "ZA": ("Republika Południowej Afryki", "South Africa"),
}


def get_country_name(code: str) -> tuple[str, str]:
    """Return (Polish name, English name) for an ISO-3166 alpha-2 country code.

    Falls back to (code, code) for unknown codes.
    """
    return COUNTRIES.get(code.upper(), (code, code))


# ---------------------------------------------------------------------------
# Invoice types: RodzajFaktury → (Polish label, English label)
# ---------------------------------------------------------------------------
INVOICE_TYPES: dict[str, tuple[str, str]] = {
    "VAT": ("Faktura podstawowa", "Standard Invoice"),
    "KOR": ("Faktura korygująca", "Corrective Invoice"),
    "ZAL": ("Faktura zaliczkowa", "Advance Invoice"),
    "ROZ": ("Faktura rozliczeniowa", "Settlement Invoice"),
    "UPR": ("Faktura uproszczona", "Simplified Invoice"),
    "KOR_ZAL": ("Korekta faktury zaliczkowej", "Corrective Advance Invoice"),
    "KOR_ROZ": ("Korekta faktury rozliczeniowej", "Corrective Settlement Invoice"),
}


def get_invoice_type(code: str) -> tuple[str, str]:
    """Return (Polish label, English label) for a RodzajFaktury code."""
    return INVOICE_TYPES.get(code, (code, code))


# ---------------------------------------------------------------------------
# Payment forms: FormaPlatnosci → (Polish label, English label)
# ---------------------------------------------------------------------------
PAYMENT_FORMS: dict[str, tuple[str, str]] = {
    "1": ("Gotówka", "Cash"),
    "2": ("Karta", "Card"),
    "3": ("Bon", "Voucher"),
    "4": ("Czek", "Cheque"),
    "5": ("Kredyt", "Credit"),
    "6": ("Przelew", "Bank transfer"),
    "7": ("Mobilna", "Mobile payment"),
}


def get_payment_form(code: str) -> tuple[str, str]:
    """Return (Polish label, English label) for a FormaPlatnosci code."""
    return PAYMENT_FORMS.get(code, (code, code))


# ---------------------------------------------------------------------------
# Tax rate display strings (what to show on the invoice)
# ---------------------------------------------------------------------------
TAX_RATE_DISPLAY: dict[str, str] = {
    "23": "23%",
    "22": "22%",
    "8": "8%",
    "7": "7%",
    "5": "5%",
    "4": "4%",
    "3": "3%",
    "0": "0%",
    "zw": "zw.*",
    "oo": "oo.*",
    "np": "np.*",
    "np I": "np.I*",
    "np II": "np.II*",
    "np III": "np.III*",
    "np IV": "np.IV*",
    "np V": "np.V*",
}


TAX_SUMMARY_RATE_DISPLAY: dict[str, str] = {
    "P_13_1": "23%",
    "P_13_2": "8%",
    "P_13_3": "5%",
    "P_13_4": "4%",
    "P_13_5": "3%",
    "P_13_6": "0%",
    "P_13_7": "zw.*",
    "P_13_8": "np.*",
    "P_13_9": "np.*",
    "P_13_10": "np.*",
    "P_13_11": "-",
}


def get_tax_rate_display(rate: str) -> str:
    """Return the display string for a tax rate code (e.g. 'np I' → 'np.I*')."""
    if rate in TAX_RATE_DISPLAY:
        return TAX_RATE_DISPLAY[rate]
    if rate in TAX_SUMMARY_RATE_DISPLAY:
        return TAX_SUMMARY_RATE_DISPLAY[rate]
    try:
        float(rate)
        return f"{rate}%"
    except ValueError:
        return rate


# ---------------------------------------------------------------------------
# Tax rate footnotes (shown at the bottom of the invoice)
# ---------------------------------------------------------------------------
TAX_RATE_FOOTNOTES: dict[str, str] = {
    "zw": "zw. - Zwolnienie od podatku VAT. / VAT exemption.",
    "oo": "oo. - Odwrotne obciążenie. / Reverse charge.",
    "np": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    "np I": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    "np II": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    "np III": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    "np IV": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
    "np V": "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland.",
}


def get_tax_rate_footnote(rate: str) -> str | None:
    """Return the footnote text for a tax rate, or None if no footnote applies."""
    return TAX_RATE_FOOTNOTES.get(rate)


# ---------------------------------------------------------------------------
# Tax summary row labels: P_13_x → Polish description
# ---------------------------------------------------------------------------
TAX_SUMMARY_LABELS: dict[str, str] = {
    "P_13_1": "Podstawa opodatkowania – stawka 22% albo 23%\nTax base – 22% or 23%",
    "P_13_2": "Podstawa opodatkowania – stawka 7% albo 8%\nTax base – 7% or 8%",
    "P_13_3": "Podstawa opodatkowania – stawka 5%\nTax base – 5%",
    "P_13_4": "Podstawa opodatkowania – stawka 4%\nTax base – 4%",
    "P_13_5": "Podstawa opodatkowania – stawka 3%\nTax base – 3%",
    "P_13_6": "Podstawa opodatkowania – stawka 0%\nTax base – 0%",
    "P_13_7": "Dostawa towarów oraz świadczenie usług zwolnionych od podatku\nExempt from tax",
    "P_13_8": "np z wyłączeniem art. 100 ust 1 pkt 4 ustawy\nNot subject to tax in Poland",
    "P_13_9": "Świadczenie usług, o których mowa w art. 100 ust. 1 pkt 4 ustawy\nIntra-EU services",
    "P_13_10": "Dostawa towarów oraz świadczenie usług poza terytorium kraju\nOutside Poland",
    "P_13_11": "Inne\nOther",
}


def get_tax_summary_label(rate_code: str) -> str:
    """Return the Polish description for a P_13_x tax summary field."""
    return TAX_SUMMARY_LABELS.get(rate_code, rate_code)
