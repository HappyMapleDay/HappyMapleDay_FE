"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/authStore";
import { Character } from "../../types";
import { mockAllCharacters } from "../../data/mockCharacters";

export default function SettingsPage() {
  const router = useRouter();
  const { isLoggedIn, mainCharacterName, initializeAuth } = useAuth();
  
  // 본캐 변경 관련 상태
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isMainCharacterChangeMode, setIsMainCharacterChangeMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordChangeMode, setIsPasswordChangeMode] = useState(false);
  
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
      // TODO: 본캐 변경 API 호출
      console.log('본캐 변경 요청:', selectedCharacter.name);
      
      // 성공 시 상태 초기화
      setSelectedCharacter(null);
      setIsMainCharacterChangeMode(false);
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
      setIsPasswordChangeMode(false);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-orange-500 transition-colors"
            >
              ← 뒤로가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          </div>
          <p className="text-gray-600">
            현재 본캐: <span className="font-semibold text-orange-600">{mainCharacterName}</span>
          </p>
        </div>

        {/* 본캐 변경 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">본캐 변경</h2>
          
          {!isMainCharacterChangeMode ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                새로운 본캐를 선택하여 변경할 수 있습니다.
              </p>
              <button
                onClick={() => setIsMainCharacterChangeMode(true)}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                본캐 변경하기
              </button>
            </div>
          ) : (
            <div>
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

              {/* 버튼 그룹 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsMainCharacterChangeMode(false);
                    setSelectedCharacter(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleMainCharacterChange}
                  disabled={!selectedCharacter}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                    selectedCharacter
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  본캐 선택 완료
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 비밀번호 변경 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h2>
          
          {!isPasswordChangeMode ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                새로운 비밀번호로 변경할 수 있습니다.
              </p>
              <button
                onClick={() => setIsPasswordChangeMode(true)}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                비밀번호 변경하기
              </button>
            </div>
          ) : (
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
                  placeholder="현재 비밀번호를 입력하세요"
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
                  placeholder="새 비밀번호를 입력하세요"
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
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsPasswordChangeMode(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                    currentPassword && newPassword && confirmPassword
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  비밀번호 변경
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 