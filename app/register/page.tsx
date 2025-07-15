"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/authStore";
import { Character } from "../../types";
import nexonApiService from "../../services/nexonApiService";

export default function Register() {
  const router = useRouter();
  const { signup, error, clearError, isLoading } = useAuth();
  const [step, setStep] = useState<'api' | 'character'>('api');
  const [apiKey, setApiKey] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedBossCharacters, setSelectedBossCharacters] = useState<Character[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!apiKey.trim()) {
      alert("API 키를 입력해주세요.");
      return;
    }
    
    setIsLoadingCharacters(true);
    
    try {
      // 실제 넥슨 API 호출
      const charactersData = await nexonApiService.getCharacterList(apiKey);
      
      if (charactersData.length === 0) {
        alert("레벨 235 이상의 캐릭터가 없습니다. 캐릭터를 더 키운 후 다시 시도해주세요.");
        setIsLoadingCharacters(false);
        return;
      }
      
      setCharacters(charactersData);
      setStep('character');
    } catch (error) {
      console.error('캐릭터 목록 조회 실패:', error);
      alert("캐릭터 목록을 불러오는데 실패했습니다. API 키를 확인해주세요.");
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    // 다음 단계로 진행하거나 완료 처리
    alert(`본캐로 ${character.name} (${character.job}, Lv.${character.level})를 선택했습니다!`);
  };

  const handleBossCharacterToggle = (character: Character) => {
    setSelectedBossCharacters(prev => {
      const isSelected = prev.some(c => c.id === character.id);
      if (isSelected) {
        return prev.filter(c => c.id !== character.id);
      } else {
        return [...prev, character];
      }
    });
  };

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

  const handleRegisterComplete = async () => {
    console.log('회원가입 시작');
    
    if (!selectedCharacter || !password || !confirmPassword || !agreeToTerms) {
      console.log('필수 입력 정보 누락:', {
        selectedCharacter: !!selectedCharacter,
        password: !!password,
        confirmPassword: !!confirmPassword,
        agreeToTerms
      });
      return;
    }
    
    if (!validatePassword(password, confirmPassword)) {
      console.log('비밀번호 검증 실패');
      return;
    }

    // 회원가입 API 호출 - 백엔드 API 스펙에 맞게 수정
    const signupData = {
      nexonApiKey: apiKey,
      mainCharacterName: selectedCharacter.name,
      subCharacterNames: selectedBossCharacters.map(char => char.name),
      password: password,
      passwordConfirm: confirmPassword,
      dataCollectionAgreed: agreeToTerms
    };
    
    console.log('회원가입 데이터:', signupData);
    
    try {
      const success = await signup(signupData);
      console.log('회원가입 API 결과:', success);

      if (success) {
        alert("회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.");
        router.push('/');
      } else {
        alert("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const isFormValid = step === 'api' ? apiKey.trim() : selectedCharacter !== null;

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

          {/* 단계별 폼 */}
          {step === 'api' ? (
            /* API 키 입력 단계 */
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="넥슨 OpenAPI에서 발급받은 API key를 입력해주세요."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="text-red-500 text-sm text-center whitespace-pre-line -mt-2">
                  {error}
                </div>
              )}

              {/* 캐릭터 목록 불러오기 버튼 */}
              <button
                type="submit"
                disabled={!isFormValid || isLoadingCharacters}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                  isFormValid && !isLoadingCharacters
                    ? "bg-[#FF9100] hover:bg-[#E8820E] text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {isLoadingCharacters ? "불러오는 중..." : "캐릭터 목록 불러오기"}
              </button>
            </form>
          ) : (
            /* 캐릭터 선택 단계 */
            <div className="space-y-6">
              {/* API Key 입력 (읽기 전용) */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-orange-500 mb-2">
                  메이플스토리 API key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {/* API 키 발급 가이드 링크 */}
              <div className="text-sm text-gray-500 text-center">
                API 키 발급 방법은{" "}
                <a 
                  href="https://openapi.nexon.com/ko/guide/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  API 키 발급 가이드
                </a>
                를 참고해주세요
              </div>

              {/* 캐릭터 목록 불러오기 버튼 (성공 상태) */}
              <button
                disabled
                className="w-full font-medium py-3 px-4 rounded-lg bg- [#FF9100] text-white"
              >
                캐릭터 목록 불러오기
              </button>

              {/* 본캐 선택 섹션 */}
              <div>
                <h2 className="text-lg font-medium text-orange-500 mb-2">본캐 선택 (필수)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  선택한 본캐의 닉네임은 로그인 시 필요한 ID로 활용됩니다.
                  <br />
                  나중에 설정 페이지에서 변경이 가능합니다.
                </p>

                {/* 캐릭터 목록 */}
                <div className="space-y-3 bg-gray-100 rounded-lg p-4">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      onClick={() => handleCharacterSelect(character)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCharacter?.id === character.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 bg-white hover:bg-orange-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Image
                          src={character.image}
                          alt={character.name}
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                            {character.name}
                            <span className="text-sm bg-gray-200 rounded-full px-2 py-1 flex items-center gap-1">
                              {character.serverIcon ? (
                                <Image
                                  src={character.serverIcon}
                                  alt={character.server}
                                  width={16}
                                  height={16}
                                  className="rounded-sm"
                                />
                              ) : (
                                <span>⭐</span>
                              )}
                              {character.server}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {character.job} | Lv.{character.level}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 안내 텍스트 */}
                <p className="text-sm text-orange-500 text-center mt-4">
                  캐릭터를 클릭하여 본캐를 선택해주세요
                </p>
              </div>

              {/* 보돌캐 선택 섹션 - 본캐 선택 후에만 표시 */}
              {selectedCharacter && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-orange-500 mb-2">보돌캐 선택 (선택)</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    보스돌이를 도는 캐릭터들을 선택해주세요.
                    <br />
                    나중에 보돌현황 화면에서 변경 가능합니다.
                  </p>

                  {/* 보돌캐 캐릭터 목록 */}
                  <div className="space-y-3 bg-gray-100 rounded-lg p-4">
                    {characters.map((character) => (
                      <div
                        key={`boss-${character.id}`}
                        onClick={() => handleBossCharacterToggle(character)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedBossCharacters.some(c => c.id === character.id)
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white hover:bg-orange-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Image
                            src={character.image}
                            alt={character.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                              {character.name}
                              <span className="text-sm bg-gray-200 rounded-full px-2 py-1 flex items-center gap-1">
                                {character.serverIcon ? (
                                  <Image
                                    src={character.serverIcon}
                                    alt={character.server}
                                    width={16}
                                    height={16}
                                    className="rounded-sm"
                                  />
                                ) : (
                                  <span>⭐</span>
                                )}
                                {character.server}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {character.job} | Lv.{character.level}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 안내 텍스트 */}
                  <p className="text-sm text-orange-500 text-center mt-4">
                    캐릭터를 클릭하여 보돌캐를 선택해주세요
                  </p>
                </div>
              )}

                            {/* 비밀번호 입력 섹션 - 본캐 선택 후에만 표시 */}
              {selectedCharacter && (
                <div className="mt-8">
                  <h3 className="text-[#FF9100] text-lg font-medium mb-2">비밀번호 입력</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    비밀번호는 10자 이상으로 만들어주세요.
                  </p>
                  
                  <div className="space-y-5">
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (confirmPassword && passwordError) {
                            validatePassword(e.target.value, confirmPassword);
                          }
                        }}
                        placeholder="비밀번호를 입력해주세요."
                        className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF9100] text-gray-900"
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
                          if (password && e.target.value) {
                            validatePassword(password, e.target.value);
                          }
                        }}
                        placeholder="확인을 위해 비밀번호를 다시 입력해주세요."
                        className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF9100] text-gray-900"
                      />
                      {passwordError && passwordError === "비밀번호가 일치하지 않습니다." && (
                        <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-6">
                      <div 
                        onClick={() => setAgreeToTerms(!agreeToTerms)}
                        className={`flex items-center justify-center w-5 h-5 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                          agreeToTerms 
                            ? 'border-[#FF9100] bg-[#FF9100]' 
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {agreeToTerms && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                                                                    <label 
                        onClick={() => setAgreeToTerms(!agreeToTerms)}
                        className={`text-[12px] cursor-pointer transition-all duration-200 ${
                          agreeToTerms ? 'text-[#FF9100]' : 'text-gray-400'
                        }`}
                      >
                        api key를 활용한 데이터 수집(캐릭터 정보 등)에 동의합니다.
                      </label>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegisterComplete}
                    disabled={!password || !confirmPassword || !agreeToTerms || !!passwordError || isLoading}
                    className={`w-full mt-8 py-4 px-4 rounded-lg font-medium text-lg transition-all duration-200 ${
                      password && confirmPassword && agreeToTerms && !passwordError && !isLoading
                        ? 'bg-[#FF9100] text-white cursor-pointer hover:bg-[#E8820E]'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? "회원가입 중..." : "회원가입 완료"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 하단 링크 - API 키 입력 단계에서만 표시 */}
          {step === 'api' && (
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 