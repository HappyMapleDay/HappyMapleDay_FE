import { DesireHistoryRequest, DesireHistoryResponse, Character, DesireItem } from '../types/desireHistory';

// 물욕템 히스토리 API 서비스
export class DesireHistoryService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

  // 물욕템 히스토리 데이터 조회
  static async getDesireHistory(params: DesireHistoryRequest): Promise<DesireHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.characterId) {
        queryParams.append('characterId', params.characterId);
      }
      
      if (params.searchTerm) {
        queryParams.append('searchTerm', params.searchTerm);
      }
      
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const response = await fetch(`${this.baseUrl}/desire-history?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('물욕템 히스토리 조회 실패:', error);
      throw error;
    }
  }

  // 캐릭터 목록 조회
  static async getCharacterList(): Promise<Character[]> {
    try {
      const response = await fetch(`${this.baseUrl}/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.characters || [];
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      return []; // 기본값 반환
    }
  }

  // 물욕템 목록 조회
  static async getDesireItems(params: DesireHistoryRequest): Promise<DesireItem[]> {
    try {
      const historyData = await this.getDesireHistory(params);
      return historyData.data.items;
    } catch (error) {
      console.error('물욕템 목록 조회 실패:', error);
      return [];
    }
  }

  // 물욕템 검색
  static async searchDesireItems(searchTerm: string, characterId?: string): Promise<DesireItem[]> {
    try {
      const params: DesireHistoryRequest = {
        searchTerm,
        characterId
      };
      
      return await this.getDesireItems(params);
    } catch (error) {
      console.error('물욕템 검색 실패:', error);
      return [];
    }
  }

  // 물욕템 정렬
  static async getSortedDesireItems(sortBy: string, characterId?: string): Promise<DesireItem[]> {
    try {
      const params: DesireHistoryRequest = {
        sortBy,
        characterId
      };
      
      return await this.getDesireItems(params);
    } catch (error) {
      console.error('물욕템 정렬 실패:', error);
      return [];
    }
  }
}
