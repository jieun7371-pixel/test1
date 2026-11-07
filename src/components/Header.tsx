import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck, HelpCircle, X, Sparkles, MousePointer, Hand, ArrowLeftRight } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  isMouseMode: boolean;
  onToggleMouseMode: () => void;
  cameraPosition?: 'right' | 'left';
  onToggleCameraPosition?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  score,
  isMouseMode,
  onToggleMouseMode,
  cameraPosition = 'right',
  onToggleCameraPosition
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sound.setMuted(nextState);
    if (!nextState) {
      sound.playTick(1.2);
    }
  };

  return (
    <>
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand Wordmark Zone */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-extrabold text-lg">
              科
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                중학 과학 제스처 퀴즈
                <span className="hidden sm:inline-block text-[11px] font-medium text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                  MediaPipe AI
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden md:block">
                손가락 1~4개로 1.5초 유지하여 정답 선택
              </p>
            </div>
          </div>

          {/* Interactive Controls & Status Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Input Mode Pill Selector */}
            <button
              onClick={onToggleMouseMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="입력 모드 변경 (제스처 / 마우스)"
            >
              {isMouseMode ? (
                <>
                  <MousePointer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">마우스 모드</span>
                </>
              ) : (
                <>
                  <Hand className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">손 제스처 모드</span>
                </>
              )}
            </button>

            {/* Camera Position Toggle Button */}
            {!isMouseMode && onToggleCameraPosition && (
              <button
                onClick={onToggleCameraPosition}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title={`카메라를 문제 ${cameraPosition === 'right' ? '좌측' : '우측'}으로 이동`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden md:inline">
                  {cameraPosition === 'right' ? '카메라 우측' : '카메라 좌측'}
                </span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label={isMuted ? '음소거 해제' : '음소거'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Help & Guide Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              aria-label="이용 안내"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Privacy Shield Button */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              aria-label="개인정보 및 카메라 보안 안내"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Privacy Guarantee Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">100% 로컬 프라이버시 보호</h3>
                <p className="text-xs text-slate-400">브라우저 내 인공지능 온디바이스 처리</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                본 웹앱은 <strong>Google MediaPipe Hand Landmarker</strong> 기술을 브라우저의 WebAssembly 및 WebGL 환경에서 직접 구동합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>카메라 영상 스트림은 <strong>외부 서버나 클라우드로 일체 전송되지 않습니다.</strong></li>
                <li>손가락 좌표 계산 후 프레임은 메모리에서 즉시 폐기됩니다.</li>
                <li>언제든지 카메라를 끄고 <strong>마우스 클릭 모드</strong>로 전환하여 문제를 풀 수 있습니다.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">제스처 퀴즈 조작 방법</h3>
                <p className="text-xs text-slate-400">손가락으로 퀴즈를 즐기는 3단계 가이드</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-semibold">
                  <span>1. 손가락 1~4개 펴기</span>
                </div>
                <p className="text-slate-400">
                  웹캠 화면에 손을 대고 선택하려는 보기 번호(1~4번)만큼 손가락을 펼칩니다.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">☝️ 1번</div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">✌️ 2번</div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">🤟 3번</div>
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800">🖖 4번</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <span>2. 1.5초 유지하여 확정</span>
                </div>
                <p className="text-slate-400">
                  원하는 번호를 1.5초 동안 유지하면 진행 링이 차오르며 자동으로 정답이 확정 제출됩니다.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <span>3. 마우스 클릭 대체 가능</span>
                </div>
                <p className="text-slate-400">
                  카메라가 없거나 손을 들기 어려운 환경에서는 보기 카드를 마우스로 직접 클릭하면 즉시 확정됩니다.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                이해했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
