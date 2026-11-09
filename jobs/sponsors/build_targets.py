#!/usr/bin/env python3
"""
Build jobs/sponsors/targets.csv — companies that REALLY sponsor work visas.

Sources
  UK      : Home Office "Register of licensed sponsors: workers" (CSV, updated every working day)
            https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers
  Ireland : DETE "Employment permits issued to companies" (Excel/CSV per year)
            https://enterprise.gov.ie/en/publications/  (search "permits issued to companies")
            Download the file yourself and pass it with --ireland-file (xlsx or csv).

Usage
  python jobs/sponsors/build_targets.py                       # UK only (downloads the register)
  python jobs/sponsors/build_targets.py --ireland-file ~/Downloads/permits-2026.xlsx
  python jobs/sponsors/build_targets.py --uk-file register.csv --ireland-file permits.csv

Output columns: company,country,city,evidence,tech_signal
Only standard library is required (openpyxl only if you pass an .xlsx file: pip install openpyxl).
"""
from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "targets.csv"
GOVUK_PAGE = "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
UA = {"User-Agent": "relocation-coach/1.0 (personal job search script)"}

# Words that suggest a tech / software employer (cheap heuristic, refine as you go)
TECH_WORDS = [
    "software", "technolog", "tech", "digital", "data", "cloud", "systems", "solutions", "labs", "ai ",
    "analytics", "cyber", "security", "computing", "it services", "consult", "fintech", "payments",
    "microsoft", "google", "amazon", "meta", "stripe", "salesforce", "workday", "intercom", "hubspot",
    "oracle", "sap", "ibm", "accenture", "deloitte", "pwc", "kpmg", "ey ", "fidelity", "citi", "mastercard",
    "visa europe", "bank", "insurance", "games", "studio", "network", "platform", "app",
]
# Cities we care about
UK_CITIES = ["london", "manchester", "birmingham", "edinburgh", "glasgow", "leeds", "bristol", "cambridge", "oxford", "belfast", "reading", "cardiff"]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def find_uk_csv_url() -> str:
    try:
        html = fetch(GOVUK_PAGE).decode("utf-8", "replace")
    except OSError as e:
        sys.exit(
            f"Could not reach gov.uk ({e}).\n"
            f"Open {GOVUK_PAGE} in your browser, download the CSV, then run:\n"
            "  python jobs/sponsors/build_targets.py --uk-file <path-to-downloaded.csv>"
        )
    m = re.search(r'https://assets\.publishing\.service\.gov\.uk/[^"\']+?\.csv', html)
    if not m:
        sys.exit("Could not find the CSV link on the gov.uk page. Download it manually and use --uk-file.")
    return m.group(0)


def tech_signal(name: str) -> str:
    n = f" {name.lower()} "
    hits = [w.strip() for w in TECH_WORDS if w in n]
    return ";".join(sorted(set(hits)))


def load_uk(path: str | None) -> list[dict]:
    if path:
        text = Path(path).read_text(encoding="utf-8-sig", errors="replace")
    else:
        url = find_uk_csv_url()
        print(f"Downloading UK register: {url}")
        try:
            text = fetch(url).decode("utf-8-sig", "replace")
        except OSError as e:
            sys.exit(f"Download failed ({e}). Download it in your browser and use --uk-file.")
    rows = list(csv.DictReader(io.StringIO(text)))
    out = []
    for r in rows:
        keys = {k.lower().strip(): v for k, v in r.items() if k}
        name = (keys.get("organisation name") or keys.get("organisation") or "").strip()
        city = (keys.get("town/city") or keys.get("town") or "").strip()
        route = (keys.get("route") or "").strip()
        rating = (keys.get("type & rating") or keys.get("type and rating") or "").strip()
        if not name or "skilled worker" not in route.lower():
            continue
        out.append({
            "company": name,
            "country": "UK",
            "city": city.title(),
            "evidence": f"UK licensed sponsor ({route}{', ' + rating if rating else ''})",
            "tech_signal": tech_signal(name),
        })
    print(f"UK: {len(out)} Skilled Worker sponsors")
    return out


def load_ireland(path: str) -> list[dict]:
    p = Path(path)
    rows: list[list[str]] = []
    if p.suffix.lower() in (".xlsx", ".xlsm"):
        try:
            import openpyxl  # type: ignore
        except ImportError:
            sys.exit("Install openpyxl first: pip install openpyxl (or save the sheet as CSV).")
        wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
        for ws in wb.worksheets:
            for row in ws.iter_rows(values_only=True):
                rows.append(["" if c is None else str(c) for c in row])
    else:
        rows = list(csv.reader(io.StringIO(p.read_text(encoding="utf-8-sig", errors="replace"))))

    # Find the header row: the one that contains "employer" / "company"
    header_i = next((i for i, r in enumerate(rows) if any(re.search(r"employer|company", c, re.I) for c in r)), None)
    if header_i is None:
        sys.exit("Could not find an 'Employer'/'Company' column in the Ireland file.")
    header = [c.strip().lower() for c in rows[header_i]]
    name_col = next(i for i, c in enumerate(header) if re.search(r"employer|company", c))
    count_col = next((i for i, c in enumerate(header) if re.search(r"total|issued|count|number", c)), None)
    out = []
    for r in rows[header_i + 1 :]:
        if name_col >= len(r) or not r[name_col].strip():
            continue
        name = r[name_col].strip()
        if re.search(r"^total", name, re.I):
            continue
        count = r[count_col].strip() if count_col is not None and count_col < len(r) else ""
        out.append({
            "company": name,
            "country": "IE",
            "city": "",
            "evidence": f"Irish employment permits issued{': ' + count if count else ''}",
            "tech_signal": tech_signal(name),
        })
    print(f"Ireland: {len(out)} companies with permits")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--uk-file", help="Local copy of the UK register CSV (skips the download)")
    ap.add_argument("--ireland-file", help="DETE permits-by-company file (.xlsx or .csv)")
    ap.add_argument("--skip-uk", action="store_true")
    ap.add_argument("--all", action="store_true", help="Keep non-tech companies too (default keeps tech-looking names + big UK cities)")
    args = ap.parse_args()

    rows: list[dict] = []
    if args.ireland_file:
        rows += load_ireland(args.ireland_file)
    if not args.skip_uk:
        uk = load_uk(args.uk_file)
        if not args.all:
            uk = [r for r in uk if r["tech_signal"] and any(c in r["city"].lower() for c in UK_CITIES)]
        rows += uk
    if not args.all:
        rows = [r for r in rows if r["tech_signal"] or r["country"] == "IE"]

    # Ireland first, tech first
    rows.sort(key=lambda r: (r["country"] != "IE", not r["tech_signal"], r["company"].lower()))
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["company", "country", "city", "evidence", "tech_signal"])
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} targets → {OUT}")


if __name__ == "__main__":
    main()
