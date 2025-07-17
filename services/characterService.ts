import { CharacterListResponseDto, CharacterResponse } from '../types/auth';
import { Character } from '../types';

// API 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 토큰 관리 유틸리티
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

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

    // 인증이 필요한 요청에 토큰 추가
    const accessToken = TokenManager.getAccessToken();
    if (accessToken) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

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
      const response = await this.httpClient.get<CharacterListResponseDto>('/api/character');
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