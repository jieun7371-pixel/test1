/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SCIENCE_QUESTIONS } from './data/scienceQuestions';
import { Question, QuizPhase, UserAnswerRecord } from './types/quiz';
import { Header } from './components/Header';
import { QuizCard } from './components/QuizCard';
import { ExplanationPanel } from './components/ExplanationPanel';
import { CameraHandTracker } from './components/CameraHandTracker';
import { ResultScreen } from './components/ResultScreen';
import { sound } from './utils/sound';
import { 
  Sparkles, 
  HelpCircle, 
  Hand, 
  MousePointer, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck,
  ArrowLeftRight 
} from 'lucide-react';

export default function App() {
  // Quiz Dataset & State
  const [activeQuestionSet, setActiveQuestionSet] = useState<Question[]>(SCIENCE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<QuizPhase>('playing');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);

  // Input & Gesture states
  const [isMouseMode, setIsMouseMode] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<'right' | 'left'>('right');
  const [activeFinger, setActiveFinger] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const currentQuestion = activeQuestionSet[currentIndex] || activeQuestionSet[0];
  const totalQuestions = activeQuestionSet.length;
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  // Calculate live score
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const currentScore = correctCount * 10;

  // Reset per-question timers
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Handle hand gesture finger updates
  const handleFingerSelect = useCallback((finger: number | null, progress: number) => {
    if (phase !== 'playing') {
      setActiveFinger(null);
      setHoldProgress(0);
      return;
    }
    setActiveFinger(finger);
    setHoldProgress(progress);
  }, [phase]);

  // Confirm selection (called after 1.5s hold or on mouse click)
  const handleConfirmAnswer = useCallback((optionNumber: number) => {
    if (phase !== 'playing') return;

    const optionIdx = optionNumber - 1; // 1-based to 0-based
    if (optionIdx < 0 || optionIdx > 3) return;

    const isCorrect = optionIdx === currentQuestion.correctIndex;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    setSelectedOptionIndex(optionIdx);
    setPhase('answered');
    setActiveFinger(null);
    setHoldProgress(0);

    // Record answer
    setUserAnswers(prev => [
      ...prev.filter(a => a.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        selectedOptionIndex: optionIdx,
        isCorrect,
        timeSpentSec: timeSpent
      }
    ]);

    // Audio feedback
    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }
  }, [phase, currentQuestion, questionStartTime]);

  // Mouse click selection on option
  const handleMouseClickOption = useCallback((optionIdx: number) => {
    sound.playLockIn();
    handleConfirmAnswer(optionIdx + 1);
  }, [handleConfirmAnswer]);

  // Next question navigation
  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setPhase('finished');
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedOptionIndex(null);
    setActiveFinger(null);
    setHoldProgress(0);
    setPhase('playing');
    sound.playTick(1.4);
  }, [isLastQuestion]);

  // Restart all 10 questions
  const handleRestartAll = useCallback(() => {
    setActiveQuestionSet(SCIENCE_QUESTIONS);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setActiveFinger(null);
    setHoldProgress(0);
    setUserAnswers([]);
    setPhase('playing');
    sound.playTick(1.2);
  }, []);

  // Retry only incorrect questions
  const handleRetryIncorrect = useCallback((incorrectIds: number[]) => {
    const wrongQuestions = SCIENCE_QUESTIONS.filter(q => incorrectIds.includes(q.id));
    if (wrongQuestions.length === 0) return;

    setActiveQuestionSet(wrongQuestions);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setActiveFinger(null);
    setHoldProgress(0);
    // Keep answers of others or reset
    setUserAnswers(prev => prev.filter(a => !incorrectIds.includes(a.questionId)));
    setPhase('playing');
    sound.playTick(1.2);
  }, []);

  // Keyboard shortcut listener (1, 2, 3, 4, Enter, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'playing') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const num = parseInt(e.key, 10);
          handleConfirmAnswer(num);
        }
      } else if (phase === 'answered') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleConfirmAnswer, handleNextQuestion]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <Header
        currentQuestionIndex={currentIndex}
        totalQuestions={totalQuestions}
        score={currentScore}
        isMouseMode={isMouseMode}
        onToggleMouseMode={() => setIsMouseMode(prev => !prev)}
        cameraPosition={cameraPosition}
        onToggleCameraPosition={() => setCameraPosition(prev => prev === 'right' ? 'left' : 'right')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {phase === 'finished' ? (
          <ResultScreen
            questions={activeQuestionSet}
            userAnswers={userAnswers}
            onRestartAll={handleRestartAll}
            onRetryIncorrect={handleRetryIncorrect}
          />
        ) : (
          <div className="space-y-6">
            {/* Live Progress Bar & Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">진행률</span>
                <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + (phase === 'answered' ? 1 : 0)) / totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300 tabular-nums">
                  {currentIndex + 1} / {totalQuestions}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>현재 점수: <strong className="text-white text-sm tabular-nums">{currentScore}</strong>점</span>
                </div>
                <div className="text-slate-500 hidden sm:block">·</div>
                <div className="text-slate-400">
                  남은 문제: <span className="text-slate-200">{totalQuestions - (currentIndex + 1)}개</span>
                </div>
              </div>
            </div>

            {/* Split 2-Column Grid: Question & Interactive Canvas / Webcam side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* Question & Explanations Column */}
              <div className={`space-y-4 md:col-span-7 ${cameraPosition === 'right' ? 'md:order-1 order-2' : 'md:order-2 order-2'}`}>
                <QuizCard
                  question={currentQuestion}
                  currentIndex={currentIndex}
                  totalQuestions={totalQuestions}
                  activeFinger={activeFinger}
                  holdProgress={holdProgress}
                  selectedOptionIndex={selectedOptionIndex}
                  isAnswered={phase === 'answered'}
                  onSelectOption={handleMouseClickOption}
                />

                {/* Explanation Panel revealed upon answer */}
                {phase === 'answered' && selectedOptionIndex !== null && (
                  <ExplanationPanel
                    question={currentQuestion}
                    selectedOptionIndex={selectedOptionIndex}
                    isLastQuestion={isLastQuestion}
                    onNextQuestion={handleNextQuestion}
                  />
                )}
              </div>

              {/* Camera & Gesture Recognition Column: Right next to the question */}
              <div className={`space-y-4 md:col-span-5 md:sticky md:top-20 ${cameraPosition === 'right' ? 'md:order-2 order-1' : 'md:order-1 order-1'}`}>
                {/* Tracker Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <Hand className="w-4 h-4 text-sky-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        AI 손가락 제스처
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCameraPosition(p => p === 'right' ? 'left' : 'right')}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                        title={`카메라를 문제 ${cameraPosition === 'right' ? '좌측' : '우측'}으로 이동`}
                      >
                        <ArrowLeftRight className="w-3 h-3 text-sky-400" />
                        <span>{cameraPosition === 'right' ? '좌측으로' : '우측으로'}</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        MediaPipe
                      </span>
                    </div>
                  </div>

                  <CameraHandTracker
                    onFingerSelect={handleFingerSelect}
                    onConfirmSelection={handleConfirmAnswer}
                    onConfirmNextQuestion={phase === 'answered' ? handleNextQuestion : undefined}
                    isQuestionAnswered={phase === 'answered'}
                    disabled={false}
                    isMouseMode={isMouseMode}
                    onSwitchToMouseMode={() => setIsMouseMode(prev => !prev)}
                  />
                </div>

                {/* Gesture Guide Cheatsheet Card */}
                <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    제스처 매칭 규칙 (1.5초 유지)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                      <span className="text-base">☝️</span>
                      <div>
                        <div className="font-bold text-white">손가락 1개</div>
                        <div className="text-slate-400">1번 보기 선택</div>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                      <span className="text-base">✌️</span>
                      <div>
                        <div className="font-bold text-white">손가락 2개</div>
                        <div className="text-slate-400">2번 보기 선택</div>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                      <span className="text-base">🤟</span>
                      <div>
                        <div className="font-bold text-white">손가락 3개</div>
                        <div className="text-slate-400">3번 보기 선택</div>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                      <span className="text-base">🖖</span>
                      <div>
                        <div className="font-bold text-white">손가락 4개</div>
                        <div className="text-slate-400">4번 보기 선택</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300 flex items-center gap-2">
                    <span className="text-base">🖐️</span>
                    <span>해설 화면에서 손바닥(5개)을 1.5초 들면 다음 문제로 자동 이동!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>중학교 과학 4지선다 10문제 웹앱 · MediaPipe Hand Landmarker</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>브라우저 온디바이스 AI</span>
            <span>·</span>
            <span>마우스/터치 지원</span>
            <span>·</span>
            <span>개인정보 안전 보장</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
