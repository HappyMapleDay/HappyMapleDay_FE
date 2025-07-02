// 보스 난이도별 세부 정보
export interface BossDifficultyInfo {
  difficulty: 'normal' | 'hard' | 'chaos' | 'extreme';
  requiredLevel: number;
  expectedMeso: number;
  expectedItems: string[];
}

// 보스 관련 타입 정의
export interface Boss {
  id: string;
  name: string;
  resetType: 'daily' | 'weekly';
  image?: string;
  difficulties: BossDifficultyInfo[];
  // 나중에 API 연동 시 추가될 예정:
  // hasDesireDrop?: boolean; // 물욕템 드랍 여부
  // desireDropItems?: string[]; // 물욕템 목록
}

// 보스 진행 상태
export interface BossProgress {
  id: string;
  characterId: string;
  bossId: string;
  completed: boolean;
  completedAt?: string;
  meso?: number;
  items?: string[];
  date: string; // YYYY-MM-DD 형식
}

// 캐릭터별 보스 설정
export interface CharacterBossConfig {
  characterId: string;
  selectedBosses: string[]; // boss id 배열
  weeklyGoal?: number;
}

// 보스 선택 설정 (UI용)
export interface BossSelection {
  bossId: string;
  selectedDifficulty: 'normal' | 'hard' | 'chaos' | 'extreme';
  partySize: number;
  isGoldDrop: boolean; // 물욕템 체크 상태 (나중에 API 연동 시 물욕템 드랍 가능 보스에서만 활성화)
}

// 날짜 범위
export interface DateRange {
  startDate: string;
  endDate: string;
}

// 총계 정보
export interface BossSummary {
  totalMeso: number;
  completedBosses: number;
  totalBosses: number;
  completionRate: number;
} 