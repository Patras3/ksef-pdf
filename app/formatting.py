"""Polish number formatting utilities for KSeF invoice PDF generation."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


def format_amount(value: str) -> str:
    """Format a numeric string as a Polish monetary amount.

    Uses comma as the decimal separator and space as the thousands separator,
    always rendering exactly two decimal places.

    Examples:
        "1234.56"  → "1 234,56"
        "1000"     → "1 000,00"
        "0.00"     → "0,00"
    """
    amount = Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # Split into integer and fractional parts
    int_part, _, frac_part = f"{amount:.2f}".partition(".")
    # Add space thousands separator to integer part
    int_formatted = _thousands(int_part)
    return f"{int_formatted},{frac_part}"


def format_exchange_rate(value: str) -> str:
    """Format an exchange rate string with exactly six decimal places and a comma separator.

    Examples:
        "4.2346"    → "4,234600"
        "4.234600"  → "4,234600"
    """
    rate = Decimal(value).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    formatted = f"{rate:.6f}"
    return formatted.replace(".", ",")


def _thousands(int_str: str) -> str:
    """Insert space as a thousands separator into an integer string (handles negatives)."""
    negative = int_str.startswith("-")
    digits = int_str.lstrip("-")
    # Group digits from the right in blocks of 3
    groups: list[str] = []
    while len(digits) > 3:
        groups.append(digits[-3:])
        digits = digits[:-3]
    groups.append(digits)
    result = " ".join(reversed(groups))
    return f"-{result}" if negative else result
