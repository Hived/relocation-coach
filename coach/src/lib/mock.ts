/** Canned answers used when COACH_MOCK=1 (testing the app without Claude). */
const tri = (en: string) => ({ en, ar: "هذا نص تجريبي.", darija: "Hada ghir texte dyal test." });
const duo = (en: string) => ({ en, darija: "Hada ghir texte dyal test." });

export function mockFor(kind: string, prompt: string): unknown {
  switch (kind) {
    case "ping":
      return { ok: true, message: "Mock mode: Claude is not really connected." };
    case "frenchPlacement":
      return {
        mcq: [
          { q: "Je ___ marocain.", options: ["suis", "es", "est", "sommes"], answer: "suis", skill: "conjugation", level: "A1" },
          { q: "Hier, nous ___ au cinéma.", options: ["sommes allés", "avons allé", "allons", "irons"], answer: "sommes allés", skill: "conjugation", level: "A2" },
          { q: "Il faut que tu ___ à l'heure.", options: ["sois", "es", "seras", "étais"], answer: "sois", skill: "grammar", level: "B1" },
        ],
        writing_prompt: { fr: "Présentez-vous en 5 phrases.", ...tri("Introduce yourself in 5 sentences.") },
      };
    case "frenchPlacementGrade":
      return {
        level: "A2",
        score: 48,
        summary: tri("You understand a lot but conjugation in the past needs work."),
        strengths: ["Present tense of être/avoir"],
        weaknesses: ["Passé composé with être"],
        corrections: [{ wrong: "je suis allé hier au travail", right: "je suis allé au travail hier", type: "syntax", rule: tri("Time words usually go at the end.") }],
        start_topic_index: 0,
      };
    case "frenchTask":
      return {
        title: "Les verbes être et avoir",
        lesson: tri("**être** = to be, **avoir** = to have. They are the two most important verbs."),
        examples: [
          { fr: "Je suis développeur.", en: "I am a developer.", darija: "Ana developer." },
          { fr: "J'ai cinq ans d'expérience.", en: "I have five years of experience.", darija: "3endi 5 snin d l-experience." },
        ],
        task_fr: "Écrivez 5 phrases sur vous avec être et avoir.",
        task: tri("Write 5 sentences about yourself using être and avoir."),
        useful_words: [{ fr: "l'expérience (f)", en: "experience", darija: "l-experience" }],
        expected_sentences: 5,
      };
    case "frenchCorrect":
      return {
        score: 7,
        corrected_text: "Je suis développeur. J'ai vingt-neuf ans.",
        praise: tri("Good structure! Small conjugation mistakes."),
        corrections: [
          { wrong: "Je ai", right: "J'ai", type: "spelling", rule: tri("je + vowel becomes j' (elision).") },
          { wrong: "un expérience", right: "une expérience", type: "gender", rule: tri("expérience is feminine.") },
        ],
        vocab: [{ fr: "un entretien", en: "an interview", darija: "entretien / mo9abala", example: "J'ai un entretien demain." }],
        next_tip: tri("Practice elision: je → j' before a vowel."),
      };
    case "codingLesson":
      return {
        title: "Mock lesson",
        explanation: duo("This is a **mock** lesson. Connect Claude Code to get real lessons."),
        code_example: "int x = 5; // value type\nvar list = new List<int>(); // reference type",
        key_points: [duo("Value types are copied."), duo("Reference types share the same object.")],
        common_mistakes: [duo("Thinking struct and class behave the same when copied.")],
        flashcards: [{ front: "Is string a value or reference type?", back: "Reference type (but immutable)." }],
        check_questions: [{ q: "What happens when you copy a struct?", answer: "You get an independent copy." }],
      };
    case "codingHint":
      return { hint: duo("Mock hint: think about which data structure gives O(1) lookups.") };
    case "codingReview":
      return {
        score: 6,
        summary: duo("Works for the main case, misses an edge case."),
        good: [duo("Clear variable names.")],
        issues: [{ problem: "Null input not handled", fix: "Guard with ArgumentNullException.ThrowIfNull(nums).", topic: "edge cases", rule: duo("Always check inputs at public boundaries.") }],
        complexity: "O(n) time, O(n) space",
      };
    case "judge": {
      const answer = prompt.match(/Learner's answer: """([\s\S]*?)"""/)?.[1] ?? "";
      const correct = /copy|reference|deferred|correct/i.test(answer);
      return { correct, feedback: { en: correct ? "Correct!" : "Not quite.", ar: "تجربة.", darija: correct ? "Mzyan!" : "Machi bzzaf." } };
    }
    case "relearnChecks":
      return { questions: [{ q: "Mock question 1?", answer: "Mock answer 1" }, { q: "Mock question 2?", answer: "Mock answer 2" }, { q: "Mock question 3?", answer: "Mock answer 3" }] };
    case "teachGrade":
      return {
        accuracy: 6,
        completeness: 5,
        clarity: 7,
        overall: 6,
        feedback: duo("Good start; you missed why it matters."),
        gaps: [{ gap: "Did not explain the deadlock risk", correction: ".Result blocks the thread and can deadlock with a sync context.", rule: duo("Never block on async code.") }],
        model_explanation: { en: "Mock model explanation." },
      };
    case "interviewTurn":
      return { message: "Hi! Thanks for joining. Can you tell me about a .NET project you're proud of? (mock)", done: false };
    case "interviewFeedback":
      return {
        score: 6,
        verdict: "lean hire",
        summary: duo("Solid basics, answers could be more structured."),
        strengths: ["Clear communication"],
        improvements: [{ question: "Tell me about a project", issue: "No measurable result", better_answer: "Use STAR and give a number." }],
      };
    case "companyBrief":
      return { markdown: "# Mock brief\n\nConnect Claude Code to generate a real company brief." };
    case "weeklyReport":
      return { markdown: "# Weekly report (mock)\n\n- Keep going!\n\n*Bsa7tek, kml hakka!*" };
    default:
      return {};
  }
}
