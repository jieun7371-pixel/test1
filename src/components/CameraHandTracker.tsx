import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { analyzeFingers, drawHand, LandmarkPoint } from '../utils/handDetection';
import { sound } from '../utils/sound';
import { 
  Camera, 
  CameraOff, 
  ShieldCheck, 
  AlertTriangle, 
  Hand, 
  MousePointer, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

interface CameraHandTrackerProps {
  onFingerSelect: (finger: number | null, progress: number) => void;
  onConfirmSelection: (finger: number) => void;
  onConfirmNextQuestion?: () => void;
  isQuestionAnswered: boolean;
  disabled?: boolean;
  onSwitchToMouseMode?: () => void;
  isMouseMode?: boolean;
}

export const CameraHandTracker: React.FC<CameraHandTrackerProps> = ({
  onFingerSelect,
  onConfirmSelection,
  onConfirmNextQuestion,
  isQuestionAnswered,
  disabled = false,
  onSwitchToMouseMode,
  isMouseMode = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Status states
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initStatusText, setInitStatusText] = useState<string>('MediaPipe 비전 엔진 로딩 중...');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [currentFingers, setCurrentFingers] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Gesture hold tracking refs
  const candidateFingerRef = useRef<number | null>(null);
  const holdStartTimestampRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const isConfirmedRef = useRef<boolean>(false);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        setIsInitializing(true);
        setInitStatusText('AI 비전 모델 초기화 중...');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        setInitStatusText('손가락 랜드마커 모델 로딩 중...');
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!isMounted) return;

        landmarkerRef.current = landmarker;
        setIsInitializing(false);
      } catch (err) {
        console.error('MediaPipe initialization failed:', err);
        if (isMounted) {
          setCameraError('AI 손 인식 모듈을 불러오는 중 오류가 발생했습니다. 마우스 모드로 계속할 수 있습니다.');
          setIsInitializing(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Initialize webcam stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('현재 브라우저 환경에서 웹캠 접근 API를 지원하지 않습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Video play error:', e));
          setIsCameraActive(true);
        };
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or failed:', err);
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setCameraError('카메라 권한이 차단되었습니다. 브라우저 주소창의 카메라 권한을 허용하시거나 마우스 클릭 모드로 진행해 주세요.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        setCameraError('연결된 카메라 장치를 찾을 수 없습니다. 마우스 클릭으로 퀴즈를 풀 수 있습니다.');
      } else {
        setCameraError('카메라를 실행할 수 없습니다: ' + (errorObj?.message || '알 수 없는 오류'));
      }
      setIsCameraActive(false);
    }
  }, []);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setHandDetected(false);
    setHoldProgress(0);
    setCurrentFingers(0);
    onFingerSelect(null, 0);
  }, [onFingerSelect]);

  // Handle camera start/stop
  useEffect(() => {
    if (!isInitializing && !isMouseMode) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isInitializing, isMouseMode, startCamera, stopCamera]);

  // Frame processing loop
  useEffect(() => {
    let lastVideoTime = -1;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (
        video &&
        canvas &&
        landmarker &&
        video.readyState >= 2 &&
        !video.paused &&
        !disabled
      ) {
        // Sync canvas size
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const now = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;

          try {
            const results = landmarker.detectForVideo(video, now);
            const ctx = canvas.getContext('2d');

            if (results.landmarks && results.landmarks.length > 0 && ctx) {
              setHandDetected(true);
              const landmarks = results.landmarks[0] as unknown as LandmarkPoint[];
              const analysis = analyzeFingers(landmarks);
              const count = analysis.count;
              setCurrentFingers(count);

              // Gesture Recognition Logic:
              // Case 1: Answering question (count 1 to 4)
              // Case 2: If question answered, 5 fingers or open hand can advance to next question
              const isEligibleTarget = (!isQuestionAnswered && count >= 1 && count <= 4) ||
                                       (isQuestionAnswered && count === 5 && !!onConfirmNextQuestion);

              if (isEligibleTarget) {
                if (candidateFingerRef.current === count) {
                  // Same finger held continuously
                  const elapsed = now - (holdStartTimestampRef.current || now);
                  const progress = Math.min(1, elapsed / 1500);
                  setHoldProgress(progress);
                  onFingerSelect(count, progress);

                  // Sound feedback while holding
                  if (now - lastTickTimeRef.current > 300 && progress > 0.1 && progress < 0.95) {
                    lastTickTimeRef.current = now;
                    sound.playTick(1 + progress * 0.8);
                  }

                  // 1.5 seconds achieved!
                  if (elapsed >= 1500 && !isConfirmedRef.current) {
                    isConfirmedRef.current = true;
                    sound.playLockIn();
                    
                    if (!isQuestionAnswered && count >= 1 && count <= 4) {
                      onConfirmSelection(count);
                    } else if (isQuestionAnswered && count === 5 && onConfirmNextQuestion) {
                      onConfirmNextQuestion();
                    }

                    // Reset after confirmation
                    setTimeout(() => {
                      isConfirmedRef.current = false;
                      holdStartTimestampRef.current = null;
                      candidateFingerRef.current = null;
                      setHoldProgress(0);
                    }, 500);
                  }
                } else {
                  // Finger count changed or started
                  candidateFingerRef.current = count;
                  holdStartTimestampRef.current = now;
                  isConfirmedRef.current = false;
                  setHoldProgress(0);
                  onFingerSelect(count, 0);
                }
              } else {
                // Not in 1..4 range or invalid
                candidateFingerRef.current = null;
                holdStartTimestampRef.current = null;
                isConfirmedRef.current = false;
                setHoldProgress(0);
                onFingerSelect(null, 0);
              }

              // Draw skeleton overlay
              drawHand(ctx, landmarks, count, holdProgress > 0);
            } else {
              setHandDetected(false);
              setCurrentFingers(0);
              candidateFingerRef.current = null;
              holdStartTimestampRef.current = null;
              setHoldProgress(0);
              onFingerSelect(null, 0);
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          } catch (e) {
            console.error('Frame detection error:', e);
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [disabled, isQuestionAnswered, onConfirmSelection, onConfirmNextQuestion, onFingerSelect, holdProgress]);

  return (
    <div className="flex flex-col gap-3">
      {/* Video Container Card */}
      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        {/* Loading Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-200">{initStatusText}</p>
            <p className="text-xs text-slate-400 mt-1">최초 1회 AI 모델 파일 다운로드 중</p>
          </div>
        )}

        {/* Camera Permission or Hardware Error */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 bg-slate-950/95 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-slate-100 mb-1">카메라 연결 불가</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-4 max-w-xs">
              {cameraError}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[220px]">
              <button
                onClick={startCamera}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                카메라 다시 시도
              </button>
              {onSwitchToMouseMode && (
                <button
                  onClick={onSwitchToMouseMode}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                  마우스 클릭 모드로 진행
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real Webcam Stream (Mirrored for natural mirror-like intuition) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Hand Landmark Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Top Floating Badge Bar */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-200">
            <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-emerald-400 ring-2 ring-emerald-500/30 animate-pulse' : 'bg-slate-600'}`} />
            <span className="font-medium">
              {handDetected ? `손 인식됨 (${currentFingers}개)` : '카메라에 손을 보여주세요'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => isCameraActive ? stopCamera() : startCamera()}
              title={isCameraActive ? '카메라 일시정지' : '카메라 켜기'}
              className="p-1.5 rounded-md bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5 text-rose-400" />}
            </button>
          </div>
        </div>

        {/* Center Circular Progress Ring while Holding */}
        {holdProgress > 0 && (
          <div className="absolute inset-0 z-15 flex flex-col items-center justify-center pointer-events-none bg-slate-950/30 backdrop-blur-[1px]">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - holdProgress)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-75"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tabular-nums">
                  {candidateFingerRef.current === 5 && isQuestionAnswered ? '다음' : `${candidateFingerRef.current}번`}
                </span>
                <span className="text-[10px] text-sky-200 font-semibold uppercase tracking-wider">
                  {Math.round(holdProgress * 100)}%
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold text-sky-100 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-sky-500/40 shadow-sm animate-pulse">
              1.5초 유지 시 선택 확정!
            </p>
          </div>
        )}

        {/* Bottom Helper Bar on Camera */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10">
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <Hand className="w-3 h-3 text-sky-400" />
              손가락 1~4개 = 1~4번
            </span>
            <span className="text-slate-400 font-medium">1.5초 유지</span>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee & Mode Switch Banner */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-400 px-1">
        <div className="flex items-start gap-1.5 text-[11px] text-emerald-400/90 leading-tight">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
          <span>
            <strong className="text-emerald-300 font-semibold">100% 로컬 브라우저 처리:</strong> 비디오 영상은 어떤 외부 서버로도 전송되지 않으며 기기 내에서만 실시간 분석됩니다.
          </span>
        </div>

        {onSwitchToMouseMode && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">마우스 클릭이나 터치로도 즉시 풀 수 있습니다.</span>
            <button
              onClick={onSwitchToMouseMode}
              className="text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1"
            >
              <MousePointer className="w-3 h-3" />
              {isMouseMode ? '제스처 모드 켜기' : '마우스 전용 모드'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
