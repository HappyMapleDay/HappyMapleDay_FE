'use client';

import { useState, useMemo } from 'react';
import { getAvailableCharacters } from '../data/mockCharacters';
import Image from 'next/image';

interface AddBossCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBossCharacterIds: string[];
  onAddCharacters: (characterIds: string[]) => void;
}

export default function AddBossCharacterModal({
  isOpen,
  onClose,
  currentBossCharacterIds,
  onAddCharacters
}: AddBossCharacterModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

  // 추가 가능한 캐릭터 목록
  const availableCharacters = useMemo(() => {
    return getAvailableCharacters(currentBossCharacterIds);
  }, [currentBossCharacterIds]);

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
  const handleApplySelection = () => {
    onAddCharacters(selectedCharacterIds);
    setSelectedCharacterIds([]);
    setSearchTerm('');
    onClose();
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
          <h2 className="text-lg font-semibold">보돌 캐릭터 추가</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          {filteredCharacters.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? '검색 결과가 없습니다.' : '추가 가능한 캐릭터가 없습니다.'}
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
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* 캐릭터 아바타 */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={character.image}
                      alt={character.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
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
          disabled={selectedCharacterIds.length === 0}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            selectedCharacterIds.length > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          선택 적용
          {selectedCharacterIds.length > 0 && ` (${selectedCharacterIds.length})`}
        </button>
      </div>
    </div>
  );
} 