"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/authStore";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BossHistoryService } from '../../services/bossHistoryService';
import { BossHistoryData, BossHistoryChartData, BossHistoryRequest } from '../../types/bossHistory';

export default function BossHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, logout, mainCharacterName, initializeAuth } = useAuth();
  
  // 인증 상태 확인 및 리다이렉션
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  // 필터 상태
  const [selectedServer, setSelectedServer] = useState("크로아");
  const [selectedPeriod, setSelectedPeriod] = useState("1개월");
  
  // 데이터 상태
  const [chartData, setChartData] = useState<BossHistoryChartData[]>([]);
  const [tableData, setTableData] = useState<BossHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverOptions, setServerOptions] = useState<string[]>(["전체", "크로아", "챌린저스1"]);
  
  // 기간 필터 옵션
  const periodOptions = ["1개월", "3개월", "6개월"];

  // 데이터 로딩 함수
  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const params: BossHistoryRequest = {
        server: selectedServer,
        period: selectedPeriod
      };

      const [chartDataResult, tableDataResult] = await Promise.all([
        BossHistoryService.getChartData(params),
        BossHistoryService.getTableData(params)
      ]);

      setChartData(chartDataResult);
      setTableData(tableDataResult);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      // 에러 시 임시 데이터 사용
      setChartData([
        { period: "06.05~06.11", value: 1000, fullPeriod: "2025.06.05~2025.06.11" },
        { period: "06.12~06.18", value: 950, fullPeriod: "2025.06.12~2025.06.18" },
        { period: "06.19~06.25", value: 1100, fullPeriod: "2025.06.19~2025.06.25" },
        { period: "06.26~07.02", value: 1200, fullPeriod: "2025.06.26~2025.07.02" }
      ]);
      setTableData([
        {
          period: "2025.06.05~2025.06.11",
          crystallizedStone: "808만메소",
          desiredItem: "1000만메소",
          total: "1808만 메소"
        },
        {
          period: "2025.06.12~2025.06.18",
          crystallizedStone: "808만메소",
          desiredItem: "1000만메소",
          total: "1808만 메소"
        },
        {
          period: "2025.06.19~2025.06.25",
          crystallizedStone: "808만메소",
          desiredItem: "1000만메소",
          total: "1808만 메소"
        },
        {
          period: "2025.06.26~2025.07.02",
          crystallizedStone: "808만메소",
          desiredItem: "1000만메소",
          total: "1808만 메소"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, selectedServer, selectedPeriod]);

  // 서버 목록 로딩
  const loadServerOptions = async () => {
    try {
      const servers = await BossHistoryService.getServerList();
      setServerOptions(servers);
    } catch (error) {
      console.error('서버 목록 로딩 실패:', error);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    if (isLoggedIn) {
      loadServerOptions();
      loadData();
    }
  }, [isLoggedIn, loadData]);

  // 필터 변경 시 데이터 재로딩
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link href="/boss-status" className="flex items-center space-x-2">
              <Image
                src="/image/logo.png"
                alt="메요일조아"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg lg:text-xl font-bold" style={{ color: '#FF9100' }}>메요일조아</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                href="/boss-status" 
                className="text-gray-500 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                보돌 현황
              </Link>
              <Link 
                href="/boss-history" 
                className="font-medium border-b-2 pb-1"
                style={{ color: '#FF9100', borderColor: '#FF9100' }}
              >
                보돌 히스토리
              </Link>
              <Link 
                href="/desire-history" 
                className="text-gray-500 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                물욕템 히스토리
              </Link>
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {mainCharacterName || '사용자'}님
              </span>
              <Link 
                href="/settings" 
                className="text-gray-600 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
              >
                설정
              </Link>
              <button 
                onClick={logout}
                className="text-gray-600 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#FF9100'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4B5563'}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 필터 섹션 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
              {serverOptions.map((server) => (
                <button
                  key={server}
                  onClick={() => setSelectedServer(server)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                    selectedServer === server
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={selectedServer === server ? { backgroundColor: '#FF9100' } : {}}
                >
                  {server}
                </button>
              ))}
            </div>
          </div>

          {/* 기간 필터 */}
          <div className="flex items-center gap-2">
            {periodOptions.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={selectedPeriod === period ? { backgroundColor: '#FF9100' } : {}}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">수익 추이</h2>
          
          {/* 간단한 차트 (recharts 대신 CSS로 구현) */}
          <div className="h-64 flex items-end justify-between space-x-4">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                <div 
                  className="bg-orange-500 rounded-t w-full"
                  style={{ 
                    height: `${(data.value / 1200) * 200}px`,
                    minHeight: '20px'
                  }}
                />
                <span className="text-xs text-gray-600 text-center">
                  {data.period}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    결정석
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    물욕템
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총합
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : tableData.length > 0 ? (
                  tableData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.crystallizedStone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.desiredItem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
