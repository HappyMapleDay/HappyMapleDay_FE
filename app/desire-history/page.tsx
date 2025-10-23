"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/authStore";
import { DesireHistoryService } from '../../services/desireHistoryService';
import { Character, DesireItem, DesireHistoryRequest } from '../../types/desireHistory';

export default function DesireHistoryPage() {
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

  // 상태 관리
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("이름순");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [desireItems, setDesireItems] = useState<DesireItem[]>([]);

  // 정렬 옵션
  const sortOptions = ["이름순", "가격순"];

  // 데이터 로딩 함수
  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const [charactersData, itemsData] = await Promise.all([
        DesireHistoryService.getCharacterList(),
        DesireHistoryService.getDesireItems({
          characterId: selectedCharacter || undefined,
          searchTerm: searchTerm || undefined,
          sortBy: sortBy
        })
      ]);

      setCharacters(charactersData);
      setDesireItems(itemsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      // 에러 시 임시 데이터 사용
      setCharacters([
        {
          id: "1",
          name: "바꺄",
          server: "크로아",
          class: "패스파인더",
          level: 282,
          image: "/image/character1.png"
        },
        {
          id: "2", 
          name: "바카",
          server: "크로아",
          class: "비숍",
          level: 280,
          image: "/image/character2.png"
        }
      ]);
      setDesireItems([
        {
          id: "1",
          name: "창세의 뱃지",
          price: "400억",
          image: "/image/drop-item/genesis-badge.png",
          obtainedDate: "2025.06.15"
        },
        {
          id: "2",
          name: "창세의 뱃지",
          price: "400억", 
          image: "/image/drop-item/genesis-badge.png",
          obtainedDate: "2025.06.10"
        },
        {
          id: "3",
          name: "창세의 뱃지",
          price: "400억",
          image: "/image/drop-item/genesis-badge.png", 
          obtainedDate: "2025.06.05"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, selectedCharacter, searchTerm, sortBy]);

  // 초기 데이터 로딩
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, loadData]);

  // 검색 및 정렬된 아이템 목록
  const filteredItems = desireItems
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "이름순") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "가격순") {
        return b.price.localeCompare(a.price);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link href="/boss-status" className="flex items-center space-x-2">
              <Image
                src="/image/logo.png"
                alt="메요일조아"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg lg:text-xl font-bold" style={{ color: '#FF9100' }}>메요일조아</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                href="/boss-status" 
                className="text-gray-500 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
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
                className="font-medium border-b-2 pb-1"
                style={{ color: '#FF9100', borderColor: '#FF9100' }}
              >
                물욕템 히스토리
              </Link>
            </nav>

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
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 왼쪽 사이드바 - 캐릭터 목록 */}
          <div className="w-80 bg-gray-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">캐릭터 목록</h2>
            
            <div className="space-y-3">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCharacter === character.id
                      ? 'bg-white border-2 border-orange-500'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCharacter(character.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Image
                        src={character.image}
                        alt={character.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{character.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {character.server}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {character.class} | Lv.{character.level}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽 메인 컨텐츠 - 물욕템 목록 */}
          <div className="flex-1 bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">물욕템 목록</h2>
            
            {/* 검색 및 정렬 바 */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">정렬기준</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="검색어를 입력해주세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 물욕템 카드 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  데이터를 불러오는 중...
                </div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-12 h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-lg font-bold text-orange-600">{item.price}</p>
                        <p className="text-sm text-gray-500">획득일: {item.obtainedDate}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '물욕템이 없습니다.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
