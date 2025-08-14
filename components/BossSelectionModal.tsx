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
  onBossesChange: (bossIds: string[]) => void;
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
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
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

  // 보스별 물욕템(주요드랍) 조회 - 전체 난이도 캐시 후 렌더 시 선택 난이도로 필터
  useEffect(() => {
    if (!isOpen || apiBosses.length === 0 || allBosses.length === 0) return;
    const fetchDrops = async () => {
      const updates: Record<string, Record<string, string[]>> = {};
      const tasks = allBosses.map(async (uiBoss) => {
        const api = apiBosses.find((b: BossResponse & { englishName?: string }) => (b.bossNameEn || b.englishName) === uiBoss.id || b.bossName === uiBoss.name);
        if (!api) return;
        try {
          const bossNumericId = (api as unknown as { id?: number; bossId?: number }).id ?? (api as unknown as { id?: number; bossId?: number }).bossId;
          if (bossNumericId == null) return;
          const items = await getBossDesireItems(bossNumericId);
          const normalize = (v?: string) => (v || '').toLowerCase();
          items.forEach((d: { bossDifficultyEn?: string; bossDifficulty?: string; itemNameEn?: string; itemName: string }) => {
            const key = normalize(d.bossDifficultyEn || d.bossDifficulty) || 'all';
            if (!updates[uiBoss.id]) updates[uiBoss.id] = {};
            if (!updates[uiBoss.id][key]) updates[uiBoss.id][key] = [];
            const nm = d.itemNameEn || d.itemName;
            if (nm) updates[uiBoss.id][key].push(nm);
          });
        } catch {
          // ignore
        }
      });
      await Promise.all(tasks);
      if (Object.keys(updates).length > 0) {
        setDesireDropMap((prev) => ({ ...prev, ...updates }));
      }
    };
    fetchDrops();
  }, [isOpen, apiBosses, allBosses]);

  useEffect(() => {
    if (isOpen) {
      loadModalData();
    }
  }, [isOpen, loadModalData]);

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

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    // 프리셋의 보스 EN 이름으로 로컬 보스 ID 매칭
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const toSelect: string[] = (preset.bosses?.length ? preset.bosses.map(b => (b.bossNameEn || b.englishName)) : [])
      .filter((v): v is string => !!v);

    if (toSelect.length > 0) {
      setLocalSelectedBosses(Array.from(new Set([...localSelectedBosses, ...toSelect])));
    }
  };

  if (!isOpen) return null;

  // 주간보스만 표시 (API는 주간이므로 그대로 사용)
  const weeklyBosses = allBosses.filter(boss => boss.resetType === 'weekly');

  const handleBossToggle = (bossId: string) => {
    setLocalSelectedBosses(prev => 
      prev.includes(bossId) 
        ? prev.filter(id => id !== bossId)
        : [...prev, bossId]
    );
  };

  const handleSave = () => {
    onBossesChange(localSelectedBosses);
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
            {presets.map((preset, idx) => (
              <button
                key={`${preset.id}-${preset.presetName}-${idx}`}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedPresetId === preset.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.presetName}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
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
                            const difKey = boss.difficulties[currentIdx].difficulty.toLowerCase();
                            const pool = desireDropMap[boss.id]?.[difKey] || desireDropMap[boss.id]?.all || [];
                            const list = (pool.length > 0 ? pool : currentDifficulty.expectedItems).slice(0, 3);
                            return list.map((name, idx) => (
                            <Image
                              key={idx}
                              src={`/image/drop-item/${name}.png`}
                              alt={name}
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded object-contain bg-white"
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
                          <div>입장요구레벨: {minRequiredLevel}</div>
                          <div className="font-medium text-orange-600">예상 메소: {formatMeso(currentDifficulty.expectedMeso)}</div>
                        </div>
                      </div>

                      {/* Checkbox (original position at right side) */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        localSelectedBosses.includes(boss.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
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
                 <span className="ml-2 text-orange-600 font-medium">
                   예상 총 메소: {formatMeso(
                     allBosses
                       .filter((boss: Boss) => localSelectedBosses.includes(boss.id))
                       .reduce((sum: number, boss: Boss) => sum + (boss.difficulties[0]?.expectedMeso || 0), 0)
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
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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