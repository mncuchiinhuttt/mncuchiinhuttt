import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/test";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RotateCcw, ChevronRight, Check, X, Map as MapIcon, ChevronUp } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Đang làm bài kiểm tra" },
    { name: "description", content: "Bài kiểm tra ngẫu nhiên" },
  ];
}

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

export default function TestRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const countParam = searchParams.get("count") || "25";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mobile Map State
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("testAppAuth");
    if (auth !== "true") {
      navigate("/");
      return;
    }
    setIsAuthenticated(true);

    fetch(`/${id}.json`)
      .then((res) => res.json())
      .then((data: Question[]) => {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const count = countParam === "all" ? data.length : parseInt(countParam);
        setTestQuestions(shuffled.slice(0, count));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load questions:", err);
        setIsLoading(false);
      });
  }, [countParam, navigate]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const submitTest = () => {
    let currentScore = 0;
    testQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.answer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setIsSubmitted(true);
    setIsMobileMapOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`question-${index}`);
    if (el) {
      const headerOffset = 180;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      // Auto close mobile map if opened
      if (isMobileMapOpen) {
        setIsMobileMapOpen(false);
      }
    }
  };

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-violet-900/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            BUI THANH TRUC
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Thoát phòng thi
          </button>
        </div>
      </header>

      {/* Adjust padding bottom on mobile to accommodate the floating bottom bar */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32 lg:pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="testing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start"
            >
              {/* Left Column: Test Questions & Sticky Header */}
              <div className="relative">
                {/* Sticky Progress Bar */}
                <div className="sticky top-20 z-40 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Phòng Thi</h3>
                      <p className="text-sm text-zinc-400 font-medium">{testQuestions.length} câu hỏi ngẫu nhiên</p>
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-950/50 px-5 py-2.5 rounded-2xl border border-white/5 shrink-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Tiến độ</span>
                        <span className="text-base font-bold text-indigo-400">
                          {Object.keys(userAnswers).length} / {testQuestions.length}
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(Object.keys(userAnswers).length / testQuestions.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-8">
                  {testQuestions.map((q, index) => (
                    <motion.div
                      key={q.id}
                      id={`question-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.5 }}
                      className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 sm:p-8 hover:bg-zinc-900/60 transition-colors scroll-mt-32"
                    >
                      <div className="flex gap-4 mb-6">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-zinc-400 border border-white/5">
                          {index + 1}
                        </div>
                        <h4 className="text-xl font-semibold leading-relaxed mt-1">{q.question}</h4>
                      </div>
                      <div className="grid gap-3 pl-0 sm:pl-14">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = userAnswers[q.id] === optIndex;
                          return (
                            <label
                              key={optIndex}
                              className={`group relative flex items-center p-4 cursor-pointer rounded-2xl border transition-all duration-200 ${isSelected
                                ? "bg-indigo-500/10 border-indigo-500/50"
                                : "bg-zinc-950/50 border-white/5 hover:border-white/20 hover:bg-zinc-800/50"
                                }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={optIndex}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(q.id, optIndex)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected ? "border-indigo-400" : "border-zinc-600 group-hover:border-zinc-400"
                                }`}>
                                <AnimatePresence>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      className="w-2.5 h-2.5 bg-indigo-400 rounded-full"
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                              <span className={`text-base ${isSelected ? "text-white" : "text-zinc-300"}`}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: Navigation Map & Submit (Desktop Only) */}
              <div className="hidden lg:block sticky top-20 z-30">
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col h-[calc(100vh-8rem)]">
                  <div className="flex items-center gap-2 mb-6 text-white font-bold text-lg">
                    <MapIcon className="w-5 h-5 text-indigo-400" />
                    Bản đồ câu hỏi
                  </div>

                  {/* Grid of questions */}
                  <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start pb-4">
                    {testQuestions.map((q, index) => {
                      const isAnswered = userAnswers[q.id] !== undefined;
                      return (
                        <button
                          key={index}
                          onClick={() => scrollToQuestion(index)}
                          className={`h-12 w-full rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 border ${isAnswered
                            ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                            : "bg-zinc-950/50 text-zinc-500 border-white/5 hover:border-white/20 hover:text-zinc-300"
                            }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit Button Area */}
                  <div className="pt-6 mt-2 border-t border-white/10 shrink-0">
                    <div className="text-zinc-400 text-xs font-medium text-center mb-4">
                      Hãy kiểm tra lại các đáp án trước khi nộp bài.
                    </div>
                    <button
                      onClick={submitTest}
                      className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transform hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Nộp Bài
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Sheet (Floating Map) */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                {/* Backdrop */}
                <AnimatePresence>
                  {isMobileMapOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileMapOpen(false)}
                      className="absolute bottom-full left-0 right-0 h-[100vh] bg-zinc-950/60 backdrop-blur-sm"
                    />
                  )}
                </AnimatePresence>

                {/* Sheet */}
                <motion.div
                  className="bg-zinc-900 border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col relative"
                  animate={{ height: isMobileMapOpen ? '80vh' : '90px' }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                  {/* Handle to toggle */}
                  <div
                    className="h-[90px] px-6 flex items-center justify-between cursor-pointer active:bg-white/5 transition-colors"
                    onClick={() => setIsMobileMapOpen(!isMobileMapOpen)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <MapIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-white font-bold block text-lg">Bản đồ & Nộp bài</span>
                        <span className="text-sm text-indigo-400 font-medium">{Object.keys(userAnswers).length} / {testQuestions.length} câu đã làm</span>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isMobileMapOpen ? 180 : 0 }}>
                      <ChevronUp className="w-6 h-6 text-zinc-400" />
                    </motion.div>
                  </div>

                  {/* Content (Expanded Mode) */}
                  <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 border-t border-white/5">
                    <div className="py-4 text-zinc-400 text-sm font-medium">Danh sách câu hỏi</div>
                    
                    <div className="overflow-y-auto flex-1 custom-scrollbar grid grid-cols-5 gap-3 content-start pb-4">
                      {testQuestions.map((q, index) => {
                        const isAnswered = userAnswers[q.id] !== undefined;
                        return (
                          <button
                            key={index}
                            onClick={() => scrollToQuestion(index)}
                            className={`h-12 w-full rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 border ${isAnswered
                              ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                              : "bg-zinc-950/50 text-zinc-500 border-white/5 hover:border-white/20 hover:text-zinc-300"
                              }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 mt-2 shrink-0">
                      <button
                        onClick={submitTest}
                        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Hoàn Thành & Nộp Bài
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col items-center text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 ring-8 ring-indigo-500/10"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-bold mb-3 tracking-tight">Kết Quả Bài Làm</h2>
                  <p className="text-zinc-400 text-lg">Bạn đã hoàn thành xuất sắc bài kiểm tra!</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-12">
                  <div className="bg-zinc-950/50 p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-zinc-500 text-xs sm:text-sm uppercase tracking-widest font-bold mb-2 sm:mb-3">Số câu đúng</span>
                    <div className="text-4xl sm:text-5xl font-black text-white">
                      {score} <span className="text-xl sm:text-2xl text-zinc-600 font-medium">/ {testQuestions.length}</span>
                    </div>
                  </div>
                  <div className="bg-indigo-500/5 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 flex flex-col items-center justify-center">
                    <span className="text-indigo-400/80 text-xs sm:text-sm uppercase tracking-widest font-bold mb-2 sm:mb-3">Chính xác</span>
                    <div className="text-4xl sm:text-5xl font-black text-indigo-400">
                      {Math.round((score / testQuestions.length) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      navigate("/");
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] transform hover:scale-[1.02]"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Về Trang Chủ
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold px-4 mb-8">Chi Tiết Trả Lời</h3>
                {testQuestions.map((q, index) => {
                  const userAnswerIdx = userAnswers[q.id];
                  const isCorrect = userAnswerIdx === q.answer;
                  const isUnanswered = userAnswerIdx === undefined;

                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(0.5 + index * 0.05, 1.5) }}
                      className={`bg-zinc-900/40 rounded-3xl p-5 sm:p-8 border ${isCorrect ? 'border-emerald-500/20' : isUnanswered ? 'border-amber-500/20' : 'border-rose-500/20'
                        }`}
                    >
                      <div className="flex gap-4 sm:gap-5 items-start">
                        <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isUnanswered ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                          {isCorrect ? <Check className="w-4 h-4" /> : isUnanswered ? <span className="text-sm font-bold">?</span> : <X className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-white mb-4 leading-relaxed">
                            <span className="text-zinc-500 mr-2">Câu {index + 1}.</span>
                            {q.question}
                          </h4>

                          <div className="bg-zinc-950/50 rounded-2xl p-4 sm:p-5 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <span className="text-zinc-500 text-sm">Bạn chọn</span>
                              <span className={`font-semibold text-right max-w-[60%] ${isCorrect ? 'text-emerald-400' : isUnanswered ? 'text-amber-400' : 'text-rose-400'}`}>
                                {isUnanswered ? "Không chọn" : q.options[userAnswerIdx]}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-zinc-500 text-sm">Đáp án đúng</span>
                                <span className="font-semibold text-emerald-400 text-right max-w-[60%]">{q.options[q.answer]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
