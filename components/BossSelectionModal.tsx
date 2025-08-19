"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Boss, Character } from "../types";
import { getBossPresetList, getBossListFromAPI, getBossDesireItems } from "../services/bossService";
import { BossPresetResponse, BossResponse } from "../types/boss";

interface BossSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  selectedBosses: string[];
  onBossesChange: (bossIds: string[], difficultySettings?: Record<string, number>) => void;
}

export default function BossSelectionModal({
  isOpen,
  onClose,
  character,
  selectedBosses,
  onBossesChange
}: BossSelectionModalProps) {
  const [localSelectedBosses, setLocalSelectedBosses] = useState<string[]>(selectedBosses);
  const [allBosses, setAllBosses] = useState<Boss[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presets, setPresets] = useState<BossPresetResponse[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | string | null>(null);
  const [difficultyIndexByBossId, setDifficultyIndexByBossId] = useState<Record<string, number>>({});
  const [apiBosses, setApiBosses] = useState<BossResponse[]>([]);
  // 보스별 난이도 키 -> 드랍아이템EN 배열
  const [desireDropMap, setDesireDropMap] = useState<Record<string, Record<string, string[]>>>({});
  // API 전체 보스 리스트는 UI Boss로 변환해서 사용

  // API 보스를 UI 보스로 변환
  const transformApiBossesToUi = useCallback((apiList: (BossResponse & { englishName?: string })[]): Boss[] => {
    const group = new Map<string, Boss>();
    for (const item of apiList) {
      const en = item.bossNameEn || item.englishName || '';
      const id = en || item.id.toString();
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
  }, []);

  const loadModalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const presetList = await getBossPresetList();
      console.log('Loaded presets:', presetList);
      // 프리셋 데이터 검증
      presetList.forEach((preset, index) => {
        if (preset.id === undefined || preset.id === null) {
          console.warn(`Preset at index ${index} has undefined/null id:`, preset);
        }
      });
      setPresets(presetList);
      
      const apiList = await getBossListFromAPI();
      setApiBosses(apiList);
      setAllBosses(transformApiBossesToUi(apiList));
    } catch (error) {
      console.error('보스 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  }, [transformApiBossesToUi]);

  // 보스별 물욕템(주요드랍) 조회 - 각 보스의 모든 난이도별 ID로 개별 조회
  useEffect(() => {
    if (!isOpen || apiBosses.length === 0 || allBosses.length === 0) return;
    const fetchDrops = async () => {
      const updates: Record<string, Record<string, string[]>> = {};
      
      // 난이도 정규화 함수 - 다양한 형태의 난이도를 표준 형태로 변환
      const normalizeDifficulty = (v?: string): string => {
        if (!v) return 'all';
        const normalized = v.toLowerCase().trim();
        
        // 영문 난이도를 표준 형태로 매핑
        if (normalized === 'easy' || normalized === '이지') return 'easy';
        if (normalized === 'normal' || normalized === '노말') return 'normal';
        if (normalized === 'hard' || normalized === '하드') return 'hard';
        if (normalized === 'chaos' || normalized === '카오스') return 'chaos';
        if (normalized === 'extreme' || normalized === '익스트림') return 'extreme';
        
        return normalized;
      };

      // UI 보스별로 관련된 모든 API 보스들을 찾아서 각각 드롭 아이템 조회
      const tasks = allBosses.map(async (uiBoss) => {
        // 같은 보스의 모든 난이도 찾기 (bossNameEn 또는 bossName으로 매칭)
        const relatedApiBosses = apiBosses.filter((b: BossResponse & { englishName?: string }) => 
          (b.bossNameEn || b.englishName) === uiBoss.id || b.bossName === uiBoss.name
        );
        
        console.log(`Boss ${uiBoss.name} (${uiBoss.id}) - Found ${relatedApiBosses.length} API entries`);
        
        if (relatedApiBosses.length === 0) return;
        
        // 각 난이도별 API 보스에 대해 드롭 아이템 조회
        const difficultyTasks = relatedApiBosses.map(async (apiBoss) => {
          try {
            const bossNumericId = (apiBoss as unknown as { id?: number; bossId?: number }).id ?? 
                                 (apiBoss as unknown as { id?: number; bossId?: number }).bossId;
            if (bossNumericId == null) return;
            
            console.log(`Fetching drops for ${apiBoss.bossName} (${apiBoss.difficulty || apiBoss.difficultyEn}) - ID: ${bossNumericId}`);
            
            const items = await getBossDesireItems(bossNumericId);
            
            items.forEach((d: { bossDifficultyEn?: string; bossDifficulty?: string; itemNameEn?: string; itemName: string }) => {
              // 영문 난이도 우선, 없으면 한글 난이도 사용, 최종적으로 API 보스의 난이도 사용
              const difficultyText = d.bossDifficultyEn || d.bossDifficulty || apiBoss.difficultyEn || apiBoss.difficulty;
              const key = normalizeDifficulty(difficultyText);
              
              if (!updates[uiBoss.id]) updates[uiBoss.id] = {};
              if (!updates[uiBoss.id][key]) updates[uiBoss.id][key] = [];
              
              // 영문 아이템명 우선, 없으면 한글 아이템명 사용
              const itemName = d.itemNameEn || d.itemName;
              if (itemName && !updates[uiBoss.id][key].includes(itemName)) {
                updates[uiBoss.id][key].push(itemName);
              }
            });
          } catch (error) {
            const bossNumericId = (apiBoss as unknown as { id?: number; bossId?: number }).id ?? 
                                 (apiBoss as unknown as { id?: number; bossId?: number }).bossId;
            console.warn(`Failed to fetch desire items for boss ${apiBoss.bossName} (ID: ${bossNumericId}):`, error);
          }
        });
        
        await Promise.all(difficultyTasks);
      });
      
      await Promise.all(tasks);
      
      if (Object.keys(updates).length > 0) {
        console.log('Updated desire drop map:', updates); // 디버깅용
        // 각 보스별로 어떤 난이도 키가 있는지 상세 로그
        Object.keys(updates).forEach(bossId => {
          console.log(`Boss ${bossId} difficulties:`, Object.keys(updates[bossId]));
          Object.keys(updates[bossId]).forEach(diffKey => {
            console.log(`  ${diffKey}: ${updates[bossId][diffKey].length} items`);
          });
        });
        setDesireDropMap((prev) => ({ ...prev, ...updates }));
      }
    };
    fetchDrops();
  }, [isOpen, apiBosses, allBosses]);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때마다 모든 상태 초기화
      setLocalSelectedBosses(selectedBosses);
      setSelectedPresetId(null);
      setDifficultyIndexByBossId({});
      loadModalData();
    }
  }, [isOpen, loadModalData, selectedBosses]);

  const englishToImage = (englishName?: string) => {
    if (!englishName) return '/image/logo.png';
    // 일부 명칭 표준화 및 예외 매핑
    const overrides: Record<string, string> = {
      // 파일명과 영문명이 다른 경우 보정
      vervushilla: 'vernushilla',
    };

    const normalized = englishName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // 공백/특수문자 제거

    const fileKey = overrides[normalized] || normalized;
    return `/image/boss-illustrate/${fileKey}-illustrate.png`;
  };

  const getCurrentDifficultyIndex = useCallback((bossId: string, difficultiesLength: number) => {
    const idx = difficultyIndexByBossId[bossId];
    // 기본값: 최상 난이도(마지막 인덱스)
    return typeof idx === 'number' ? idx : Math.max(0, difficultiesLength - 1);
  }, [difficultyIndexByBossId]);

  const changeDifficulty = (bossId: string, direction: 'prev' | 'next', total: number) => {
    setDifficultyIndexByBossId(prev => {
      const current = getCurrentDifficultyIndex(bossId, total);
      let nextIndex = current;
      if (direction === 'prev') {
        nextIndex = current > 0 ? current - 1 : total - 1;
      } else {
        nextIndex = current < total - 1 ? current + 1 : 0;
      }
      return { ...prev, [bossId]: nextIndex };
    });
  };

  const mapDifficulty = (koOrEn?: string): 'easy' | 'normal' | 'hard' | 'chaos' | 'extreme' => {
    const v = (koOrEn || '').toLowerCase();
    if (v === 'easy' || v === '이지') return 'easy';
    if (v === 'normal' || v === '노말') return 'normal';
    if (v === 'hard' || v === '하드') return 'hard';
    if (v === 'chaos' || v === '카오스') return 'chaos';
    if (v === 'extreme' || v === '익스트림') return 'extreme';
    return 'normal';
  };



  // 중복 선언 제거
  /* const transformApiBossesToUi = (apiList: BossResponse[]): Boss[] => {
    const group = new Map<string, Boss>();
    for (const item of apiList) {
      const en = item.bossNameEn || item.englishName || '';
      const id = en || item.id.toString();
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
    return Array.from(group.values());
  }; */

  const handleSelectPreset = (presetId: number | string) => {
    console.log(`Clicking preset ${presetId}, current selectedPresetId: ${selectedPresetId}`);
    
    // 같은 프리셋을 다시 클릭하면 선택 해제
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
      console.log('Deselected preset');
      return;
    }
    
    // 새로운 프리셋 선택
    setSelectedPresetId(presetId);
    
    // 선택된 프리셋 찾기
    const preset = presets.find((p, index) => {
      const actualId = typeof p.id === 'number' ? p.id : `fallback-${index}`;
      return actualId === presetId;
    });
    if (!preset || !preset.bosses) {
      console.warn(`Preset ${presetId} not found or has no bosses`);
      setSelectedPresetId(null);
      return;
    }

    console.log(`Selected preset: ${preset.presetName}`, preset.bosses);

    // 프리셋의 보스들을 UI 보스 ID로 매칭하고 난이도 설정
    const toSelect: string[] = [];
    const newDifficultySettings: Record<string, number> = {};
    
    preset.bosses.forEach(presetBoss => {
      // API 보스 이름(한글 또는 영문)으로 UI 보스 찾기
      const matchingUiBoss = allBosses.find(uiBoss => {
        // 영문명 매칭 우선
        const presetBossEn = presetBoss.bossNameEn || presetBoss.englishName;
        if (presetBossEn && uiBoss.id === presetBossEn) {
          return true;
        }
        // 한글명 매칭
        if (uiBoss.name === presetBoss.bossName) {
          return true;
        }
        return false;
      });

      if (matchingUiBoss) {
        toSelect.push(matchingUiBoss.id);
        
        // 프리셋 보스의 난이도에 맞는 UI 보스 난이도 인덱스 찾기
        const presetDifficulty = mapDifficulty(presetBoss.difficultyEn || presetBoss.difficulty);
        const difficultyIndex = matchingUiBoss.difficulties.findIndex(d => d.difficulty === presetDifficulty);
        
        if (difficultyIndex >= 0) {
          newDifficultySettings[matchingUiBoss.id] = difficultyIndex;
          console.log(`Set difficulty for ${matchingUiBoss.name}: ${presetDifficulty} (index: ${difficultyIndex})`);
        } else {
          // 해당 난이도가 없으면 기본값 사용 (최고 난이도)
          const defaultIndex = Math.max(0, matchingUiBoss.difficulties.length - 1);
          newDifficultySettings[matchingUiBoss.id] = defaultIndex;
          console.warn(`Difficulty ${presetDifficulty} not found for ${matchingUiBoss.name}, using default index: ${defaultIndex}`);
        }
        
        console.log(`Matched preset boss "${presetBoss.bossName}" (${presetBoss.difficulty || presetBoss.difficultyEn}) to UI boss "${matchingUiBoss.name}" (${matchingUiBoss.id})`);
      } else {
        console.warn(`Could not match preset boss: ${presetBoss.bossName} (${presetBoss.bossNameEn || presetBoss.englishName})`);
      }
    });

    if (toSelect.length > 0) {
      // 보스 선택과 난이도 설정을 동시에 적용
      setLocalSelectedBosses(toSelect);
      setDifficultyIndexByBossId(newDifficultySettings);
      console.log(`Applied preset "${preset.presetName}" with ${toSelect.length} bosses:`, toSelect);
      console.log('Difficulty settings:', newDifficultySettings);
    } else {
      console.warn(`No matching bosses found for preset "${preset.presetName}"`);
      setSelectedPresetId(null);
    }
  };

  if (!isOpen) return null;

  // 주간보스만 표시 후 정렬 (검은마법사 첫 번째, 나머지는 입장 요구 레벨 높은 순)
  const weeklyBosses = allBosses
    .filter(boss => boss.resetType === 'weekly')
    .sort((a, b) => {
      // 검은마법사(blackmage)를 항상 첫 번째로
      if (a.id === 'blackmage') return -1;
      if (b.id === 'blackmage') return 1;
      
      // 나머지는 최고 난이도의 입장 요구 레벨 기준으로 내림차순 정렬
      const aMaxLevel = Math.max(...a.difficulties.map(d => d.requiredLevel));
      const bMaxLevel = Math.max(...b.difficulties.map(d => d.requiredLevel));
      
      return bMaxLevel - aMaxLevel;
    });

  const handleBossToggle = (bossId: string) => {
    setLocalSelectedBosses(prev => 
      prev.includes(bossId) 
        ? prev.filter(id => id !== bossId)
        : [...prev, bossId]
    );
  };

  const handleSave = () => {
    console.log('=== BossSelectionModal handleSave 호출됨 ===');
    console.log('Saving with bosses:', localSelectedBosses);
    console.log('Difficulty settings:', difficultyIndexByBossId);
    console.log('onBossesChange 함수 호출 중...');
    onBossesChange(localSelectedBosses, difficultyIndexByBossId);
    console.log('onBossesChange 호출 완료, 모달 닫는 중...');
    onClose();
  };

  // 난이도 표기는 이미지로만 표시하므로 색상 클래스는 제거

  // 페이지와 동일한 표기 규칙으로 통일 (x억 y만 메소)
  const formatMeso = (meso: number) => {
    const manMeso = Math.floor(meso / 10000);
    if (manMeso >= 10000) {
      const eok = Math.floor(manMeso / 10000);
      const remainingMan = manMeso % 10000;
      if (remainingMan === 0) {
        return `${eok}억 메소`;
      }
      return `${eok}억 ${remainingMan}만 메소`;
    }
    return `${manMeso}만 메소`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">보스 선택</h2>
              <p className="text-sm text-gray-600 mt-1">
                {character.name} ({character.job}, Lv.{character.level})
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* 프리셋 탭 */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto">
            {presets
              .filter((preset) => preset.presetName) // presetName이 있는 것만 표시
              .map((preset, index) => {
                // preset.id가 undefined인 경우를 대비해 고유한 ID 생성
                const presetId = typeof preset.id === 'number' ? preset.id : `fallback-${index}`;
                const isSelected = selectedPresetId === presetId;
                
                return (
                  <button
                    key={`preset-${presetId}-${preset.presetName}`}
                    onClick={() => handleSelectPreset(presetId)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isSelected ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isSelected ? { backgroundColor: '#FF9100' } : {}}
                  >
                    {preset.presetName}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FF9100' }}></div>
              <span className="ml-3 text-gray-600">보스 목록을 불러오는 중...</span>
            </div>
          ) : weeklyBosses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyBosses.map((boss) => {
                const currentIndex = getCurrentDifficultyIndex(boss.id, boss.difficulties.length);
                const currentDifficulty = boss.difficulties[currentIndex];
                const minRequiredLevel = currentDifficulty.requiredLevel;
                const imageSrc = boss.image || '/image/logo.png';
                const difficultyKey = currentDifficulty.difficulty;
                const hasMultipleDifficulties = boss.difficulties.length > 1;
                
                return (
                  <div
                    key={boss.id}
                    onClick={() => handleBossToggle(boss.id)}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      localSelectedBosses.includes(boss.id)
                        ? ''
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={localSelectedBosses.includes(boss.id) ? {
                      borderColor: '#FF9100',
                      backgroundColor: 'rgba(255, 145, 0, 0.1)'
                    } : {}}
                  >
                    <div className="flex items-start gap-4">
                      {/* Left column: Drops thumbnails */}
                      <div className="flex flex-col items-start w-[92px]">
                        <div className="flex gap-1">
                          <Image src={imageSrc} alt={boss.name} width={92} height={92} className="w-[92px] h-[92px] rounded-lg object-cover flex-shrink-0" />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1 w-full">
                          {(() => {
                            const currentIdx = getCurrentDifficultyIndex(boss.id, boss.difficulties.length);
                            const currentDif = boss.difficulties[currentIdx];
                            const difKey = currentDif.difficulty.toLowerCase();
                            
                            // 다양한 키 형태로 시도해서 드롭 아이템 찾기
                            const bossDropData = desireDropMap[boss.id] || {};
                            let pool: string[] = [];
                            let usedKey = '';
                            
                            // 디버깅: 현재 보스의 드롭 데이터 확인
                            console.log(`Boss ${boss.id} (${boss.name}) - Looking for difficulty: ${difKey}`);
                            console.log(`Available keys:`, Object.keys(bossDropData));
                            
                            // 1. 정확한 난이도 키로 찾기
                            if (bossDropData[difKey]) {
                              pool = bossDropData[difKey];
                              usedKey = difKey;
                            }
                            // 2. 'all' 키로 찾기
                            else if (bossDropData['all']) {
                              pool = bossDropData['all'];
                              usedKey = 'all';
                            }
                            // 3. 다른 가능한 키들로 찾기 (한글 난이도명 등)
                            else {
                              const alternativeKeys = Object.keys(bossDropData);
                              for (const key of alternativeKeys) {
                                if (key.includes(difKey) || difKey.includes(key)) {
                                  pool = bossDropData[key];
                                  usedKey = key;
                                  break;
                                }
                              }
                            }
                            
                            console.log(`Used key: ${usedKey}, Pool size: ${pool.length}`);
                            
                            // 반지상자 필터링 함수
                            const filterOutRingBoxes = (items: string[]): string[] => {
                              return items.filter(itemName => {
                                const lowerName = itemName.toLowerCase();
                                // 반지상자 관련 키워드들 필터링 (반지 자체는 포함)
                                return !lowerName.includes('ringbox') && 
                                       !lowerName.includes('ring box') &&
                                       !lowerName.includes('반지상자') &&
                                       !lowerName.includes('jade') &&
                                       !lowerName.includes('ringboxwithlife');
                              });
                            };
                            
                            // 4. 반지상자 제외하고 최대 3개 선택
                            const filteredPool = filterOutRingBoxes(pool);
                            const filteredExpectedItems = filterOutRingBoxes(currentDif.expectedItems);
                            const list = (filteredPool.length > 0 ? filteredPool : filteredExpectedItems).slice(0, 3);
                            
                            return list.map((name, idx) => (
                              <Image
                                key={`${boss.id}-${currentIdx}-${idx}-${name}`}
                                src={`/image/drop-item/${name}.png`}
                                alt={name}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded object-contain bg-white"
                                onError={(e) => {
                                  // 이미지 로드 실패 시 기본 이미지로 대체
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/image/logo.png';
                                }}
                              />
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Right side: name, difficulty (under name), entry level, meso */}
                      <div className="flex-1">
                        {/* Name (single line) */}
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 text-base truncate">{boss.name}</h3>
                        </div>
                        {/* Difficulty controls under name */}
                        <div className="flex items-center gap-2 mb-2">
                          {hasMultipleDifficulties && (
                            <button
                              onClick={(e) => { e.stopPropagation(); changeDifficulty(boss.id, 'prev', boss.difficulties.length); }}
                              className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                              aria-label="이전 난이도"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          <Image
                            src={`/image/boss-difficulty/difficulty-${difficultyKey}.png`}
                            alt={difficultyKey}
                            width={90}
                            height={28}
                            className="object-contain"
                          />
                          {hasMultipleDifficulties && (
                            <button
                              onClick={(e) => { e.stopPropagation(); changeDifficulty(boss.id, 'next', boss.difficulties.length); }}
                              className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                              aria-label="다음 난이도"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Entry requirement and meso */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>입장 요구 레벨: {minRequiredLevel}</div>
                          <div className="font-medium" style={{ color: '#FF9100' }}>예상 메소: {formatMeso(currentDifficulty.expectedMeso)}</div>
                        </div>
                      </div>

                      {/* Checkbox (original position at right side) */}
                      <div 
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          localSelectedBosses.includes(boss.id)
                            ? ''
                            : 'border-gray-300'
                        }`}
                        style={localSelectedBosses.includes(boss.id) ? {
                          borderColor: '#FF9100',
                          backgroundColor: '#FF9100'
                        } : {}}
                      >
                        {localSelectedBosses.includes(boss.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                레벨에 맞는 주간 보스가 없습니다.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                캐릭터 레벨을 확인해주세요.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
                             선택된 보스: {localSelectedBosses.length}개
               {localSelectedBosses.length > 0 && (
                 <span className="ml-2 font-medium" style={{ color: '#FF9100' }}>
                   예상 총 메소: {formatMeso(
                     allBosses
                       .filter((boss: Boss) => localSelectedBosses.includes(boss.id))
                       .reduce((sum: number, boss: Boss) => {
                         // 현재 선택된 난이도의 메소 사용
                         const currentDifficultyIndex = getCurrentDifficultyIndex(boss.id, boss.difficulties.length);
                         const currentDifficulty = boss.difficulties[currentDifficultyIndex];
                         return sum + (currentDifficulty?.expectedMeso || 0);
                       }, 0)
                   )}
                 </span>
               )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#FF9100' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 