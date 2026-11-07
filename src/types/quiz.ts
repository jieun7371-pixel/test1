export type ScienceCategory = '물리' | '화학' | '생명과학' | '지구과학';

export interface Question {
  id: number;
  grade: '중1' | '중2' | '중3';
  category: ScienceCategory;
  question: string;
  context?: string; // Optional context or formula
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3 (corresponding to 1, 2, 3, 4)
  explanation: string;
  keyConcept: string;
}

export type QuizPhase = 'intro' | 'playing' | 'answered' | 'finished';

export interface UserAnswerRecord {
  questionId: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSec: number;
}

export interface HandGestureInfo {
  detected: boolean;
  fingerCount: number; // 0 to 5
  confidence: number;
  isStable: boolean;
  handType?: 'Left' | 'Right';
}
