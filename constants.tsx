
import { Player } from './types';

export const BOARD_WIDTH = 7;
export const BOARD_HEIGHT = 7;
export const CASTLE_MAX_HP = 5000; // 요청하신 5000으로 조정
export const FIREBALL_ATK = 70;    // 요청하신 70으로 조정
export const FIREBALL_MAX_COUNT = 5;

export const UNIT_TEMPLATES = [
  { name: 'Paladin', maxHp: 900, atk: 400, moveRange: 1, icon: '🛡️', cost: 5, isAir: false, onlyCastle: true, description: 'Siege Knight. Attacks ONLY castles.' },
  { name: 'Sky Valkyrie', maxHp: 200, atk: 100, moveRange: 2, icon: '🦅', cost: 2, isAir: true, onlyCastle: false, description: 'Air unit. Can attack anyone, but ground units cannot hit it.' },
  { name: 'Rogue', maxHp: 150, atk: 150, moveRange: 4, icon: '🗡️', cost: 1, isAir: false, onlyCastle: false, description: 'Fast scout and assassin.' },
  { name: 'Berserker', maxHp: 500, atk: 200, moveRange: 2, icon: '🪓', cost: 3, isAir: false, onlyCastle: false, description: 'High damage warrior.' },
  { name: 'Witch', maxHp: 300, atk: 110, moveRange: 1, icon: '🧙', cost: 4, isAir: false, onlyCastle: false, description: 'Elite spell caster.' },
];
