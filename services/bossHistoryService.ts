import { BossHistoryRequest, BossHistoryResponse } from '../types/bossHistory';

// 보돌 히스토리 API 서비스
export class BossHistoryService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // 보돌 히스토리 데이터 조회
  static async getBossHistory(params: BossHistoryRequest): Promise<BossHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.server && params.server !== '전체') {
        queryParams.append('server', params.server);
      }
      
      queryParams.append('period', params.period);
      
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const response = await fetch(`${this.baseUrl}/boss-history?${queryParams.toString()}`, {
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
      console.error('보돌 히스토리 조회 실패:', error);
      throw error;
    }
  }

  // 서버 목록 조회
  static async getServerList(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/servers`, {
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
      return data.servers || [];
    } catch (error) {
      console.error('서버 목록 조회 실패:', error);
      return ['전체', '크로아', '챌린저스1']; // 기본값 반환
    }
  }

  // 기간별 데이터 조회 (차트용)
  static async getChartData(params: BossHistoryRequest): Promise<any[]> {
    try {
      const historyData = await this.getBossHistory(params);
      return historyData.data.chartData;
    } catch (error) {
      console.error('차트 데이터 조회 실패:', error);
      return [];
    }
  }

  // 테이블 데이터 조회
  static async getTableData(params: BossHistoryRequest): Promise<any[]> {
    try {
      const historyData = await this.getBossHistory(params);
      return historyData.data.tableData;
    } catch (error) {
      console.error('테이블 데이터 조회 실패:', error);
      return [];
    }
  }
}
