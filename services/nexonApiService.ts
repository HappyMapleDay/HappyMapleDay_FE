import { Character, CharacterStats } from '../types';

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

// 능력치 정보 타입
interface NexonCharacterStat {
  date: string;
  character_class: string;
  final_stat: {
    stat_name: string;
    stat_value: string;
  }[];
}



// 넥슨 OpenAPI 서비스 클래스
class NexonApiService {
  private readonly baseUrl = 'https://open.api.nexon.com/maplestory/v1';

  // 캐릭터 이미지 URL을 고해상도로 개선 (96x96 제한 해결 시도)
  private enhanceCharacterImageUrl(originalUrl: string): string {
    if (!originalUrl) return originalUrl;
    
    try {
      console.log('원본 이미지 URL:', originalUrl);
      
      // 넥슨 API에서 96x96, 64x64만 제공하는 문제 해결 시도
      const enhancedOptions = [
        // 1. 원본 URL
        originalUrl,
        // 2. 다양한 크기 파라미터 시도
        `${originalUrl}?size=128`,
        `${originalUrl}?size=256`,
        `${originalUrl}?size=300`,
        `${originalUrl}?size=512`,
        // 3. 스케일 파라미터 시도
        `${originalUrl}?scale=2`,
        `${originalUrl}?scale=3`,
        `${originalUrl}?scale=4`,
        // 4. 품질 파라미터 시도
        `${originalUrl}?quality=high`,
        `${originalUrl}?quality=best`,
        // 5. 포맷 파라미터 시도
        `${originalUrl}?format=png`,
        `${originalUrl}?format=jpg`,
        // 6. 조합 파라미터 시도
        `${originalUrl}?size=256&scale=2`,
        `${originalUrl}?size=300&quality=high`,
        `${originalUrl}?scale=2&format=png`
      ];
      
      console.log('향상된 이미지 URL 옵션들:', enhancedOptions);
      
      // maplescouter.com처럼 고화질 이미지를 얻기 위한 다양한 시도
      const priorityOptions = [
        // 1. 원본 URL
        originalUrl,
        // 2. 다양한 크기 파라미터 (maplescouter가 사용할 수 있는 것들)
        `${originalUrl}?size=512`,
        `${originalUrl}?size=256`,
        `${originalUrl}?size=128`,
        // 3. 스케일 파라미터
        `${originalUrl}?scale=2`,
        `${originalUrl}?scale=3`,
        `${originalUrl}?scale=4`,
        // 4. 품질 파라미터
        `${originalUrl}?quality=high`,
        `${originalUrl}?quality=best`,
        // 5. 포맷 파라미터
        `${originalUrl}?format=png`,
        // 6. 조합 파라미터
        `${originalUrl}?size=512&scale=2`,
        `${originalUrl}?size=256&quality=high`,
        `${originalUrl}?scale=2&format=png`
      ];
      
      console.log('우선순위 이미지 URL 옵션들:', priorityOptions);
      
      // 실제로 작동하는 URL을 찾기 위해 각 옵션을 테스트
      // 현재는 첫 번째 옵션(?size=300)을 시도하고, 
      // 브라우저에서 실패 시 자동으로 원본으로 폴백되도록 함
      const selectedUrl = priorityOptions[0];
      console.log('선택된 이미지 URL:', selectedUrl);
      
      // 추가 디버깅: 각 우선순위 옵션들을 콘솔에 출력
      console.log('테스트할 URL 순서:');
      priorityOptions.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      return selectedUrl;
      
    } catch (error) {
      console.warn('이미지 URL 개선 실패, 원본 URL 사용:', error);
      return originalUrl;
    }
  }

  // API 키로 계정의 캐릭터 목록 조회
  async getCharacterList(apiKey: string): Promise<Character[]> {
    try {
      
      
      // 1단계: 캐릭터 목록 조회
      const listResponse = await fetch(`${this.baseUrl}/character/list`, {
        headers: {
          'x-nxopen-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('캐릭터 목록 API 에러:', errorText);
        throw new Error(`캐릭터 목록 조회 실패: ${listResponse.status}`);
      }

      const listData: NexonCharacterListResponse = await listResponse.json();
      
      
      // 2단계: 모든 계정의 캐릭터를 하나의 배열로 통합
      const allCharacters: NexonCharacterListItem[] = [];
      listData.account_list.forEach(account => {
        allCharacters.push(...account.character_list);
      });

      // 3단계: 레벨 235 이상 필터링
      const highLevelCharacters = allCharacters.filter(char => char.character_level >= 235);

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

          // API 응답에서 실제 이미지 URL 확인
          console.log(`캐릭터 ${char.character_name} 이미지 URL:`, basicData.character_image);

          // 아케인포스, 어센틱포스 정보 조회
          const forceData = await this.getCharacterStat(char.ocid, apiKey);

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
            image: this.enhanceCharacterImageUrl(basicData.character_image),
            isMainCharacter: false,
            arcaneForce: forceData.arcaneForce,
            authenticForce: forceData.authenticForce
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
        image: this.enhanceCharacterImageUrl(data.character_image),
        guildName: data.character_guild_name,
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

  // 캐릭터 능력치 정보 조회 (아케인포스, 어센틱포스 포함)
  async getCharacterStat(ocid: string, apiKey: string): Promise<CharacterStats> {
    try {
      const response = await fetch(`${this.baseUrl}/character/stat?ocid=${ocid}`, {
        headers: {
          'x-nxopen-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`캐릭터 능력치 조회 실패: ${response.status}`);
        return { arcaneForce: 0, authenticForce: 0 };
      }

      const statData: NexonCharacterStat = await response.json();
      
      // 공통 파서
      const parseNumber = (v: string | undefined): number => {
        if (!v) return 0;
        const cleaned = v.replace(/[,\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };
      const parsePercent = (v: string | undefined): number => {
        if (!v) return 0;
        const cleaned = v.replace(/[,\s%]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };
      const parseSeconds = (v: string | undefined): number => {
        if (!v) return 0;
        const cleaned = v.replace(/[^0-9.\-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      // 초기값
      const result: CharacterStats = {
        arcaneForce: 0,
        authenticForce: 0,
      };

      // 매핑 테이블
      type StatsKey = keyof CharacterStats;
      const m: Record<StatsKey, string[]> = {
        // 포스
        arcaneForce: ['아케인포스'],
        authenticForce: ['어센틱포스'],
        // 기본 능력치
        hp: ['최대 HP', 'HP'],
        mp: ['최대 MP', 'MP'],
        str: ['STR'],
        dex: ['DEX'],
        int: ['INT'],
        luk: ['LUK'],
        // 공격/데미지
        attack: ['공격력'],
        magicAttack: ['마력'],
        damagePct: ['데미지', '데미지(%)'],
        finalDamagePct: ['최종 데미지'],
        normalMobDamagePct: ['일반 몬스터 공격 시 데미지 증가'],
        bossDamagePct: ['보스 몬스터 공격 시 데미지 증가', '보스 공격력', '보스 몬스터 데미지'],
        critDamagePct: ['크리티컬 데미지', '크리티컬 데미지(%)'],
        // 방어/관통
        ignoreDefensePct: ['몬스터 방어율 무시', '방어율 무시'],
        // 쿨감
        cooldownReducePct: ['재사용 대기시간 감소', '재사용 대기시간 감소(%)'],
        cooldownReduceSec: ['재사용 대기시간 감소(초)'],
        cooldownIgnorePct: ['재사용 대기시간 미적용'],
        // 파밍
        itemDropPct: ['아이템 드롭률'],
        mesoObtainPct: ['메소 획득량'],
        // 전투력
        combatPower: ['전투력'],
      };

      // 역인덱스 구성: stat_name -> 내부키 (정확/부분 일치 모두 처리)
      const nameToKey = new Map<string, StatsKey>();
      (Object.keys(m) as StatsKey[]).forEach((key) => {
        m[key].forEach((label) => nameToKey.set(label, key));
      });

      // 순회 파싱
      statData.final_stat.forEach((stat) => {
        let key = nameToKey.get(stat.stat_name);
        let matchedByPartial = false;
        if (!key) {
          // 부분 일치 허용: 공백/괄호 제거 후 포함 관계 체크
          const normalized = stat.stat_name.replace(/\s|\(|\)|%/g, '');
          (Object.keys(m) as StatsKey[]).some((k) => {
            // 기본 능력치 및 HP/MP는 부분일치 제외 (오검출 방지)
            if (k === 'str' || k === 'dex' || k === 'int' || k === 'luk' || k === 'hp' || k === 'mp') return false;
            const labels = m[k];
            const matched = labels.some((lbl) => normalized.includes(lbl.replace(/\s|\(|\)|%/g, '')));
            if (matched) { key = k; matchedByPartial = true; return true; }
            return false;
          });
        }
        if (!key) return;

        switch (key) {
          case 'arcaneForce':
          case 'authenticForce':
          case 'hp':
          case 'mp':
          case 'str':
          case 'dex':
          case 'int':
          case 'luk':
          case 'attack':
          case 'magicAttack':
            // 기본 능력치는 부분일치로 세팅하지 않음
            if ((key === 'hp' || key === 'mp' || key === 'str' || key === 'dex' || key === 'int' || key === 'luk') && matchedByPartial) break;
            result[key] = parseNumber(stat.stat_value);
            break;
          case 'cooldownReduceSec':
            result.cooldownReduceSec = parseSeconds(stat.stat_value);
            break;
          case 'cooldownIgnorePct':
          case 'damagePct':
          case 'finalDamagePct':
          case 'normalMobDamagePct':
          case 'bossDamagePct':
          case 'critDamagePct':
          case 'ignoreDefensePct':
          case 'cooldownReducePct':
          case 'itemDropPct':
          case 'mesoObtainPct':
          case 'combatPower': {
            const val = parsePercent(stat.stat_value);
            const prev = result[key as keyof CharacterStats] as number | undefined;
            // 값이 여러 번 올 수 있으므로 0으로 덮어쓰지 말고 더 신뢰도 높은(큰) 값을 유지
            if (prev === undefined || (val > 0 && (prev ?? 0) < val)) {
              (result as unknown as Record<string, number>)[key] = val;
            }
            break;
          }
        }
      });

      return result;
    } catch (error) {
      console.error('캐릭터 능력치 조회 실패:', error);
      return { arcaneForce: 0, authenticForce: 0 };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const nexonApiService = new NexonApiService();
export default nexonApiService; 