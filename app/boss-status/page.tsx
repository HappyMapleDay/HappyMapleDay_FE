"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Character, CharacterStats } from "../../types";
import { BossSelection } from "../../types/boss";
import BossSelectionModal from "../../components/BossSelectionModal";
import AddBossCharacterModal from "../../components/AddBossCharacterModal";
import DesireDropModal from "../../components/DesireDropModal";
import OptimizationResultModal from "../../components/OptimizationResultModal";

import { useAuth } from "../../store/authStore";
import { getCharacterList } from "../../services/characterService";
import nexonApiService from "../../services/nexonApiService";
import { TokenManager } from "../../services/authService";
import { getBossListFromAPI, getBossDesireItems, getOptimizedRecommendation } from "../../services/bossService";
import { getSettlementStatus, formatDateForAPI, attemptSettlement, autoSaveSettlement } from "../../services/settlementService";
import type { BossResponse, Boss, OptimizeRecommendationRequest, OptimizedRecommendationResponse } from "../../types/boss";
import type { SettlementStatusResponse, SettlementRequest, BossRecordRequest, DesireItemRequest } from "../../types/settlement";
// 프리셋 로직은 모달 내부에서 처리

export default function BossStatusPage() {
  const router = useRouter();
  const { isLoggedIn, logout, mainCharacterName, initializeAuth } = useAuth();
  
  // 인증 상태 확인 및 리다이렉션
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  // 프리셋은 모달에서만 로드

  // 캐릭터 목록 조회
  const fetchCharacters = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      setIsLoadingCharacters(true);
      const characters = await getCharacterList();
      
      // 캐릭터 목록 정렬: 본캐 최상위, 그 다음 레벨 내림차순
      const sortedCharacters = [...characters].sort((a, b) => {
        // 본캐인 경우 최상위로
        if (a.isMainCharacter && !b.isMainCharacter) return -1;
        if (!a.isMainCharacter && b.isMainCharacter) return 1;
        
        // 본캐가 아닌 경우 레벨 내림차순
        return b.level - a.level;
      });
      
      setBossCharacters(sortedCharacters);
      
      // 첫 번째 캐릭터나 본캐를 기본 선택
      if (sortedCharacters.length > 0) {
        const mainCharacter = sortedCharacters.find(char => char.isMainCharacter);
        setSelectedCharacterId(mainCharacter?.id || sortedCharacters[0].id);
      }
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [isLoggedIn]);

  // 캐릭터 새로고침 (쿨타임 적용)
  const handleRefreshCharacters = useCallback(async () => {
    // 현재 쿨타임 상태 확인
    const currentCooldownEndTime = localStorage.getItem('characterRefreshCooldown');
    if (currentCooldownEndTime && Date.now() < parseInt(currentCooldownEndTime)) {
      return; // 쿨타임 중이면 실행하지 않음
    }

    try {
      await fetchCharacters();
      
      // 새로고침 성공 후 1분 쿨타임 설정
      const newCooldownEndTime = Date.now() + 60 * 1000; // 60초
      setCooldownEndTime(newCooldownEndTime);
      localStorage.setItem('characterRefreshCooldown', newCooldownEndTime.toString());
      
    } catch {
      // 에러 발생 시에도 쿨타임 적용 (API 호출은 했으므로)
      const newCooldownEndTime = Date.now() + 60 * 1000;
      setCooldownEndTime(newCooldownEndTime);
      localStorage.setItem('characterRefreshCooldown', newCooldownEndTime.toString());
    }
  }, [fetchCharacters]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // 캐릭터 상세 스탯 캐시 및 호버 상태
  const [characterStatsById, setCharacterStatsById] = useState<Record<string, CharacterStats | 'loading'>>({});
  const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    placement: 'above' | 'below';
  } | null>(null);

  const ensureCharacterStats = useCallback(async (character: Character) => {
    if (characterStatsById[character.id] && characterStatsById[character.id] !== 'loading') return;
    const apiKey = TokenManager.getNexonApiKey();
    if (!apiKey) return;
    setCharacterStatsById(prev => ({ ...prev, [character.id]: 'loading' }));
    try {
      const stats = await nexonApiService.getCharacterStat(character.ocid, apiKey);
      setCharacterStatsById(prev => ({ ...prev, [character.id]: stats }));
    } catch {
      setCharacterStatsById(prev => ({ ...prev, [character.id]: { arcaneForce: 0, authenticForce: 0 } }));
    }
  }, [characterStatsById]);

  // API 보스 데이터 로드 (BossSelectionModal과 동일한 로직)
  useEffect(() => {
    const loadBossData = async () => {
      if (!isLoggedIn) return;
      
      try {
        setIsLoadingBosses(true);
        const apiList = await getBossListFromAPI();
        
        // BossSelectionModal과 동일한 변환 로직
        const transformApiBossesToUi = (apiList: (BossResponse & { englishName?: string })[]): Boss[] => {
          const group = new Map<string, Boss>();
          for (const item of apiList) {
            const en = item.bossNameEn || item.englishName || '';
            const id = en || item.bossId.toString();
            const difficulty = mapDifficulty(item.difficultyEn || item.difficulty);
            const existing = group.get(id);
            const difficultyInfo: Boss['difficulties'][number] = {
              difficulty,
              requiredLevel: (item as BossResponse).minEntryLevel ?? 0,
              expectedMeso: item.crystalPrice || 0,
              expectedItems: [] as string[],
            };

            if (existing) {
              existing.difficulties.push(difficultyInfo);
            } else {
              group.set(id, {
                id,
                name: item.bossName,
                resetType: 'weekly',
                image: englishToImage(en),
                difficulties: [difficultyInfo],
              });
            }
          }
          // 난이도 정렬: easy → normal → hard → chaos → extreme
          const order: Record<'easy' | 'normal' | 'hard' | 'chaos' | 'extreme', number> = {
            easy: 0,
            normal: 1,
            hard: 2,
            chaos: 3,
            extreme: 4,
          };
          for (const boss of group.values()) {
            boss.difficulties.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
          }
          return Array.from(group.values());
        };

        const uiBosses = transformApiBossesToUi(apiList);
        setAllBosses(uiBosses);
        setApiBosses(apiList); // 원본 API 데이터도 저장
        
        // 각 보스별 난이도별 물욕템 존재 여부 확인
        const desireItemsCheck: Record<string, boolean> = {};
        const desireItemsData: Record<string, Record<string, unknown[]>> = {};
        
        for (const uiBoss of uiBosses) {
          const relatedApiBosses = apiList.filter((b: BossResponse & { englishName?: string }) => 
            (b.bossNameEn || b.englishName) === uiBoss.id || b.bossName === uiBoss.name
          );
          
          let hasDesireItems = false;
          const difficultyItems: Record<string, unknown[]> = {};
          
          for (const apiBoss of relatedApiBosses) {
            try {
              const bossNumericId = (apiBoss as unknown as { id?: number; bossId?: number }).id ?? 
                                   (apiBoss as unknown as { id?: number; bossId?: number }).bossId;
              if (bossNumericId != null) {
                const items = await getBossDesireItems(bossNumericId);
                if (items.length > 0) {
                  hasDesireItems = true;
                  
                  // 난이도 정보 가져오기
                  const difficulty = mapDifficulty(apiBoss.difficultyEn || apiBoss.difficulty);
                  
                  // 난이도별로 아이템 분류
                  if (!difficultyItems[difficulty]) {
                    difficultyItems[difficulty] = [];
                  }
                  difficultyItems[difficulty].push(...items);
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch desire items for ${uiBoss.name}:`, error);
            }
          }
          
          desireItemsCheck[uiBoss.id] = hasDesireItems;
          if (hasDesireItems) {
            desireItemsData[uiBoss.id] = difficultyItems;
          }
        }
        
        setBossHasDesireItems(desireItemsCheck);
        setBossDesireItems(desireItemsData);
        
      } catch (error) {
        console.error('보스 목록을 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoadingBosses(false);
      }
    };

    loadBossData();
  }, [isLoggedIn]);

  // 난이도 매핑 함수 (BossSelectionModal과 동일)
  const mapDifficulty = (koOrEn?: string): 'easy' | 'normal' | 'hard' | 'chaos' | 'extreme' => {
    const v = (koOrEn || '').toLowerCase();
    if (v === 'easy' || v === '이지') return 'easy';
    if (v === 'normal' || v === '노말') return 'normal';
    if (v === 'hard' || v === '하드') return 'hard';
    if (v === 'chaos' || v === '카오스') return 'chaos';
    if (v === 'extreme' || v === '익스트림') return 'extreme';
    return 'normal';
  };

  // 영문명을 이미지 경로로 변환 (BossSelectionModal과 동일)
  const englishToImage = (englishName?: string) => {
    if (!englishName) return '/image/logo.png';
    const overrides: Record<string, string> = {
      vervushilla: 'vernushilla',
    };

    const normalized = englishName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const fileKey = overrides[normalized] || normalized;
    return `/image/boss-illustrate/${fileKey}-illustrate.png`;
  };

  // 숫자 → 한국형 표기 (억 만 나머지)
  const formatKoreanNumberFull = (n?: number) => {
    if (!n || n <= 0) return '';
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    const rest = n % 10000;
    const parts: string[] = [];
    if (eok > 0) parts.push(`${eok}억`);
    if (man > 0) parts.push(`${man}만`);
    if (rest > 0) parts.push(`${rest}`);
    return parts.join(' ');
  };

  // 반지 이름으로 반지 타입 결정
  const getRingType = (ringName: string): 'weapon' | 'restraint' | 'continue' => {
    const lowerName = ringName.toLowerCase();
    if (lowerName.includes('weapon') || lowerName.includes('웨폰')) return 'weapon';
    if (lowerName.includes('restraint') || lowerName.includes('리스트')) return 'restraint';
    if (lowerName.includes('continue') || lowerName.includes('컨티')) return 'continue';
    return 'weapon'; // 기본값
  };

  // 물욕템 이미지 경로 생성 (영문명을 파일명으로 변환)
  const getDesireItemImage = (itemNameEn?: string, itemName?: string) => {
    if (!itemNameEn && !itemName) return '/image/logo.png';
    
    // 특수 매핑 (API 영문명과 실제 파일명이 다른 경우)
    const imageOverrides: Record<string, string> = {
      // 생명의 연마석 관련 모든 가능한 매핑
      'stoneoflife': 'scochStoneOfLife',
      'lifestone': 'scochStoneOfLife',
      'scochstoneoflife': 'scochStoneOfLife',
      'scochlivelystone': 'scochStoneOfLife',
      'livelystone': 'scochStoneOfLife',
      '생명의연마석': 'scochStoneOfLife',
      '생명의 연마석': 'scochStoneOfLife',
      '생명연마석': 'scochStoneOfLife',
      // 신념의 연마석도 추가
      'stoneofbelief': 'scochStoneOfBelief',
      'beliefstone': 'scochStoneOfBelief',
      'scochstoneofbelief': 'scochStoneOfBelief',
      'scochbeliefstone': 'scochStoneOfBelief',
      '신념의연마석': 'scochStoneOfBelief',
      '신념의 연마석': 'scochStoneOfBelief',
      '신념연마석': 'scochStoneOfBelief',
      // 반지 상자 관련
      'ringboxwithlife': 'RingboxWithLife',
      'liferingbox': 'RingboxWithLife',
      '생명의보스반지상자': 'RingboxWithLife',
      '생명의 보스 반지상자': 'RingboxWithLife',
      // 커맨더 포스 이어링
      'commanderforceearing': 'commanderForceEaring',
      'commanderearing': 'commanderForceEaring',
      '커맨더포스이어링': 'commanderForceEaring',
      '커맨더 포스 이어링': 'commanderForceEaring',
      // 필요시 다른 아이템들도 추가 가능
    };

    // 우선 영문명 사용, 없으면 한글명 사용
    const itemKey = (itemNameEn || itemName || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    
    // 매핑된 파일명이 있으면 사용
    const mappedFileName = imageOverrides[itemKey];
    if (mappedFileName) {
      // 캐시 버스팅을 위한 타임스탬프 추가
      const timestamp = Date.now();
      const imagePath = `/image/drop-item/${mappedFileName}.png?v=${timestamp}`;
      console.log('최종 이미지 경로 (캐시버스팅):', imagePath);
      return imagePath;
    }
    
    // 기본적으로 영문명 우선 사용
    const fileName = itemNameEn || itemName;
    const timestamp = Date.now();
    const imagePath = `/image/drop-item/${fileName}.png?v=${timestamp}`;
    console.log('기본 이미지 경로 (캐시버스팅):', imagePath);
    return imagePath;
  };

  // 디버깅용 플래그 (한 번만 로그 출력)
  const [hasLoggedBossStructure, setHasLoggedBossStructure] = useState(false);



  // UI 보스 ID(영문명)와 난이도를 API 보스 ID(숫자)로 매핑
  const getBossApiId = (uiBossId: string, difficulty: string): number => {
    // 첫 번째 호출에서만 구조 로그 출력
    if (!hasLoggedBossStructure && apiBosses.length > 0) {
      console.log('=== apiBosses 데이터 구조 분석 ===');
      console.log('apiBosses 길이:', apiBosses.length);
      console.log('첫 번째 객체 전체 구조:', JSON.stringify(apiBosses[0], null, 2));
      console.log('첫 번째 객체의 모든 키:', Object.keys(apiBosses[0]));
      setHasLoggedBossStructure(true);
    }
    
    // 난이도 매핑 (UI -> API)
    const difficultyMap: Record<string, string> = {
      'easy': '이지',
      'normal': '노말', 
      'hard': '하드',
      'chaos': '카오스',
      'extreme': '익스트림'
    };
    
    const apiDifficulty = difficultyMap[difficulty] || difficulty;
    
    // 원본 API 데이터에서 영문명과 난이도로 찾기
    const apiBoss = apiBosses.find(boss => {
      const englishName = boss.bossNameEn || boss.englishName;
      const bossMatches = englishName === uiBossId;
      const difficultyMatches = boss.difficulty === apiDifficulty || boss.difficultyEn === difficulty;
      
      return bossMatches && difficultyMatches;
    });
    
    if (apiBoss) {
      // 첫 번째 매칭에서만 상세 로그 출력
      if (!hasLoggedBossStructure) {
        console.log('매칭된 보스 객체 구조:', JSON.stringify(apiBoss, null, 2));
        console.log('ID 필드 확인: bossId =', apiBoss.bossId);
      }
      
      console.log(`매칭: ${uiBossId} (${difficulty}) -> ${apiBoss.bossId}`);
      return apiBoss.bossId;
    }
    
    // 찾지 못한 경우 0 반환 (나중에 필터링됨)
    console.warn(`API 보스 ID를 찾을 수 없음: ${uiBossId} (${difficulty})`);
    return 0;
  };

  // 현재 보돌캐로 선택된 캐릭터들
  const [bossCharacters, setBossCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>("1");
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  // 날짜 범위 상태 (목요일 기준 일주일)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ..., 4: 목요일
    const daysToThursday = (4 - currentDay + 7) % 7; // 목요일까지 남은 일수
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + daysToThursday);
    
    const startDate = new Date(thursday);
    const endDate = new Date(thursday);
    endDate.setDate(thursday.getDate() + 6); // 일주일 후
    
    return {
      startDate: startDate.toISOString().split('T')[0].replace(/-/g, '.'),
      endDate: endDate.toISOString().split('T')[0].replace(/-/g, '.')
    };
  });
  // 서버 필터링 상태
  const [selectedServer, setSelectedServer] = useState<string>('전체');

  // 쿨타임 상태 복원 (페이지 로드 시)
  useEffect(() => {
    const savedCooldownEndTime = localStorage.getItem('characterRefreshCooldown');
    if (savedCooldownEndTime) {
      const endTime = parseInt(savedCooldownEndTime);
      if (endTime > Date.now()) {
        setCooldownEndTime(endTime);
      } else {
        localStorage.removeItem('characterRefreshCooldown');
      }
    }
  }, []);

  // 쿨타임 타이머 업데이트
  useEffect(() => {
    if (!cooldownEndTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, cooldownEndTime - now);
      setRemainingTime(remaining);
      
      if (remaining === 0) {
        setCooldownEndTime(null);
        localStorage.removeItem('characterRefreshCooldown');
      }
    };

    updateTimer(); // 즉시 실행
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  // 날짜 변경 함수들
  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentStartDate = new Date(dateRange.startDate.replace(/\./g, '-'));
    const newStartDate = new Date(currentStartDate);
    
    if (direction === 'prev') {
      newStartDate.setDate(currentStartDate.getDate() - 7); // 이전 주
    } else {
      newStartDate.setDate(currentStartDate.getDate() + 7); // 다음 주
    }
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + 6);
    
    setDateRange({
      startDate: newStartDate.toISOString().split('T')[0].replace(/-/g, '.'),
      endDate: newEndDate.toISOString().split('T')[0].replace(/-/g, '.')
    });
  };

  // 미래 날짜로 이동할 수 있는지 확인
  const canMoveToNextWeek = () => {
    const currentStartDate = new Date(dateRange.startDate.replace(/\./g, '-'));
    const today = new Date();
    const nextWeekStart = new Date(currentStartDate);
    nextWeekStart.setDate(currentStartDate.getDate() + 7);
    
    return nextWeekStart <= today;
  };

  // 정산 데이터 로드 함수
  const loadSettlementData = useCallback(async () => {
    if (!isLoggedIn || !mainCharacterName) return;
    
    try {
      setIsLoadingSettlement(true);
      const weekStartDate = formatDateForAPI(dateRange.startDate);
      
      // 사용자 ID는 임시로 1로 설정 (실제로는 인증된 사용자 ID를 사용해야 함)
      const userId = 1;
      
      console.log('정산 데이터 로드 중:', { userId, weekStartDate });
      
      // 정산 요약 데이터 로드
      const statusData = await getSettlementStatus(userId, weekStartDate);
      setSettlementStatus(statusData);
      
      console.log('정산 데이터 로드 완료:', { statusData });
    } catch (error) {
      console.error('정산 데이터 로드 실패:', error);
      // 에러 발생 시 상태 초기화
      setSettlementStatus(null);
    } finally {
      setIsLoadingSettlement(false);
    }
  }, [isLoggedIn, mainCharacterName, dateRange.startDate]);



  // 날짜 변경 시 API 호출을 위한 useEffect
  useEffect(() => {
    loadSettlementData();
  }, [loadSettlementData]);


  // 서버 변경 핸들러 - 선택된 캐릭터가 필터에서 제외되면 자동으로 다른 캐릭터 선택
  const handleServerChange = (server: string) => {
    setSelectedServer(server);
    
    // 현재 선택된 캐릭터가 새 필터에 포함되는지 확인
    const newFilteredCharacters = server === '전체' 
      ? bossCharacters 
      : bossCharacters.filter(char => char.server === server);
    
    const currentCharacterInFilter = newFilteredCharacters.find(char => char.id === selectedCharacterId);
    
    // 현재 선택된 캐릭터가 필터에 없으면 첫 번째 캐릭터 선택 (있는 경우)
    if (!currentCharacterInFilter && newFilteredCharacters.length > 0) {
      setSelectedCharacterId(newFilteredCharacters[0].id);
    } else if (newFilteredCharacters.length === 0) {
      setSelectedCharacterId(null);
    }
  };
  const [isBossModalOpen, setIsBossModalOpen] = useState(false);
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  // localStorage 키 생성 (사용자별로 구분)
  const getStorageKey = useCallback(() => `bossSelections_${mainCharacterName || 'default'}`, [mainCharacterName]);

  // localStorage에서 보스 선택 상태 로드
  const loadBossSelectionsFromStorage = (): Record<string, BossSelection[]> => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('보스 선택 상태 로드 실패:', error);
    }
    return {};
  };

  // localStorage에 보스 선택 상태 저장
  const saveBossSelectionsToStorage = (selections: Record<string, BossSelection[]>) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(selections));
    } catch (error) {
      console.error('보스 선택 상태 저장 실패:', error);
    }
  };

  const [characterBossSelections, setCharacterBossSelectionsState] = useState<Record<string, BossSelection[]>>(loadBossSelectionsFromStorage);

  // localStorage 자동 저장이 포함된 setter 함수
  const setCharacterBossSelections = (newSelections: Record<string, BossSelection[]> | ((prev: Record<string, BossSelection[]>) => Record<string, BossSelection[]>)) => {
    if (typeof newSelections === 'function') {
      setCharacterBossSelectionsState(prev => {
        const updated = newSelections(prev);
        saveBossSelectionsToStorage(updated);
        return updated;
      });
    } else {
      setCharacterBossSelectionsState(newSelections);
      saveBossSelectionsToStorage(newSelections);
    }
  };

  // 사용자가 변경되거나 로그인 상태가 변경될 때 저장된 보스 선택 상태 로드
  useEffect(() => {
    if (isLoggedIn && mainCharacterName) {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const savedSelections = JSON.parse(stored);
          setCharacterBossSelectionsState(savedSelections);
        }
      } catch (error) {
        console.error('보스 선택 상태 로드 실패:', error);
      }
    }
  }, [isLoggedIn, mainCharacterName, getStorageKey]);
  
  // 실제 API 보스 데이터 사용
  const [allBosses, setAllBosses] = useState<Boss[]>([]);
  const [isLoadingBosses, setIsLoadingBosses] = useState(true);
  const [apiBosses, setApiBosses] = useState<BossResponse[]>([]); // 원본 API 보스 데이터
  
  // 물욕템 관련 상태
  const [isDesireDropModalOpen, setIsDesireDropModalOpen] = useState(false);
  const [currentDesireDropBoss, setCurrentDesireDropBoss] = useState<{ bossId: string; bossName: string; difficulty: string } | null>(null);
  const [bossDesireItems, setBossDesireItems] = useState<Record<string, Record<string, unknown[]>>>({});
  const [bossHasDesireItems, setBossHasDesireItems] = useState<Record<string, boolean>>({});

  // 최적화 추천 관련 상태
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizedRecommendationResponse | null>(null);
  const [isOptimizationResultModalOpen, setIsOptimizationResultModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 정산 데이터 관련 상태
  const [settlementStatus, setSettlementStatus] = useState<SettlementStatusResponse | null>(null);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // 서버 목록 동적 생성 (캐릭터들의 서버만 포함)
  const availableServers = ['전체', ...Array.from(new Set(bossCharacters.map(char => char.server)))];
  
  // 서버별 필터링된 캐릭터 목록
  const filteredCharacters = selectedServer === '전체' 
    ? bossCharacters 
    : bossCharacters.filter(char => char.server === selectedServer);

  const selectedCharacter = bossCharacters.find((char: Character) => char.id === selectedCharacterId);
  const selectedBossSelections = selectedCharacterId ? characterBossSelections[selectedCharacterId] || [] : [];

  // SettlementRequest 생성 함수
  const createSettlementRequest = useCallback((): SettlementRequest => {
    const bossRecords: BossRecordRequest[] = [];
    
    filteredCharacters.forEach(character => {
      const selections = characterBossSelections[character.id] || [];
      const clearedSelections = selections.filter(selection => selection.isCleared);
      
      clearedSelections.forEach(selection => {
        const boss = allBosses.find(b => b.id === selection.bossId);
        const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
        
        if (boss && difficultyInfo) {
          // 결정석 수익 계산
          const crystalIncome = difficultyInfo.expectedMeso / selection.partySize;
          
          // 물욕템 수익 계산
          const desireItems: DesireItemRequest[] = selection.desireDropItems.map((item, index) => ({
            desireItemId: index + 1, // 임시 ID 생성
            sourceBoxItemId: undefined, // 필요시 추가 로직 구현
            salePrice: item.price
          }));
          
          bossRecords.push({
            characterId: parseInt(character.id),
            bossId: parseInt(boss.id) || 0,
            partySize: selection.partySize,
            crystalIncome: Math.floor(crystalIncome),
            desireItems,
            characterLevel: character.level,
            arcaneForce: character.arcaneForce || 0,
            authenticForce: character.authenticForce || 0,
            character_class: character.job,
            combat_power: 0 // 필요시 추가 로직 구현
          });
        }
      });
    });
    
    return {
      worldName: selectedServer === '전체' ? 'ALL' : selectedServer,
      bossRecords,
      version: 1
    };
  }, [filteredCharacters, characterBossSelections, allBosses, selectedServer]);

  // 자동 저장 함수
  const triggerAutoSave = useCallback(async () => {
    if (!isLoggedIn || !mainCharacterName) return;
    
    try {
      setIsAutoSaving(true);
      const weekStartDate = formatDateForAPI(dateRange.startDate);
      const userId = 1; // 임시 사용자 ID
      const settlementRequest = createSettlementRequest();
      
      console.log('자동 저장 실행:', { userId, weekStartDate, settlementRequest });
      
      await autoSaveSettlement(userId, weekStartDate, settlementRequest);
      console.log('자동 저장 완료');
    } catch (error) {
      console.error('자동 저장 실패:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [isLoggedIn, mainCharacterName, dateRange.startDate, createSettlementRequest]);

  // 자동 저장 타이머 설정
  const scheduleAutoSave = useCallback(() => {
    // 기존 타이머 클리어
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // 5초 후 자동 저장 실행
    const timeout = setTimeout(() => {
      triggerAutoSave();
    }, 5000);
    
    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, triggerAutoSave]);

  // 보스 선택 변경 시 자동 저장 스케줄링
  useEffect(() => {
    if (Object.keys(characterBossSelections).length > 0) {
      scheduleAutoSave();
    }
    
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [characterBossSelections, scheduleAutoSave, autoSaveTimeout]);

  // 수동 정산 시도 함수
  const handleSettlementAttempt = useCallback(async () => {
    if (!isLoggedIn || !mainCharacterName) return;
    
    try {
      const weekStartDate = formatDateForAPI(dateRange.startDate);
      const userId = 1; // 임시 사용자 ID
      
      // SettlementRequest를 직접 생성
      const bossRecords: BossRecordRequest[] = [];
      
      filteredCharacters.forEach(character => {
        const selections = characterBossSelections[character.id] || [];
        const clearedSelections = selections.filter(selection => selection.isCleared);
        
        clearedSelections.forEach(selection => {
          const boss = allBosses.find(b => b.id === selection.bossId);
          const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
          
          if (boss && difficultyInfo) {
            // 결정석 수익 계산
            const crystalIncome = difficultyInfo.expectedMeso / selection.partySize;
            
            // 물욕템 수익 계산
            const desireItems: DesireItemRequest[] = selection.desireDropItems.map((item, index) => ({
              desireItemId: index + 1, // 임시 ID 생성
              sourceBoxItemId: undefined, // 필요시 추가 로직 구현
              salePrice: item.price
            }));
            
            bossRecords.push({
              characterId: parseInt(character.id),
              bossId: parseInt(boss.id) || 0,
              partySize: selection.partySize,
              crystalIncome: Math.floor(crystalIncome),
              desireItems,
              characterLevel: character.level,
              arcaneForce: character.arcaneForce || 0,
              authenticForce: character.authenticForce || 0,
              character_class: character.job,
              combat_power: 0 // 필요시 추가 로직 구현
            });
          }
        });
      });
      
      const settlementRequest: SettlementRequest = {
        worldName: selectedServer === '전체' ? 'ALL' : selectedServer,
        bossRecords,
        version: 1
      };
      
      console.log('정산 시도:', { userId, weekStartDate, settlementRequest });
      
      const result = await attemptSettlement(userId, weekStartDate, settlementRequest);
      console.log('정산 시도 완료:', result);
      
      // 정산 완료 후 데이터 새로고침
      await loadSettlementData();
      
      alert('정산이 완료되었습니다!');
    } catch (error) {
      console.error('정산 시도 실패:', error);
      alert('정산 시도에 실패했습니다.');
    }
  }, [isLoggedIn, mainCharacterName, dateRange.startDate, filteredCharacters, characterBossSelections, allBosses, selectedServer, loadSettlementData]);

  const handleBossesChange = (bossIds: string[], difficultySettings?: Record<string, number>) => {
    console.log('handleBossesChange called with:', { bossIds, difficultySettings, allBossesLength: allBosses.length });
    console.log('selectedCharacterId:', selectedCharacterId);
    
    if (selectedCharacterId) {
      // 기존 선택 유지하면서 새로운 보스는 기본 설정으로 추가
      const existingSelections = characterBossSelections[selectedCharacterId] || [];
      const newSelections: BossSelection[] = bossIds.map(bossId => {
        const existing = existingSelections.find(sel => sel.bossId === bossId);
        if (existing) {
          // 기존 보스의 경우 난이도만 업데이트 (difficultySettings가 있는 경우)
          if (difficultySettings && difficultySettings[bossId] !== undefined) {
            const boss = allBosses.find(b => b.id === bossId);
            const difficultyIndex = difficultySettings[bossId];
            const selectedDifficulty = boss?.difficulties[difficultyIndex]?.difficulty || existing.selectedDifficulty;
            console.log(`Updating existing boss ${bossId} difficulty to: ${selectedDifficulty}`);
            return { ...existing, selectedDifficulty };
          }
          return existing;
        }
        
        // 새로운 보스의 경우 기본 설정으로 추가
        const boss = allBosses.find(b => b.id === bossId);
        if (!boss) {
          console.warn(`Boss not found: ${bossId}`);
          return null;
        }
        
        let selectedDifficulty = boss.difficulties[0]?.difficulty || 'normal';
        
        // difficultySettings가 있으면 해당 난이도 사용
        if (difficultySettings && difficultySettings[bossId] !== undefined) {
          const difficultyIndex = difficultySettings[bossId];
          selectedDifficulty = boss.difficulties[difficultyIndex]?.difficulty || selectedDifficulty;
        }
        
        console.log(`Adding new boss ${boss.name} with difficulty: ${selectedDifficulty}`);
        
        return {
          bossId,
          selectedDifficulty,
          partySize: 1,
          isGoldDrop: false,
          desireDropItems: [],
          isCleared: false
        };
      }).filter(Boolean) as BossSelection[];

      console.log('Setting new selections:', newSelections);
      setCharacterBossSelections(prev => {
        const updated = {
          ...prev,
          [selectedCharacterId]: newSelections
        };
        console.log('Updated characterBossSelections:', updated);
        return updated;
      });
    }
  };

  // 난이도 변경 함수
  const handleDifficultyChange = (bossId: string, direction: 'prev' | 'next') => {
    if (!selectedCharacterId) return;

    const boss = allBosses.find(b => b.id === bossId);
    if (!boss) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const currentSelection = currentSelections.find(sel => sel.bossId === bossId);
    if (!currentSelection) return;

    const currentIndex = boss.difficulties.findIndex(d => d.difficulty === currentSelection.selectedDifficulty);
    let newIndex: number;

    if (direction === 'next') {
      newIndex = currentIndex < boss.difficulties.length - 1 ? currentIndex + 1 : -1;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : -1;
    }

    // 더 이상 변경할 수 없는 경우 (가장 낮은/높은 난이도)
    if (newIndex === -1) return;

    const newDifficulty = boss.difficulties[newIndex].difficulty;

    setCharacterBossSelections(prev => ({
      ...prev,
      [selectedCharacterId]: currentSelections.map(sel =>
        sel.bossId === bossId 
          ? { ...sel, selectedDifficulty: newDifficulty }
          : sel
      )
    }));
  };

  // 파티원 수 변경 함수
  const handlePartySizeChange = (bossId: string, direction: 'prev' | 'next') => {
    if (!selectedCharacterId) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const currentSelection = currentSelections.find(sel => sel.bossId === bossId);
    if (!currentSelection) return;

    let newPartySize = currentSelection.partySize;
    
    if (direction === 'next' && newPartySize < 6) {
      newPartySize += 1;
    } else if (direction === 'prev' && newPartySize > 1) {
      newPartySize -= 1;
    }

    setCharacterBossSelections(prev => ({
      ...prev,
      [selectedCharacterId]: currentSelections.map(sel =>
        sel.bossId === bossId 
          ? { ...sel, partySize: newPartySize }
          : sel
      )
    }));
  };

  // 물욕템 체크 모달 열기
  const handleDesireDropClick = (bossId: string) => {
    if (!selectedCharacterId) return;
    
    const boss = allBosses.find(b => b.id === bossId);
    if (!boss || !bossHasDesireItems[bossId]) return;
    
    // 현재 선택된 난이도 정보 가져오기
    const currentSelection = characterBossSelections[selectedCharacterId]?.find(sel => sel.bossId === bossId);
    const currentDifficulty = currentSelection?.selectedDifficulty || 'normal';
    
    setCurrentDesireDropBoss({ 
      bossId, 
      bossName: boss.name,
      difficulty: currentDifficulty
    });
    setIsDesireDropModalOpen(true);
  };

  // 물욕템 저장 함수
  const handleDesireDropSave = (desireDropItems: import('../../types/boss').DesireDropItem[]) => {
    if (!selectedCharacterId || !currentDesireDropBoss) return;

    console.log('Saving desire drop items:', desireDropItems); // 디버깅

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const bossId = currentDesireDropBoss.bossId;

    setCharacterBossSelections(prev => ({
      ...prev,
      [selectedCharacterId]: currentSelections.map(sel =>
        sel.bossId === bossId 
          ? { 
              ...sel, 
              isGoldDrop: desireDropItems.length > 0,
              desireDropItems
            }
          : sel
      )
    }));

    setCurrentDesireDropBoss(null);
  };

  // 보스 클리어 상태 토글 함수
  const handleBossClearToggle = (bossId: string) => {
    if (!selectedCharacterId) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    
    setCharacterBossSelections(prev => ({
      ...prev,
      [selectedCharacterId]: currentSelections.map(sel =>
        sel.bossId === bossId 
          ? { ...sel, isCleared: !sel.isCleared }
          : sel
      )
    }));
  };

  // 일괄 클리어 함수
  const handleBulkClear = () => {
    if (!selectedCharacterId) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const unclearedBosses = currentSelections.filter(sel => !sel.isCleared);
    
    if (unclearedBosses.length === 0) {
      alert('모든 보스가 이미 클리어되었습니다.');
      return;
    }

    const confirmMessage = `선택된 ${unclearedBosses.length}개의 보스를 모두 클리어 처리하시겠습니까?`;
    if (confirm(confirmMessage)) {
      setCharacterBossSelections(prev => ({
        ...prev,
        [selectedCharacterId]: currentSelections.map(sel => ({ ...sel, isCleared: true }))
      }));
    }
  };

  // 프리셋 관련 로직 제거 (모달에서 처리)

  // 캐릭터 추가 함수
  const handleAddCharacters = (characters: Character[]) => {
    setBossCharacters(prev => [...prev, ...characters]);
  };

  // 캐릭터 삭제 함수
  const handleRemoveCharacter = (characterId: string) => {
    setBossCharacters(prev => prev.filter(char => char.id !== characterId));
    // 선택된 캐릭터가 삭제된 경우 선택 해제
    if (selectedCharacterId === characterId) {
      setSelectedCharacterId(null);
    }
    // 해당 캐릭터의 보스 설정도 삭제
    setCharacterBossSelections(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[characterId];
      return newConfigs;
    });
  };

  // 최적화 추천 실행 함수
  const handleOptimizeRecommendation = async () => {
    if (!filteredCharacters.length) {
      alert('캐릭터를 먼저 선택해 주세요.');
      return;
    }

    // DB ID가 없는 캐릭터 확인
    const charactersWithoutDbId = filteredCharacters.filter(char => !char.dbId);
    if (charactersWithoutDbId.length > 0) {
      const characterNames = charactersWithoutDbId.map(char => char.name).join(', ');
      alert(`다음 캐릭터들은 데이터베이스에 등록되지 않아 최적화에서 제외됩니다:\n${characterNames}\n\n캐릭터를 다시 추가해 주세요.`);
      return;
    }

    // 보스 선택 상태 전체 확인
    console.log('=== 보스 선택 상태 디버깅 ===');
    console.log('filteredCharacters:', filteredCharacters.map(c => ({ id: c.id, name: c.name, dbId: c.dbId })));
    console.log('characterBossSelections keys:', Object.keys(characterBossSelections));
    console.log('apiBosses 상태:', apiBosses.length, '개 보스 데이터');
    filteredCharacters.forEach(char => {
      const selections = characterBossSelections[char.id] || [];
      console.log(`캐릭터 ${char.name} (${char.id}): ${selections.length}개 보스 선택됨`, selections.map(s => s.bossId));
    });

    setIsOptimizing(true);
    try {
      // API 요청 데이터 구성
      const validCharacters = filteredCharacters.filter(char => char.dbId);
      const request: OptimizeRecommendationRequest = {
        characters: validCharacters.map(character => {
          const selections = characterBossSelections[character.id] || [];
          console.log(`캐릭터 ${character.name} (ID: ${character.id})의 선택된 보스:`, selections);
          
          return {
            characterId: character.dbId!, // 실제 데이터베이스 ID 사용 (이미 필터링됨)
            worldName: character.server,
            level: character.level,
            arcaneForce: character.arcaneForce || 0,
            authenticForce: character.authenticForce || 0,
            plannedBosses: selections.map(selection => {
              const boss = allBosses.find(b => b.id === selection.bossId);
              let bossApiId = 0;
              
              if (boss) {
                // UI 보스 ID(영문명)와 난이도를 API 보스 ID(숫자)로 매핑
                bossApiId = getBossApiId(selection.bossId, selection.selectedDifficulty);
                console.log(`보스 ${boss.name} (${selection.selectedDifficulty}): UI ID = ${boss.id}, API ID = ${bossApiId}`);
              } else {
                console.warn(`보스를 찾을 수 없음: ${selection.bossId}`);
              }
              
              return {
                bossId: bossApiId,
                partySize: selection.partySize,
                alreadyCleared: selection.isCleared
              };
            }).filter(boss => boss.bossId > 0) // 유효한 보스 ID만 포함
          };
        })
      };

      console.log('전체 characterBossSelections:', characterBossSelections);
      console.log('최적화 요청 데이터:', JSON.stringify(request, null, 2));
      
      const result = await getOptimizedRecommendation(request);
      setOptimizationResult(result);
      setIsOptimizationResultModalOpen(true);
      
      console.log('최적화 추천 결과:', result);
    } catch (error) {
      console.error('최적화 추천 실패:', error);
      alert('최적화 추천을 불러오는데 실패했습니다.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // 최적화 추천 적용 함수 (API 응답의 모든 보스를 보스 목록에 적용)
  const handleApplyOptimization = (customizedSelections?: Record<string, BossSelection[]>) => {
    if (!optimizationResult) return;
    
    console.log('handleApplyOptimization 호출됨:', { customizedSelections, optimizationResult });

    // 커스텀 선택이 있으면 그것을 사용, 없으면 기본 최적화 결과 사용
    let newCharacterBossSelections: Record<string, BossSelection[]>;
    
    if (customizedSelections) {
      // 커스텀 선택 사용 - 기존 선택을 유지하면서 커스텀 선택만 업데이트
      newCharacterBossSelections = { ...characterBossSelections };
      Object.keys(customizedSelections).forEach(characterId => {
        newCharacterBossSelections[characterId] = customizedSelections[characterId];
      });
      console.log('커스텀 선택 적용됨:', newCharacterBossSelections);
    } else {
      // 기본 최적화 결과 적용
      newCharacterBossSelections = { ...characterBossSelections };
      
      optimizationResult.worlds.forEach(world => {
        world.characters.forEach(characterRec => {
          const characterId = characterRec.characterId.toString();
          const character = bossCharacters.find(c => c.id === characterId);
          if (!character) return;

          // API 응답의 추천 보스들을 모두 새로운 선택 목록으로 생성
          const updatedSelections: BossSelection[] = characterRec.bosses.map(recommended => {
            // API 보스 ID를 UI 보스 ID로 변환
            const apiBoss = apiBosses.find(boss => boss.bossId === recommended.bossId);
            if (!apiBoss) {
              console.warn(`API 보스를 찾을 수 없음: ${recommended.bossId}`);
              return null;
            }

            const uiBossId = apiBoss.bossNameEn || apiBoss.englishName;
            if (!uiBossId) {
              console.warn(`UI 보스 ID를 찾을 수 없음: ${recommended.bossId}`);
              return null;
            }

            // 난이도 매핑 (API -> UI)
            const difficultyMap: Record<string, string> = {
              '이지': 'easy',
              '노말': 'normal', 
              '하드': 'hard',
              '카오스': 'chaos',
              '익스트림': 'extreme'
            };
            
            const uiDifficulty = difficultyMap[apiBoss.difficulty] || apiBoss.difficultyEn || 'normal';

            // UI 보스 정보 확인
            const boss = allBosses.find(b => b.id === uiBossId);
            if (!boss) {
              console.warn(`UI 보스를 찾을 수 없음: ${uiBossId}`);
              return null;
            }

            // 기존 선택이 있는 경우 일부 정보 유지 (물욕템 등)
            const existingSelection = newCharacterBossSelections[characterId]?.find(sel => 
              sel.bossId === uiBossId && sel.selectedDifficulty === uiDifficulty
            );

            return {
              bossId: uiBossId,
              selectedDifficulty: uiDifficulty,
              partySize: recommended.partySize || existingSelection?.partySize || 1, // API 응답의 partySize 사용
              isGoldDrop: existingSelection?.isGoldDrop || false,
              desireDropItems: existingSelection?.desireDropItems || [],
              isCleared: false // 최적화 적용 시에는 기본적으로 미클리어 상태로 설정
            };
          }).filter(Boolean) as BossSelection[];

          console.log(`캐릭터 ${character.name}의 최적화 적용 결과:`, updatedSelections);
          newCharacterBossSelections[characterId] = updatedSelections;
        });
      });
    }

    setCharacterBossSelections(newCharacterBossSelections);
    
    // 최적화 결과 초기화 (다시 최적화를 실행할 수 있도록)
    setOptimizationResult(null);
    
    alert('최적화가 적용되었습니다. API 응답의 모든 보스가 목록에 추가되었습니다.');
  };

  // 최적화 추천에서 제외된 보스인지 확인하는 함수
  const isExcludedFromOptimization = (): boolean => {
    // 최적화 배경색 변경 기능 비활성화 - 모달에서 최적화 상태 확인 가능
    return false;
  };

  const formatMeso = (meso: number) => {
    const manMeso = Math.floor(meso / 10000); // 만 단위로 변환
    
    if (manMeso >= 10000) {
      const eok = Math.floor(manMeso / 10000); // 억 단위
      const remainingMan = manMeso % 10000; // 나머지 만 단위
      
      if (remainingMan === 0) {
        return `${eok}억 메소`;
      } else {
        return `${eok}억 ${remainingMan}만 메소`;
      }
    } else {
      return `${manMeso}만 메소`;
    }
  };

  // 결정석 표기/합계는 모달에서 선택한 mock 데이터 기준 그대로 사용 (API 표기는 모달에서 처리)



  // 필터링된 캐릭터들의 총합 계산 - 정산 데이터가 있으면 정산 데이터 사용, 없으면 클리어된 보스만 포함
  const filteredTotalBossCount = settlementStatus 
    ? settlementStatus.totalBossCount 
    : filteredCharacters.reduce((sum, character) => {
        const selections = characterBossSelections[character.id] || [];
        const clearedBosses = selections.filter(selection => selection.isCleared);
        return sum + clearedBosses.length;
      }, 0);
  
  const filteredTotalExpectedMeso = settlementStatus 
    ? settlementStatus.totalIncome 
    : filteredCharacters.reduce((sum, character) => {
        const selections = characterBossSelections[character.id] || [];
        const characterTotal = selections.reduce((charSum, selection) => {
          // 클리어되지 않은 보스는 총계에서 제외
          if (!selection.isCleared) return charSum;
          
          const boss = allBosses.find(b => b.id === selection.bossId);
          const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
          const mesoPerPlayer = difficultyInfo?.expectedMeso || 0;
          const actualMeso = mesoPerPlayer / selection.partySize;
          
          // 물욕템 체크된 경우 모든 물욕템의 총 가격 사용 (메소 단위)
          const desireDropMeso = selection.desireDropItems.reduce((sum, item) => {
            return sum + (item.price / selection.partySize);
          }, 0);
          
          return charSum + actualMeso + desireDropMeso;
        }, 0);
        return sum + characterTotal;
      }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/image/logo.png"
                  alt="메요일조아 로고"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-lg lg:text-xl font-bold" style={{ color: '#FF9100' }}>메요일조아</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-8">
                <Link 
                  href="/boss-status" 
                  className="font-medium border-b-2 pb-1"
                  style={{ color: '#FF9100', borderColor: '#FF9100' }}
                >
                  보돌 현황
                </Link>
                <Link 
                  href="/boss-history" 
                  className="text-gray-500 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
                >
                  보돌 히스토리
                </Link>
                <Link 
                  href="/desire-history" 
                  className="text-gray-500 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
                >
                  물욕템 히스토리
                </Link>
              </nav>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {mainCharacterName || '사용자'}님
              </span>
              <Link 
                href="/settings" 
                className="text-gray-600 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
              >
                설정
              </Link>
              <button 
                onClick={logout}
                className="text-gray-600 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
              >
                로그아웃
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile Navigation */}
                <div className="space-y-2 mb-4">
                  <Link 
                    href="/boss-status" 
                    className="block px-3 py-2 rounded-md font-medium"
                    style={{ color: '#FF9100', backgroundColor: '#FFF3E0' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    보돌 현황
                  </Link>
                  <Link 
                    href="/boss-history" 
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    보돌 히스토리
                  </Link>
                  <Link 
                    href="/desire-history" 
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    물욕템 히스토리
                  </Link>
                </div>

                {/* Mobile User Menu */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-600">
                    {mainCharacterName || '사용자'}님
                  </div>
                  <Link 
                    href="/settings" 
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    설정
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Section - 기간, 캐릭터 선택 등 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
              {availableServers.map((server) => (
                <button
                  key={server}
                  onClick={() => handleServerChange(server)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                    selectedServer === server
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {server}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
            <button 
              onClick={() => handleDateChange('prev')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title="이전 주"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {dateRange.startDate} ~ {dateRange.endDate}
            </span>
            <button 
              onClick={() => handleDateChange('next')}
              disabled={!canMoveToNextWeek()}
              className={`transition-colors ${
                canMoveToNextWeek() 
                  ? 'text-gray-600 hover:text-gray-800' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={canMoveToNextWeek() ? "다음 주" : "미래 날짜로는 이동할 수 없습니다"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-6">
          {/* Left Sidebar - Character List */}
          <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0 order-1 md:order-1 xl:order-1">
            <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">캐릭터 목록</h3>
                <div className="flex items-center gap-2">
                  {/* 새로고침 버튼 */}
                  <button 
                    onClick={handleRefreshCharacters}
                    disabled={isLoadingCharacters || Boolean(cooldownEndTime && Date.now() < cooldownEndTime)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                    title={
                      cooldownEndTime && Date.now() < cooldownEndTime 
                        ? `새로고침 쿨타임: ${Math.ceil(remainingTime / 1000)}초 남음`
                        : "캐릭터 목록 새로고침"
                    }
                  >
                    {cooldownEndTime && Date.now() < cooldownEndTime ? (
                      <div className="text-xs font-bold" style={{ color: '#FF9100' }}>
                        {Math.ceil(remainingTime / 1000)}
                      </div>
                    ) : (
                      <svg 
                        className={`w-4 h-4 text-gray-600 ${isLoadingCharacters ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                  
                  {/* 캐릭터 추가 버튼 */}
                  <button 
                    onClick={() => setIsAddCharacterModalOpen(true)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    title="캐릭터 추가"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="relative space-y-3 h-[300px] md:h-[400px] lg:h-[calc(100vh-400px)] overflow-y-auto overflow-x-visible pr-2">
                {isLoadingCharacters ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#FF9100' }}></div>
                    <p className="mt-2 text-gray-500">캐릭터 목록을 불러오는 중...</p>
                  </div>
                ) : filteredCharacters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {selectedServer === '전체' ? '캐릭터가 없습니다.' : `${selectedServer} 서버에 캐릭터가 없습니다.`}
                    </p>
                  </div>
                ) : (
                  filteredCharacters.map((character: Character) => (
                  <div
                    key={character.id}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCharacterId === character.id
                        ? ''
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${character.isMainCharacter ? 'border-l-4' : ''}`}
                    style={character.isMainCharacter ? 
                      (selectedCharacterId === character.id ? 
                        { 
                          borderLeftColor: '#FF9100', 
                          borderTopColor: '#FF9100',
                          borderRightColor: '#FF9100',
                          borderBottomColor: '#FF9100',
                          backgroundColor: '#FFF3E0' 
                        } : 
                        { borderLeftColor: '#FF9100' }
                      ) : 
                      selectedCharacterId === character.id ? 
                        { 
                          borderTopColor: '#FF9100',
                          borderRightColor: '#FF9100',
                          borderBottomColor: '#FF9100',
                          borderLeftColor: '#FF9100',
                          backgroundColor: '#FFF3E0' 
                        } : 
                        {}
                    }
                  >
                    {/* 본캐 표시 또는 삭제 버튼 */}
                    {character.isMainCharacter ? (
                      <div className="absolute top-1 right-1 w-6 h-6 text-white rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm" style={{ backgroundColor: '#FF9100' }}>
                        <span className="text-xs font-medium">본</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 캐릭터 선택 이벤트 방지
                          handleRemoveCharacter(character.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors z-10 border-2 border-white shadow-sm"
                        style={{ backgroundColor: '#9CA3AF' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9CA3AF'}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div 
                      onClick={() => setSelectedCharacterId(character.id)}
                      className="flex items-start"
                    >
                      <div className="relative w-[85px] h-[90px] flex-shrink-0">
                        <div className="w-full h-full rounded-lg overflow-hidden">
                          <img
                            src={character.image}
                            alt={character.name}
                            className="w-full h-full"
                            style={{
                              objectFit: 'none',
                              objectPosition: '55% 58%',
                              transform: 'scale(0.8)',
                              transformOrigin: '55% 58%',
                              imageRendering: 'crisp-edges'
                            }}
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredCharacterId(character.id);
                            setHoveredCharacter(character);
                            ensureCharacterStats(character);
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const isMobile = window.innerWidth < 768;
                            const TOOLTIP_WIDTH = isMobile ? window.innerWidth * 0.9 : 560;
                            const TOOLTIP_HEIGHT = isMobile ? 400 : 300;
                            const HALF = TOOLTIP_WIDTH / 2;
                            const MARGIN = 12;
                            let x = rect.left + rect.width / 2;
                            x = Math.max(MARGIN + HALF, Math.min(window.innerWidth - MARGIN - HALF, x));
                            const spaceAbove = rect.top;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            let placement: 'above' | 'below' = 'below';
                            let top = rect.bottom + 8;
                            if (spaceAbove > TOOLTIP_HEIGHT + MARGIN || spaceBelow < TOOLTIP_HEIGHT + MARGIN) {
                              placement = 'above';
                              top = Math.max(MARGIN, rect.top - 8 - TOOLTIP_HEIGHT);
                            } else {
                              placement = 'below';
                              top = Math.min(window.innerHeight - MARGIN - TOOLTIP_HEIGHT, rect.bottom + 8);
                            }
                            setTooltipPos({ x, y: top, placement });
                          }}
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 translate-y-[14px] px-2 py-1 text-xs rounded-md transition-colors shadow-sm whitespace-nowrap"
                          style={{ backgroundColor: '#FF9100', color: 'white' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#E6820A';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FF9100';
                          }}
                        >
                          세부스탯
                        </button>
                      </div>
                      <div className={`flex-1 min-w-0 rounded-lg p-3 ml-3 ${
                        selectedCharacterId === character.id ? 'bg-gray-200' : 'bg-gray-100'
                      }`}>
                        <span className="text-xs text-gray-500 mb-0 pb-0 block">Lv.{character.level}</span>
                        <div className="font-medium text-gray-900 truncate mb-0.5 flex items-center">
                          {character.serverIcon ? (
                            <Image
                              src={character.serverIcon}
                              alt={character.server}
                              width={16}
                              height={16}
                              className="rounded-sm mr-1"
                            />
                          ) : (
                            <span className="mr-1">⭐</span>
                          )}
                          <span className="text-sm">{character.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          <span className="flex items-center border border-gray-300 rounded-full px-2 py-0.5 w-fit">
                            {character.guildName ? (
                              <span>{character.guildName}</span>
                            ) : (
                              <span>길드없음</span>
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {character.job}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
                {hoveredCharacterId && hoveredCharacter && tooltipPos && (
                  <div className="fixed z-50" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                    <div className="-translate-x-1/2 w-[90vw] max-w-[560px] rounded-2xl border border-gray-200 bg-white shadow-2xl p-3 md:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold" style={{ color: '#FF9100' }}>캐릭터 상세정보</div>
                        <button
                          onClick={() => {
                            setHoveredCharacterId(null);
                            setHoveredCharacter(null);
                            setTooltipPos(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <img
                          src={hoveredCharacter.image}
                          alt={hoveredCharacter.name}
                          className="rounded-xl w-24 h-24 md:w-28 md:h-28"
                          style={{
                            objectFit: 'none',
                            objectPosition: '55% 58%',
                            transform: 'scale(0.8)',
                            transformOrigin: '55% 58%',
                            imageRendering: 'crisp-edges'
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-sm md:text-base">{hoveredCharacter.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {hoveredCharacter.server}
                            {hoveredCharacter.guildName && (<>{' '}|{' '}{hoveredCharacter.guildName}</>)}
                          </div>
                          <div className="text-xs text-gray-600 truncate">{hoveredCharacter.job} Lv.{hoveredCharacter.level}</div>
                          {(() => {
                            const stats = characterStatsById[hoveredCharacterId];
                            const s = (stats && stats !== 'loading') ? stats as CharacterStats : undefined;
                            const power = s?.combatPower;
                            return power ? (
                              <div className="mt-2">
                                <div className="text-xs" style={{ color: '#FF9100' }}>전투력</div>
                                <div className="text-base font-bold text-gray-900">{formatKoreanNumberFull(power)}</div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      {(() => {
                        const stats = characterStatsById[hoveredCharacterId];
                        const loading = stats === 'loading';
                        const s = (loading || !stats) ? {} as CharacterStats : (stats as CharacterStats);
                        const cell = (label: string, value?: number | string) => (
                          <div>
                            <div className="text-[11px] text-gray-400">{label}</div>
                            <div className="text-sm font-semibold text-gray-900 mt-0.5">{loading ? '...' : (value ?? '-')}</div>
                          </div>
                        );
                        return (
                          <div className="mt-4 border border-gray-200 rounded-2xl p-2 md:p-4">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-4">
                              {cell('HP', s.hp)}
                              {cell('MP', s.mp)}
                              {cell('STR', s.str)}
                              {cell('DEX', s.dex)}
                              {cell('INT', s.int)}
                              {cell('LUK', s.luk)}
                              {cell('공격력', s.attack)}
                              {cell('마력', s.magicAttack)}
                              {cell('데미지(%)', s.damagePct)}
                              {cell('최종뎀(%)', s.finalDamagePct)}
                              {cell('보공(%)', s.bossDamagePct)}
                              {cell('크뎀(%)', s.critDamagePct)}
                              {cell('방무(%)', s.ignoreDefensePct)}
                              {cell('쿨감(%)', s.cooldownReducePct)}
                              {cell('쿨감(초)', s.cooldownReduceSec)}
                              {cell('재사용(%)', s.cooldownIgnorePct)}
                              {cell('드랍(%)', s.itemDropPct)}
                              {cell('메획(%)', s.mesoObtainPct)}
                              {cell('아케인포스', s.arcaneForce)}
                              {cell('어센틱포스', s.authenticForce)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Boss List */}
          <div className="col-span-12 md:col-span-6 xl:col-span-6 min-w-0 order-2 md:order-2 xl:order-2">
            <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">보스 목록</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {/* 일괄 클리어 버튼 */}
                  {selectedCharacterId && selectedBossSelections.length > 0 && (
                    <button
                      onClick={handleBulkClear}
                      disabled={selectedBossSelections.filter(sel => !sel.isCleared).length === 0}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedBossSelections.filter(sel => !sel.isCleared).length === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-white hover:opacity-80'
                      }`}
                      title={
                        selectedBossSelections.filter(sel => !sel.isCleared).length === 0
                          ? '모든 보스가 이미 클리어되었습니다'
                          : `${selectedBossSelections.filter(sel => !sel.isCleared).length}개 보스 일괄 클리어`
                      }
                    >
                      일괄 클리어
                    </button>
                  )}
                  <span>클리어된 보스</span>
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                    {selectedBossSelections.filter(selection => selection.isCleared).length}
                  </span>
                  <span>/</span>
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                    {selectedBossSelections.length}
                  </span>
                </div>
              </div>

              {/* 프리셋 탭 제거: 프리셋은 모달 내부에서만 노출 */}

              <div className="h-[300px] md:h-[400px] lg:h-[calc(100vh-400px)] overflow-y-auto">
                {isLoadingBosses ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#FF9100' }}></div>
                    <p className="mt-2 text-gray-500">보스 데이터를 불러오는 중...</p>
                  </div>
                ) : selectedCharacterId ? (
                  selectedBossSelections.length > 0 ? (
                    <div className="space-y-3">
                    {selectedBossSelections
                      .sort((a, b) => {
                        // 결정석 가격이 높은 순서대로 정렬
                        const bossA = allBosses.find(boss => boss.id === a.bossId);
                        const bossB = allBosses.find(boss => boss.id === b.bossId);
                        
                        const difficultyA = bossA?.difficulties.find(d => d.difficulty === a.selectedDifficulty);
                        const difficultyB = bossB?.difficulties.find(d => d.difficulty === b.selectedDifficulty);
                        
                        const mesoA = difficultyA?.expectedMeso || 0;
                        const mesoB = difficultyB?.expectedMeso || 0;
                        
                        return mesoB - mesoA; // 내림차순 (높은 가격부터)
                      })
                      .map((selection) => {
                      const boss = allBosses.find(b => b.id === selection.bossId);
                      const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
                      
                      if (!boss || !difficultyInfo) return null;
                      
                      return (
                        <div 
                          key={selection.bossId} 
                          className={`border border-gray-200 rounded-2xl p-2 md:p-2 lg:p-3 relative cursor-pointer transition-all duration-200 ${
                            selection.isCleared 
                              ? 'shadow-md' 
                              : 'bg-white hover:shadow-sm'
                          }`}
                          style={
                            isExcludedFromOptimization()
                              ? { backgroundColor: 'rgba(128, 128, 128, 0.3)', borderColor: '#9CA3AF' }
                              : selection.isCleared 
                                ? { backgroundColor: 'rgba(255, 179, 102, 0.8)', borderColor: '#FF9100' }
                                : {}
                          }
                          onClick={() => handleBossClearToggle(selection.bossId)}
                        >
                          <div className="flex items-start gap-2 lg:gap-4">
                            {/* 보스 이미지 */}
                            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={boss.image || '/image/logo.png'}
                                alt={boss.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* 보스 정보 섹션 */}
                            <div className="flex-1 min-w-0">
                              {/* 보스 이름 */}
                              <h4 className={`text-base xl:text-lg font-bold mb-2 ${
                                selection.isCleared ? 'text-gray-800' : 'text-gray-900'
                              }`}>{boss.name}</h4>
                              
                                                            {/* 난이도 컨트롤 + 가격/결정석 */}
                              <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-0 mb-2">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-sm font-medium" 
                                    style={{ color: selection.isCleared ? '#8B4513' : '#FF9100' }}
                                  >
                                    난이도
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDifficultyChange(selection.bossId, 'prev');
                                      }}
                                      disabled={(() => {
                                        const boss = allBosses.find(b => b.id === selection.bossId);
                                        if (!boss) return true;
                                        const currentIndex = boss.difficulties.findIndex(d => d.difficulty === selection.selectedDifficulty);
                                        return currentIndex <= 0;
                                      })()}
                                      className={`w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center text-xs ${
                                        (() => {
                                          const boss = allBosses.find(b => b.id === selection.bossId);
                                          if (!boss) return true;
                                          const currentIndex = boss.difficulties.findIndex(d => d.difficulty === selection.selectedDifficulty);
                                          return currentIndex <= 0;
                                        })()
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'bg-gray-200 hover:bg-gray-300'
                                      }`}
                                    >
                                      &lt;
                                    </button>
                                    <div className="flex items-center justify-center w-[60px] xl:w-[90px] h-[18px] xl:h-[24px]">
                                      <Image
                                        src={`/image/boss-difficulty/difficulty-${selection.selectedDifficulty}.png`}
                                        alt={selection.selectedDifficulty}
                                        width={90}
                                        height={24}
                                        className="h-4 xl:h-6 object-contain"
                                        style={{ 
                                          imageRendering: 'auto',
                                          maxWidth: 'none'
                                        }}
                                      />
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDifficultyChange(selection.bossId, 'next');
                                      }}
                                      disabled={(() => {
                                        const boss = allBosses.find(b => b.id === selection.bossId);
                                        if (!boss) return true;
                                        const currentIndex = boss.difficulties.findIndex(d => d.difficulty === selection.selectedDifficulty);
                                        return currentIndex >= boss.difficulties.length - 1;
                                      })()}
                                      className={`w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center text-xs ${
                                        (() => {
                                          const boss = allBosses.find(b => b.id === selection.bossId);
                                          if (!boss) return true;
                                          const currentIndex = boss.difficulties.findIndex(d => d.difficulty === selection.selectedDifficulty);
                                          return currentIndex >= boss.difficulties.length - 1;
                                        })()
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'bg-gray-200 hover:bg-gray-300'
                                      }`}
                                    >
                                      &gt;
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 xl:gap-3 xl:ml-auto">
                                  <span 
                                    className="text-base font-medium" 
                                    style={{ color: selection.isCleared ? '#8B4513' : '#FF9100' }}
                                  >
                                    가격
                                  </span>
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className={`text-sm font-bold whitespace-nowrap ${
                                      selection.isCleared ? 'text-gray-800' : 'text-gray-900'
                                    }`}>결정석 {formatMeso(difficultyInfo.expectedMeso / selection.partySize)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 파티원 컨트롤 + 물욕템 */}
                              <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-sm font-medium" 
                                    style={{ color: selection.isCleared ? '#8B4513' : '#FF9100' }}
                                  >
                                    파티원
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePartySizeChange(selection.bossId, 'prev');
                                      }}
                                      disabled={selection.partySize <= 1}
                                      className={`w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center text-xs ${
                                        selection.partySize <= 1 
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'text-white'
                                      }`}
                                      style={selection.partySize > 1 ? { 
                                        backgroundColor: '#FF9100'
                                      } : {}}
                                      onMouseEnter={(e) => {
                                        if (selection.partySize > 1) {
                                          e.currentTarget.style.backgroundColor = '#E68200';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (selection.partySize > 1) {
                                          e.currentTarget.style.backgroundColor = '#FF9100';
                                        }
                                      }}
                                    >
                                      &lt;
                                    </button>
                                    <div className="flex items-center justify-center w-[60px] xl:w-[90px] h-[18px] xl:h-[24px] bg-white border border-gray-300 rounded-full">
                                      <span className="text-sm font-medium text-center">
                                        {selection.partySize}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePartySizeChange(selection.bossId, 'next');
                                      }}
                                      disabled={selection.partySize >= 6}
                                      className={`w-6 h-6 xl:w-7 xl:h-7 rounded-full flex items-center justify-center text-xs ${
                                        selection.partySize >= 6 
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'text-white'
                                      }`}
                                      style={selection.partySize < 6 ? { 
                                        backgroundColor: '#FF9100'
                                      } : {}}
                                      onMouseEnter={(e) => {
                                        if (selection.partySize < 6) {
                                          e.currentTarget.style.backgroundColor = '#E68200';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (selection.partySize < 6) {
                                          e.currentTarget.style.backgroundColor = '#FF9100';
                                        }
                                      }}
                                    >
                                      &gt;
                                    </button>
                                  </div>
                                </div>
                                                                                                                                    <div className="flex items-center gap-2 xl:gap-1 xl:ml-auto min-w-0">
                                    <span className={`text-sm font-bold whitespace-nowrap ${
                                      selection.isCleared ? 'text-gray-800' : 'text-gray-900'
                                    }`}>
                                      물욕템 {selection.desireDropItems.length > 0
                                        ? formatMeso(selection.desireDropItems.reduce((sum, item) => sum + item.price, 0) / selection.partySize) 
                                        : '-'}
                                    </span>
                                  </div>
                              </div>
                            </div>



                          {/* 물욕템 체크 버튼 (물욕템이 있는 보스만 표시) */}
                          {bossHasDesireItems[selection.bossId] && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDesireDropClick(selection.bossId);
                              }}
                              className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                selection.isGoldDrop 
                                  ? 'text-white' 
                                  : ''
                              }`}
                              style={selection.isGoldDrop 
                                ? { backgroundColor: '#FF9100' }
                                : { 
                                    backgroundColor: '#FFF3E0', 
                                    color: '#FF9100'
                                  }
                              }
                              onMouseEnter={(e) => {
                                if (!selection.isGoldDrop) {
                                  e.currentTarget.style.backgroundColor = '#FFE0B3';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!selection.isGoldDrop) {
                                  e.currentTarget.style.backgroundColor = '#FFF3E0';
                                }
                              }}
                            >
                              물욕템 체크
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                    
                    <button 
                      onClick={() => {
                        console.log('Opening modal with current selections:', selectedBossSelections);
                        console.log('All bosses available:', allBosses.length);
                        setIsBossModalOpen(true);
                      }}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 transition-colors"
                      style={{ '--hover-border-color': '#FF9100', '--hover-text-color': '#FF9100' } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FF9100';
                        e.currentTarget.style.color = '#FF9100';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                    >
                      + 보스 추가/수정
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">선택된 보스가 없습니다.</p>
                    <button 
                      onClick={() => {
                        console.log('Opening modal (empty state) with:', { selectedCharacterId, allBossesLength: allBosses.length });
                        setIsBossModalOpen(true);
                      }}
                      className="px-4 py-2 text-white rounded-lg transition-colors"
                      style={{ backgroundColor: '#FF9100' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
                    >
                      보스 선택하기
                    </button>
                  </div>
                )
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">캐릭터를 선택해 주세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Summary */}
          <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0 order-3 md:order-3 xl:order-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#FF9100' }}>총계</h3>
              
              {/* 총계 하단 버튼 - 최상부 고정 */}
              <button 
                className="w-full py-2 mb-4 border rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  borderColor: '#FF9100', 
                  color: '#FF9100' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF3E0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isLoadingSettlement ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                    <span>정산 데이터 로딩 중...</span>
                  </div>
                ) : settlementStatus ? (
                  <div className="flex flex-col items-center">
                    <span>정산 데이터</span>
                    <span>총 {filteredTotalBossCount}마리 {formatMeso(filteredTotalExpectedMeso)}</span>
                  </div>
                ) : isAutoSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                    <span>자동 저장 중...</span>
                  </div>
                ) : (
                  `총 ${filteredTotalBossCount}마리 ${formatMeso(filteredTotalExpectedMeso)}`
                )}
              </button>
              
              <div className="space-y-4 h-[250px] md:h-[350px] lg:h-[calc(100vh-450px)] overflow-y-auto">
                {/* 캐릭터별 박스 */}
                {filteredCharacters.map((character) => {
                  const characterSelections = characterBossSelections[character.id] || [];
                  const clearedSelections = characterSelections.filter(selection => selection.isCleared);
                  const characterMeso = clearedSelections.reduce((sum, selection) => {
                    const boss = allBosses.find(b => b.id === selection.bossId);
                    const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
                    const mesoPerPlayer = difficultyInfo?.expectedMeso || 0;
                    return sum + (mesoPerPlayer / selection.partySize);
                  }, 0);

                  return (
                    <div key={character.id} className="p-3 bg-gray-50 rounded-lg space-y-3 relative">
                      {/* 본캐 표시 */}
                      {character.isMainCharacter && (
                        <div className="absolute top-1 right-1 w-6 h-6 text-white rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm" style={{ backgroundColor: '#FF9100' }}>
                          <span className="text-xs font-medium">본</span>
                        </div>
                      )}
                      {/* 캐릭터 정보 */}
                      <div className="flex items-center bg-white border border-gray-300 rounded-lg p-3">
                        <div className="w-[85px] h-[90px] rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={character.image}
                            alt={character.name}
                            className="w-full h-full"
                            style={{
                              objectFit: 'none',
                              objectPosition: '55% 58%',
                              transform: 'scale(0.8)',
                              transformOrigin: '55% 58%',
                              imageRendering: 'crisp-edges'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 ml-3">
                          <span className="text-xs text-gray-500 mb-0 pb-0 block">Lv.{character.level}</span>
                          <div className="font-medium text-gray-900 truncate mb-0.5 flex items-center">
                            {character.serverIcon ? (
                              <Image
                                src={character.serverIcon}
                                alt={character.server}
                                width={16}
                                height={16}
                                className="rounded-sm mr-1"
                              />
                            ) : (
                              <span className="mr-1">⭐</span>
                            )}
                            <span className="text-sm">{character.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            <span className="flex items-center border border-gray-300 rounded-full px-2 py-0.5 w-fit">
                              {character.guildName ? (
                                <span>{character.guildName}</span>
                              ) : (
                                <span>길드없음</span>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {character.job}
                          </div>
                        </div>
                      </div>

                      {/* 결정석/물욕템 정보 */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">결정석</span>
                          <span className="font-medium">{formatMeso(characterMeso)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">물욕템</span>
                          <span className="font-medium">
                            {(() => {
                              const desireDropMeso = clearedSelections.reduce((sum, selection) => {
                                const itemsTotal = selection.desireDropItems.reduce((itemSum, item) => itemSum + item.price, 0);
                                return sum + (itemsTotal / selection.partySize);
                              }, 0);
                              return desireDropMeso > 0 ? formatMeso(desireDropMeso) : '-';
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* 큰 숫자 표시 */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-base font-bold" style={{ color: '#FF9100' }}>
                          <span>{clearedSelections.length}마리</span>
                          <span className="text-gray-300">|</span>
                          <span>
                            {(() => {
                              const desireDropMeso = clearedSelections.reduce((sum, selection) => {
                                const itemsTotal = selection.desireDropItems.reduce((itemSum, item) => itemSum + item.price, 0);
                                return sum + (itemsTotal / selection.partySize);
                              }, 0);
                              const totalMeso = characterMeso + desireDropMeso;
                              return formatMeso(totalMeso);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons Area - 모바일/태블릿에서만 표시 */}
          <div className="col-span-12 md:col-span-6 xl:hidden min-w-0 order-4 md:order-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="space-y-3">
                <button 
                  onClick={handleOptimizeRecommendation}
                  disabled={isOptimizing || !filteredCharacters.length}
                  className="w-full px-3 py-2 bg-white border-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  style={{ 
                    borderColor: '#FF9100', 
                    color: '#FF9100' 
                  }}
                  onMouseEnter={(e) => {
                    if (!isOptimizing && filteredCharacters.length > 0) {
                      e.currentTarget.style.backgroundColor = '#FFF3E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOptimizing && filteredCharacters.length > 0) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {isOptimizing ? '추천 최적 보돌 계산 중...' : '추천 최적 보돌 산출'}
                </button>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 text-center">
                    <p>이번 주 보돌 완료 시</p>
                    <p>이번 주에 대해</p>
                    <p>추천 최적 보돌 산출</p>
                    <p>기능을 사용할 수 없습니다.</p>
                  </div>
                  <button 
                    onClick={handleSettlementAttempt}
                    className="w-full px-3 py-2 text-white rounded-lg transition-colors text-xs"
                    style={{ backgroundColor: '#FF9100' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
                  >
                    이번 주 보돌 완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons - 데스크톱용 */}
        <div className="hidden xl:flex flex-col lg:flex-row items-center justify-between mt-8 gap-4">
          <button 
            onClick={handleOptimizeRecommendation}
            disabled={isOptimizing || !filteredCharacters.length}
            className="px-6 py-3 bg-white border-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              borderColor: '#FF9100', 
              color: '#FF9100' 
            }}
            onMouseEnter={(e) => {
              if (!isOptimizing && filteredCharacters.length > 0) {
                e.currentTarget.style.backgroundColor = '#FFF3E0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOptimizing && filteredCharacters.length > 0) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {isOptimizing ? '추천 최적 보돌 계산 중...' : '추천 최적 보돌 산출'}
          </button>

          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="text-center lg:text-right lg:mr-6">
              <p className="text-sm text-gray-500 mb-2">
                이번 주 보돌 완료 시 이번 주에 대해 
              </p>
              <p className="text-sm text-gray-500">
                추천 최적 보돌 산출 기능을 사용할 수 없습니다.
              </p>
            </div>
            <button 
              onClick={handleSettlementAttempt}
              className="px-6 py-3 text-white rounded-lg transition-colors whitespace-nowrap"
              style={{ backgroundColor: '#FF9100' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
            >
              이번 주 보돌 완료
            </button>
          </div>
        </div>

       </div>

       {/* Boss Selection Modal */}
       {selectedCharacter && (
         <BossSelectionModal
           isOpen={isBossModalOpen}
           onClose={() => setIsBossModalOpen(false)}
           character={selectedCharacter}
           selectedBosses={selectedBossSelections.map(sel => sel.bossId)}
           currentBossSelections={selectedBossSelections}
           onBossesChange={handleBossesChange}
         />
       )}

       {/* Add Boss Character Modal */}
       <AddBossCharacterModal
         isOpen={isAddCharacterModalOpen}
         onClose={() => setIsAddCharacterModalOpen(false)}
         currentBossCharacterIds={bossCharacters.map(char => char.id)}
         currentBossCharacters={bossCharacters}
         onAddCharacters={handleAddCharacters}
       />

             {/* Desire Drop Modal */}
      {currentDesireDropBoss && selectedCharacterId && (
        <DesireDropModal
          isOpen={isDesireDropModalOpen}
          onClose={() => {
            setIsDesireDropModalOpen(false);
            setCurrentDesireDropBoss(null);
          }}
          bossName={currentDesireDropBoss.bossName}
          availableItems={
            bossDesireItems[currentDesireDropBoss.bossId]?.[currentDesireDropBoss.difficulty]?.map((item: unknown) => {
              const typedItem = item as { 
                id?: number; 
                itemName?: string; 
                fullItemName?: string; 
                itemNameEn?: string;
                isRandomBox?: boolean;
                randomBoxItems?: Array<{
                  randomBoxItemId?: number;
                  dropItemName?: string;
                  dropItemNameEn?: string;
                  dropItemLevel?: number;
                  fullDropItemName?: string;
                  hasDropLevel?: boolean;
                }>;
              };
              
              const isRingBox = typedItem.isRandomBox && 
                               typedItem.randomBoxItems && 
                               typedItem.randomBoxItems.length > 0;
              
              return {
                id: typedItem.id?.toString() || Math.random().toString(),
                name: typedItem.itemName || typedItem.fullItemName || '알 수 없는 아이템',
                image: getDesireItemImage(typedItem.itemNameEn, typedItem.itemName),
                isRingBox: isRingBox,
                ringOptions: isRingBox ? typedItem.randomBoxItems?.map(ringItem => ({
                  type: getRingType(ringItem.dropItemName || ringItem.dropItemNameEn || ''),
                  level: ringItem.dropItemLevel || 1,
                  name: ringItem.dropItemName || ringItem.dropItemNameEn || '알 수 없는 반지',
                  fullName: ringItem.fullDropItemName || ringItem.dropItemName || '알 수 없는 반지',
                  image: getDesireItemImage(ringItem.dropItemNameEn, ringItem.dropItemName) // 개별 아이템 이미지 경로 추가
                })) : undefined
              };
            }) || []
          }
          currentDesireDropItems={
            characterBossSelections[selectedCharacterId]?.find(sel => sel.bossId === currentDesireDropBoss.bossId)?.desireDropItems || []
          }
          onSave={handleDesireDropSave}
        />
      )}

      {/* Optimization Result Modal */}
      <OptimizationResultModal
        isOpen={isOptimizationResultModalOpen}
        onClose={() => setIsOptimizationResultModalOpen(false)}
        result={optimizationResult}
        allBosses={allBosses}
        bossCharacters={bossCharacters}
        onApplyOptimization={handleApplyOptimization}
      />
     </div>
   );
 }