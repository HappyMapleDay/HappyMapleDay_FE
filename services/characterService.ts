import { CharacterListResponseDto, CharacterResponse } from '../types/auth';
import { Character } from '../types';
import { TokenManager } from './authService';

// API 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';



// HTTP 클라이언트 클래스
class HttpClient {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    };

    // 캐릭터 목록 조회는 토큰이 필요없는 API이므로 Authorization 헤더 제외

    console.log('API 요청:', {
      url: `${API_BASE_URL}${url}`,
      method: config.method,
      headers: config.headers,
    });

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401) {
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    const data = await response.json();
    
    console.log('서버 응답 상태:', response.status);
    console.log('서버 응답 데이터:', data);
    
    if (!response.ok) {
      console.error('API 요청 실패:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || '요청이 실패했습니다.');
    }
    
    return data;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(url, { method: 'GET', headers });
  }
}

// 캐릭터 서비스 클래스
class CharacterService {
  private httpClient = new HttpClient();

  // 백엔드 응답을 프론트엔드 타입으로 변환
  private transformCharacterResponse(response: CharacterResponse): Character {
    return {
      id: response.id.toString(),
      name: response.characterName,
      server: "unknown", // 서버 정보가 없으므로 임시로 unknown
      job: "unknown", // 직업 정보가 없으므로 임시로 unknown
      level: 0, // 레벨 정보가 없으므로 임시로 0
      image: "/image/logo.png", // 이미지 정보가 없으므로 기본 이미지
      isMainCharacter: response.isMain
    };
  }

  // 캐릭터 목록 조회
  async getCharacterList(): Promise<Character[]> {
    try {
      console.log('캐릭터 목록 조회 API 호출 시작');
      
      // 저장된 사용자 ID 조회
      const accessToken = TokenManager.getAccessToken();
      const userId = TokenManager.getUserId();
      
      console.log('액세스 토큰:', accessToken ? '존재함' : '없음');
      console.log('사용자 ID:', userId);
      
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      const response = await this.httpClient.get<CharacterListResponseDto>(`/api/character/${userId}`);
      console.log('캐릭터 목록 조회 API 응답:', response);
      
      if (response.status === 'success' && response.data) {
        return response.data.map(char => this.transformCharacterResponse(char));
      } else {
        throw new Error(response.message || '캐릭터 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const characterService = new CharacterService();

// 편의 함수
export const getCharacterList = () => characterService.getCharacterList(); 