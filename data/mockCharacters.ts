import { Character } from '../types';

// 확장된 캐릭터 Mock 데이터
export const mockAllCharacters: Character[] = [
  // 현재 보돌캐들
  {
    id: "1",
    name: "뱌꺄",
    server: "크로아",
    job: "패스파인더",
    level: 282,
    image: "/image/logo.png",
    isMainCharacter: true
  },
  {
    id: "2",
    name: "바카",
    server: "크로아", 
    job: "비숍",
    level: 280,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  
  // 추가 가능한 캐릭터들
  {
    id: "3",
    name: "뱌꺄밤",
    server: "크로아",
    job: "패스파인더",
    level: 282,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "4",
    name: "QWERASDFZXCV",
    server: "크로아",
    job: "비숍",
    level: 280,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "5",
    name: "뱌꺄삼",
    server: "크로아",
    job: "패스파인더",
    level: 282,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "6",
    name: "메이플짱",
    server: "크로아",
    job: "아크메이지(불,독)",
    level: 275,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "7",
    name: "보스킬러",
    server: "크로아",
    job: "히어로",
    level: 270,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "8",
    name: "힐러짱",
    server: "크로아",
    job: "비숍",
    level: 265,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "9",
    name: "딜러최고",
    server: "크로아",
    job: "나이트로드",
    level: 260,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "10",
    name: "서포터",
    server: "크로아",
    job: "캐논슈터",
    level: 255,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "11",
    name: "파이터",
    server: "크로아",
    job: "팔라딘",
    level: 250,
    image: "/image/logo.png",
    isMainCharacter: false
  },
  {
    id: "12",
    name: "마법사",
    server: "크로아",
    job: "아크메이지(썬,콜)",
    level: 245,
    image: "/image/logo.png",
    isMainCharacter: false
  }
];

// 현재 보돌캐로 선택된 캐릭터들 (메인 페이지에서 사용)
export const getCurrentBossCharacters = (): Character[] => {
  return mockAllCharacters.filter(char => ["1", "2"].includes(char.id));
};

// 보돌캐로 추가 가능한 캐릭터들 (현재 선택되지 않은 캐릭터들)
export const getAvailableCharacters = (currentBossCharacterIds: string[]): Character[] => {
  return mockAllCharacters.filter(char => !currentBossCharacterIds.includes(char.id));
}; 