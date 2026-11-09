export type Area = "coding" | "french" | "interview";

export interface TriText {
  en: string;
  ar?: string; // Modern Standard Arabic (French lessons only)
  darija?: string; // Moroccan Darija in Latin letters (3arbizi)
}

export interface Mistake {
  id: string;
  date: string;
  area: Area;
  topic: string;
  question: string;
  myAnswer: string;
  correction: string;
  rule: TriText;
  streakCorrect: number; // closed when it reaches 2
  status: "open" | "closed";
  history: { date: string; answer: string; correct: boolean }[];
}

export interface CardState {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface Card {
  id: string;
  area: "coding" | "french";
  topic: string;
  front: string;
  back: string;
  extra?: TriText;
  createdAt: string;
  fsrs: CardState;
}

export interface Progress {
  sessions: string[]; // ISO dates with any activity
  skills: Record<string, number>; // topic -> 0..100
  hints: Record<string, number[]>; // exerciseId -> hint levels used
  solved: Record<string, string>; // exerciseId -> date solved
  french: { level: string; placementDone: boolean; topicIndex: number };
  scores: { date: string; area: Area; score: number }[];
}

export interface Settings {
  model: string; // "" = Claude Code default; or "sonnet", "opus", "haiku", "fable"
  showEn: boolean;
  showAr: boolean;
  showDarija: boolean;
  dailyMinutes: number;
}

export const DEFAULT_SETTINGS: Settings = {
  model: "",
  showEn: true,
  showAr: true,
  showDarija: true,
  dailyMinutes: 90,
};

export const DEFAULT_PROGRESS: Progress = {
  sessions: [],
  skills: {},
  hints: {},
  solved: {},
  french: { level: "unknown", placementDone: false, topicIndex: 0 },
  scores: [],
};

export interface Application {
  id: string;
  company: string;
  role: string;
  country: "IE" | "UK" | "FR" | "Other";
  link: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  salary?: string;
  notes?: string;
  nextAction?: string;
  nextDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  role?: string;
  howFound?: string;
  link?: string;
  messagedOn?: string;
  followUpOn?: string;
  status: "to-contact" | "messaged" | "replied" | "referred" | "no-reply";
  notes?: string;
}
