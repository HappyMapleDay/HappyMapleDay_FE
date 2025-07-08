This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 메요일조아 (HappyMapleDay)

메이플스토리 보스 돌이 관리 시스템

## 주요 기능

- 사용자 인증 (회원가입, 로그인, 비밀번호 재설정)
- 보스 돌이 현황 관리
- 캐릭터별 보스 선택 및 설정
- 주간/일간 보스 진행 상황 추적

## API 연동 완료 사항

### 인증 관련 API
- ✅ 회원가입 (`POST /api/user/register`)
- ✅ 로그인 (`POST /api/user/login`)
- ✅ 로그아웃 (`POST /api/user/logout`)
- ✅ 토큰 갱신 (`POST /api/user/refresh`)
- ✅ 비밀번호 재설정 (`POST /api/user/reset-password`)
- ✅ 사용자명 중복 확인 (`GET /api/user/check-username/{name}`)

### 사용자 설정 API
- ✅ 사용자 설정 조회 (`GET /api/user/settings`)
- ✅ 개인정보 수집 동의 설정 (`PUT /api/user/settings/privacy`)
- ✅ 주간 초기화 설정 (`PUT /api/user/settings/weekly-reset`)
- ✅ 본캐 변경 (`PUT /api/user/main-character`)

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 백엔드 API 기본 URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Mock 데이터 사용 여부 (개발 중에는 false)
NEXT_PUBLIC_USE_MOCK=false
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
