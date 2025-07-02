"use client";

import { useState, useEffect } from "react";
import { Boss, Character } from "../types";
import { bossService } from "../services/bossService";

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

  useEffect(() => {
    if (isOpen) {
      loadBosses();
    }
  }, [isOpen]);

  const loadBosses = async () => {
    setIsLoading(true);
    try {
      const bosses = await bossService.getRecommendedBosses(character.level);
      setAllBosses(bosses);
    } catch (error) {
      console.error('보스 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // 주간보스만 표시
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

  const getDifficultyColor = (difficulty: 'normal' | 'hard' | 'chaos' | 'extreme') => {
    switch (difficulty) {
      case 'normal': return 'bg-green-100 text-green-700';
      case 'hard': return 'bg-yellow-100 text-yellow-700';
      case 'chaos': return 'bg-red-100 text-red-700';
      case 'extreme': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatMeso = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}억`;
    } else if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(0)}천만`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)}백만`;
    }
    return amount.toLocaleString();
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
                // 첫 번째 난이도를 기본으로 표시
                const firstDifficulty = boss.difficulties[0];
                const minRequiredLevel = Math.min(...boss.difficulties.map(d => d.requiredLevel));
                
                return (
                  <div
                    key={boss.id}
                    onClick={() => handleBossToggle(boss.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      localSelectedBosses.includes(boss.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{boss.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(firstDifficulty.difficulty)}`}>
                            {firstDifficulty.difficulty}
                          </span>
                          {boss.difficulties.length > 1 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{boss.difficulties.length - 1}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>필요 레벨: {minRequiredLevel}</div>
                          <div className="font-medium text-orange-600">
                            예상 메소: {formatMeso(firstDifficulty.expectedMeso)}
                          </div>
                          <div className="text-xs">
                            주요 드랍: {firstDifficulty.expectedItems.slice(0, 2).join(', ')}
                            {firstDifficulty.expectedItems.length > 2 && ' 외'}
                          </div>
                        </div>
                      </div>

                    {/* Checkbox */}
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