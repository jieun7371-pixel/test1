import React from 'react';
import { Question } from '../types/quiz';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, Trophy, Sparkles, Hand } from 'lucide-react';

interface ExplanationPanelProps {
  question: Question;
  selectedOptionIndex: number;
  isLastQuestion: boolean;
  onNextQuestion: () => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  question,
  selectedOptionIndex,
  isLastQuestion,
  onNextQuestion
}) => {
  const isCorrect = selectedOptionIndex === question.correctIndex;
  const correctOptionText = question.options[question.correctIndex];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl mt-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Result Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 mb-5 ${
          isCorrect
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
            : 'bg-rose-950/40 border-rose-500/50 text-rose-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold">
                {isCorrect ? '정답입니다!' : '오답입니다!'}
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isCorrect
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                }`}
              >
                {isCorrect ? '+10점' : '+0점'}
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-0.5 opacity-90">
              {isCorrect
                ? '훌륭합니다! 교과 핵심 개념을 정확히 이해하고 계시네요.'
                : `정답은 ${question.correctIndex + 1}번 「${correctOptionText}」 입니다.`}
            </p>
          </div>
        </div>

        {/* Next Question Primary CTA Button */}
        <button
          onClick={onNextQuestion}
          className="shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:translate-x-0.5 cursor-pointer"
        >
          <span>{isLastQuestion ? '최종 결과 보기' : '다음 문제'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Core Concept Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
          <Lightbulb className="w-4 h-4" />
          <span>핵심 과학 원리</span>
        </div>
        <p className="text-sm font-semibold text-slate-200">
          {question.keyConcept}
        </p>
      </div>

      {/* Detailed Pedagogical Explanation */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          상세 해설
        </h4>
        <p>{question.explanation}</p>
      </div>

      {/* Gesture Tip */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Hand className="w-3.5 h-3.5 text-sky-400" />
          손바닥(5개 손가락)을 1.5초 들고 있으면 다음 문제로 바로 넘어갑니다.
        </span>
        <button
          onClick={onNextQuestion}
          className="text-blue-400 hover:text-blue-300 underline font-medium"
        >
          {isLastQuestion ? '결과 페이지로' : '클릭하여 다음으로'}
        </button>
      </div>
    </div>
  );
};
