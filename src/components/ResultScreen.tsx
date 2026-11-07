import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Question, UserAnswerRecord, ScienceCategory } from '../types/quiz';
import { sound } from '../utils/sound';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Check, 
  BookOpen,
  HelpCircle,
  Filter
} from 'lucide-react';

interface ResultScreenProps {
  questions: Question[];
  userAnswers: UserAnswerRecord[];
  onRestartAll: () => void;
  onRetryIncorrect: (incorrectIds: number[]) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  questions,
  userAnswers,
  onRestartAll,
  onRetryIncorrect
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [copied, setCopied] = useState(false);

  // Compute statistics
  const totalQuestions = questions.length;
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;
  const score = correctCount * 10;

  // Trigger celebration confetti & fanfare
  useEffect(() => {
    sound.playFanfare();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (score >= 80) {
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.5 }
          });
        }, 300);
      }
    } catch {
      // Ignored
    }
  }, [score]);

  // Category statistics
  const categories: ScienceCategory[] = ['물리', '화학', '생명과학', '지구과학'];
  const categoryStats = categories.map(cat => {
    const catQuestions = questions.filter(q => q.category === cat);
    const catCorrect = catQuestions.filter(q => {
      const ans = userAnswers.find(a => a.questionId === q.id);
      return ans?.isCorrect;
    }).length;
    return {
      category: cat,
      total: catQuestions.length,
      correct: catCorrect,
      rate: catQuestions.length > 0 ? Math.round((catCorrect / catQuestions.length) * 100) : 0
    };
  });

  const incorrectQuestionIds = userAnswers
    .filter(a => !a.isCorrect)
    .map(a => a.questionId);

  // Copy result summary
  const handleCopyResult = () => {
    const text = `[중학 과학 제스처 퀴즈 결과]\n점수: ${score}점 / 100점 (${correctCount}문제 정답 / ${totalQuestions}문제)\n손가락 1~4개 제스처로 푼 AI 과학 퀴즈!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Filter questions for review
  const filteredQuestions = questions.filter(q => {
    const ans = userAnswers.find(a => a.questionId === q.id);
    if (filterType === 'correct') return ans?.isCorrect;
    if (filterType === 'incorrect') return !ans?.isCorrect;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Score Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
        
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          과학 퀴즈 탐구 완료!
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          손가락 인식 제스처와 마우스 조작으로 중학교 과학 10문제를 모두 완주하셨습니다.
        </p>

        {/* Big Score Counter */}
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 tabular-nums">
            {score}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-500">/ 100점</span>
        </div>

        {/* Metric Badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold mb-8">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>정답 {correctCount}개</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300">
            <XCircle className="w-4 h-4" />
            <span>오답 {incorrectCount}개</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            정답률 {Math.round((correctCount / totalQuestions) * 100)}%
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRestartAll}
            className="px-5 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>전체 다시 도전</span>
          </button>

          {incorrectCount > 0 && (
            <button
              onClick={() => onRetryIncorrect(incorrectQuestionIds)}
              className="px-5 py-3 rounded-xl font-bold text-sm text-rose-200 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>틀린 {incorrectCount}문제만 복습</span>
            </button>
          )}

          <button
            onClick={handleCopyResult}
            className="px-4 py-3 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? '결과 복사 완료!' : '결과 복사'}</span>
          </button>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div>
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <span>과목 영역별 성취도 분석</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoryStats.map(stat => (
            <div
              key={stat.category}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold text-slate-200">{stat.category}</span>
                <span>{stat.correct} / {stat.total}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-white tabular-nums">
                  {stat.rate}%
                </span>
                <span className="text-xs text-slate-500 font-medium">정답률</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stat.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10-Question Review Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              10문제 정답 및 상세 해설 검토
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              각 문제를 클릭하면 내가 고른 답과 상세 해설을 확인할 수 있습니다.
            </p>
          </div>

          {/* Review Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              전체 ({totalQuestions})
            </button>
            <button
              onClick={() => setFilterType('incorrect')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              오답 ({incorrectCount})
            </button>
            <button
              onClick={() => setFilterType('correct')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              정답 ({correctCount})
            </button>
          </div>
        </div>

        {/* Question List Accordion */}
        <div className="space-y-3">
          {filteredQuestions.map(q => {
            const answerRecord = userAnswers.find(a => a.questionId === q.id);
            const isCorrect = answerRecord?.isCorrect;
            const userPickIndex = answerRecord?.selectedOptionIndex ?? -1;
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-colors"
              >
                {/* Header Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400">
                          Q{q.id}.
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {q.category} · {q.grade}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isCorrect
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {isCorrect ? '정답' : '오답'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950 space-y-3 text-xs sm:text-sm">
                    {/* Full Question */}
                    <div className="text-slate-100 font-medium">
                      {q.question}
                    </div>

                    {/* Options list with highlight */}
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isOptionCorrect = optIdx === q.correctIndex;
                        const isUserChoice = optIdx === userPickIndex;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                              isOptionCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium'
                                : isUserChoice
                                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{optIdx + 1}.</span>
                              <span>{opt}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isOptionCorrect && (
                                <span className="font-bold text-emerald-400">정답</span>
                              )}
                              {isUserChoice && !isOptionCorrect && (
                                <span className="font-bold text-rose-400">내 선택</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <span>핵심 개념:</span>
                        <span className="text-slate-200">{q.keyConcept}</span>
                      </div>
                      <p className="text-slate-400">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
