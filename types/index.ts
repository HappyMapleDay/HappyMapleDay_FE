// 캐릭터 관련 타입
export interface Character {
  id: string; // 프론트엔드 내부 ID (UI용)
  dbId?: number; // 데이터베이스 실제 ID (API용)
  ocid: string; // 넥슨 API 호출용
  name: string;
  server: string;
  serverIcon?: string; // 서버 아이콘 URL
  job: string;
  level: number;
  image: string;
  isMainCharacter?: boolean; // 본캐 여부
  arcaneForce?: number; // 아케인 포스
  authenticForce?: number; // 어센틱 포스
}

// 사용자 관련 타입
export interface User {
  username: string;
  apiKey: string;
  isLoggedIn: boolean;
}

// 보스 관련 타입들을 import 및 re-export
import type { Boss, BossProgress, DateRange, BossSummary, CharacterBossConfig } from './boss';
export { Boss, BossProgress, DateRange, BossSummary, CharacterBossConfig };

// 전역 상태 타입
export interface AppState {
  // 사용자 관련
  user: User | null;
  
  // 캐릭터 관련
  characters: Character[];
  mainCharacter: Character | null;
  bossCharacters: Character[];
  
  // 보스 관련
  selectedBosses: string[];
  bossProgress: BossProgress[];
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  currentDateRange: DateRange | null;
  selectedCharacterId: string | null;
}

// 액션 타입
export interface AppActions {
  // 사용자 관련
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // 캐릭터 관련
  setCharacters: (characters: Character[]) => void;
  setMainCharacter: (character: Character) => void;
  setBossCharacters: (characters: Character[]) => void;
  setSelectedCharacter: (characterId: string | null) => void;
  
  // 보스 관련
  setSelectedBosses: (bosses: string[]) => void;
  toggleBossSelection: (bossId: string) => void;
  updateBossProgress: (progress: BossProgress) => void;
  
  // UI 상태
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (range: DateRange | null) => void;
  
  // API 관련
  fetchCharacters: (apiKey: string) => Promise<Character[]>;
}

// Auth 관련 타입들 re-export
export * from './auth';

// 캐릭터 일괄 등록 관련 타입은 auth.ts에서 import
export type { CharacterBulkCreateRequest, CharacterBulkCreateResponse, CharacterBulkCreateCharacter } from './auth';

export type AppStore = AppState & AppActions; 