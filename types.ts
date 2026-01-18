
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Feedback {
  score: number;
  message: string;
  isCorrect: boolean;
}

// Added CharacterChallenge interface to support the constants.ts file requirements
export interface CharacterChallenge {
  id: string;
  name: string;
  description: string;
  instruction: string;
  missingPart: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
}
