from app.mappings import (
    get_country_name, get_invoice_type, get_payment_form,
    get_tax_rate_display, get_tax_rate_footnote, get_tax_summary_label,
)


def test_country_name_pl():
    assert get_country_name("PL") == ("Polska", "Poland")


def test_country_name_us():
    assert get_country_name("US") == ("Stany Zjednoczone Ameryki", "United States")


def test_country_name_unknown():
    pl, en = get_country_name("XX")
    assert pl == "XX" and en == "XX"


def test_invoice_type_vat():
    assert get_invoice_type("VAT") == ("Faktura podstawowa", "Standard Invoice")


def test_payment_form_transfer():
    assert get_payment_form("6") == ("Przelew", "Bank transfer")


def test_tax_rate_display_np_i():
    assert get_tax_rate_display("np I") == "np.I*"


def test_tax_rate_display_23():
    assert get_tax_rate_display("23") == "23%"


def test_tax_rate_footnote_np_i():
    result = get_tax_rate_footnote("np I")
    assert result == "np. - Nie podlega opodatkowaniu w Polsce. / Not subject to taxation in Poland."


def test_tax_rate_footnote_23():
    assert get_tax_rate_footnote("23") is None


def test_tax_summary_label_p13_8():
    label = get_tax_summary_label("P_13_8")
    assert "np z wyłączeniem art. 100 ust 1 pkt 4 ustawy" in label
    assert "Not subject to tax" in label
