
import React, { useState, useEffect, useCallback } from 'react';
import { Feedback } from './types';
import DrawingCanvas from './components/DrawingCanvas';
import { evaluateDrawing, generateChallengeImage } from './services/geminiService';

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [topicName, setTopicName] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const loadLevel = useCallback(async (level: number) => {
    setIsGeneratingImage(true);
    setFeedback(null);
    setCurrentLevel(level);
    const result = await generateChallengeImage(level);
    setCurrentImageUrl(result.url);
    setTopicName(result.name);
    setIsGeneratingImage(false);
  }, []);

  const handleSaveDrawing = async (dataUrl: string) => {
    setIsProcessing(true);
    const result = await evaluateDrawing(dataUrl, currentLevel, topicName);
    setFeedback(result);
    setIsProcessing(false);
  };

  const selectLevel = (level: number) => {
    setGameStarted(true);
    loadLevel(level);
  };

  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-white to-pink-100">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-2xl w-full border-b-[12px] border-indigo-200">
          <div className="text-7xl mb-6">✨🎨</div>
          <h1 className="text-5xl font-title text-indigo-600 mb-4 tracking-tight">AI 컬러링 마스터</h1>
          <p className="text-lg text-gray-500 mb-10">단계별로 정교해지는 도안에 도전하세요. 10단계 마스터에 도전할 수 있을까요?</p>
          
          <div className="grid grid-cols-5 gap-4 mb-8">
            {levels.map(lv => (
              <button
                key={lv}
                onClick={() => selectLevel(lv)}
                className="group relative h-16 bg-white hover:bg-indigo-600 border-2 border-indigo-100 hover:border-indigo-600 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-indigo-200 hover:-translate-y-1"
              >
                <span className="text-2xl font-bold text-indigo-600 group-hover:text-white">{lv}</span>
                <span className="absolute -bottom-1 text-[10px] font-bold text-indigo-300 group-hover:text-indigo-100 uppercase">LV</span>
              </button>
            ))}
          </div>
          <p className="text-indigo-400 font-medium">원하는 단계를 눌러 바로 시작하세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm py-4 mb-6 sticky top-0 z-50 px-6 border-b border-indigo-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => setGameStarted(false)}
            className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> 목록으로
          </button>
          
          <div className="flex gap-2">
            {levels.map(lv => (
              <button
                key={lv}
                onClick={() => loadLevel(lv)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  currentLevel === lv 
                  ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                  : 'bg-white text-indigo-400 hover:bg-indigo-50 border border-indigo-50'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>

          <div className="w-24 text-right">
            <span className="text-xs font-black text-indigo-300 uppercase tracking-tighter">Gemini AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 mb-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            {currentLevel}
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800">Level {currentLevel}: {topicName || '준비 중...'}</h3>
            <p className="text-indigo-500 text-sm font-medium">
              {currentLevel <= 3 ? '큼직한 구역을 시원하게 칠해보세요!' : 
               currentLevel <= 7 ? '색상의 조화를 생각하며 꼼꼼히 채워주세요.' : 
               '최고 난이도입니다! 아주 세밀한 부분까지 마법을 부려보세요.'}
            </p>
          </div>
        </div>

        {isGeneratingImage ? (
          <div className="w-full aspect-square max-w-[600px] mx-auto bg-white rounded-[3rem] shadow-xl flex flex-col items-center justify-center border-4 border-dashed border-indigo-100 animate-pulse">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-2xl font-title text-indigo-900">도안 생성 중...</p>
            <p className="text-indigo-400 font-bold mt-2">Level {currentLevel} 도안을 AI가 그리고 있습니다.</p>
          </div>
        ) : currentImageUrl && (
          <DrawingCanvas 
            backgroundImage={currentImageUrl} 
            onSave={handleSaveDrawing}
            isProcessing={isProcessing}
          />
        )}

        {feedback && (
          <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-[pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
              <div className={`p-10 text-center ${feedback.score >= 80 ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                <div className={`text-7xl mb-6 ${feedback.score >= 80 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                  {feedback.score >= 90 ? '🏆' : feedback.score >= 70 ? '🎨' : '✨'}
                </div>
                <h4 className="text-3xl font-black text-gray-800 mb-2">Level {currentLevel} 완료!</h4>
                <div className="text-6xl font-black text-indigo-600 mb-6 drop-shadow-sm">
                  {feedback.score}<span className="text-2xl">점</span>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed font-medium bg-white/80 p-4 rounded-2xl border border-white">
                  "{feedback.message}"
                </p>
              </div>
              <div className="p-8 bg-white flex flex-col gap-3">
                <button 
                  onClick={() => currentLevel < 10 ? loadLevel(currentLevel + 1) : setGameStarted(false)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  {currentLevel < 10 ? '다음 레벨 도전!' : '축하합니다! 처음으로'}
                </button>
                <button 
                  onClick={() => setFeedback(null)}
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-2xl transition-colors"
                >
                  한 번 더 칠하기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
