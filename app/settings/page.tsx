"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../store/authStore";
import { changePassword } from "../../services/authService";
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
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
      // const requestData = {
      //   newMainCharacterName: selectedCharacter.name,
      //   nexonApiKey: "test_api_key_9x7k2m4n8p1q5w"
      // };
      
      // TODO: 백엔드 API 호출 구현 필요
      
      // 성공 시 상태 초기화
      setSelectedCharacter(null);
      setCurrentView('main');
      alert(`본캐가 "${selectedCharacter.name}"으로 변경되었습니다.`);
      
    } catch (error) {
      console.error('본캐 변경 실패:', error);
      alert('본캐 변경에 실패했습니다.');
    }
  };

  // 비밀번호 검증 함수 (회원가입과 동일)
  const validatePassword = (pwd: string, confirmPwd: string) => {
    setPasswordError("");
    
    // 비밀번호 규칙 검증: 10자 이상
    if (pwd.length < 10) {
      setPasswordError("유효하지 않은 비밀번호입니다. 다시 입력해주세요.");
      return false;
    }
    
    // 비밀번호 일치 확인
    if (pwd !== confirmPwd) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    
    return true;
  };

  // 비밀번호 변경 처리
  const handlePasswordChange = async () => {
    if (!validatePassword(newPassword, confirmPassword)) {
      return;
    }
    
    try {
      const response = await changePassword({
        mainCharacterName: mainCharacterName || '',
        newPassword: newPassword
      });
      
      if (response.status === 'success') {
        // 성공 시 상태 초기화
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setCurrentView('main');
        alert(response.data.message);
      } else {
        alert('비밀번호 변경에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
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
              <span className="text-xl font-bold" style={{ color: '#FF9100' }}>메요일조아</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-8">
            <Link 
              href="/boss-status" 
              className="text-gray-500 transition-colors"
              style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              보돌 현황
            </Link>
            <Link 
              href="/boss-history" 
              className="text-gray-500 transition-colors"
              style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              보돌 히스토리
            </Link>
            <Link 
              href="/desire-history" 
              className="text-gray-500 transition-colors"
              style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
              }}
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
            <Link href="/settings" className="font-medium" style={{ color: '#FF9100' }}>
              설정
            </Link>
            <button 
              onClick={logout}
              className="text-gray-600 transition-colors"
              style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#4B5563';
              }}
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
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6" style={{ minHeight: 'calc(100vh - 19rem)' }}>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setCurrentView('main')}
                  className="text-gray-600 transition-colors py-2"
                  style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF9100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#4B5563';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold" style={{ color: '#FF9100' }}>본캐 변경</h1>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              선택한 본캐는 보스돌이 캐릭터(통칭, 보돌캐)로 취급됩니다.<br />
              닉네임이 로그인 시 필요한 ID로 활용되며, 언제든지 변경 가능합니다.
            </p>
            
            {/* 캐릭터 검색 */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="닉네임으로 검색해주세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--focus-ring-color': '#FF9100' } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF9100';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 145, 0, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5" style={{ color: '#FF9100' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 캐릭터 목록 */}
            <div className="space-y-3 mb-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 27rem)' }}>
              {filteredCharacters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => setSelectedCharacter(character)}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCharacter?.id === character.id
                      ? ''
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={selectedCharacter?.id === character.id ? { borderColor: '#FF9100', backgroundColor: '#FFF3E0' } : {}}
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
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedCharacter
                  ? 'text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={selectedCharacter ? { backgroundColor: '#FF9100' } : {}}
            >
              본캐 선택 완료
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white min-h-screen flex items-center justify-center w-full max-w-3xl">
          <div className="p-12 w-full max-w-md">
            {/* 로고 및 브랜드명 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-8 relative">
                {/* 뒤로가기 버튼 */}
                <button
                  onClick={() => setCurrentView('main')}
                  className="absolute left-0 text-gray-600 transition-colors py-2"
                  style={{ '--hover-color': '#FF9100' } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF9100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#4B5563';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <Image
                  src="/image/logo.png"
                  alt="메요일조아 로고"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold">메요일조아</h1>
              </div>
            </div>

            {/* 비밀번호 변경 폼 */}
            <div className="space-y-6">
              {/* 비밀번호 제목 */}
              <div>
                <h2 className="text-lg font-medium mb-2" style={{ color: '#FF9100' }}>
                  비밀번호
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  비밀번호는 10자 이상으로 만들어주세요.
                </p>
              </div>

              {/* 비밀번호 입력 필드들 */}
              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (confirmPassword && passwordError) {
                        validatePassword(e.target.value, confirmPassword);
                      }
                    }}
                    placeholder="새로운 비밀번호를 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-colors"
                    style={{ '--focus-ring-color': '#FF9100', '--focus-border-color': '#FF9100' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF9100';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 145, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {passwordError && passwordError !== "비밀번호가 일치하지 않습니다." && (
                    <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (newPassword && e.target.value) {
                        validatePassword(newPassword, e.target.value);
                      }
                    }}
                    placeholder="확인을 위해 비밀번호를 다시 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-colors"
                    style={{ '--focus-ring-color': '#FF9100', '--focus-border-color': '#FF9100' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF9100';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 145, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {passwordError && passwordError === "비밀번호가 일치하지 않습니다." && (
                    <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                  )}
                </div>
              </div>

              {/* 비밀번호 변경 완료 버튼 */}
              <button
                onClick={handlePasswordChange}
                disabled={!newPassword || !confirmPassword || !!passwordError}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                  newPassword && confirmPassword && !passwordError
                    ? 'text-white hover:opacity-90'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                style={newPassword && confirmPassword && !passwordError ? { backgroundColor: '#FF9100' } : {}}
              >
                비밀번호 변경 완료
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 