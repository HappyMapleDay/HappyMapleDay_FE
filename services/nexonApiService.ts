import { Character } from '../types';

// 서버별 아이콘 매핑 함수
const getServerIcon = (worldName: string): string => {
  const serverIcons: { [key: string]: string } = {
    // 일반 서버
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
    
    // 특수 서버
    '리부트': '/image/server-icons/reboot.png',
    '리부트2': '/image/server-icons/reboot2.png',
    
    // 테스트/기타 서버
    '테스트': '/image/server-icons/test.png',
    '챌린저스1': '/image/server-icons/challengers.png',
    '챌린저스2': '/image/server-icons/challengers.png',
    '챌린저스3': '/image/server-icons/challengers.png',
    '챌린저스4': '/image/server-icons/challengers.png',
  };
  
  return serverIcons[worldName] || '/image/server-icons/default.png';
};

// 넥슨 API 응답 타입 정의
interface NexonCharacterListItem {
  ocid: string;
  character_name: string;
  world_name: string;
  character_class: string;
  character_level: number;
}

interface NexonAccountInfo {
  account_id: string;
  character_list: NexonCharacterListItem[];
}

interface NexonCharacterListResponse {
  account_list: NexonAccountInfo[];
}

interface NexonCharacterBasic {
  date: string;
  character_name: string;
  world_name: string;
  character_gender: string;
  character_class: string;
  character_class_level: string;
  character_level: number;
  character_exp: number;
  character_exp_rate: string;
  character_guild_name: string;
  character_image: string;
  character_date_create: string;
  access_flag: string;
  liberation_quest_clear_flag: string;
  // 서버 아이콘 정보 (있을 경우)
  world_image?: string;
  server_image?: string;
  world_icon?: string;
  server_icon?: string;
}

interface NexonApiError {
  error: {
    name: string;
    message: string;
  };
}

interface NexonOCIDResponse {
  ocid: string;
}

// 넥슨 OpenAPI 서비스 클래스
class NexonApiService {
  private readonly baseUrl = 'https://open.api.nexon.com/maplestory/v1';

  // API 키로 계정의 캐릭터 목록 조회
  async getCharacterList(apiKey: string): Promise<Character[]> {
    try {
      console.log('넥슨 API 호출 시작, API 키:', apiKey.substring(0, 10) + '...');
      
      // 1단계: 캐릭터 목록 조회
      const listResponse = await fetch(`${this.baseUrl}/character/list`, {
        headers: {
          'x-nxopen-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('캐릭터 목록 API 응답 상태:', listResponse.status);

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('캐릭터 목록 API 에러:', errorText);
        throw new Error(`캐릭터 목록 조회 실패: ${listResponse.status}`);
      }

      const listData: NexonCharacterListResponse = await listResponse.json();
      console.log('캐릭터 목록 API 응답 데이터:', listData);
      
      // 2단계: 모든 계정의 캐릭터를 하나의 배열로 통합
      const allCharacters: NexonCharacterListItem[] = [];
      listData.account_list.forEach(account => {
        allCharacters.push(...account.character_list);
      });

      console.log('전체 캐릭터 수:', allCharacters.length);

      // 3단계: 레벨 235 이상 필터링
      const highLevelCharacters = allCharacters.filter(char => char.character_level >= 235);
      console.log('레벨 235 이상 캐릭터 수:', highLevelCharacters.length);

      // 4단계: 각 캐릭터의 상세 정보 조회 (이미지 포함)
      const characterPromises = highLevelCharacters.map(async (char) => {
        try {
          const basicResponse = await fetch(`${this.baseUrl}/character/basic?ocid=${char.ocid}`, {
            headers: {
              'x-nxopen-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (!basicResponse.ok) {
            console.warn(`캐릭터 ${char.character_name} 정보 조회 실패: ${basicResponse.status}`);
            return null;
          }

          const basicData: NexonCharacterBasic = await basicResponse.json();
          console.log(`캐릭터 ${char.character_name} 전체 정보:`, basicData);
          
          // 서버 아이콘 관련 필드들 확인
          console.log('서버 아이콘 관련 필드들:', {
            world_name: basicData.world_name,
            world_image: basicData.world_image,
            server_image: basicData.server_image,
            world_icon: basicData.world_icon,
            server_icon: basicData.server_icon,
            character_image: basicData.character_image.substring(0, 100) + '...'
          });

          // 서버 아이콘 매핑
          const serverIcon = getServerIcon(basicData.world_name);

          // Character 타입에 맞게 변환
          const character: Character = {
            id: char.ocid,
            ocid: char.ocid,
            name: basicData.character_name,
            level: basicData.character_level,
            job: basicData.character_class,
            server: basicData.world_name,
            serverIcon: serverIcon,
            image: basicData.character_image,
            isMainCharacter: false
          };

          return character;
        } catch (error) {
          console.error(`캐릭터 ${char.character_name} 정보 조회 중 오류:`, error);
          return null;
        }
      });

      // 5단계: 모든 비동기 요청 완료 대기
      const characters = await Promise.all(characterPromises);
      
      // null 값들 제거 (실패한 요청들)
      const validCharacters = characters.filter((char): char is Character => char !== null);
      
      // 레벨 내림차순 정렬
      const sortedCharacters = validCharacters.sort((a, b) => b.level - a.level);
      
      console.log('최종 캐릭터 목록 (레벨 내림차순):', sortedCharacters);

      return sortedCharacters;

    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      throw new Error('캐릭터 목록을 불러오는데 실패했습니다. API 키를 확인해주세요.');
    }
  }

  // 단일 캐릭터 정보 조회
  async getCharacterBasic(ocid: string, apiKey: string): Promise<Character | null> {
    try {
      const response = await fetch(`${this.baseUrl}/character/basic?ocid=${ocid}`, {
        headers: {
          'x-nxopen-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`캐릭터 정보 조회 실패: ${response.status}`);
      }

      const data: NexonCharacterBasic = await response.json();
      console.log('단일 캐릭터 전체 정보:', data);
      
      // 서버 아이콘 관련 필드들 확인
      console.log('서버 아이콘 관련 필드들:', {
        world_name: data.world_name,
        world_image: data.world_image,
        server_image: data.server_image,
        world_icon: data.world_icon,
        server_icon: data.server_icon,
        character_image: data.character_image.substring(0, 100) + '...'
      });

      // 서버 아이콘 매핑
      const serverIcon = getServerIcon(data.world_name);

      const character: Character = {
        id: ocid,
        ocid: ocid,
        name: data.character_name,
        level: data.character_level,
        job: data.character_class,
        server: data.world_name,
        serverIcon: serverIcon,
        image: data.character_image,
        isMainCharacter: false
      };

      return character;
    } catch (error) {
      console.error('캐릭터 정보 조회 실패:', error);
      return null;
    }
  }

  // API 키로 캐릭터 OCID 조회
  async getOCID(characterName: string, apiKey: string): Promise<string> {
    const url = `/maplestory/v1/id?character_name=${encodeURIComponent(characterName)}`;
    
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'GET',
        headers: {
          'x-nxopen-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: NexonApiError = await response.json();
        throw new Error(errorData.error.message || '캐릭터 정보를 찾을 수 없습니다.');
      }

      const data: NexonOCIDResponse = await response.json();
      return data.ocid;
    } catch (error) {
      console.error('넥슨 API OCID 조회 실패:', error);
      throw new Error(error instanceof Error ? error.message : '캐릭터 정보 조회에 실패했습니다.');
    }
  }

  // 캐릭터 검증 (이름 + API키로 캐릭터 존재 확인)
  async validateCharacter(characterName: string, apiKey: string): Promise<Character | null> {
    try {
      const ocid = await this.getOCID(characterName, apiKey);
      const basicInfo = await this.getCharacterBasic(ocid, apiKey);
      return basicInfo;
    } catch (error) {
      console.error('캐릭터 검증 실패:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nexonApiService = new NexonApiService();
export default nexonApiService; 