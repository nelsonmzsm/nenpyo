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
  // 若い人ほど1テーマ1問ずつ丁寧に（最低10問・最大20問）
  if (age < 30) return 12;
  if (age < 40) return 14;
  if (age < 60) return Math.max(14, Math.min(18, Math.ceil(age / 3)));
  return Math.max(16, Math.min(20, Math.ceil(age / 3)));
}

export function categoryToAge(category: string, currentAge: number): number {
  if (!category) return 0;
  // 若い人用テーマ（幼少期と小学校を別立て、中学・高校も別）
  if (category.includes("幼少期")) return Math.min(6, currentAge);
  if (category.includes("小学校")) return Math.min(12, currentAge);
  if (category.includes("中学")) return Math.min(15, currentAge);
  if (category.includes("高校")) return Math.min(18, currentAge);
  // 共通マッピング（番号ベース）
  if (category.startsWith("①")) return Math.min(12, currentAge);
  if (category.startsWith("②")) return Math.min(18, currentAge);
  if (category.startsWith("③")) return Math.min(25, currentAge);
  if (category.startsWith("④")) return Math.min(35, currentAge);
  if (category.startsWith("⑤")) return Math.min(45, currentAge);
  if (category.startsWith("⑥") || category.startsWith("⑦") || category.startsWith("⑧") || category.startsWith("⑨")) return currentAge;
  return 0;
}
