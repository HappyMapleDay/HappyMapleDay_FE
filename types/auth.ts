// 회원가입 관련 타입
export interface SignupRequestDto {
  nexonApiKey: string;
  mainCharacterName: string;
  subCharacterNames: string[];
  password: string;
  passwordConfirm: string;
  dataCollectionAgreed: boolean;
}

export interface SignupResponseDto {
  status: string;     // "success" 또는 "error"
  message: string;
  data: {
    message?: string;
  } | null;
}

// 로그인 관련 타입
export interface LoginRequestDto {
  mainCharacterName: string;
  password: string;
}

export interface LoginResponseDto {
  status: string; // "success" 또는 "error"
  message: string;
  data: {
    token: string; // Access Token
    refreshToken: string; // Refresh Token
    user: {
      id: number;
      mainCharacterName: string;
    };
  };
}

// 토큰 갱신 관련 타입
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  success: boolean;
  data: {
    accessToken: string; // 새로운 Access Token
    refreshToken: string; // 새로운 Refresh Token
  };
  message: string | null;
}

// 사용자명 중복 확인 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// 로그아웃 관련 타입
export interface LogoutRequestDto {
  refreshToken: string;
}

export interface LogoutResponseDto {
  status: string;
  message: string;
  data: {
    message: string;
  };
}

// 비밀번호 재설정 관련 타입
export interface PasswordResetRequestDto {
  mainCharacterName: string;
  nexonApiKey: string;
}

export interface PasswordResetResponseDto {
  status: string;
  message: string;
  data: {
    message: string;
    temporaryPassword: string;
  };
}

// 사용자 설정 관련 타입
export interface UserSettingsResponseDto {
  status: string;
  message: string;
  data: {
    mainCharacterName: string;
    dataCollectionAgreed: boolean;
    weeklyResetEnabled: boolean;
  };
}

export interface PrivacySettingsUpdateRequestDto {
  dataCollectionAgreed: boolean;
}

export interface WeeklyResetSettingsUpdateRequestDto {
  weeklyResetEnabled: boolean;
}

// 본캐 변경 관련 타입
export interface MainCharacterUpdateRequestDto {
  newMainCharacterName: string;
}

export interface MainCharacterUpdateResponseDto {
  status: string;
  message: string;
  data: {
    previousMainCharacterName: string;
    newMainCharacterName: string;
    message: string;
  };
}

// 비밀번호 변경 관련 타입
export interface PasswordChangeRequestDto {
  mainCharacterName: string;
  newPassword: string;
}

export interface PasswordChangeResponseDto {
  status: string;
  message: string;
  data: {
    message: string;
  };
}

// 인증 상태 관리용 타입
export interface AuthUser {
  id: number;
  mainCharacterName: string;
  accessToken: string;
  refreshToken: string;
}

// API 에러 응답 타입
export interface ApiErrorResponse {
  status: string;
  message: string;
  data: null;
}

// 캐릭터 관련 타입
export interface CharacterResponse {
  id: number;
  ocid: string;
  characterName: string;
  isMain: boolean;
  createdAt: string;
}

export interface CharacterListResponseDto {
  status: string;
  message: string;
  data: CharacterResponse[];
}

// 캐릭터 일괄 등록 관련 타입
export interface CharacterBulkCreateCharacter {
  characterName: string;
  ocid: string;
  isMain: boolean;
}

export interface CharacterBulkCreateRequest {
  userId: number;
  characters: CharacterBulkCreateCharacter[];
}

export interface SavedCharacter {
  id: number;
  ocid: string;
  characterName: string;
  isMain: boolean;
  createdAt: string;
}

export interface CharacterBulkCreateResponse {
  savedCharacters: SavedCharacter[];
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors: string[];
} 