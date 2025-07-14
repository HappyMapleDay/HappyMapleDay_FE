"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../store/authStore";
import { Character } from "../../types";
import { mockAllCharacters } from "../../data/mockCharacters";

export default function SettingsPage() {
  const router = useRouter();
  const { isLoggedIn, mainCharacterName, initializeAuth, logout } = useAuth();
  
  // 화면 상태 관리
  const [currentView, setCurrentView] = useState<'main' | 'character' | 'password'>('main');
  
  // 본캐 변경 관련 상태
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 인증 상태 확인 및 리다이렉션
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  // 캐릭터 검색 필터링
  const filteredCharacters = mockAllCharacters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 본캐 변경 완료 처리
  const handleMainCharacterChange = async () => {
    if (!selectedCharacter) return;
    
    try {
      // 본캐 변경 API 호출 (테스트용 API키 사용)
      const requestData = {
        newMainCharacterName: selectedCharacter.name,
        nexonApiKey: "test_api_key_9x7k2m4n8p1q5w"
      };
      
      console.log('본캐 변경 요청:', requestData);
      
      // 성공 시 상태 초기화
      setSelectedCharacter(null);
      setCurrentView('main');
      alert(`본캐가 "${selectedCharacter.name}"으로 변경되었습니다.`);
      
    } catch (error) {
      console.error('본캐 변경 실패:', error);
      alert('본캐 변경에 실패했습니다.');
    }
  };

  // 비밀번호 변경 처리
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      // TODO: 비밀번호 변경 API 호출
      console.log('비밀번호 변경 요청');
      
      // 성공 시 상태 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentView('main');
      alert('비밀번호가 성공적으로 변경되었습니다.');
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  // 공통 헤더 컴포넌트
  const renderHeader = () => (
          <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
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
              className="text-gray-500 hover:text-orange-500 transition-colors"
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
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {mainCharacterName || '사용자'}님
            </span>
            <Link href="/settings" className="text-orange-500 font-medium">
              설정
            </Link>
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
  );

  // 현재 뷰에 따라 렌더링
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {/* 선택 카드들 */}
              <div className="grid grid-cols-1 gap-10 max-w-lg mx-auto">
                {/* 본캐 변경 카드 */}
                <div 
                  onClick={() => setCurrentView('character')}
                  className="text-white p-20 rounded-2xl cursor-pointer transition-colors shadow-lg"
                  style={{ backgroundColor: '#FF9100' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#E8810A'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#FF9100'}
                >
                  <div className="text-center">
                    <div className="mb-6">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="mx-auto">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
                        <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="white"/>
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold">본캐 변경</h2>
                  </div>
                </div>

                {/* 비밀번호 변경 카드 */}
                <div 
                  onClick={() => setCurrentView('password')}
                  className="text-white p-20 rounded-2xl cursor-pointer transition-colors shadow-lg"
                  style={{ backgroundColor: '#FF9100' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#E8810A'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#FF9100'}
                >
                  <div className="text-center">
                    <div className="mb-6">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="mx-auto">
                        <path d="M7 10V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V10H18C18.5523 10 19 10.4477 19 11V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V11C5 10.4477 5.44772 10 6 10H7ZM9 10H15V7C15 5.89543 14.1046 5 13 5H11C9.89543 5 9 5.89543 9 7V10Z" fill="white"/>
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold">비밀번호 변경</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (currentView === 'character') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setCurrentView('main')}
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  ← 뒤로가기
                </button>
                <h1 className="text-2xl font-bold text-gray-900">본캐 변경</h1>
              </div>
              <p className="text-gray-600">
                현재 본캐: <span className="font-semibold text-orange-600">{mainCharacterName}</span>
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              현재 본캐를 혼재한 캐릭터리스트 중 바뀔캐릭터를 선택하고 변경할 수 있습니다.<br />
              변경양은 로그인 시 관리자의 id로 활용되며, 언제든지 변경 가능합니다.
            </p>
            
            {/* 캐릭터 검색 */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="닉네임으로 검색해 주세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500">
                  🔍
                </button>
              </div>
            </div>

            {/* 캐릭터 리스트 */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {filteredCharacters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => setSelectedCharacter(character)}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCharacter?.id === character.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{character.job === 'warrior' ? '⚔️' : character.job === 'mage' ? '🔮' : character.job === 'archer' ? '🏹' : character.job === 'thief' ? '🗡️' : '🏴‍☠️'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{character.name}</span>
                      <span className="text-sm text-gray-500">@크로아</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {character.job === 'warrior' ? '패스파인더' : character.job === 'mage' ? '비숍' : character.job === 'archer' ? '패스파인더' : character.job === 'thief' ? '비숍' : '패스파인더'} Lv.{character.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 본캐 선택 완료 버튼 */}
            <button
              onClick={handleMainCharacterChange}
              disabled={!selectedCharacter}
              className={`w-full px-4 py-3 rounded-lg transition-colors ${
                selectedCharacter
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              본캐 선택 완료
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setCurrentView('main')}
                  className="text-gray-600 hover:text-orange-500 transition-colors"
                >
                  ← 뒤로가기
                </button>
                <h1 className="text-2xl font-bold text-gray-900">비밀번호 변경</h1>
              </div>
              <p className="text-gray-600 text-sm">
                비밀번호는 10자 이상으로 입력해주세요.
              </p>
            </div>

            {/* 비밀번호 변경 폼 */}
            <div className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="현재 비밀번호를 입력해주세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="새로운 비밀번호를 입력해주세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="확인을 위해 비밀번호를 다시 입력해주세요"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${
                    currentPassword && newPassword && confirmPassword
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  비밀번호 변경 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 