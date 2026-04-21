import argparse
import sys
from pathlib import Path

from app.parser import parse_invoice
from app.render import render_pdf


def main():
    parser = argparse.ArgumentParser(description="Generate bilingual PDF from KSeF XML")
    parser.add_argument("xml_file", type=Path, help="Path to KSeF XML invoice file")
    parser.add_argument("-o", "--output", type=Path, help="Output PDF path (default: same name as XML with .pdf)")
    args = parser.parse_args()

    if not args.xml_file.exists():
        print(f"Error: {args.xml_file} not found", file=sys.stderr)
        sys.exit(1)

    output = args.output or args.xml_file.with_suffix(".pdf")
    invoice = parse_invoice(args.xml_file)
    render_pdf(invoice, output_path=output)
    print(f"Generated: {output}")


if __name__ == "__main__":
    main()
