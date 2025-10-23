// 정산 API 응답 타입 정의

export interface DesireItemDetailResponse {
  desireItemId: number;
  salePrice: number;
}

export interface BossRecordDetailResponse {
  bossRecordId: number;
  characterId: number;
  characterName: string;
  bossId: number;
  bossName: string;
  difficulty: string;
  partySize: number;
  crystalIncome: number;
  desireItemIncome: number;
  totalIncome: number;
  desireItems: DesireItemDetailResponse[];
}

export interface SettlementStatusResponse {
  settlementId: number;
  userId: number;
  worldName: string;
  weekStartDate: string; // YYYY-MM-DD 형식
  totalCrystalIncome: number;
  totalDesireItemIncome: number;
  totalIncome: number;
  totalBossCount: number;
  characterCount: number;
  characterCrystalCounts: Record<number, number>; // characterId -> crystalCount
  version: number;
}

export interface SettlementDetailResponse extends SettlementStatusResponse {
  bossRecords: BossRecordDetailResponse[];
}

// 정산 요청 타입 정의

export interface DesireItemRequest {
  desireItemId: number;
  sourceBoxItemId?: number; // 칠흑/반지 상자에서 나온 아이템의 경우
  salePrice: number;
}

export interface BossRecordRequest {
  characterId: number;
  bossId: number;
  partySize: number;
  crystalIncome: number; // 실제 캐릭터가 얻은 결정석의 값
  desireItems: DesireItemRequest[];
  characterLevel: number;
  arcaneForce: number;
  authenticForce: number;
  character_class: string;
  combat_power: number;
}

export interface SettlementRequest {
  worldName: string;
  bossRecords: BossRecordRequest[];
  version: number;
}

export interface SettlementCompleteResponse {
  settlementId: number;
  weekStartDate: string; // YYYY-MM-DD 형식
  totalCrystalIncome: number; // 결정석으로 낸 총 수익
  totalDesireItemIncome: number; // 물욕템으로 낸 총 수익
  totalIncome: number; // 총 수익
  totalBossCount: number; // 잡은 보스의 수
  characterCount: number; // 정산된 캐릭터 수
}
