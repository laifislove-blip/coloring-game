
import { CharacterChallenge } from './types';

export const CHALLENGES: CharacterChallenge[] = [
  {
    id: 'dino',
    name: '아기 공룡',
    description: '단순하고 귀여운 아기 공룡 도안이에요.',
    instruction: '공룡의 몸통을 초록색으로 예쁘게 색칠해주세요!',
    missingPart: 'green body color',
    difficulty: 'easy',
    image: 'A very simple black and white line art of a cute baby dinosaur. Large open areas, thick black outlines, minimal detail, white background.'
  },
  {
    id: 'flower',
    name: '웃는 해바라기',
    description: '꽃잎이 많아 조금 더 집중이 필요해요.',
    instruction: '해바라기의 꽃잎을 노란색으로 색칠해주세요!',
    missingPart: 'yellow petals',
    difficulty: 'medium',
    image: 'A detailed black and white line art of a sunflower with multiple rows of petals and a textured center. Medium thick black outlines, white background.'
  },
  {
    id: 'castle',
    name: '환상의 성',
    description: '복잡한 성의 구석구석을 채워야 하는 최고 난이도!',
    instruction: '성을 하늘색과 보라색을 섞어 신비롭게 색칠해주세요!',
    missingPart: 'blue and purple castle walls',
    difficulty: 'hard',
    image: 'An intricate, complex black and white line art of a fantasy fairy tale castle with many small towers, windows, and flags. Thin black outlines, highly detailed, white background.'
  }
];
