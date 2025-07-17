import { CharacterListResponseDto, CharacterResponse, CharacterBulkCreateRequest, CharacterBulkCreateResponse } from '../types/auth';
import { Character } from '../types';
import { TokenManager } from './authService';
import nexonApiService from './nexonApiService';

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

  async post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }
}

// 캐릭터 서비스 클래스
class CharacterService {
  private httpClient = new HttpClient();

  // 백엔드 응답을 프론트엔드 타입으로 변환
  private transformCharacterResponse(response: CharacterResponse): Character {
    // 서버 아이콘 매핑
    const getServerIcon = (worldName: string): string => {
      const serverIcons: { [key: string]: string } = {
        '스카니아': '/image/server-icons/scania.png',
        '베라': '/image/server-icons/bera.png',
        '루나': '/image/server-icons/luna.png',
        '제니스': '/image/server-icons/zenith.png',
        '크로아': '/image/server-icons/croa.png',
        '유니온': '/image/server-icons/union.png',
        '엘리시움': '/image/server-icons/elysium.png',
        '이노시스': '/image/server-icons/enosis.png',
        '레드': '/image/server-icons/red.png',
        '오로라': '/image/server-icons/aurora.png',
        '아케인': '/image/server-icons/arcane.png',
        '노바': '/image/server-icons/nova.png',
        '리부트': '/image/server-icons/reboot.png',
        '리부트2': '/image/server-icons/reboot2.png',
        '헬리오스': '/image/server-icons/helios.png',
        '이오스': '/image/server-icons/eos.png',
        '챌린저스1': '/image/server-icons/challengers.png',
        '챌린저스2': '/image/server-icons/challengers.png',
        '챌린저스3': '/image/server-icons/challengers.png',
        '챌린저스4': '/image/server-icons/challengers.png',
      };
      return serverIcons[worldName] || '/image/server-icons/default.png';
    };

    return {
      id: response.id.toString(),
      ocid: response.ocid,
      name: response.characterName,
      server: response.worldName || "unknown",
      serverIcon: response.worldName ? getServerIcon(response.worldName) : undefined,
      job: response.characterClass || "unknown",
      level: response.characterLevel || 0,
      image: response.characterImage || "/image/logo.png",
      isMainCharacter: response.isMain
    };
  }

  // 캐릭터 목록 조회
  async getCharacterList(): Promise<Character[]> {
    try {
      // 저장된 사용자 ID 조회
      const userId = TokenManager.getUserId();
      
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      const response = await this.httpClient.get<CharacterListResponseDto>(`/api/character/${userId}`);
      
      if (response.status === 'success' && response.data) {
        const characters = response.data.map(char => this.transformCharacterResponse(char));
        
        // 캐릭터 정보가 부족한 경우 넥슨 API로 보완
        const enhancedCharacters = await this.enhanceCharacterInfo(characters);
        
        return enhancedCharacters;
      } else {
        throw new Error(response.message || '캐릭터 목록 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      throw error;
    }
  }

  // 캐릭터 정보 보완
  private async enhanceCharacterInfo(characters: Character[]): Promise<Character[]> {
    const apiKey = TokenManager.getNexonApiKey();
    if (!apiKey) {
      return characters;
    }

    const enhancedCharacters = await Promise.all(
      characters.map(async (character) => {
        // 정보가 부족한 경우만 넥슨 API 호출
                 if (character.server === 'unknown' || character.job === 'unknown' || character.level === 0) {
           try {
             const enhancedInfo = await nexonApiService.getCharacterBasic(character.ocid, apiKey);
            
            if (enhancedInfo) {
              return {
                ...character,
                server: enhancedInfo.server,
                serverIcon: enhancedInfo.serverIcon,
                job: enhancedInfo.job,
                level: enhancedInfo.level,
                image: enhancedInfo.image
              };
            }
          } catch (error) {
            console.error(`캐릭터 ${character.name} 정보 보완 실패:`, error);
          }
        }
        return character;
      })
    );

    return enhancedCharacters;
  }

  // 캐릭터 일괄 등록
  async registerCharacters(request: CharacterBulkCreateRequest): Promise<CharacterBulkCreateResponse> {
    try {
      const response = await this.httpClient.post<CharacterBulkCreateResponse>('/api/character/register', request);
      return response;
    } catch (error) {
      console.error('캐릭터 일괄 등록 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const characterService = new CharacterService();

// 편의 함수
export const getCharacterList = () => characterService.getCharacterList();
export const registerCharacters = (request: CharacterBulkCreateRequest) => characterService.registerCharacters(request); 