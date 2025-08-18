"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface DesireDropItem {
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
  availableItems: DesireDropItem[];
  onSave: (selectedItem: DesireDropItem | null, price?: number, ringInfo?: { type: string; level: number; name: string; fullName: string }) => void;
}

export default function DesireDropModal({
  isOpen,
  onClose,
  bossName,
  availableItems,
  onSave
}: DesireDropModalProps) {
  const [step, setStep] = useState<'select' | 'price' | 'ring'>('select');
  const [selectedItem, setSelectedItem] = useState<DesireDropItem | null>(null);
  const [price, setPrice] = useState<string>('');
  const [selectedRingIndex, setSelectedRingIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedItem(null);
      setPrice('');
      setSelectedRingIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemSelect = (item: DesireDropItem) => {
    setSelectedItem(item);
    if (item.isRingBox) {
      setStep('ring');
    } else {
      setStep('price');
    }
  };

  const handleRingConfirm = () => {
    setStep('price');
  };

  const handleSave = () => {
    const priceValue = parseInt(price.replace(/[^0-9]/g, ''));
    console.log('DesireDropModal - Saving price:', price, 'parsed:', priceValue); // 디버깅
    
    let ringInfo = undefined;
    if (selectedItem?.isRingBox && selectedItem.ringOptions && selectedItem.ringOptions.length > 0) {
      const selectedRing = selectedItem.ringOptions[selectedRingIndex];
      ringInfo = {
        type: selectedRing.type,
        level: selectedRing.level,
        name: selectedRing.name,
        fullName: selectedRing.fullName
      };
    }
    
    onSave(selectedItem, priceValue, ringInfo);
    onClose();
  };

  const formatPrice = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers === '') return '';
    return parseInt(numbers).toLocaleString();
  };

  const handlePriceChange = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    setPrice(numbers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-orange-500">물욕템 체크</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'select' && (
          <>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">습득 아이템 선택</h4>
              <p className="text-sm text-gray-600 mb-4">
                습득하신 아이템을 선택해주시고, 판매하신 경우엔 판매가를 입력해주세요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/image/logo.png';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-700 text-center truncate">{item.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'ring' && selectedItem && (
          <>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">반지 정보 선택</h4>
              <p className="text-sm text-gray-600 mb-4">
                획득하신 반지의 종류와 레벨을 선택해주세요.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-center mb-4 p-4 border-2 border-orange-300 rounded-lg">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">획득 가능한 반지</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedItem?.ringOptions?.map((ring, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedRingIndex(index)}
                    className={`w-full p-3 rounded-lg border-2 transition-colors ${
                      selectedRingIndex === index
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Image
                          src={`/image/rings/${ring.type}.png`}
                          alt={ring.type}
                          width={32}
                          height={32}
                          className="object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/image/logo.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 text-sm">{ring.fullName || ring.name}</p>
                      </div>
                    </div>
                  </button>
                )) || (
                  <p className="text-center text-gray-500 py-4">반지 정보를 불러올 수 없습니다.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleRingConfirm}
              className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              다음
            </button>
          </>
        )}

        {step === 'price' && selectedItem && (
          <>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">습득 아이템 선택</h4>
              <p className="text-sm text-gray-600 mb-4">
                습득하신 아이템을 선택해주시고, 판매하신 경우엔 판매가를 입력해주세요.
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-center mb-4 p-4 border-2 border-orange-300 rounded-lg">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              {selectedItem.isRingBox && selectedItem.ringOptions && selectedItem.ringOptions[selectedRingIndex] && (
                <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">선택된 반지 정보</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <Image
                        src={`/image/rings/${selectedItem.ringOptions[selectedRingIndex].type}.png`}
                        alt={selectedItem.ringOptions[selectedRingIndex].type}
                        width={32}
                        height={32}
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/image/logo.png';
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedItem.ringOptions[selectedRingIndex].fullName || selectedItem.ringOptions[selectedRingIndex].name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">판매가</label>
              <input
                type="text"
                value={price ? formatPrice(price) : ''}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="숫자만 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                저장
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
