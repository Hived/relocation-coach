/**
 * All prompts sent to Claude. Every answer must be a single JSON object.
 * Language rules (agreed with the learner):
 *  - Coding: explanations in English + Moroccan Darija. Technical terms stay in English.
 *  - French: explanations in English + Modern Standard Arabic + Darija.
 *  - Darija is ALWAYS written in Latin letters (3arbizi: 3, 7, 9, kh, ch, gh), never Arabic script.
 *  - Modern Standard Arabic is in Arabic script and never contains Latin words or code.
 */

const LEARNER = `The learner: Moroccan software developer, 29, CS master's degree, 5 years of .NET experience but rusty after relying on AI "vibe coding". Good English, basic French (understands, struggles to speak/write). Preparing to relocate to Ireland or the UK (plan B: France).`;

const DARIJA_RULE = `Darija must be natural Moroccan Darija written ONLY in Latin letters (3arbizi, e.g. "ila beddelti wa7ed kay-tbeddel 7ta l-akhor"), never Arabic script.`;

export const CODING_LANG = `Explain in two versions: "en" (clear, simple English) and "darija" (${DARIJA_RULE} Keep technical terms like class, interface, method, async in English inside the Darija text).`;

export const FRENCH_LANG = `Every explanation has three versions: "en" (simple English), "ar" (Modern Standard Arabic in Arabic script, with NO Latin letters or French words inside — put French examples only in the separate example fields), and "darija" (${DARIJA_RULE}).`;

const JSON_ONLY = `Reply with ONLY one JSON object matching the schema. No markdown fences, no text before or after.`;

export const SYS = {
  frenchTeacher: `You are a warm, precise French teacher for an Arabic-speaking (Moroccan) adult learner. ${LEARNER} Use the communicative approach: high-frequency verbs and real-life situations first; grammar is taught through the learner's own mistakes. Watch for typical Arabic-speaker errors: noun gender, être/avoir in passé composé, u/ou and é/è, missing articles, prepositions. ${FRENCH_LANG} ${JSON_ONLY}`,
  codingTeacher: `You are a patient senior .NET engineer mentoring a rusty developer back to interview level. ${LEARNER} Never write the full solution to an exercise unless explicitly asked for hint level 3; teach, ask, nudge. Prefer modern C# (.NET 8). ${CODING_LANG} ${JSON_ONLY}`,
  judge: `You are a fair examiner. Decide whether the learner's answer is correct in substance (wording can differ). ${LEARNER} ${JSON_ONLY}`,
  interviewer: `You are a realistic interviewer at a tech company in Dublin or London hiring a mid-level .NET engineer who would need visa sponsorship. ${LEARNER} Ask one question at a time, follow up on vague answers, keep a professional but friendly tone. ${JSON_ONLY}`,
  careerCoach: `You are a career coach specialized in tech relocation to Ireland and the UK with visa sponsorship. ${LEARNER} Be concrete and honest; say clearly when something must be verified on an official site. ${JSON_ONLY}`,
};

export const PROMPTS = {
  ping: () => `Reply with {"ok": true, "message": "<a one-line friendly greeting>"}`,

  frenchPlacement: () => `Create a short French placement test (about 10 minutes) to estimate the learner's CEFR level (A1–B2).
Schema: {"mcq":[{"q":"question in French","options":["a","b","c","d"],"answer":"exact correct option","skill":"grammar|conjugation|vocabulary|comprehension","level":"A1|A2|B1|B2"}],"writing_prompt":{"fr":"writing task in French (5-6 sentences)","en":"...","ar":"...","darija":"..."}}
Give 12 MCQ ordered from easy (A1) to hard (B2).`,

  frenchPlacementGrade: (mcqResults: string, writing: string) => `Grade this placement test.
MCQ results (question | learner answer | correct answer):
${mcqResults}
Writing answer:
"""${writing}"""
Schema: {"level":"A1|A2|B1|B2","score":0-100,"summary":{"en":"","ar":"","darija":""},"strengths":["..."],"weaknesses":["..."],"corrections":[{"wrong":"","right":"","type":"gender|conjugation|agreement|spelling|vocabulary|syntax|preposition|article","rule":{"en":"","ar":"","darija":""}}],"start_topic_index":0}
start_topic_index = index in the curriculum to start from (0 = present tense of key verbs).`,

  frenchTask: (topic: string, level: string, recentMistakes: string) => `Create today's French practice task.
Current topic: ${topic}
Learner level: ${level}
Recent recurring mistakes to target: ${recentMistakes || "none yet"}
Include a mini-lesson on the topic, then a short writing/speaking task that forces using it.
Schema: {"title":"short title","lesson":{"en":"","ar":"","darija":""},"examples":[{"fr":"","en":"","darija":""}],"task_fr":"the task in simple French","task":{"en":"","ar":"","darija":""},"useful_words":[{"fr":"","en":"","darija":""}],"expected_sentences":5}
Give 3–5 examples and 5–8 useful words.`,

  frenchCorrect: (task: string, answer: string) => `Correct the learner's French.
Task: ${task}
Learner answer:
"""${answer}"""
Correct EVERY mistake (spelling, accents, gender, conjugation, agreement, word choice, syntax). Explain each with a one-line rule.
Schema: {"score":0-10,"corrected_text":"full corrected version","praise":{"en":"","ar":"","darija":""},"corrections":[{"wrong":"exact wrong fragment","right":"corrected fragment","type":"gender|conjugation|agreement|spelling|accent|vocabulary|syntax|preposition|article","rule":{"en":"","ar":"","darija":""}}],"vocab":[{"fr":"word or expression worth learning from this exercise","en":"","darija":"","example":"short French example"}],"next_tip":{"en":"","ar":"","darija":""}}
Give 2–5 vocab items. If there are no mistakes, corrections is [].`,

  codingLesson: (topic: string, points: string) => `Teach this C#/.NET topic as a short lesson (about 10 minutes of reading).
Topic: ${topic}
Must cover: ${points}
Schema: {"title":"","explanation":{"en":"","darija":""},"code_example":"C# code with short comments","key_points":[{"en":"","darija":""}],"common_mistakes":[{"en":"","darija":""}],"flashcards":[{"front":"question","back":"short answer"}],"check_questions":[{"q":"","answer":""}]}
Use markdown inside explanation (short paragraphs, bullet lists). 4–6 key points, 3–5 flashcards, 3 check questions.`,

  codingHint: (exercise: string, code: string, level: number, testOutput: string) => `The learner asks for hint level ${level} on this exercise.
Level 1 = a nudge (what to think about). Level 2 = the approach/algorithm in words, no code. Level 3 = pseudo-code or a partial snippet, still not the full final solution.
Exercise:
${exercise}
Learner's current code:
\`\`\`csharp
${code}
\`\`\`
Last test output:
${testOutput || "(not run yet)"}
Schema: {"hint":{"en":"","darija":""}}`,

  codingReview: (exercise: string, code: string, testOutput: string) => `Review the learner's solution like a senior engineer in a code review.
Exercise:
${exercise}
Code:
\`\`\`csharp
${code}
\`\`\`
Test output:
${testOutput || "(not run)"}
Schema: {"score":0-10,"summary":{"en":"","darija":""},"good":[{"en":"","darija":""}],"issues":[{"problem":"","fix":"","topic":"short topic name","rule":{"en":"","darija":""}}],"complexity":"time and space complexity in one line, or empty"}
Only list real issues (bugs, edge cases, naming, readability, performance, idiomatic C#).`,

  judge: (question: string, expected: string, answer: string, lang: "coding" | "french") => `Question: ${question}
Expected / correct answer: ${expected}
Learner's answer: """${answer}"""
Is the learner's answer correct in substance?
Schema: {"correct":true|false,"feedback":{"en":""${lang === "french" ? ',"ar":""' : ""},"darija":""}}
Feedback: one or two sentences. Darija in Latin letters only.`,

  relearnChecks: (card: string) => `From this relearn card, write 3 short check questions that test real understanding (not memorized wording).
Card:
${card}
Schema: {"questions":[{"q":"","answer":""}]}`,

  teachGrade: (topic: string, explanation: string) => `The learner explains "${topic}" as if teaching a junior developer (Feynman technique). Grade it.
Learner's explanation:
"""${explanation}"""
Schema: {"accuracy":0-10,"completeness":0-10,"clarity":0-10,"overall":0-10,"feedback":{"en":"","darija":""},"gaps":[{"gap":"what was wrong or missing","correction":"the correct idea","rule":{"en":"","darija":""}}],"model_explanation":{"en":"a great 5-7 sentence explanation"}}`,

  interviewTurn: (mode: string, transcript: string) => `Interview type: ${mode}
Transcript so far (I = interviewer, C = candidate):
${transcript || "(interview not started)"}
Give the interviewer's next message. Start with a short greeting and the first question if not started. After about 6–8 candidate answers, close the interview politely and set done=true.
Schema: {"message":"","done":false}`,

  interviewFeedback: (mode: string, transcript: string) => `Give honest feedback on this ${mode} interview.
Transcript:
${transcript}
Schema: {"score":0-10,"verdict":"strong hire|hire|lean hire|lean no|no","summary":{"en":"","darija":""},"strengths":["..."],"improvements":[{"question":"the question","issue":"what was weak","better_answer":"a stronger answer"}]}`,

  companyBrief: (company: string, role: string, notes: string) => `Write a one-page company research brief to prepare an application/interview.
Company: ${company}
Role: ${role || "Software Engineer (.NET)"}
Known notes: ${notes || "none"}
Cover: what the company does, likely tech stack, Dublin/London presence, visa sponsorship signals (say "verify" when unsure), typical interview process, culture, 5 smart questions to ask, how to tailor the CV. Be honest about uncertainty; your knowledge may be outdated.
Schema: {"markdown":"the brief in markdown"}`,

  weeklyReport: (data: string) => `Write the learner's weekly report from this activity data:
${data}
Cover: what was learned, mistakes closed vs still open (top weak spots), streak, scores trend, job-hunt activity, and a focused plan for next week (max 5 bullet points). If activity was low, be kind and suggest a lighter week (burnout guard), never guilt.
Schema: {"markdown":"report in markdown, with a short Darija (Latin letters) motivational line at the end"}`,
};
