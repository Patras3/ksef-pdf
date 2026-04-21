from app.formatting import format_amount, format_exchange_rate


def test_format_amount_thousands():
    assert format_amount("1234.56") == "1 234,56"


def test_format_amount_no_thousands():
    assert format_amount("123.45") == "123,45"


def test_format_amount_zero():
    assert format_amount("0.00") == "0,00"


def test_format_amount_large():
    assert format_amount("1234567.89") == "1 234 567,89"


def test_format_amount_integer():
    assert format_amount("1000") == "1 000,00"


def test_format_exchange_rate():
    assert format_exchange_rate("4.2346") == "4,234600"


def test_format_exchange_rate_already_six():
    assert format_exchange_rate("4.234600") == "4,234600"
