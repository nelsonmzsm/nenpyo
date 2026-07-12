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
  // 1問あたり約4年分の人生をカバー、最低8問・最大20問
  return Math.max(8, Math.min(20, Math.ceil(age / 4)));
}

export function categoryToAge(category: string, currentAge: number): number {
  if (!category) return 0;
  if (category.startsWith("①")) return Math.min(12, currentAge);
  if (category.startsWith("②")) return Math.min(18, currentAge);
  if (category.startsWith("③")) return Math.min(25, currentAge);
  if (category.startsWith("④")) return Math.min(40, currentAge);
  if (category.startsWith("⑤")) return Math.min(50, currentAge);
  if (category.startsWith("⑥") || category.startsWith("⑦") || category.startsWith("⑧")) return currentAge;
  return 0;
}
