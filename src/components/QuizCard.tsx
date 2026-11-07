import React from 'react';
import { Question } from '../types/quiz';
import { CheckCircle2, XCircle, Hand, Sparkles, BookOpen } from 'lucide-react';

interface QuizCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  activeFinger: number | null; // 1 to 4
  holdProgress: number; // 0 to 1
  selectedOptionIndex: number | null; // 0 to 3 when answered
  isAnswered: boolean;
  onSelectOption: (optionIndex: number) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  물리: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  화학: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  생명과학: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  지구과학: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const FINGER_EMOJIS = ['☝️ 1개', '✌️ 2개', '🤟 3개', '🖖 4개'];

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  activeFinger,
  holdProgress,
  selectedOptionIndex,
  isAnswered,
  onSelectOption
}) => {
  const catColor = CATEGORY_COLORS[question.category] || {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl flex flex-col justify-between">
      {/* Question Header & Metadata */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}
            >
              {question.category}
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2 py-1 rounded-md border border-slate-700/50">
              {question.grade}
            </span>
            {question.context && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                {question.context}
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-400 tabular-nums">
            문제 <span className="text-white font-bold">{currentIndex + 1}</span> / {totalQuestions}
          </div>
        </div>

        {/* Question Title */}
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug tracking-tight mb-6">
          <span className="text-blue-400 mr-2 font-mono">Q{currentIndex + 1}.</span>
          {question.question}
        </h2>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
        {question.options.map((optionText, idx) => {
          const optionNumber = idx + 1; // 1, 2, 3, 4
          const isGestureTarget = !isAnswered && activeFinger === optionNumber;
          const isCorrect = isAnswered && idx === question.correctIndex;
          const isUserPick = isAnswered && idx === selectedOptionIndex;
          const isWrongPick = isUserPick && !isCorrect;

          // Compute card styling
          let cardStyle = 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950';

          if (isAnswered) {
            if (isCorrect) {
              cardStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/40';
            } else if (isWrongPick) {
              cardStyle = 'bg-rose-950/40 border-rose-500 text-rose-100';
            } else {
              cardStyle = 'bg-slate-950/30 border-slate-800/60 text-slate-500 opacity-60';
            }
          } else if (isGestureTarget) {
            cardStyle = 'bg-sky-950/40 border-sky-400 text-white shadow-md shadow-sky-900/30 ring-1 ring-sky-400';
          }

          return (
            <button
              key={idx}
              onClick={() => !isAnswered && onSelectOption(idx)}
              disabled={isAnswered}
              className={`relative overflow-hidden w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 group cursor-pointer disabled:cursor-default ${cardStyle}`}
            >
              {/* Active Gesture Hold Fill Background Bar */}
              {isGestureTarget && holdProgress > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500/20 transition-all duration-75 pointer-events-none"
                  style={{ width: `${holdProgress * 100}%` }}
                />
              )}

              {/* Option Left Side: Number Badge & Text */}
              <div className="relative z-10 flex items-center gap-3.5 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
                    isAnswered && isCorrect
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                      : isAnswered && isWrongPick
                      ? 'bg-rose-500 border-rose-400 text-white'
                      : isGestureTarget
                      ? 'bg-sky-500 border-sky-400 text-slate-950 font-black'
                      : 'bg-slate-900 border-slate-700 text-slate-300 group-hover:border-slate-500 group-hover:text-white'
                  }`}
                >
                  {optionNumber}
                </div>
                <span className="text-sm sm:text-base font-medium leading-relaxed">
                  {optionText}
                </span>
              </div>

              {/* Option Right Side: Gesture Hint or Feedback Status */}
              <div className="relative z-10 shrink-0 flex items-center gap-2">
                {isAnswered ? (
                  isCorrect ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>정답</span>
                    </div>
                  ) : isWrongPick ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-500/40">
                      <XCircle className="w-4 h-4" />
                      <span>선택한 오답</span>
                    </div>
                  ) : null
                ) : (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isGestureTarget
                        ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 group-hover:text-slate-300 group-hover:border-slate-700'
                    }`}
                  >
                    <span>{FINGER_EMOJIS[idx]}</span>
                    {isGestureTarget && (
                      <span className="text-[10px] text-sky-300 font-mono">
                        ({Math.round(holdProgress * 100)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Helpful Hint Footer */}
      {!isAnswered && (
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-sky-400" />
            손가락 개수를 맞춰 1.5초 유지하거나, 마우스로 보기를 클릭하세요.
          </span>
          <span className="text-slate-500 hidden sm:inline">단축키: 1 ~ 4</span>
        </div>
      )}
    </div>
  );
};
