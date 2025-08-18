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
                            <Image
                              src={availableItem.image}
                              alt={availableItem.name}
                              width={40}
                              height={40}
                              className="rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/image/logo.png';
                              }}
                            />
                            <div>
                              <p className="font-medium">{availableItem.name}</p>
                              {item.ringInfo && (
                                <p className="text-sm text-gray-600">
                                  {item.ringInfo.fullName} (레벨 {item.ringInfo.level})
                                </p>
                              )}
                              <p className="text-sm font-bold text-orange-600">
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
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-center font-bold text-orange-600">
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
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
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
                    className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/image/logo.png';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.isRingBox && (
                          <p className="text-xs text-gray-500">반지상자</p>
                        )}
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
                <h3 className="text-lg font-semibold">반지 선택</h3>
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
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={getRingImage(ring.type)}
                        alt={ring.type}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div className="text-left">
                        <p className="font-medium">{ring.fullName}</p>
                        <p className="text-sm text-gray-600">레벨 {ring.level}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('price')}
                className="w-full mt-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
                    {selectedItem.ringOptions[selectedRingIndex]?.fullName} (레벨 {selectedItem.ringOptions[selectedRingIndex]?.level})
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}