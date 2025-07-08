import {
  SignupRequestDto,
  SignupResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  ApiResponse,
  LogoutResponseDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  UserSettingsResponseDto,
  PrivacySettingsUpdateRequestDto,
  WeeklyResetSettingsUpdateRequestDto,
  MainCharacterUpdateRequestDto,
  MainCharacterUpdateResponseDto
} from '../types/auth';

// API 설정 - Next.js 프록시 사용 (fallback: 8080)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 토큰 관리 유틸리티
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// HTTP 클라이언트 클래스
class HttpClient {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    };

    // 인증이 필요한 요청에 토큰 추가
    const accessToken = TokenManager.getAccessToken();
    if (accessToken && !url.includes('/login') && !url.includes('/register')) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && !url.includes('/refresh')) {
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        // 토큰 갱신 성공 시 원래 요청 재시도
        const newAccessToken = TokenManager.getAccessToken();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        return this.makeRequest(url, config);
      } else {
        // 토큰 갱신 실패 시 로그인 페이지로 리다이렉션
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '요청이 실패했습니다.');
    }
    
    return data;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/api/user/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data: RefreshTokenResponseDto = await response.json();
        if (data.success) {
          TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(url, { method: 'GET', headers });
  }

  async post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }
}

// 인증 서비스 클래스
class AuthService {
  private httpClient = new HttpClient();

  // 회원가입
  async signup(request: SignupRequestDto): Promise<SignupResponseDto> {
    try {
      return await this.httpClient.post<SignupResponseDto>('/api/user/register', request);
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  }

  // 로그인
  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const response = await this.httpClient.post<LoginResponseDto>('/api/user/login', request);
      
      if (response.success && response.data) {
        // 토큰 저장
        TokenManager.setTokens(response.data.token, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  }

  // 로그아웃
  async logout(): Promise<LogoutResponseDto> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        const response = await this.httpClient.post<LogoutResponseDto>('/api/user/logout', {
          refreshToken
        });
        
        // 토큰 삭제
        TokenManager.clearTokens();
        
        return response;
      } else {
        // 토큰이 없어도 로컬 토큰은 삭제
        TokenManager.clearTokens();
        return {
          status: 'success',
          message: '로그아웃되었습니다.',
          data: { message: '로그아웃되었습니다.' }
        };
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 발생해도 로컬 토큰은 삭제
      TokenManager.clearTokens();
      throw error;
    }
  }

  // 토큰 갱신
  async refreshToken(request: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    try {
      const response = await this.httpClient.post<RefreshTokenResponseDto>('/api/user/refresh', request);
      
      if (response.success && response.data) {
        TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      throw error;
    }
  }

  // 사용자명 중복 확인
  async checkUsername(name: string): Promise<ApiResponse<boolean>> {
    try {
      return await this.httpClient.get<ApiResponse<boolean>>(`/api/user/check-username/${encodeURIComponent(name)}`);
    } catch (error) {
      console.error('사용자명 중복 확인 실패:', error);
      throw error;
    }
  }

  // 비밀번호 재설정
  async resetPassword(request: PasswordResetRequestDto): Promise<PasswordResetResponseDto> {
    try {
      return await this.httpClient.post<PasswordResetResponseDto>('/api/user/reset-password', request);
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      throw error;
    }
  }

  // 사용자 설정 조회
  async getUserSettings(): Promise<UserSettingsResponseDto> {
    try {
      return await this.httpClient.get<UserSettingsResponseDto>('/api/user/settings');
    } catch (error) {
      console.error('사용자 설정 조회 실패:', error);
      throw error;
    }
  }

  // 개인정보 수집 동의 설정 업데이트
  async updatePrivacySettings(request: PrivacySettingsUpdateRequestDto): Promise<UserSettingsResponseDto> {
    try {
      return await this.httpClient.put<UserSettingsResponseDto>('/api/user/settings/privacy', request);
    } catch (error) {
      console.error('개인정보 설정 업데이트 실패:', error);
      throw error;
    }
  }

  // 주간 초기화 설정 업데이트
  async updateWeeklyResetSettings(request: WeeklyResetSettingsUpdateRequestDto): Promise<UserSettingsResponseDto> {
    try {
      return await this.httpClient.put<UserSettingsResponseDto>('/api/user/settings/weekly-reset', request);
    } catch (error) {
      console.error('주간 초기화 설정 업데이트 실패:', error);
      throw error;
    }
  }

  // 본캐 변경
  async updateMainCharacter(request: MainCharacterUpdateRequestDto): Promise<MainCharacterUpdateResponseDto> {
    try {
      return await this.httpClient.put<MainCharacterUpdateResponseDto>('/api/user/main-character', request);
    } catch (error) {
      console.error('본캐 변경 실패:', error);
      throw error;
    }
  }

  // 현재 로그인 상태 확인
  isLoggedIn(): boolean {
    return TokenManager.getAccessToken() !== null;
  }

  // 현재 저장된 토큰들 가져오기
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: TokenManager.getAccessToken(),
      refreshToken: TokenManager.getRefreshToken(),
    };
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();

// 토큰 매니저 export
export { TokenManager };

// 편의 함수들
export const login = (request: LoginRequestDto) => authService.login(request);
export const logout = () => authService.logout();
export const signup = (request: SignupRequestDto) => authService.signup(request);
export const checkUsername = (name: string) => authService.checkUsername(name);
export const resetPassword = (request: PasswordResetRequestDto) => authService.resetPassword(request);
export const isLoggedIn = () => authService.isLoggedIn(); 