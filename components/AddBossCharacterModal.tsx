'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Character, CharacterBulkCreateRequest } from '../types';
import nexonApiService from '../services/nexonApiService';
import { TokenManager } from '../services/authService';
import { registerCharacters } from '../services/characterService';

interface AddBossCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBossCharacterIds: string[];
  currentBossCharacters?: Character[]; // 추가: 현재 등록된 캐릭터 전체 정보
  onAddCharacters: (characters: Character[]) => void;
}

export default function AddBossCharacterModal({
  isOpen,
  onClose,
  currentBossCharacterIds,
  currentBossCharacters = [],
  onAddCharacters
}: AddBossCharacterModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

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

  // API에서 캐릭터 목록 조회
  const fetchCharacters = useCallback(async () => {
    const nexonApiKey = TokenManager.getNexonApiKey();
    if (!nexonApiKey) {
      setError('Nexon API 키가 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const characters = await nexonApiService.getCharacterList(nexonApiKey);
      setAllCharacters(characters);
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      setError('캐릭터 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
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

  // 캐릭터 새로고침
  const handleRefresh = async () => {
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      return; // 쿨타임 중이면 실행하지 않음
    }

    try {
      setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  };

  // 모달이 열릴 때 캐릭터 목록 조회
  useEffect(() => {
    if (isOpen && allCharacters.length === 0) {
      fetchCharacters();
    }
  }, [isOpen, allCharacters.length, fetchCharacters]);

  // 추가 가능한 캐릭터 목록 (이미 추가된 캐릭터 제외)
  const availableCharacters = useMemo(() => {
    return allCharacters.filter(character => {
      // 1차 필터링: ID로 확인
      if (currentBossCharacterIds.includes(character.id)) {
        return false;
      }
      
      // 2차 필터링: 이름과 서버로 중복 확인 (추가 안전장치)
      const isDuplicateByNameAndServer = currentBossCharacters.some(existingChar => 
        existingChar.name === character.name && 
        existingChar.server === character.server
      );
      
      return !isDuplicateByNameAndServer;
    });
  }, [allCharacters, currentBossCharacterIds, currentBossCharacters]);

  // 검색 필터링된 캐릭터 목록
  const filteredCharacters = useMemo(() => {
    if (!searchTerm) return availableCharacters;
    return availableCharacters.filter(character =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.job.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCharacters, searchTerm]);

  // 캐릭터 선택/해제
  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacterIds(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      } else {
        return [...prev, characterId];
      }
    });
  };

  // 선택 적용
  const handleApplySelection = async () => {
    if (selectedCharacterIds.length === 0) return;

    setIsRegistering(true);
    try {
      const selectedCharacters = allCharacters.filter(char => 
        selectedCharacterIds.includes(char.id)
      );

      // 사용자 ID 가져오기
      const userId = TokenManager.getUserId();
      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
      }

      // API 요청 데이터 구성
      const request: CharacterBulkCreateRequest = {
        userId: parseInt(userId),
        characters: selectedCharacters.map(char => ({
          characterName: char.name,
          ocid: char.ocid,
          isMain: char.isMainCharacter || false,
          worldName: char.server,
          characterClass: char.job,
          characterLevel: char.level,
          characterImage: char.image,
          arcaneForce: char.arcaneForce || 0,
          authenticForce: char.authenticForce || 0
        }))
      };

      // 캐릭터 일괄 등록 API 호출
      const response = await registerCharacters(request);
      
      console.log('캐릭터 등록 결과:', response);
      
      // 성공한 캐릭터들만 추가
      if (response.data && response.data.successCount > 0) {
        // 등록 응답에서 받은 DB ID를 포함하여 캐릭터 정보 업데이트
        const savedCharacters = response.data.savedCharacters;
        const updatedCharacters = selectedCharacters.map(char => {
          const savedChar = savedCharacters.find(saved => saved.ocid === char.ocid);
          if (savedChar) {
            return {
              ...char,
              dbId: savedChar.id // 데이터베이스 실제 ID 설정
            };
          }
          return char;
        });
        
        // UI에 DB ID가 포함된 캐릭터들을 추가
        onAddCharacters(updatedCharacters);
        
        // 성공 메시지
        if (response.data.failureCount > 0) {
          alert(`${response.data.successCount}개 캐릭터가 성공적으로 등록되었습니다.\n${response.data.failureCount}개 캐릭터는 등록에 실패했습니다.`);
        } else {
          alert(`${response.data.successCount}개 캐릭터가 성공적으로 등록되었습니다.`);
        }
      } else {
        throw new Error('모든 캐릭터 등록에 실패했습니다.');
      }

      setSelectedCharacterIds([]);
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('캐릭터 등록 실패:', error);
      alert(error instanceof Error ? error.message : '캐릭터 등록에 실패했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedCharacterIds([]);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">보돌 캐릭터 추가</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || Boolean(cooldownEndTime && Date.now() < cooldownEndTime)}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 relative"
              title={
                cooldownEndTime && Date.now() < cooldownEndTime 
                  ? `새로고침 쿨타임: ${Math.ceil(remainingTime / 1000)}초 남음`
                  : "캐릭터 목록 새로고침"
              }
            >
              {cooldownEndTime && Date.now() < cooldownEndTime ? (
                <div className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ color: '#FF9100' }}>
                  {Math.ceil(remainingTime / 1000)}
                </div>
              ) : (
                <svg 
                  className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 검색창 */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="닉네임으로 캐릭터를 찾아주세요."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 text-sm"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 캐릭터 목록 */}
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
          {error ? (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
              <button 
                onClick={fetchCharacters}
                className="mt-2 text-sm transition-colors"
                style={{ color: '#FF9100' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E68200'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF9100'}
              >
                다시 시도
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FF9100' }}></div>
              <p className="mt-2 text-gray-500">캐릭터 목록을 불러오는 중...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? (
                <div>
                  <p>&apos;{searchTerm}&apos;에 대한 검색 결과가 없습니다.</p>
                  <p className="text-xs mt-1">등록된 캐릭터는 검색에서 제외됩니다.</p>
                </div>
              ) : allCharacters.length === 0 ? (
                <div>
                  <p>API에서 캐릭터를 불러와주세요.</p>
                  <button 
                    onClick={fetchCharacters}
                    className="mt-2 text-sm transition-colors"
                    style={{ color: '#FF9100' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#E68200'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#FF9100'}
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <div>
                  <p>추가 가능한 캐릭터가 없습니다.</p>
                  <p className="text-xs mt-1">모든 캐릭터가 이미 등록되었습니다.</p>
                </div>
              )}
            </div>
          ) : (
            filteredCharacters.map((character) => {
              const isSelected = selectedCharacterIds.includes(character.id);
              return (
                <div
                  key={character.id}
                  onClick={() => toggleCharacterSelection(character.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                  style={isSelected ? { 
                    borderColor: '#FF9100',
                    backgroundColor: '#FFF3E0'
                  } : {}}
                >
                  {/* 캐릭터 아바타 */}
                  <div className="w-[85px] h-[90px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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

                  {/* 캐릭터 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{character.name}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                        {character.server}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {character.job} Lv.{character.level}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 선택 적용 버튼 */}
        <button
          onClick={handleApplySelection}
          disabled={selectedCharacterIds.length === 0 || isRegistering}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            selectedCharacterIds.length > 0 && !isRegistering
              ? 'text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          style={selectedCharacterIds.length > 0 && !isRegistering ? { 
            backgroundColor: '#FF9100'
          } : {}}
          onMouseEnter={(e) => {
            if (selectedCharacterIds.length > 0 && !isRegistering) {
              e.currentTarget.style.backgroundColor = '#E68200';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCharacterIds.length > 0 && !isRegistering) {
              e.currentTarget.style.backgroundColor = '#FF9100';
            }
          }}
        >
          {isRegistering ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              등록 중...
            </div>
          ) : (
            <>
              선택 적용
              {selectedCharacterIds.length > 0 && ` (${selectedCharacterIds.length})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
} 