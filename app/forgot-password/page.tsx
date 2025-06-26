"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // API 검증 로직 (임시)
    setTimeout(() => {
      setIsLoading(false);
      
      // 간단한 유효성 검사
      if (!username.trim() || !apiKey.trim()) {
        setError("입력한 아이디 혹은 API key가 유효하지 않습니다. \n 확인 후 다시 입력해주세요.");
        return;
      }
      
      // 임시 검증 (실제로는 Nexon API 호출)
      // 테스트 케이스 추가
      if (username === "테스트" && apiKey === "1234") {
        // 테스트 케이스는 통과
      } else if (apiKey.length < 50) {
        setError("입력한 아이디 혹은 API key가 유효하지 않습니다. \n 확인 후 다시 입력해주세요.");
        return;
      }
      
      // 검증 성공 시 비밀번호 재설정 단계로 이동
      setStep('reset');
    }, 2000);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // 비밀번호 검증
    setTimeout(() => {
      setIsLoading(false);
      
      // 비밀번호 규칙 검증 (10자리 이상)
      if (newPassword.length < 10) {
        setError("비밀번호는 10자리이상으로 만들어 주세요.");
        return;
      }
      
      // 비밀번호 일치 확인
      if (newPassword !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
        return;
      }
      
      // 성공 - 로그인 페이지로 리다이렉션
      alert("비밀번호가 성공적으로 변경되었습니다!");
      router.push("/");
    }, 2000);
  };

  const isFormValid = step === 'verify' 
    ? username.trim() && apiKey.trim()
    : newPassword.trim() && confirmPassword.trim();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white min-h-screen flex items-center justify-center w-full max-w-3xl">
        <div className="p-12 w-full max-w-md">
          {/* 로고 및 브랜드명 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
                <Image
                  src="/image/logo.png"
                  alt="메요일조아 로고"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold">메요일조아</h1>
              </div>
            </Link>
          </div>

          {/* 폼 */}
          {step === 'verify' ? (
            /* 검증 단계 */
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

              {/* API Key 입력 */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-orange-500 mb-2">
                  메이플스토리 API key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  name="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API 키를 입력해주세요."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="text-red-500 text-sm text-center whitespace-pre-line -mt-2">
                  {error}
                </div>
              )}

              {/* 비밀번호 찾기 버튼 */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                  isFormValid && !isLoading
                    ? "bg-[#FF9100] hover:bg-[#E8820E] text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {isLoading ? "처리 중..." : "비밀번호 찾기"}
              </button>
            </form>
          ) : (
            /* 비밀번호 재설정 단계 */
            <div className="space-y-6">
              {/* 비밀번호 제목 및 설명 */}
              <div>
                <h2 className="text-lg font-medium text-orange-500 mb-2">비밀번호</h2>
                <p className="text-sm text-gray-600 mb-6">
                비밀번호는 10자리이상으로 만들어 주세요.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handlePasswordReset}>
                {/* 새 비밀번호 입력 */}
                <div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새로운 비밀번호를 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  />
                </div>

                {/* 비밀번호 확인 입력 */}
                <div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="확인을 위해 비밀번호를 다시 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="text-red-500 text-sm text-center whitespace-pre-line -mt-2">
                    {error}
                  </div>
                )}

                {/* 비밀번호 변경 완료 버튼 */}
                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                    isFormValid && !isLoading
                      ? "bg-[#FF9100] hover:bg-[#E8820E] text-white"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {isLoading ? "처리 중..." : "비밀번호 변경 완료"}
                </button>
              </form>
            </div>
          )}

          {/* 하단 링크 */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 