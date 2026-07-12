export interface NenpyoSpec {
  name: string;
  birthYear: number;
  kana?: string;
}

export interface QAItem {
  role: "ai" | "user";
  content: string;
}

export interface InterviewResponse {
  acknowledgement: string;
  next_category: string;
  question_number_in_category: number;
  question: string;
  is_complete: boolean;
}

export interface TimelineEvent {
  id: string;
  year: string;
  age?: string;
  event: string;
  emotion?: string;
}

export function calcMaxQuestions(birthYear: number): number {
  const age = new Date().getFullYear() - birthYear;
  if (age < 30) return 6;
  if (age < 50) return 8;
  return 10;
}
