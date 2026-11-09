#!/usr/bin/env python3
"""
Daily job finder: new .NET / C# jobs in Ireland and the UK, scored and flagged.

Uses JobSpy (MIT, https://github.com/speedyapply/JobSpy):  pip install -r jobs/requirements.txt
Run from your PC (home internet works best for LinkedIn/Indeed):

  python jobs/finder/jobspy_daily.py
  python jobs/finder/jobspy_daily.py --hours 24 --results 40

Output: jobs/finder/new_jobs.csv (shown in the app under Jobs → Sponsors & jobs)
  sponsor  = ⭐ when the company appears in jobs/sponsors/targets.csv
  score    = 0-100 keyword pre-score (stack match + sponsorship signals). Claude scores properly in the app.

Be polite: run it once a day, not in a loop. You apply by hand — no auto-apply.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / "new_jobs.csv"
SEEN = HERE / "seen_urls.txt"
TARGETS = ROOT / "jobs" / "sponsors" / "targets.csv"

SEARCHES = [
    # (search term, location, indeed country)
    (".NET developer", "Dublin, Ireland", "ireland"),
    ("C# software engineer", "Ireland", "ireland"),
    (".NET developer", "London, UK", "uk"),
    ("C# software engineer", "United Kingdom", "uk"),
]

PLUS = {
    r"\.net\b|dotnet": 15, r"\bc#": 15, r"asp\.net": 10, r"\bazure\b": 8, r"entity framework|ef core": 6,
    r"microservice": 4, r"\bsql\b": 4, r"visa sponsorship|sponsorship (is )?available|we (can|will) sponsor|critical skills": 25,
    r"relocation (package|support|assistance)": 15, r"mid[- ]level|intermediate": 5,
}
MINUS = {
    r"no (visa )?sponsorship|unable to (offer|provide) sponsorship|cannot sponsor|without sponsorship": -40,
    r"must have (the )?(full )?right to work|eu citizens? only|stamp 4 required": -30,
    r"security clearance|sc clearance|dv clearance": -25,
    r"principal|staff engineer|head of|director": -10,
}


def norm(name: str) -> str:
    n = name.lower()
    n = re.sub(r"\b(limited|ltd|plc|llp|inc|uc|dac|group|holdings|ireland|uk|europe|emea)\b", " ", n)
    return re.sub(r"[^a-z0-9]+", " ", n).strip()


def load_sponsors() -> set[str]:
    if not TARGETS.exists():
        print("(No targets.csv yet — run jobs/sponsors/build_targets.py to enable ⭐ sponsor flags)")
        return set()
    with TARGETS.open(encoding="utf-8") as f:
        return {norm(r["company"]) for r in csv.DictReader(f) if r.get("company")}


def score(title: str, desc: str) -> int:
    text = f"{title}\n{desc}".lower()
    s = 30
    for pat, pts in {**PLUS, **MINUS}.items():
        if re.search(pat, text):
            s += pts
    return max(0, min(100, s))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hours", type=int, default=72, help="only jobs posted in the last N hours")
    ap.add_argument("--results", type=int, default=30, help="results per search")
    args = ap.parse_args()

    try:
        from jobspy import scrape_jobs  # type: ignore
    except ImportError:
        sys.exit("JobSpy is not installed. Run: pip install -r jobs/requirements.txt")

    sponsors = load_sponsors()
    seen = set(SEEN.read_text(encoding="utf-8").split()) if SEEN.exists() else set()
    rows = []
    for term, loc, country in SEARCHES:
        print(f"Searching '{term}' in {loc}…")
        try:
            df = scrape_jobs(
                site_name=["linkedin", "indeed"],
                search_term=term,
                location=loc,
                results_wanted=args.results,
                hours_old=args.hours,
                country_indeed=country,
                linkedin_fetch_description=False,
            )
        except Exception as e:  # network/site changes shouldn't kill the whole run
            print(f"  skipped: {e}")
            continue
        for _, j in df.iterrows():
            url = str(j.get("job_url") or "")
            if not url or url in seen:
                continue
            seen.add(url)
            company = str(j.get("company") or "")
            title = str(j.get("title") or "")
            desc = str(j.get("description") or "")
            is_sponsor = norm(company) in sponsors if company else False
            s = score(title, desc) + (15 if is_sponsor else 0)
            rows.append({
                "sponsor": "⭐" if is_sponsor else "",
                "score": min(100, s),
                "title": title,
                "company": company,
                "location": str(j.get("location") or ""),
                "date_posted": str(j.get("date_posted") or ""),
                "site": str(j.get("site") or ""),
                "job_url": url,
                "found_on": date.today().isoformat(),
            })

    # Keep previous results, newest first, best score first
    old = []
    if OUT.exists():
        with OUT.open(encoding="utf-8") as f:
            old = list(csv.DictReader(f))
    allrows = rows + old
    allrows.sort(key=lambda r: (r.get("found_on", ""), int(r.get("score") or 0)), reverse=True)
    allrows = allrows[:500]
    fields = ["sponsor", "score", "title", "company", "location", "date_posted", "site", "job_url", "found_on"]
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(allrows)
    SEEN.write_text("\n".join(sorted(seen)), encoding="utf-8")
    print(f"{len(rows)} new jobs ({sum(1 for r in rows if r['sponsor'])} at known sponsors) → {OUT}")


if __name__ == "__main__":
    main()
