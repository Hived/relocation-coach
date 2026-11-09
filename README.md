# Relocation Coach 🇮🇪 🇬🇧 · .NET · 🇫🇷

My personal system to **relearn .NET properly**, **learn French (plan B)** and **land a sponsored developer job in Ireland or the UK**.

It's a local web app (Next.js) connected to **my own Claude Code** (my subscription — no API key), plus C# exercises with real tests, job-hunt scripts and all my progress saved as files in this repo.

## What's inside

| Screen | What it does |
|---|---|
| 🏠 **Today** | Today's plan: due reviews, next lesson, French topic, follow-ups, burnout guard |
| 💻 **Coding Studio** | Lessons in English + Darija, VS Code-style editor, **Run tests** (real `dotnet test`), hints 1/2/3, code review |
| 🇫🇷 **French Studio** | Placement test, daily lesson, write or **speak** (mic), corrections ❌ → ✅ → 📘 in English / العربية / Darija, listen to pronunciation |
| 🃏 **Flashcards** | Spaced repetition (FSRS) for C# and French — 3D flip cards |
| 📕 **Mistake Journal** | Every mistake with correction + rule, timeline, filters, **Redo** until correct twice |
| 🔁 **Relearn** | 1-page summary per topic + your old mistakes + 3 quick checks |
| 🎓 **Teach-back** | Explain a concept, get graded on accuracy / completeness / clarity |
| 🎤 **Mock Interview** | .NET, system design, behavioral (STAR), salary negotiation — chat or voice |
| 💼 **Jobs** | Drag-and-drop tracker, sponsor list, new jobs, referral contacts + templates, company briefs, salary calculator |
| ✈️ **Relocation** | Ireland + UK move checklists with official links |
| 📊 **Dashboard** | Streak heatmap, score curves, skills, job funnel, weekly report |

## Setup on my PC (once)

1. Install **Node.js LTS** → https://nodejs.org
2. Install the **.NET 8 SDK or newer** → https://dotnet.microsoft.com/download
3. Install **Claude Code** and log in once: open a terminal, run `claude`, follow the login.
4. Install **Git**, then clone:
   ```bash
   git clone https://github.com/Hived/relocation-coach.git
   ```
5. (Optional, for job scripts) **Python 3.11+**, then:
   ```bash
   pip install -r relocation-coach/jobs/requirements.txt
   ```

## Start the app

- **Windows:** double-click `start.bat`
- **macOS / Linux:** `./start.sh`

It opens **http://localhost:3000**. The first start installs dependencies (a few minutes).

Then go to **Settings → Test connection** to check Claude works. If answers feel slow, pick **Sonnet** there.

> Use **Chrome or Edge** for the microphone and text-to-speech features.

## Daily routine (~1.5 h)

1. **Today** page → do what it says (reviews first, ~5 min)
2. **Coding** ~60 min: lesson → check questions → exercises (AI off, hints only when stuck)
3. **French** ~30 min: lesson → write/speak → corrections
4. **Sunday**: Dashboard → *Generate weekly report*, Redo mistakes, Jobs follow-ups
5. **Save my progress:**
   ```bash
   git add -A && git commit -m "progress" && git push
   ```

## Job-hunt scripts

```bash
# Companies that really sponsor visas (UK register downloads automatically; Ireland file from enterprise.gov.ie)
python jobs/sponsors/build_targets.py --ireland-file path/to/permits-by-company.xlsx

# New .NET jobs in Dublin / London (once a day)
python jobs/finder/jobspy_daily.py
```

Results appear in **Jobs → Sponsors & jobs**.

## Where my data lives

| Folder | Content |
|---|---|
| `data/` | progress, mistakes, flashcards, settings, applications, contacts (JSON) |
| `french/journal/` | every French exercise with corrections (Markdown) |
| `relearn/` | relearn cards per topic |
| `interviews/logs/` | mock interview transcripts + feedback |
| `jobs/` | sponsor lists, found jobs, company briefs, CV |
| `reports/` | weekly reports |
| `coding/` | C# exercises (`Exercises/`) and their tests (`Exercises.Tests/`) |

## Credits

Spaced repetition: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT) · Job scraping: [JobSpy](https://github.com/speedyapply/JobSpy) (MIT) · Job-scoring ideas inspired by [career-ops](https://github.com/santifer/career-ops) (MIT).
