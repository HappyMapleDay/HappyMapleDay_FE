"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Character } from "../../types";
import { BossSelection } from "../../types/boss";
import BossSelectionModal from "../../components/BossSelectionModal";
import AddBossCharacterModal from "../../components/AddBossCharacterModal";
import { mockBosses } from "../../data/mockBosses";
import { getCurrentBossCharacters, mockAllCharacters } from "../../data/mockCharacters";
import { useAuth } from "../../store/authStore";

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

  // 현재 보돌캐로 선택된 캐릭터들
  const [bossCharacters, setBossCharacters] = useState<Character[]>(getCurrentBossCharacters());
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>("1");
  const [dateRange] = useState({
    startDate: "2025.06.05",
    endDate: "2025.06.11"
  });
  const [isBossModalOpen, setIsBossModalOpen] = useState(false);
  const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
  const [characterBossSelections, setCharacterBossSelections] = useState<Record<string, BossSelection[]>>({});

  const selectedCharacter = bossCharacters.find((char: Character) => char.id === selectedCharacterId);
  const selectedBossSelections = selectedCharacterId ? characterBossSelections[selectedCharacterId] || [] : [];

  const handleBossesChange = (bossIds: string[]) => {
    if (selectedCharacterId) {
      // 기존 선택 유지하면서 새로운 보스는 기본 설정으로 추가
      const existingSelections = characterBossSelections[selectedCharacterId] || [];
      const newSelections: BossSelection[] = bossIds.map(bossId => {
        const existing = existingSelections.find(sel => sel.bossId === bossId);
        if (existing) return existing;
        
        // 새로운 보스의 경우 기본 설정으로 추가
        const boss = mockBosses.find(b => b.id === bossId);
        const firstDifficulty = boss?.difficulties[0];
        
        return {
          bossId,
          selectedDifficulty: firstDifficulty?.difficulty || 'normal',
          partySize: 1,
          isGoldDrop: false
        };
      });

      setCharacterBossSelections(prev => ({
        ...prev,
        [selectedCharacterId]: newSelections
      }));
    }
  };

  // 난이도 변경 함수
  const handleDifficultyChange = (bossId: string, direction: 'prev' | 'next') => {
    if (!selectedCharacterId) return;

    const boss = mockBosses.find(b => b.id === bossId);
    if (!boss) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const currentSelection = currentSelections.find(sel => sel.bossId === bossId);
    if (!currentSelection) return;

    const currentIndex = boss.difficulties.findIndex(d => d.difficulty === currentSelection.selectedDifficulty);
    let newIndex: number;

    if (direction === 'next') {
      newIndex = currentIndex < boss.difficulties.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : boss.difficulties.length - 1;
    }

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

  // 물욕템 체크 토글 함수
  const handleDesireDropToggle = (bossId: string) => {
    if (!selectedCharacterId) return;

    const currentSelections = characterBossSelections[selectedCharacterId] || [];
    const currentSelection = currentSelections.find(sel => sel.bossId === bossId);
    if (!currentSelection) return;

    setCharacterBossSelections(prev => ({
      ...prev,
      [selectedCharacterId]: currentSelections.map(sel =>
        sel.bossId === bossId 
          ? { ...sel, isGoldDrop: !sel.isGoldDrop }
          : sel
      )
    }));
  };

  // 캐릭터 추가 함수
  const handleAddCharacters = (characterIds: string[]) => {
    const charactersToAdd = mockAllCharacters.filter(char => characterIds.includes(char.id));
    setBossCharacters(prev => [...prev, ...charactersToAdd]);
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



  // 전체 총합 계산 (모든 캐릭터)
  const allTotalBossCount = Object.values(characterBossSelections).reduce((sum, selections) => sum + selections.length, 0);
  const allTotalExpectedMeso = Object.values(characterBossSelections).reduce((sum, selections) => {
    const characterTotal = selections.reduce((charSum, selection) => {
      const boss = mockBosses.find(b => b.id === selection.bossId);
      const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
      const mesoPerPlayer = difficultyInfo?.expectedMeso || 0;
      return charSum + (mesoPerPlayer / selection.partySize);
    }, 0);
    return sum + characterTotal;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/image/logo.png"
                alt="메요일조아 로고"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-orange-500">메요일조아</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-8">
              <Link 
                href="/boss-status" 
                className="text-orange-500 font-medium border-b-2 border-orange-500 pb-1"
              >
                보돌 현황
              </Link>
              <Link 
                href="/boss-history" 
                className="text-gray-500 hover:text-orange-500 transition-colors"
              >
                보돌 히스토리
              </Link>
              <Link 
                href="/item-history" 
                className="text-gray-500 hover:text-orange-500 transition-colors"
              >
                물욕템 히스토리
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {mainCharacterName || '사용자'}님
              </span>
              <button className="text-gray-600 hover:text-orange-500 transition-colors">
                설정
              </button>
              <button 
                onClick={logout}
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Section - 기간, 캐릭터 선택 등 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                전체
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                크로아
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                챌린저스1
              </span>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
            <button className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {dateRange.startDate} ~ {dateRange.endDate}
            </span>
            <button className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Character List */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">캐릭터 목록</h3>
                <button 
                  onClick={() => setIsAddCharacterModalOpen(true)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 h-[calc(100vh-350px)] overflow-y-auto overflow-x-visible pr-2">
                {bossCharacters.map((character: Character) => (
                  <div
                    key={character.id}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCharacterId === character.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${character.isMainCharacter ? 'border-l-4 border-l-orange-500' : ''}`}
                  >
                    {/* 캐릭터 삭제 X 버튼 (본캐가 아닌 경우에만 표시) */}
                    {!character.isMainCharacter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 캐릭터 선택 이벤트 방지
                          handleRemoveCharacter(character.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-gray-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors z-10 border-2 border-white shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div 
                      onClick={() => setSelectedCharacterId(character.id)}
                      className="flex items-center gap-3"
                    >
                      <Image
                        src={character.image}
                        alt={character.name}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate flex-shrink">{character.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">{character.server}</span>
                          {character.isMainCharacter && (
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium flex-shrink-0">
                              본캐
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {character.job} Lv.{character.level}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Boss List */}
          <div className="col-span-6">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">보스 목록</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>전체 보스 개수</span>
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                    {selectedBossSelections.length}
                  </span>
                </div>
              </div>

              {/* 탭 메뉴 */}
              <div className="flex items-center gap-2 mb-6">
                <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  스데미
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  이루윌
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  노듄더
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  하스데
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  검밑솔
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                  하세이칼
                </button>
              </div>

              <div className="h-[calc(100vh-400px)] overflow-y-auto">
                {selectedCharacterId ? (
                  selectedBossSelections.length > 0 ? (
                    <div className="space-y-3">
                    {selectedBossSelections.map((selection) => {
                      const boss = mockBosses.find(b => b.id === selection.bossId);
                      const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
                      
                      if (!boss || !difficultyInfo) return null;
                      
                      return (
                        <div key={selection.bossId} className="bg-white border border-gray-200 rounded-2xl p-3 relative">
                          <div className="flex items-center gap-4">
                            {/* 보스 이미지 */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={boss.image || '/image/logo.png'}
                                alt={boss.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* 보스 정보 섹션 */}
                            <div className="flex-1">
                              {/* 보스 이름 */}
                              <h4 className="text-xl font-bold text-gray-900 mb-2">{boss.name}</h4>
                              
                                                            {/* 난이도 컨트롤 + 가격/결정석 */}
                              <div className="flex items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-orange-500">난이도</span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleDifficultyChange(selection.bossId, 'prev')}
                                      className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs hover:bg-gray-300"
                                    >
                                      &lt;
                                    </button>
                                    <div className="flex items-center justify-center w-[90px] h-[24px]">
                                      <img
                                        src={`/image/boss-difficulty/difficulty-${selection.selectedDifficulty}.png`}
                                        alt={selection.selectedDifficulty}
                                        className="h-6 object-contain"
                                        style={{ 
                                          imageRendering: 'auto',
                                          maxWidth: 'none'
                                        }}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleDifficultyChange(selection.bossId, 'next')}
                                      className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs hover:bg-gray-300"
                                    >
                                      &gt;
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 ml-auto mr-2">
                                                                      <span className="text-base font-medium text-orange-500">가격</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm text-gray-600">결정석</span>
                                      <span className="text-sm font-bold text-gray-900 w-[120px] text-right">{formatMeso(difficultyInfo.expectedMeso / selection.partySize)}</span>
                                    </div>
                                </div>
                              </div>

                              {/* 파티원 컨트롤 + 물욕템 */}
                              <div className="flex items-center">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-orange-500">파티원</span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handlePartySizeChange(selection.bossId, 'prev')}
                                      disabled={selection.partySize <= 1}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                        selection.partySize <= 1 
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'bg-orange-500 text-white hover:bg-orange-600'
                                      }`}
                                    >
                                      &lt;
                                    </button>
                                    <div className="flex items-center justify-center w-[90px] h-[24px] bg-white border border-gray-300 rounded-full">
                                      <span className="text-sm font-medium text-center">
                                        {selection.partySize}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => handlePartySizeChange(selection.bossId, 'next')}
                                      disabled={selection.partySize >= 6}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                                        selection.partySize >= 6 
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                          : 'bg-orange-500 text-white hover:bg-orange-600'
                                      }`}
                                    >
                                      &gt;
                                    </button>
                                  </div>
                                </div>
                                                                                                  <div className="flex items-center gap-1 ml-auto mr-2">
                                  <span className="text-sm text-gray-600">물욕템</span>
                                  <span className="text-sm font-bold text-gray-900 w-[120px] text-right">{formatMeso(difficultyInfo.expectedMeso / selection.partySize * 1.2)}</span>
                                </div>
                              </div>
                            </div>



                          {/* 물욕템 체크 버튼 */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDesireDropToggle(selection.bossId);
                            }}
                            // 나중에 API 연동 시: disabled={!boss.hasDesireDrop}
                            className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                              selection.isGoldDrop 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            }`}
                          >
                            물욕템 체크
                          </button>
                        </div>
                      </div>
                      );
                    })}
                    
                    <button 
                      onClick={() => setIsBossModalOpen(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
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
                      onClick={() => setIsBossModalOpen(true)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-orange-500 mb-4">총계</h3>
              
              {/* 총계 하단 버튼 - 최상부 고정 */}
              <button className="w-full py-2 mb-4 border border-orange-500 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors">
                총 {allTotalBossCount}마리 {formatMeso(allTotalExpectedMeso)}
              </button>
              
              <div className="space-y-4 h-[calc(100vh-400px)] overflow-y-auto">
                {/* 캐릭터별 박스 */}
                {bossCharacters.map((character) => {
                  const characterSelections = characterBossSelections[character.id] || [];
                  const characterMeso = characterSelections.reduce((sum, selection) => {
                    const boss = mockBosses.find(b => b.id === selection.bossId);
                    const difficultyInfo = boss?.difficulties.find(d => d.difficulty === selection.selectedDifficulty);
                    const mesoPerPlayer = difficultyInfo?.expectedMeso || 0;
                    return sum + (mesoPerPlayer / selection.partySize);
                  }, 0);

                  return (
                    <div key={character.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                      {/* 캐릭터 정보 */}
                      <div className="flex items-center gap-3">
                        <Image
                          src={character.image}
                          alt={character.name}
                          width={32}
                          height={32}
                          className="rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{character.name}</div>
                          <div className="text-sm text-gray-600">
                            {character.job} Lv.{character.level}
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
                          <span className="font-medium">-</span>
                        </div>
                      </div>

                      {/* 큰 숫자 표시 */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-base font-bold text-orange-500">
                          <span>{characterSelections.length}마리</span>
                          <span className="text-gray-300">|</span>
                          <span>{formatMeso(characterMeso)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button className="px-6 py-3 bg-white border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-medium">
            추천 최적 보돌 산출
          </button>


          <div className="flex gap-2">
          <div className="text-right mr-6">
            <p className="text-sm text-gray-500 mb-2">
            이번 주 보돌 완료 시 이번 주에 대해 
            </p>
            <p className="text-sm text-gray-500">
            추천 최적 보돌 산출 기능을 사용할 수 없습니다.
            </p>
          </div>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
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
           onBossesChange={handleBossesChange}
         />
       )}

       {/* Add Boss Character Modal */}
       <AddBossCharacterModal
         isOpen={isAddCharacterModalOpen}
         onClose={() => setIsAddCharacterModalOpen(false)}
         currentBossCharacterIds={bossCharacters.map(char => char.id)}
         onAddCharacters={handleAddCharacters}
       />
     </div>
   );
 } 