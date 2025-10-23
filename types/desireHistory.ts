// 물욕템 히스토리 관련 타입 정의

export interface Character {
  id: string;
  name: string;
  server: string;
  class: string;
  level: number;
  image: string;
}

export interface DesireItem {
  id: string;
  name: string;
  price: string;
  image: string;
  obtainedDate: string;
  characterId?: string;
  bossName?: string;
  difficulty?: string;
}

export interface DesireHistoryRequest {
  characterId?: string;
  searchTerm?: string;
  sortBy?: string;
  startDate?: string;
  endDate?: string;
}

export interface DesireHistoryResponse {
  success: boolean;
  data: {
    characters: Character[];
    items: DesireItem[];
    totalCount: number;
  };
  message?: string;
}

export interface DesireHistorySummary {
  totalItems: number;
  totalValue: string;
  averageValue: string;
}
