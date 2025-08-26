"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { DesireDropItem as DesireDropItemType } from "../types/boss";

interface AvailableDesireDropItem {
  id: string;
  name: string;
  image: string;
  isRingBox?: boolean;
  ringOptions?: Array<{
    type: 'weapon' | 'restraint' | 'continue';
    level: number;
    name: string;
    fullName: string;
    image?: string;
  }>;
}

interface DesireDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  bossName: string;
  availableItems: AvailableDesireDropItem[];
  currentDesireDropItems: DesireDropItemType[];
  onSave: (desireDropItems: DesireDropItemType[]) => void;
}

export default function DesireDropModal({
  isOpen,
  onClose,
  bossName,
  availableItems,
  currentDesireDropItems,
  onSave
}: DesireDropModalProps) {
  const [desireDropItems, setDesireDropItems] = useState<DesireDropItemType[]>([]);
  const [step, setStep] = useState<'list' | 'add' | 'price' | 'ring'>('list');
  const [selectedItem, setSelectedItem] = useState<AvailableDesireDropItem | null>(null);
  const [price, setPrice] = useState<string>('');
  const [selectedRingIndex, setSelectedRingIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setDesireDropItems([...currentDesireDropItems]);
      setStep('list');
      setSelectedItem(null);
      setPrice('');
      setSelectedRingIndex(0);
    }
  }, [isOpen, currentDesireDropItems]);

  if (!isOpen) return null;

  const handleItemSelect = (item: AvailableDesireDropItem) => {
    setSelectedItem(item);
    setPrice('');
    setSelectedRingIndex(0);
    
    if (item.isRingBox) {
      setStep('ring');
    } else {
      setStep('price');
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) return;

    const priceValue = parseInt(price.replace(/[^0-9]/g, '')) * 10000; // 만 메소 단위를 메소로 변환
    if (!priceValue || priceValue <= 0) return;

    let ringInfo: DesireDropItemType['ringInfo'] = undefined;
    if (selectedItem.isRingBox && selectedItem.ringOptions) {
      const selectedRing = selectedItem.ringOptions[selectedRingIndex];
      ringInfo = {
        type: selectedRing.type,
        level: selectedRing.level,
        name: selectedRing.name,
        fullName: selectedRing.fullName
      };
    }

    const newItem: DesireDropItemType = {
      item: selectedItem,
      price: priceValue,
      ringInfo
    };

    setDesireDropItems(prev => [...prev, newItem]);
    setStep('list');
    setSelectedItem(null);
    setPrice('');
    setSelectedRingIndex(0);
  };

  const handleRemoveItem = (index: number) => {
    setDesireDropItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(desireDropItems);
    onClose();
  };

  const formatPrice = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers === '') return '';
    return parseInt(numbers).toLocaleString();
  };

  const handlePriceChange = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 10) { // 최대 999억까지
      setPrice(numbers);
    }
  };

  const formatMeso = (meso: number) => {
    const manMeso = Math.floor(meso / 10000);
    if (manMeso >= 10000) {
      const eok = Math.floor(manMeso / 10000);
      const remainingMan = manMeso % 10000;
      if (remainingMan === 0) {
        return `${eok}억`;
      }
      return `${eok}억 ${remainingMan}만`;
    }
    return `${manMeso}만`;
  };

  const getTotalPrice = () => {
    return desireDropItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getRingImage = (type: string) => {
    return `/image/rings/${type}.png`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">물욕템 관리</h2>
              <p className="text-sm text-gray-600 mt-1">{bossName}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'list' && (
            <div className="space-y-4">
              {/* 현재 물욕템 목록 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">등록된 물욕템</h3>
                {desireDropItems.length > 0 ? (
                  <div className="space-y-2">
                    {desireDropItems.map((item, index) => {
                      const availableItem = item.item as AvailableDesireDropItem;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              key={availableItem.image}
                              src={availableItem.image}
                              alt={availableItem.name}
                              width={40}
                              height={40}
                              className="rounded"
                              style={{ display: 'block' }}
                              onLoad={(e) => {
                                console.log('이미지 로드 성공:', {
                                  src: availableItem.image,
                                  itemName: availableItem.name
                                });
                                const target = e.target as HTMLImageElement;
                                target.style.opacity = '1';
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error('이미지 로드 실패:', {
                                  originalSrc: availableItem.image,
                                  itemName: availableItem.name,
                                  fallbackSrc: '/image/logo.png'
                                });
                                target.src = '/image/logo.png';
                              }}
                            />
                            <div>
                              <p className="font-medium">{availableItem.name}</p>
                              {item.ringInfo && (
                                <p className="text-sm text-gray-600">
                                  {item.ringInfo.fullName}
                                </p>
                              )}
                              <p className="text-sm font-bold" style={{ color: '#FF9100' }}>
                                {formatMeso(item.price)} 메소
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 145, 0, 0.1)' }}>
                      <p className="text-center font-bold" style={{ color: '#FF9100' }}>
                        총 물욕템 가격: {formatMeso(getTotalPrice())} 메소
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">등록된 물욕템이 없습니다.</p>
                )}
              </div>

              {/* 물욕템 추가 버튼 */}
              <button
                onClick={() => setStep('add')}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFB366';
                  e.currentTarget.style.color = '#FF9100';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                + 물욕템 추가
              </button>
            </div>
          )}

          {step === 'add' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">물욕템 선택</h3>
                <button
                  onClick={() => setStep('list')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← 돌아가기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {availableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className="p-3 border border-gray-200 rounded-lg transition-colors text-left"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FFB366';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 145, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('물욕템 선택 이미지 로드 실패:', {
                            originalSrc: item.image,
                            itemName: item.name,
                            fallbackSrc: '/image/logo.png'
                          });
                          target.src = '/image/logo.png';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'ring' && selectedItem && selectedItem.ringOptions && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">아이템 선택</h3>
                <button
                  onClick={() => setStep('add')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← 돌아가기
                </button>
              </div>
              <div className="text-center mb-6">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  width={80}
                  height={80}
                  className="mx-auto rounded-lg mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/image/logo.png';
                  }}
                />
                <h4 className="font-semibold">{selectedItem.name}</h4>
              </div>
              <div className="space-y-3">
                {selectedItem.ringOptions.map((ring, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedRingIndex(index)}
                    className={`w-full p-4 border rounded-lg transition-colors ${
                      selectedRingIndex === index
                        ? ''
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedRingIndex === index ? {
                      borderColor: '#FF9100',
                      backgroundColor: 'rgba(255, 145, 0, 0.1)'
                    } : {}}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={(() => {
                          // 특수 케이스: 커맨더 포스 이어링은 drop-item에 있음
                          if (ring.name.includes('커맨더') || ring.name.toLowerCase().includes('commander')) {
                            return ring.image || '/image/logo.png';
                          }
                          
                          // 실제 반지인지 확인 (리스트레인트, 컨티뉴어스, 웨폰)
                          const isActualRing = ring.name.includes('링') || 
                                             ring.name.includes('ring') || 
                                             ring.name.toLowerCase().includes('restraint') ||
                                             ring.name.toLowerCase().includes('continue') ||
                                             ring.name.toLowerCase().includes('weapon');
                          
                          if (isActualRing) {
                            // 실제 반지는 rings 경로 사용
                            return getRingImage(ring.type);
                          } else {
                            // 연마석이나 기타 아이템은 drop-item 경로 사용
                            return ring.image || '/image/logo.png';
                          }
                        })()}
                        alt={ring.name}
                        width={40}
                        height={40}
                        className="rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          
                          // 특수 케이스: 커맨더 포스 이어링은 drop-item에 있음
                          const isCommander = ring.name.includes('커맨더') || ring.name.toLowerCase().includes('commander');
                          
                          const isActualRing = ring.name.includes('링') || 
                                             ring.name.includes('ring') || 
                                             ring.name.toLowerCase().includes('restraint') ||
                                             ring.name.toLowerCase().includes('continue') ||
                                             ring.name.toLowerCase().includes('weapon');
                          
                          let imageSrc;
                          if (isCommander) {
                            imageSrc = ring.image || '/image/logo.png';
                          } else if (isActualRing) {
                            imageSrc = getRingImage(ring.type);
                          } else {
                            imageSrc = ring.image || '/image/logo.png';
                          }
                            
                          console.error('아이템 이미지 로드 실패:', {
                            originalSrc: imageSrc,
                            itemName: ring.name,
                            itemType: ring.type,
                            isActualRing: isActualRing,
                            isCommander: isCommander,
                            fallbackSrc: '/image/logo.png'
                          });
                          target.src = '/image/logo.png';
                        }}
                      />
                      <div className="text-left">
                        <p className="font-medium">{ring.fullName}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('price')}
                className="w-full mt-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#FF9100' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
              >
                다음
              </button>
            </div>
          )}

          {step === 'price' && selectedItem && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">가격 입력</h3>
                <button
                  onClick={() => {
                    if (selectedItem.isRingBox) {
                      setStep('ring');
                    } else {
                      setStep('add');
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← 돌아가기
                </button>
              </div>
              <div className="text-center mb-6">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  width={80}
                  height={80}
                  className="mx-auto rounded-lg mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/image/logo.png';
                  }}
                />
                <h4 className="font-semibold">{selectedItem.name}</h4>
                {selectedItem.isRingBox && selectedItem.ringOptions && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedItem.ringOptions[selectedRingIndex]?.fullName}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    판매 가격 (만 메소 단위)
                  </label>
                  <input
                    type="text"
                    value={formatPrice(price)}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="예: 50000 (5억 메소)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2"

                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF9100';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 145, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {price && (
                    <p className="text-sm text-gray-600 mt-1">
                      = {formatMeso(parseInt(price) * 10000)} 메소
                    </p>
                  )}
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!price || parseInt(price.replace(/[^0-9]/g, '')) <= 0}
                  className="w-full py-3 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  style={!price ? {} : { backgroundColor: '#FF9100' }}
                  onMouseEnter={(e) => {
                    if (price) e.currentTarget.style.backgroundColor = '#E68200';
                  }}
                  onMouseLeave={(e) => {
                    if (price) e.currentTarget.style.backgroundColor = '#FF9100';
                  }}
                >
                  물욕템 추가
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#FF9100' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E68200'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9100'}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}