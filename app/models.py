from dataclasses import dataclass, field


@dataclass
class Address:
    country_code: str = ""
    line1: str = ""
    line2: str = ""


@dataclass
class Party:
    nip: str = ""
    name: str = ""
    address: Address = field(default_factory=Address)
    vat_prefix: str = ""
    no_identifier: bool = False


@dataclass
class Buyer(Party):
    jst: bool = False
    gv: bool = False


@dataclass
class LineItem:
    line_number: int = 0
    name: str = ""
    unit: str = ""
    quantity: str = ""
    unit_net_price: str = ""
    net_value: str = ""
    tax_rate: str = ""
    exchange_rate: str = ""


@dataclass
class BankAccount:
    iban: str = ""
    swift: str = ""
    bank_name: str = ""
    description: str = ""


@dataclass
class PaymentTerms:
    quantity: str = ""
    unit: str = ""
    starting_event: str = ""


@dataclass
class Payment:
    form_code: str = ""
    paid: str = ""
    terms: PaymentTerms | None = None
    bank_account: BankAccount | None = None


@dataclass
class Annotations:
    reverse_charge: bool = False
    cash_method: bool = False
    split_payment: bool = False
    self_invoicing: bool = False
    simplified_triangular: bool = False


@dataclass
class TaxSummaryRow:
    rate_code: str = ""
    net_amount: str = ""
    tax_amount: str = "0.00"
    gross_amount: str = ""


@dataclass
class InvoiceData:
    invoice_number: str = ""
    invoice_type: str = ""
    invoice_date: str = ""
    sale_date: str = ""
    currency: str = ""
    exchange_rate: str = ""
    total_amount: str = ""
    seller: Party = field(default_factory=Party)
    buyer: Buyer = field(default_factory=Buyer)
    line_items: list[LineItem] = field(default_factory=list)
    tax_summary: list[TaxSummaryRow] = field(default_factory=list)
    annotations: Annotations = field(default_factory=Annotations)
    payment: Payment = field(default_factory=Payment)
    ksef_number: str = ""
    xml_bytes: bytes = field(default=b"", repr=False)
