# CLAUDE.md — instructions for Claude Code sessions in this repo

## Who I'm helping
Moroccan .NET developer, 29, CS master's (Bac+5), 5 years' experience but **rusty after AI "vibe coding"**. English good, French basic (understands, struggles to speak/write).
Goal: job **with visa sponsorship** — **Ireland (Critical Skills permit, ≥ €40,904)** first, **UK (Skilled Worker, ≥ £54,700 for SOC 2134)** second, France plan B (needs French B2).
Earns side income from own Google Play apps (AdMob) — not part of this repo.

## Golden rules
1. **Never write the learner's exercise solutions.** Teach, ask questions, give hints (level 1 nudge → 2 approach → 3 near-code). Only write the solution if they explicitly ask after trying.
2. **Log every mistake** in `data/mistakes.json` (schema in `coach/src/lib/types.ts` → `Mistake`), with a one-line rule.
3. **Languages:** coding explanations in **English + Darija**; French explanations in **English + Modern Standard Arabic + Darija**. **Darija is ALWAYS in Latin letters (3arbizi: 3, 7, 9, kh, ch, gh)** — never Arabic script (mixing scripts breaks alignment). Arabic (MSA) goes in its own block with no Latin words inside. Technical terms stay in English.
4. Be honest about visa/salary facts: say "verify on the official site" when unsure.
5. **End every session with commit + push** so progress syncs between the PC and cloud sessions.

## Repo map
- `coach/` — the Next.js app ("Relocation Coach"). Talks to the local Claude Code CLI headlessly (`coach/src/lib/claude.ts`), prompts in `coach/src/lib/prompts.ts`, curriculum in `coach/src/lib/curriculum.ts`.
  - Run: `cd coach && npm install && npm run dev` (port 3000). Mock mode without Claude: `npm run mock`.
  - Checks: `npm run build` and `npx eslint src`.
- `coding/` — `Exercises/WeekNN/*.cs` (learner edits) + `Exercises.Tests/WeekNN/*Tests.cs` (xUnit). Metadata in `coding/exercises.json` (id, week, lessonId, file, testFilter, description). Run: `dotnet test coding/Exercises.Tests --filter "FullyQualifiedName~Week01.TwoSumTests"`.
- `data/` — JSON state: `mistakes`, `cards` (FSRS), `progress`, `settings`, `applications`, `contacts`, `checklist`, `lessons/`, `french-task`.
- `relearn/coding|french/*.md` — one-page relearn cards (auto-created from coding lessons; French ones can be written by Claude in sessions).
- `french/journal/YYYY-MM-DD.md` — French exercises + corrections.
- `interviews/logs/`, `reports/`, `jobs/` (sponsors, finder, briefs, cv, tracker data in `data/`).

## Adding next week's exercises (week 3+)
Follow the existing pattern exactly:
- Stub in `coding/Exercises/WeekNN/Name.cs` that **compiles** (`throw new NotImplementedException()`), tests in `coding/Exercises.Tests/WeekNN/NameTests.cs` in namespace `Exercises.Tests.WeekNN`, class `NameTests`.
- Add an entry to `coding/exercises.json` with `testFilter: "WeekNN.NameTests"` and a `lessonId` from `curriculum.ts`.
- **Verify with a reference solution in a temp copy** (never commit solutions), then confirm stubs fail and solutions pass.
- Keep every stub compiling: one compile error blocks all tests.

## Session ideas (when the learner opens a cloud session)
- "Session": read `data/progress.json`, open mistakes and due cards; quiz them on due items; teach today's topic; log results.
- French conversation practice (voice mode in the Claude app), then append corrections to `french/journal/` and mistakes to `data/mistakes.json`.
- Mock interviews, CV tailoring (`jobs/cv/`), referral messages.
