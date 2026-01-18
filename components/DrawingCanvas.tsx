
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  backgroundImage: string;
  onSave: (dataUrl: string) => void;
  isProcessing: boolean;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ backgroundImage, onSave, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 초기 색상을 민트색으로 설정
  const [selectedColor, setSelectedColor] = useState('#2DD4BF'); 

  // 색상 정의
  const colors = [
    { name: '빨강', hex: '#EF4444' },
    { name: '오렌지', hex: '#F59E0B' },
    { name: '노랑', hex: '#FACC15' },
    { name: '민트', hex: '#2DD4BF' }, // 추가
    { name: '초록', hex: '#10B981' },
    { name: '청록', hex: '#0D9488' }, // 추가
    { name: '하늘', hex: '#7DD3FC' }, // 추가
    { name: '파랑', hex: '#3B82F6' },
    { name: '보라', hex: '#8B5CF6' },
    { name: '분홍', hex: '#EC4899' },
    { name: '그레이', hex: '#4B5563' },
    { name: '하양', hex: '#FFFFFF' }, // 추가
  ];

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [backgroundImage]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const startX = Math.floor(clientX - rect.left);
    const startY = Math.floor(clientY - rect.top);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const pixelPos = (startY * canvas.width + startX) * 4;
    const startR = data[pixelPos];
    const startG = data[pixelPos + 1];
    const startB = data[pixelPos + 2];

    const fillRGB = hexToRgb(selectedColor);
    
    // 검정색 외곽선(또는 아주 어두운 색)은 칠하지 않음
    if (startR < 50 && startG < 50 && startB < 50) return; 
    // 이미 같은 색이면 무시
    if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b) return;

    const stack: [number, number][] = [[startX, startY]];
    const width = canvas.width;
    const height = canvas.height;

    while (stack.length > 0) {
      let [currX, currY] = stack.pop()!;
      let p = (currY * width + currX) * 4;

      while (currY >= 0 && matchStartColor(p)) {
        currY--;
        p -= width * 4;
      }
      p += width * 4;
      currY++;

      let reachLeft = false;
      let reachRight = false;

      while (currY < height && matchStartColor(p)) {
        colorPixel(p);

        if (currX > 0) {
          if (matchStartColor(p - 4)) {
            if (!reachLeft) {
              stack.push([currX - 1, currY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (currX < width - 1) {
          if (matchStartColor(p + 4)) {
            if (!reachRight) {
              stack.push([currX + 1, currY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currY++;
        p += width * 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    function matchStartColor(p: number) {
      return Math.abs(data[p] - startR) < 30 && 
             Math.abs(data[p+1] - startG) < 30 && 
             Math.abs(data[p+2] - startB) < 30;
    }

    function colorPixel(p: number) {
      data[p] = fillRGB.r;
      data[p + 1] = fillRGB.g;
      data[p + 2] = fillRGB.b;
      data[p + 3] = 255;
    }
  };

  const handleFinish = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden cursor-crosshair border-8 border-indigo-100 transition-transform hover:scale-[1.01]">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="max-w-full h-auto touch-none bg-white"
          onClick={floodFill}
          onTouchStart={floodFill}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-md">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-indigo-900 font-bold text-lg animate-pulse">AI가 작품을 감상하고 있어요...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-indigo-50 w-full max-w-3xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap justify-center gap-3">
            {colors.map(color => (
              <button
                key={color.hex}
                onClick={() => setSelectedColor(color.hex)}
                className={`group relative w-12 h-12 rounded-full shadow-md transition-all duration-200 ${
                  selectedColor === color.hex 
                  ? 'scale-125 ring-4 ring-indigo-500 ring-offset-2 z-10' 
                  : 'hover:scale-110 border-2 border-gray-100'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {selectedColor === color.hex && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-100 pointer-events-none">
                    {color.name}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 px-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full border shadow-inner"
                style={{ backgroundColor: selectedColor }}
              ></div>
              <span className="text-indigo-900 font-bold hidden sm:inline">선택된 색상</span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={initCanvas}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-sm font-bold transition-all active:scale-95"
              >
                <i className="fas fa-trash-alt"></i> 지우기
              </button>

              <button 
                onClick={handleFinish}
                disabled={isProcessing}
                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              >
                제출하기 <i className="fas fa-magic"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="text-indigo-400 text-sm font-semibold flex items-center gap-2">
        <i className="fas fa-info-circle"></i> 색을 골라 도안 안쪽을 터치하면 마법처럼 색이 채워져요!
      </p>
    </div>
  );
};

export default DrawingCanvas;
