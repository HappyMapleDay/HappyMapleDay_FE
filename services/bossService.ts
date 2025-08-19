import { Boss } from '../types';
import type { BossResponse, BossPresetResponse, DesireItemResponse, ApiResponse, OptimizeRecommendationRequest, OptimizedRecommendationResponse } from '../types/boss';
import { mockBosses, getRecommendedBosses } from '../data/mockBosses';

// API 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

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
    resetType: apiItem.reset_cycle === 'daily' ? 'daily' : 'weekly',
    difficulties: [
      {
        difficulty: mapDifficulty(apiItem.difficulty_level),
        requiredLevel: apiItem.level_requirement,
        expectedMeso: apiItem.expected_meso,
        expectedItems: apiItem.drop_items || []
      }
    ]
  }));
};

// 난이도 매핑 함수
const mapDifficulty = (apiDifficulty: string): Boss['difficulties'][number]['difficulty'] => {
  switch (apiDifficulty.toLowerCase()) {
    case 'easy':
    case '이지': return 'easy';
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
    // 백엔드에 해당 엔드포인트가 없으므로, 일단 Mock 로직을 사용
    return new Promise((resolve) => {
      setTimeout(() => resolve(getRecommendedBosses(characterLevel)), 300);
    });
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
  async getBossesByDifficulty(difficulty: Boss['difficulties'][number]['difficulty']): Promise<Boss[]> {
    const allBosses = await this.getAllBosses();
    return allBosses.filter(boss => boss.difficulties.some(d => d.difficulty === difficulty));
  }

  // 백엔드 API: 전체 보스 리스트 조회
  async getBossListFromAPI(): Promise<BossResponse[]> {
    if (USE_MOCK_DATA) {
      // Mock 데이터 사용 (임시)
      return new Promise((resolve) => {
        setTimeout(() => resolve([]), 500);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/boss/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('보스 리스트를 불러오는데 실패했습니다.');
      }
      
      const apiData: ApiResponse<BossResponse[]> = await response.json();
      
      if (apiData.status === 'success' && apiData.data) {
        return apiData.data;
      } else {
        throw new Error(apiData.message || '보스 리스트 조회 실패');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 백엔드 API: 보스 프리셋 목록 조회
  async getBossPresetList(): Promise<BossPresetResponse[]> {
    if (USE_MOCK_DATA) {
      // Mock 데이터 사용 (임시)
      return new Promise((resolve) => {
        const mockPresets: BossPresetResponse[] = [
          {
            id: 1,
            presetName: '스데미',
            bosses: [
              { id: 1, bossName: '힐라', englishName: 'hilla', difficulty: '노말', crystalPrice: 150000000, fullName: '힐라 (노말)' },
              { id: 2, bossName: '시그너스', englishName: 'cygnus', difficulty: '노말', crystalPrice: 300000000, fullName: '시그너스 (노말)' },
              { id: 3, bossName: '파풀라투스', englishName: 'papulatus', difficulty: '노말', crystalPrice: 400000000, fullName: '파풀라투스 (노말)' }
            ],
            bossIds: [1, 2, 3],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 3
          },
          {
            id: 2,
            presetName: '이루윌',
            bosses: [
              { id: 6, bossName: '루시드', englishName: 'lucid', difficulty: '노말', crystalPrice: 1500000000, fullName: '루시드 (노말)' },
              { id: 7, bossName: '윌', englishName: 'will', difficulty: '노말', crystalPrice: 2000000000, fullName: '윌 (노말)' }
            ],
            bossIds: [6, 7],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 2
          },
          {
            id: 3,
            presetName: '노듄더',
            bosses: [
              { id: 8, bossName: '더스크', englishName: 'dusk', difficulty: '노말', crystalPrice: 2000000000, fullName: '더스크 (노말)' },
              { id: 9, bossName: '다크널', englishName: 'darknell', difficulty: '노말', crystalPrice: 2500000000, fullName: '다크널 (노말)' }
            ],
            bossIds: [8, 9],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 2
          },
          {
            id: 4,
            presetName: '하스데',
            bosses: [
              { id: 4, bossName: '로터스', englishName: 'lotus', difficulty: '하드', crystalPrice: 2000000000, fullName: '로터스 (하드)' },
              { id: 5, bossName: '데미안', englishName: 'damien', difficulty: '하드', crystalPrice: 2000000000, fullName: '데미안 (하드)' }
            ],
            bossIds: [4, 5],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 2
          },
          {
            id: 5,
            presetName: '검밑솔',
            bosses: [
              { id: 14, bossName: '검은마법사', englishName: 'blackmage', difficulty: '익스트림', crystalPrice: 9200000000, fullName: '검은마법사 (익스트림)' },
              { id: 15, bossName: '발드릭스', englishName: 'baldrix', difficulty: '카오스', crystalPrice: 8000000000, fullName: '발드릭스 (카오스)' }
            ],
            bossIds: [14, 15],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 2
          },
          {
            id: 6,
            presetName: '하세이칼',
            bosses: [
              { id: 10, bossName: '세렌', englishName: 'seren', difficulty: '하드', crystalPrice: 3500000000, fullName: '세렌 (하드)' },
              { id: 11, bossName: '칼링', englishName: 'kaling', difficulty: '익스트림', crystalPrice: 6000000000, fullName: '칼링 (익스트림)' },
              { id: 12, bossName: '칼로스', englishName: 'kalos', difficulty: '익스트림', crystalPrice: 7000000000, fullName: '칼로스 (익스트림)' }
            ],
            bossIds: [10, 11, 12],
            createdAt: '2025-01-01T00:00:00.000Z',
            bossCount: 3
          }
        ];
        setTimeout(() => resolve(mockPresets), 300);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/boss/preset/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('보스 프리셋 목록을 불러오는데 실패했습니다.');
      }
      
      const apiData: ApiResponse<BossPresetResponse[]> = await response.json();
      
      if (apiData.status === 'success' && apiData.data) {
        return apiData.data;
      } else {
        throw new Error(apiData.message || '보스 프리셋 목록 조회 실패');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 백엔드 API: 보스별 욕망 아이템 목록 조회
  async getBossDesireItems(bossId: number): Promise<DesireItemResponse[]> {
    if (USE_MOCK_DATA) {
      // Mock 데이터 사용 (임시)
      return new Promise((resolve) => {
        setTimeout(() => resolve([]), 200);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/boss/desire-items/boss/${bossId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('보스 욕망 아이템 목록을 불러오는데 실패했습니다.');
      }
      
      const apiData: ApiResponse<DesireItemResponse[]> = await response.json();
      
      if (apiData.status === 'success' && apiData.data) {
        return apiData.data;
      } else {
        throw new Error(apiData.message || '보스 욕망 아이템 목록 조회 실패');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 백엔드 API: 보스 결정석 수익 최적화 추천
  async getOptimizedRecommendation(request: OptimizeRecommendationRequest): Promise<OptimizedRecommendationResponse> {
    if (USE_MOCK_DATA) {
      // Mock 데이터 사용 (임시)
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          worlds: [],
          totalCrystalIncome: 0,
          totalBossCount: 0
        }), 1000);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendation/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error('보스 결정석 최적화 추천을 불러오는데 실패했습니다.');
      }
      
      const apiData: ApiResponse<OptimizedRecommendationResponse> = await response.json();
      
      if (apiData.status === 'success' && apiData.data) {
        return apiData.data;
      } else {
        throw new Error(apiData.message || '보스 결정석 최적화 추천 실패');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
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

// 백엔드 API 편의 함수들
export const getBossListFromAPI = () => bossService.getBossListFromAPI();
export const getBossPresetList = () => bossService.getBossPresetList();
export const getBossDesireItems = (bossId: number) => bossService.getBossDesireItems(bossId);
export const getOptimizedRecommendation = (request: OptimizeRecommendationRequest) => bossService.getOptimizedRecommendation(request); 