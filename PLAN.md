# The plan

**Goal:** sponsored .NET job in 🇮🇪 Ireland (Critical Skills permit) or 🇬🇧 UK (Skilled Worker visa). Plan B: 🇫🇷 France (needs French B2).
**Time:** ~1.5 h/day on weekdays (1 h coding + 30 min French) + Sunday review and job hunt.

## Coding — 12 weeks (AI autocomplete OFF while practising)

| Weeks | Focus |
|---|---|
| **1** | C# basics: types, value vs reference (class vs struct), control flow, methods, arrays & strings, writing functions by hand |
| **2** | OOP: classes, constructors, encapsulation, inheritance, polymorphism, interfaces |
| **3** | Collections, generics, LINQ + deferred execution, exceptions |
| **4** | SOLID, dependency injection, async/await, ASP.NET Core basics |
| **1–8** | Algorithms in parallel (NeetCode 150 order, in C#): arrays → hash maps → two pointers → stack → binary search → trees → graphs → DP |
| **5–8** | Portfolio project (separate repo, topic TBD): ASP.NET Core + EF Core + SQL + tests + Docker, deployed to Azure with Application Insights logs |
| **9–12** | Interview mode: system design + timed mock interviews (technical + STAR) |

## French — A2 → B2 in 12–18 months (30 min/day)
Present tense of key verbs → near future → passé composé (avoir/être) → imparfait → future → pronouns → relatives → conditional → subjunctive → connectors → formal writing → DELF B1/B2 tasks → job interview in French.
Daily: 5 min cards → 10 min mini-lesson → 15 min write/speak → corrections.

## Jobs (from week 3, weekends)
1. Build the sponsor list (`jobs/sponsors/build_targets.py`).
2. CV in Irish/UK format (2 pages, no photo/age) + "Eligible for Critical Skills Employment Permit" line.
3. Daily finder (`jobs/finder/jobspy_daily.py`) → apply by hand to the best matches (10 strong > 500 spam).
4. Referrals: ~5 personal messages/day to Moroccan engineers & alumni at target companies (templates in the app).
5. Company brief before every interview.

## Azure (without access at work)
- Ask work if I have a **Visual Studio Professional/Enterprise subscription** → personal monthly Azure dev/test credit.
- Or **Azure free account** ($200 for 30 days + 12 months of limited free services).
- Hands-on: App Service, Functions, Azure SQL, Key Vault, Application Insights / Log Analytics. Log each lab in `azure/`.
- Certification: AZ-204 retired on 31 July 2026 → replacement **AI-200 (Azure AI Cloud Developer Associate)**. Decide after the portfolio project.

## Visa facts (2026 — verify on official sites)
- 🇮🇪 Critical Skills Employment Permit: role on the Critical Skills list (software developers are), ≥ €40,904 with a relevant degree, Stamp 4 after 2 years.
- 🇬🇧 Skilled Worker: licensed sponsor, salary ≥ the higher of £41,700 and the occupation going rate (£54,700 for SOC 2134 programmers), English B2, health surcharge £1,035/yr.
