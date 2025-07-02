import { Boss } from '../types';
import { mockBosses, getRecommendedBosses } from '../data/mockBosses';

// API 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true; // 백엔드 준비 전까지 true

// 백엔드 API 응답 타입 (실제 API 구조에 맞게 수정 예정)
interface ApiBossResponse {
  boss_id: string;
  boss_name: string;
  difficulty_level: string;
  level_requirement: number;
  reset_cycle: string;
  expected_meso: number;
  drop_items: string[];
}

// API 응답을 내부 타입으로 변환하는 함수
const transformApiResponse = (apiData: ApiBossResponse[]): Boss[] => {
  return apiData.map((apiItem) => ({
    id: apiItem.boss_id,
    name: apiItem.boss_name,
    difficulty: mapDifficulty(apiItem.difficulty_level),
    requiredLevel: apiItem.level_requirement,
    resetType: apiItem.reset_cycle === 'daily' ? 'daily' : 'weekly',
    expectedMeso: apiItem.expected_meso,
    expectedItems: apiItem.drop_items || []
  }));
};

// 난이도 매핑 함수
const mapDifficulty = (apiDifficulty: string): Boss['difficulty'] => {
  switch (apiDifficulty.toLowerCase()) {
    case 'normal':
    case '노말': return 'normal';
    case 'hard':
    case '하드': return 'hard';
    case 'chaos':
    case '카오스': return 'chaos';
    case 'extreme':
    case '익스트림': return 'extreme';
    default: return 'normal';
  }
};

// API 클라이언트
class BossService {
  // 전체 보스 목록 조회
  async getAllBosses(): Promise<Boss[]> {
    if (USE_MOCK_DATA) {
      // Mock 데이터 사용
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockBosses), 500); // 실제 API 호출 시뮬레이션
      });
    }

    // 실제 API 호출 (백엔드 준비 시 사용)
    try {
      const response = await fetch(`${API_BASE_URL}/api/bosses`);
      if (!response.ok) {
        throw new Error('보스 목록을 불러오는데 실패했습니다.');
      }
      
      const apiData = await response.json();
      
      // API 응답 구조에 따라 변환 (필요시)
      if (Array.isArray(apiData)) {
        // 직접 배열로 응답하는 경우
        return transformApiResponse(apiData);
      } else if (apiData.data && Array.isArray(apiData.data)) {
        // { success: true, data: [...] } 형태로 응답하는 경우
        return transformApiResponse(apiData.data);
      } else {
        // 예상치 못한 응답 구조
        console.warn('Unexpected API response structure:', apiData);
        return mockBosses; // fallback
      }
    } catch (error) {
      console.error('API Error:', error);
      // 에러 시 Mock 데이터 fallback
      return mockBosses;
    }
  }

  // 캐릭터 레벨별 추천 보스 조회
  async getRecommendedBosses(characterLevel: number): Promise<Boss[]> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(getRecommendedBosses(characterLevel)), 300);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bosses/recommended?level=${characterLevel}`);
      if (!response.ok) {
        throw new Error('추천 보스 목록을 불러오는데 실패했습니다.');
      }
      
      const apiData = await response.json();
      
      // API 응답 변환
      if (Array.isArray(apiData)) {
        return transformApiResponse(apiData);
      } else if (apiData.data) {
        return transformApiResponse(apiData.data);
      }
      
      return getRecommendedBosses(characterLevel); // fallback
    } catch (error) {
      console.error('API Error:', error);
      return getRecommendedBosses(characterLevel);
    }
  }

  // 보스별 상세 정보 조회
  async getBossById(bossId: string): Promise<Boss | null> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        const boss = mockBosses.find(b => b.id === bossId) || null;
        setTimeout(() => resolve(boss), 200);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bosses/${bossId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('보스 정보를 불러오는데 실패했습니다.');
      }
      
      const apiData = await response.json();
      
      // 단일 보스 응답 변환
      if (apiData.boss_id) {
        const transformed = transformApiResponse([apiData]);
        return transformed[0] || null;
      } else if (apiData.data && apiData.data.boss_id) {
        const transformed = transformApiResponse([apiData.data]);
        return transformed[0] || null;
      }
      
      return mockBosses.find(b => b.id === bossId) || null; // fallback
    } catch (error) {
      console.error('API Error:', error);
      return mockBosses.find(b => b.id === bossId) || null;
    }
  }

  // 일일/주간별 보스 목록 조회
  async getBossesByResetType(resetType: 'daily' | 'weekly'): Promise<Boss[]> {
    const allBosses = await this.getAllBosses();
    return allBosses.filter(boss => boss.resetType === resetType);
  }

  // 난이도별 보스 목록 조회
  async getBossesByDifficulty(difficulty: Boss['difficulty']): Promise<Boss[]> {
    const allBosses = await this.getAllBosses();
    return allBosses.filter(boss => boss.difficulty === difficulty);
  }
}

// 싱글톤 인스턴스
export const bossService = new BossService();

// 편의 함수들
export const getAllBosses = () => bossService.getAllBosses();
export const getRecommendedBossesForLevel = (level: number) => bossService.getRecommendedBosses(level);
export const getBossById = (id: string) => bossService.getBossById(id);
export const getDailyBosses = () => bossService.getBossesByResetType('daily');
export const getWeeklyBosses = () => bossService.getBossesByResetType('weekly'); 