"use client";

import { useState } from "react";
import { OptimizedRecommendationResponse, BossSelection } from "../types/boss";
import { Character } from "../types";

interface OptimizationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizedRecommendationResponse | null;
  allBosses: any[];
  bossCharacters: Character[];
  onApplyOptimization: (customizedSelections: Record<string, BossSelection[]>) => void;
}

export default function OptimizationResultModal({
  isOpen,
  onClose,
  result,
  allBosses,
  bossCharacters,
  onApplyOptimization
}: OptimizationResultModalProps) {
  const [customizedSelections, setCustomizedSelections] = useState<Record<string, BossSelection[]>>({});
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!isOpen || !result) return null;

  const formatMeso = (meso: number) => {
    const manMeso = Math.floor(meso / 10000);
    if (manMeso >= 10000) {
      const eok = Math.floor(manMeso / 10000);
      const remainingMan = manMeso % 10000;
      if (remainingMan === 0) {
        return `${eok}억`;
      }
      return `${eok}억 ${remainingMan}만`;
    }
    return `${manMeso}만`;
  };

  // 서버 이름을 영어로 변환하는 함수
  const getServerIconName = (serverName: string) => {
    const serverNameMap: Record<string, string> = {
      '스카니아': 'scania',
      '베라': 'bera',
      '루나': 'luna',
      '제니스': 'zenith',
      '크로아': 'croa',
      '유니온': 'union',
      '엘리시움': 'elysium',
      '이노시스': 'enosis',
      '레드': 'red',
      '오로라': 'aurora',
      '아케인': 'arcane',
      '노바': 'nova',
      '챌린저스': 'challengers',
      '챌린저스2': 'challengers',
      '챌린저스3': 'challengers',
      '챌린저스4': 'challengers',
      '챌린저스5': 'challengers',
      '버닝': 'burning',
      '버닝2': 'burning2',
      '버닝3': 'burning3',
      '버닝4': 'burning4',
      '버닝5': 'burning5',
      '버닝6': 'burning6',
      '버닝7': 'burning7',
      '버닝8': 'burning8',
      '버닝9': 'burning9',
      '버닝10': 'burning10',
      '버닝11': 'burning11',
      '버닝12': 'burning12',
      '버닝13': 'burning13',
      '버닝14': 'burning14',
      '버닝15': 'burning15',
      '버닝16': 'burning16',
      '버닝17': 'burning17',
      '버닝18': 'burning18',
      '버닝19': 'burning19',
      '버닝20': 'burning20',
      '버닝21': 'burning21',
      '버닝22': 'burning22',
      '버닝23': 'burning23',
      '버닝24': 'burning24',
      '버닝25': 'burning25',
      '버닝26': 'burning26',
      '버닝27': 'burning27',
      '버닝28': 'burning28',
      '버닝29': 'burning29',
      '버닝30': 'burning30'
    };
    
    return serverNameMap[serverName] || serverName.toLowerCase().replace(/\s+/g, '');
  };

  const handleApply = () => {
    if (isCustomizing) {
      console.log('커스텀 선택으로 적용:', customizedSelections);
      onApplyOptimization(customizedSelections);
    } else {
      // 기본 적용은 페이지의 매핑 로직을 사용하도록 선택을 전달하지 않음
      console.log('기본 최적화 결과로 적용: 페이지 로직 사용');
      onApplyOptimization();
    }
    onClose();
  };

  const handleCustomize = () => {
    setIsCustomizing(true);
    // 기본 최적화 결과를 커스텀 선택으로 초기화
    const initialCustomizations: Record<string, BossSelection[]> = {};
    result.worlds.forEach(world => {
      world.characters.forEach(characterRec => {
        const characterId = characterRec.characterId.toString();
        const selections: BossSelection[] = characterRec.bosses.map(recommended => {
          // 보스 이름으로 직접 찾기
          const actualBoss = allBosses.find(b => b.name === recommended.bossName);
          const bossId = actualBoss?.id || recommended.bossName;
          
          return {
            bossId: bossId,
            selectedDifficulty: actualBoss?.difficulties?.[0]?.difficulty || 'normal',
            partySize: recommended.partySize || 1,
            isGoldDrop: false,
            desireDropItems: [],
            isCleared: false
          };
        });
        initialCustomizations[characterId] = selections;
      });
    });
    setCustomizedSelections(initialCustomizations);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-1/2 mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">최적 보돌 산출 결과</h2>
              <p className="text-sm text-gray-600 mt-1">
                총 예상 수익: {formatMeso(result.totalCrystalIncome)} 메소 | 총 보스 수: {result.totalBossCount}개
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
          {!isCustomizing ? (
            // 결과 요약 보기
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 최적화 결과 요약</h3>
                                 <p className="text-blue-800">
                   최적의 보돌 조합으로 <strong>{formatMeso(result.totalCrystalIncome)} 메소</strong>의 
                   예상 수익을 얻을 수 있습니다.
                 </p>
               </div>

               {result.worlds.map((world, worldIndex) => (
                 <div key={worldIndex} className="border border-gray-200 rounded-lg p-4">
                   <div className="flex items-center gap-2 mb-3">
                     <img
                       src={`/image/server-icons/${getServerIconName(world.worldName)}.png`}
                       alt={world.worldName}
                       width={24}
                       height={24}
                       className="rounded"
                                                onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = '/image/logo.png';
                         }}
                       />
                       <h3 className="font-semibold text-lg">{world.worldName}</h3>
                     </div>
                     <div className="space-y-4">
                       {world.characters.map((character, charIndex) => {
                         // 캐릭터 정보 찾기
                         const characterInfo = bossCharacters.find(c => c.id === character.characterId.toString());
                      
                      return (
                        <div key={charIndex} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-[85px] h-[90px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={characterInfo?.image || '/image/logo.png'}
                                alt={characterInfo?.name || '캐릭터'}
                                className="w-full h-full"
                                style={{
                                  objectFit: 'none',
                                  objectPosition: '55% 58%',
                                  transform: 'scale(0.8)',
                                  transformOrigin: '55% 58%',
                                  imageRendering: 'crisp-edges'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/image/logo.png';
                                }}
                              />
                            </div>
                            <h4 className="text-lg font-bold">{characterInfo?.name || '캐릭터'}</h4>
                          </div>
                          <div className="space-y-2">
                            {character.bosses.map((boss, bossIndex) => (
                              <div key={bossIndex} className="flex items-center justify-between text-base">
                                <span className="font-medium">{boss.bossName}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600 font-medium">{boss.difficulty}</span>
                                  <span className="text-gray-600 font-medium">{boss.partySize}인</span>
                                  <span className="font-bold" style={{ color: '#FF9100' }}>
                                    {formatMeso(boss.crystalPrice)} 메소
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 커스텀 설정 모드
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">⚙️ 커스텀 설정</h3>
                                 <p className="text-yellow-800">
                   추천 결과를 기반으로 원하는 대로 수정할 수 있습니다.
                 </p>
               </div>

               {result.worlds.map((world, worldIndex) => (
                 <div key={worldIndex} className="border border-gray-200 rounded-lg p-4">
                   <div className="flex items-center gap-2 mb-3">
                     <img
                       src={`/image/server-icons/${getServerIconName(world.worldName)}.png`}
                       alt={world.worldName}
                       width={24}
                       height={24}
                       className="rounded"
                                                onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = '/image/logo.png';
                         }}
                       />
                       <h3 className="font-semibold text-lg">{world.worldName}</h3>
                     </div>
                     <div className="space-y-4">
                       {world.characters.map((character, charIndex) => {
                         const characterId = character.characterId.toString();
                         const characterSelections = customizedSelections[characterId] || [];
                         const characterInfo = bossCharacters.find(c => c.id === characterId);
                      
                      return (
                        <div key={charIndex} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-[85px] h-[90px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={characterInfo?.image || '/image/logo.png'}
                                alt={characterInfo?.name || '캐릭터'}
                                className="w-full h-full"
                                style={{
                                  objectFit: 'none',
                                  objectPosition: '55% 58%',
                                  transform: 'scale(0.8)',
                                  transformOrigin: '55% 58%',
                                  imageRendering: 'crisp-edges'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/image/logo.png';
                                }}
                              />
                            </div>
                            <h4 className="text-lg font-bold">{characterInfo?.name || '캐릭터'}</h4>
                          </div>
                          <div className="space-y-2">
                            {character.bosses.map((boss, bossIndex) => {
                              const selection = characterSelections[bossIndex];
                              
                              // 보스 이름으로 직접 찾기 (boss-status와 동일한 방식)
                              const actualBoss = allBosses.find(b => b.name === boss.bossName);
                              const availableDifficulties = actualBoss?.difficulties || [];
                              
                              // 보스 ID 설정 (커스텀 선택에서 사용할 올바른 ID)
                              const bossId = actualBoss?.id || boss.bossName;
                              
                              return (
                                <div key={bossIndex} className="flex items-center justify-between text-base">
                                  <span className="font-medium">{boss.bossName}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => {
                                          const currentDifficulty = selection?.selectedDifficulty || availableDifficulties[0]?.difficulty || 'normal';
                                          const currentIndex = availableDifficulties.findIndex(d => d.difficulty === currentDifficulty);
                                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableDifficulties.length - 1;
                                          const newDifficulty = availableDifficulties[prevIndex]?.difficulty || 'normal';
                                          
                                          const newSelections = [...characterSelections];
                                          newSelections[bossIndex] = {
                                            ...newSelections[bossIndex],
                                            bossId: bossId,
                                            selectedDifficulty: newDifficulty
                                          };
                                          setCustomizedSelections(prev => ({
                                            ...prev,
                                            [characterId]: newSelections
                                          }));
                                        }}
                                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs hover:bg-gray-300"
                                      >
                                        &lt;
                                      </button>
                                      <div className="flex items-center justify-center w-[60px] h-[18px]">
                                        <img
                                          src={`/image/boss-difficulty/difficulty-${selection?.selectedDifficulty || availableDifficulties[0]?.difficulty || 'normal'}.png`}
                                          alt={selection?.selectedDifficulty || availableDifficulties[0]?.difficulty || 'normal'}
                                          width={60}
                                          height={18}
                                          className="h-4 object-contain"
                                          style={{ 
                                            imageRendering: 'auto',
                                            maxWidth: 'none'
                                          }}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const currentDifficulty = selection?.selectedDifficulty || availableDifficulties[0]?.difficulty || 'normal';
                                          const currentIndex = availableDifficulties.findIndex(d => d.difficulty === currentDifficulty);
                                          const nextIndex = currentIndex < availableDifficulties.length - 1 ? currentIndex + 1 : 0;
                                          const newDifficulty = availableDifficulties[nextIndex]?.difficulty || 'normal';
                                          
                                          const newSelections = [...characterSelections];
                                          newSelections[bossIndex] = {
                                            ...newSelections[bossIndex],
                                            bossId: bossId,
                                            selectedDifficulty: newDifficulty
                                          };
                                          setCustomizedSelections(prev => ({
                                            ...prev,
                                            [characterId]: newSelections
                                          }));
                                        }}
                                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs hover:bg-gray-300"
                                      >
                                        &gt;
                                      </button>
                                    </div>
                                    <input
                                      type="number"
                                      min="1"
                                      max="6"
                                      value={selection?.partySize || 1}
                                      onChange={(e) => {
                                        const newSelections = [...characterSelections];
                                        newSelections[bossIndex] = {
                                          ...newSelections[bossIndex],
                                          bossId: bossId,
                                          partySize: parseInt(e.target.value) || 1
                                        };
                                        setCustomizedSelections(prev => ({
                                          ...prev,
                                          [characterId]: newSelections
                                        }));
                                      }}
                                      className="border border-gray-300 rounded px-2 py-1 text-xs w-16"
                                    />
                                    <span className="text-gray-600">인</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <div className="flex gap-2">
              {!isCustomizing ? (
                <button
                  onClick={handleCustomize}
                  className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  커스텀 설정
                </button>
              ) : (
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  결과 보기
                </button>
              )}
              <button
                onClick={handleApply}
                className="px-6 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#FF9100' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
              >
                {isCustomizing ? '커스텀 적용' : '최적화 적용'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
