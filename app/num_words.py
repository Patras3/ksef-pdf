"""Convert monetary amounts to bilingual (Polish/English) word form."""

from decimal import Decimal

from num2words import num2words


def _pl_form(n: int, forms: tuple[str, str, str]) -> str:
    """Return correct Polish noun form based on number.

    forms: (form_1, form_2_4, form_5plus)
    Examples:
        1 złoty, 2 złote, 5 złotych
        1 euro,  2 euro,  5 euro
    """
    form1, form2_4, form5 = forms
    if n == 1:
        return form1
    last_two = n % 100
    last_one = n % 10
    if 12 <= last_two <= 14:
        return form5
    if 2 <= last_one <= 4:
        return form2_4
    return form5


# Currency definitions: (pl_main_forms, pl_subunit, en_main, en_subunit)
_CURRENCIES: dict[str, tuple[tuple[str, str, str], str, str, str]] = {
    "EUR": (("euro", "euro", "euro"), "centów", "euro", "cent"),
    "PLN": (("złoty", "złote", "złotych"), "groszy", "złoty", "grosz"),
    "USD": (("dolar", "dolary", "dolarów"), "centów", "dollar", "cent"),
    "GBP": (("funt", "funty", "funtów"), "pensów", "pound", "penny"),
}


def amount_in_words(amount_str: str, currency: str) -> tuple[str, str]:
    """Return (polish, english) word representation of a monetary amount.

    Polish format: "{words} {currency_noun} {cents}/100"
    English format: "{words} {currency} and {cent_words} {subunit}(s)"
    """
    value = Decimal(amount_str)
    whole = int(value)
    cents = int(round((value - whole) * 100))

    pl_words = num2words(whole, lang="pl")
    en_words = num2words(whole, lang="en")

    if currency in _CURRENCIES:
        pl_forms, pl_subunit, en_main, en_subunit = _CURRENCIES[currency]
        pl_currency = _pl_form(whole, pl_forms)
        pl_result = f"{pl_words} {pl_currency} {cents}/100"

        en_subunit_plural = en_subunit + "s" if cents != 1 else en_subunit
        en_cent_words = num2words(cents, lang="en")
        en_result = f"{en_words} {en_main} and {en_cent_words} {en_subunit_plural}"
    else:
        # Unknown currency: use code as-is
        pl_result = f"{pl_words} {currency} {cents}/100"
        en_cent_words = num2words(cents, lang="en")
        en_result = f"{en_words} {currency} and {en_cent_words} cents"

    return pl_result, en_result
