import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  LoginRequestDto, 
  SignupRequestDto, 
  PasswordResetRequestDto,
  AuthUser 
} from '../types/auth';
import { authService } from '../services/authService';

// 인증 상태 타입
interface AuthState {
  // 상태
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // 액션
  login: (credentials: LoginRequestDto) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (signupData: SignupRequestDto) => Promise<boolean>;
  resetPassword: (resetData: PasswordResetRequestDto) => Promise<{ success: boolean; temporaryPassword?: string }>;
  checkUsername: (username: string) => Promise<boolean>; // true if available, false if taken
  clearError: () => void;
  initializeAuth: () => void;
}

// Zustand Store 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // 로그인
      login: async (credentials: LoginRequestDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(credentials);
          console.log('로그인 응답:', response);
          
          if (response.status === "success" && response.data) {
            const user: AuthUser = {
              id: 0, // 응답에 사용자 ID가 없으므로 임시값
              mainCharacterName: credentials.mainCharacterName, // 로그인 요청에서 사용한 값
              accessToken: response.data.token,
              refreshToken: response.data.refreshToken,
            };
            
            set({ user, isLoading: false });
            return true;
          } else {
            set({ error: response.message || '로그인에 실패했습니다.', isLoading: false });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      // 로그아웃
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          // 로그아웃 실패해도 로컬 상태는 초기화
          console.error('로그아웃 요청 실패:', error);
        } finally {
          set({ user: null, isLoading: false, error: null });
        }
      },

      // 회원가입
      signup: async (signupData: SignupRequestDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.signup(signupData);
          
          // 성공시: status === "success"
          if (response.status === "success") {
            set({ isLoading: false });
            return true;
          } 
          // 에러시: status === "error" 또는 다른 경우
          else {
            set({ error: response.message || '회원가입에 실패했습니다.', isLoading: false });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      // 비밀번호 재설정
      resetPassword: async (resetData: PasswordResetRequestDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.resetPassword(resetData);
          
          if (response.status === 'success') {
            set({ isLoading: false });
            return { 
              success: true, 
              temporaryPassword: response.data.temporaryPassword 
            };
          } else {
            set({ error: response.message || '비밀번호 재설정에 실패했습니다.', isLoading: false });
            return { success: false };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.';
          set({ error: errorMessage, isLoading: false });
          return { success: false };
        }
      },

      // 사용자명 중복 확인
      checkUsername: async (username: string) => {
        try {
          const response = await authService.checkUsername(username);
          // API에서 true 반환 = 중복 없음(사용 가능), false 반환 = 중복 있음(사용 불가)
          return response.data;
        } catch (error) {
          console.error('사용자명 중복 확인 실패:', error);
          // 에러 발생 시 안전하게 중복으로 처리
          return false;
        }
      },

      // 에러 초기화
      clearError: () => {
        set({ error: null });
      },

      // 인증 상태 초기화 (페이지 로드 시 호출)
      initializeAuth: () => {
        const tokens = authService.getTokens();
        const currentState = get();
        
        if (tokens.accessToken && tokens.refreshToken) {
          // 이미 저장된 사용자 정보가 있으면 토큰만 업데이트
          if (currentState.user) {
            set({ 
              user: {
                ...currentState.user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
              },
              isInitialized: true 
            });
          } else {
            // 사용자 정보가 없으면 로그아웃 처리
            set({ user: null, isInitialized: true });
          }
        } else {
          set({ user: null, isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user,
        // 토큰은 TokenManager에서 별도 관리하므로 제외
      }),
    }
  )
);

// 편의 함수들
export const useAuth = () => {
  const auth = useAuthStore();
  
  return {
    ...auth,
    isLoggedIn: !!auth.user,
    mainCharacterName: auth.user?.mainCharacterName || '',
  };
};

// 로그인 여부 확인 함수
export const getIsLoggedIn = () => {
  return useAuthStore.getState().user !== null;
}; 