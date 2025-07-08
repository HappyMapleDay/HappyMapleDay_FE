"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../store/authStore";

export default function Home() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isLoggedIn, initializeAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 페이지 로드 시 인증 상태 초기화
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 이미 로그인된 상태라면 보돌 현황 페이지로 리다이렉션
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/boss-status");
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // 유효성 검사
    if (!username.trim() || !password.trim()) {
      return;
    }
    
    // 로그인 시도
    const success = await login({
      mainCharacterName: username.trim(),
      password: password
    });
    
    if (success) {
      router.push("/boss-status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white min-h-screen flex items-center justify-center w-full max-w-3xl">
        <div className="p-12 w-full max-w-md">
        {/* 상단 텍스트 */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm mb-4">보스돌이 추천 및 수익 계산기</p>
          
          {/* 로고 및 브랜드명 */}
          <div className="flex items-center justify-center gap-2 mb-8">
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

        {/* 로그인 폼 */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 아이디 입력 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-orange-500 mb-2">
              아이디
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="본캐 닉네임을 입력해주세요. (예: 뱌꺄)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-orange-500 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-500 text-sm text-center whitespace-pre-line -mt-4">
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-[#FF9100] focus:ring-offset-2 ${
              isLoading || !username.trim() || !password.trim()
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-[#FF9100] hover:bg-[#E8820E] text-white"
            }`}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <a href="/register" className="hover:text-orange-500 transition-colors">
              회원가입
            </a>
            <span>|</span>
            <a href="/forgot-password" className="hover:text-orange-500 transition-colors">
              비밀번호 찾기
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
