import { Boss } from '../types';

// 메이플스토리 주간 보스 Mock 데이터
export const mockBosses: Boss[] = [
  {
    id: 'hilla',
    name: '힐라',
    resetType: 'weekly',
    image: '/image/boss-illustrate/hilla-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 120,
        expectedMeso: 150000000,
        expectedItems: ['네크로맨서 장비', '펫 장비']
      },
      {
        difficulty: 'hard',
        requiredLevel: 170,
        expectedMeso: 500000000,
        expectedItems: ['네크로맨서 장비', '희귀 큐브']
      }
    ]
  },
  {
    id: 'cygnus',
    name: '시그너스',
    resetType: 'weekly',
    image: '/image/boss-illustrate/cygnus-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 140,
        expectedMeso: 300000000,
        expectedItems: ['시그너스 장비', '큐브']
      }
    ]
  },
  {
    id: 'papulatus',
    name: '파풀라투스',
    resetType: 'weekly',
    image: '/image/boss-illustrate/papulatus-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 155,
        expectedMeso: 400000000,
        expectedItems: ['파풀라투스 장비', '시계 장비']
      },
      {
        difficulty: 'chaos',
        requiredLevel: 195,
        expectedMeso: 1200000000,
        expectedItems: ['파풀라투스 장비', '시계 장비', '희귀 큐브']
      }
    ]
  },
  {
    id: 'lotus',
    name: '로터스',
    resetType: 'weekly',
    image: '/image/boss-illustrate/lotus-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 190,
        expectedMeso: 800000000,
        expectedItems: ['앱솔랩스 장비', '에테르넬 플레임']
      },
      {
        difficulty: 'hard',
        requiredLevel: 230,
        expectedMeso: 2000000000,
        expectedItems: ['앱솔랩스 장비', '에테르넬 플레임', '희귀 큐브']
      }
    ]
  },
  {
    id: 'damien',
    name: '데미안',
    resetType: 'weekly',
    image: '/image/boss-illustrate/damien-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 190,
        expectedMeso: 800000000,
        expectedItems: ['앱솔랩스 장비', '크림슨 퀸 소울']
      },
      {
        difficulty: 'hard',
        requiredLevel: 230,
        expectedMeso: 2000000000,
        expectedItems: ['앱솔랩스 장비', '크림슨 퀸 소울', '희귀 큐브']
      }
    ]
  },
  {
    id: 'lucid',
    name: '루시드',
    resetType: 'weekly',
    image: '/image/boss-illustrate/lucid-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 210,
        expectedMeso: 1500000000,
        expectedItems: ['아케인 셰이드 장비', '루시드 소울']
      },
      {
        difficulty: 'hard',
        requiredLevel: 250,
        expectedMeso: 3000000000,
        expectedItems: ['아케인 셰이드 장비', '루시드 소울', '블랙 큐브']
      }
    ]
  },
  {
    id: 'will',
    name: '윌',
    resetType: 'weekly',
    image: '/image/boss-illustrate/will-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 220,
        expectedMeso: 2000000000,
        expectedItems: ['아케인 셰이드 장비', '윌의 저주']
      },
      {
        difficulty: 'hard',
        requiredLevel: 260,
        expectedMeso: 4000000000,
        expectedItems: ['아케인 셰이드 장비', '윌의 저주', '블랙 큐브']
      }
    ]
  },
  {
    id: 'dusk',
    name: '더스크',
    resetType: 'weekly',
    image: '/image/boss-illustrate/dusk-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 220,
        expectedMeso: 2000000000,
        expectedItems: ['아케인 셰이드 장비', '더스크의 큐브']
      },
      {
        difficulty: 'chaos',
        requiredLevel: 260,
        expectedMeso: 4500000000,
        expectedItems: ['아케인 셰이드 장비', '더스크의 큐브', '블랙 큐브']
      }
    ]
  },
  {
    id: 'darknell',
    name: '듄켈',
    resetType: 'weekly',
    image: '/image/boss-illustrate/darknell-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 230,
        expectedMeso: 2500000000,
        expectedItems: ['아케인 셰이드 장비', '듄켈의 증표']
      },
      {
        difficulty: 'hard',
        requiredLevel: 270,
        expectedMeso: 5000000000,
        expectedItems: ['아케인 셰이드 장비', '듄켈의 증표', '에테르넬 큐브']
      }
    ]
  },
  {
    id: 'seren',
    name: '세렌',
    resetType: 'weekly',
    image: '/image/boss-illustrate/seren-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 240,
        expectedMeso: 3500000000,
        expectedItems: ['아케인 셰이드 장비', '세렌의 은총']
      },
      {
        difficulty: 'hard',
        requiredLevel: 275,
        expectedMeso: 7000000000,
        expectedItems: ['아케인 셰이드 장비', '세렌의 은총', '에테르넬 큐브']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 285,
        expectedMeso: 15000000000,
        expectedItems: ['아케인 셰이드 장비', '세렌의 은총', '에테르넬 큐브', '최상급 장비']
      }
    ]
  },
  {
    id: 'kaling',
    name: '칼링',
    resetType: 'weekly',
    image: '/image/boss-illustrate/kaling-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 260,
        expectedMeso: 5000000000,
        expectedItems: ['에테르넬 장비', '칼링의 분노']
      },
      {
        difficulty: 'hard',
        requiredLevel: 285,
        expectedMeso: 12000000000,
        expectedItems: ['에테르넬 장비', '칼링의 분노', '에테르넬 큐브']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 295,
        expectedMeso: 25000000000,
        expectedItems: ['에테르넬 장비', '칼링의 분노', '에테르넬 큐브', '최상급 장비']
      }
    ]
  },
  {
    id: 'kalos',
    name: '칼로스',
    resetType: 'weekly',
    image: '/image/boss-illustrate/kalos-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 265,
        expectedMeso: 6000000000,
        expectedItems: ['에테르넬 장비', '칼로스의 기운']
      },
      {
        difficulty: 'chaos',
        requiredLevel: 290,
        expectedMeso: 18000000000,
        expectedItems: ['에테르넬 장비', '칼로스의 기운', '에테르넬 큐브']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 300,
        expectedMeso: 35000000000,
        expectedItems: ['에테르넬 장비', '칼로스의 기운', '에테르넬 큐브', '최상급 장비']
      }
    ]
  },
  {
    id: 'limbo',
    name: '림보',
    resetType: 'weekly',
    image: '/image/boss-illustrate/limbo-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 270,
        expectedMeso: 8000000000,
        expectedItems: ['에테르넬 장비', '림보의 힘']
      },
      {
        difficulty: 'hard',
        requiredLevel: 295,
        expectedMeso: 20000000000,
        expectedItems: ['에테르넬 장비', '림보의 힘', '에테르넬 큐브']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 305,
        expectedMeso: 45000000000,
        expectedItems: ['에테르넬 장비', '림보의 힘', '에테르넬 큐브', '최상급 장비']
      }
    ]
  },
  {
    id: 'blackmage',
    name: '검은 마법사',
    resetType: 'weekly',
    image: '/image/boss-illustrate/blackmage-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 275,
        expectedMeso: 15000000000,
        expectedItems: ['에테르넬 장비', '검은 마법사의 저주']
      },
      {
        difficulty: 'hard',
        requiredLevel: 295,
        expectedMeso: 30000000000,
        expectedItems: ['에테르넬 장비', '검은 마법사의 저주', '제네시스 장비']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 310,
        expectedMeso: 60000000000,
        expectedItems: ['에테르넬 장비', '검은 마법사의 저주', '제네시스 장비', '최상급 장비']
      }
    ]
  },
  {
    id: 'baldrix',
    name: '발드릭스',
    resetType: 'weekly',
    image: '/image/boss-illustrate/baldrix-illustrate.png',
    difficulties: [
      {
        difficulty: 'normal',
        requiredLevel: 280,
        expectedMeso: 18000000000,
        expectedItems: ['에테르넬 장비', '발드릭스의 깃털']
      },
      {
        difficulty: 'chaos',
        requiredLevel: 300,
        expectedMeso: 40000000000,
        expectedItems: ['에테르넬 장비', '발드릭스의 깃털', '제네시스 장비']
      },
      {
        difficulty: 'extreme',
        requiredLevel: 315,
        expectedMeso: 80000000000,
        expectedItems: ['에테르넬 장비', '발드릭스의 깃털', '제네시스 장비', '최상급 장비']
      }
    ]
  }
];

// 레벨별 추천 보스 필터링 함수
export const getRecommendedBosses = (characterLevel: number): Boss[] => {
  return mockBosses.filter(boss => {
    // 캐릭터 레벨로 접근 가능한 난이도가 하나라도 있으면 포함
    return boss.difficulties.some(difficulty => difficulty.requiredLevel <= characterLevel);
  });
}; 