from app.num_words import amount_in_words


def test_eur_polish():
    pl, en = amount_in_words("1234.56", "EUR")
    assert "tysiąc dwieście trzydzieści cztery" in pl
    assert "euro" in pl
    assert "56/100" in pl


def test_eur_english():
    pl, en = amount_in_words("1234.56", "EUR")
    assert "one thousand" in en.lower()
    assert "euro" in en.lower()


def test_pln():
    pl, en = amount_in_words("100.00", "PLN")
    assert "sto" in pl
    assert "złot" in pl
    assert "hundred" in en.lower()


def test_usd():
    pl, en = amount_in_words("50.25", "USD")
    assert "pięćdziesiąt" in pl
    assert "dolar" in pl
    assert "fifty" in en.lower()


def test_zero():
    pl, en = amount_in_words("0.00", "EUR")
    assert "zero" in pl
    assert "zero" in en.lower()
