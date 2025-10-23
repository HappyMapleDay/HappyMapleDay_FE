// 보돌 히스토리 관련 타입 정의

export interface BossHistoryData {
  period: string;
  crystallizedStone: string;
  desiredItem: string;
  total: string;
}

export interface BossHistoryChartData {
  period: string;
  value: number;
  fullPeriod: string;
}

export interface BossHistoryRequest {
  server?: string;
  period: string; // "1개월", "3개월", "6개월"
  startDate?: string;
  endDate?: string;
}

export interface BossHistoryResponse {
  success: boolean;
  data: {
    chartData: BossHistoryChartData[];
    tableData: BossHistoryData[];
    summary: {
      totalCrystallizedStone: string;
      totalDesiredItem: string;
      totalRevenue: string;
    };
  };
  message?: string;
}

export interface BossHistorySummary {
  totalCrystallizedStone: string;
  totalDesiredItem: string;
  totalRevenue: string;
}
