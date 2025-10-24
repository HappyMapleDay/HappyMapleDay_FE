import { 
  SettlementStatusResponse, 
  SettlementDetailResponse, 
  SettlementRequest, 
  SettlementCompleteResponse 
} from '../types/settlement';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 특정 주차 정산 데이터 조회 (요약본)
export const getSettlementStatus = async (
  userId: number, 
  weekStartDate: string
): Promise<SettlementStatusResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settlement/user/${userId}/week/${weekStartDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`정산 요약 데이터 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('정산 요약 데이터 조회 중 오류:', error);
    throw error;
  }
};

// 특정 주차 정산 데이터 조회 (상세)
export const getSettlementDetail = async (
  userId: number, 
  weekStartDate: string
): Promise<SettlementDetailResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settlement/user/${userId}/week/${weekStartDate}/detail`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`정산 상세 데이터 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('정산 상세 데이터 조회 중 오류:', error);
    throw error;
  }
};

// 날짜 형식 변환 (YYYY.MM.DD -> YYYY-MM-DD)
export const formatDateForAPI = (dateString: string): string => {
  return dateString.replace(/\./g, '-');
};

// 날짜 형식 변환 (YYYY-MM-DD -> YYYY.MM.DD)
export const formatDateForDisplay = (dateString: string): string => {
  return dateString.replace(/-/g, '.');
};

// 정산 시도 API
export const attemptSettlement = async (
  userId: number,
  weekStartDate: string,
  settlementRequest: SettlementRequest
): Promise<SettlementCompleteResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settlement/user/${userId}/week/${weekStartDate}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settlementRequest),
      }
    );

    if (!response.ok) {
      throw new Error(`정산 시도 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('정산 시도 중 오류:', error);
    throw error;
  }
};

// 정산 데이터 임시 저장 API
export const autoSaveSettlement = async (
  userId: number,
  weekStartDate: string,
  settlementRequest: SettlementRequest
): Promise<SettlementCompleteResponse> => {
  try {
    const url = `${API_BASE_URL}/api/settlement/user/${userId}/week/${weekStartDate}/auto-save`;
    console.log('자동 저장 요청:', { url, settlementRequest });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settlementRequest),
    });

    console.log('자동 저장 응답:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('자동 저장 에러 응답:', errorText);
      throw new Error(`정산 데이터 임시 저장 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('정산 데이터 임시 저장 중 오류:', error);
    throw error;
  }
};

// 정산 삭제 API (개발용)
export const deleteSettlement = async (
  userId: number,
  settlementId: number
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/settlement/user/${userId}/settlement/${settlementId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`정산 삭제 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('정산 삭제 중 오류:', error);
    throw error;
  }
};