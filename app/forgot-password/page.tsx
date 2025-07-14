"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../store/authStore";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [username, setUsername] = useState("");
  const [apiKey] = useState("test_api_key_9x7k2m4n8p1q5w");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // 유효성 검사
    if (!username.trim() || !apiKey.trim()) {
      return;
    }
    
    // 비밀번호 재설정 API 호출
    const result = await resetPassword({
      mainCharacterName: username.trim(),
      nexonApiKey: apiKey.trim()
    });
    
    if (result.success && result.temporaryPassword) {
      setTemporaryPassword(result.temporaryPassword);
      setStep('reset');
    }
  };

  const handleBackToLogin = () => {
    router.push("/");
  };

  const isFormValid = username.trim() && apiKey.trim();

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
                  readOnly
                  placeholder="테스트용 API 키가 자동으로 설정됩니다."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
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
            /* 임시 비밀번호 표시 단계 */
            <div className="space-y-6">
              {/* 임시 비밀번호 제목 및 설명 */}
              <div>
                <h2 className="text-lg font-medium text-orange-500 mb-2">임시 비밀번호 발급 완료</h2>
                <p className="text-sm text-gray-600 mb-6">
                  임시 비밀번호가 발급되었습니다. 아래 비밀번호로 로그인하신 후 비밀번호를 변경해주세요.
                </p>
              </div>

              {/* 임시 비밀번호 표시 */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 mb-2">임시 비밀번호</div>
                <div className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {temporaryPassword}
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="text-sm text-gray-500 text-center">
                보안을 위해 로그인 후 반드시 비밀번호를 변경해주세요.
              </div>

              {/* 로그인 페이지로 이동 버튼 */}
              <button
                onClick={handleBackToLogin}
                className="w-full bg-[#FF9100] hover:bg-[#E8820E] text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                로그인하러 가기
              </button>
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