import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronRight, LogOut, AlertCircle, Activity, Stethoscope, Users, X } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Kiểm Tra Trực Tuyến - Secure Platform" },
    { name: "description", content: "Nền tảng kiểm tra trực tuyến bảo mật" },
  ];
}

const MOCK_TESTS = [
  { id: "duocdonghoc", title: "Dược động học", description: "Các câu hỏi kiểm tra kiến thức về dược động học.", icon: Activity, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { id: "duoclamsang", title: "Dược lâm sàng", description: "Kiểm tra kiến thức dược lâm sàng chuyên sâu.", icon: Stethoscope, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "duoccongdong", title: "Dược cộng đồng", description: "Vai trò, sứ mệnh và chuyên môn của dược sĩ cộng đồng.", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [pinError, setPinError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | "all">(25);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [totalQuestionsInDb, setTotalQuestionsInDb] = useState(0);

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

  useEffect(() => {
    const auth = localStorage.getItem("testAppAuth");
    setIsAuthenticated(auth === "true");
  }, []);

  useEffect(() => {
    if (activeTestId) {
      setIsDataLoaded(false);
      fetch(`/${activeTestId}.json`)
        .then((res) => res.json())
        .then((data) => {
          setTotalQuestionsInDb(data.length);
          setIsDataLoaded(true);
        })
        .catch((err) => {
          console.error("Failed to load questions:", err);
          setIsDataLoaded(true);
        });
    }
  }, [activeTestId]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setPinError("");

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value !== "") {
      const fullPin = newPin.join("");
      if (fullPin === "020479") {
        setTimeout(() => {
          localStorage.setItem("testAppAuth", "true");
          setIsAuthenticated(true);
        }, 300);
      } else {
        setPinError("Mã PIN không hợp lệ");
        setTimeout(() => {
          setPin(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }, 800);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && pin[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = [...pin];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newPin[i] = char;
    });
    setPin(newPin);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      if (pastedData === "020479") {
        setTimeout(() => {
          localStorage.setItem("testAppAuth", "true");
          setIsAuthenticated(true);
        }, 300);
      } else {
        setPinError("Mã PIN không hợp lệ");
        setTimeout(() => {
          setPin(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }, 800);
      }
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const startTest = () => {
    if (isDataLoaded && activeTestId) {
      navigate(`/test/${activeTestId}?count=${questionCount}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("testAppAuth");
    setIsAuthenticated(false);
    setPin(Array(6).fill(""));
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Xác thực quyền truy cập</h1>
              <p className="text-zinc-400 text-sm">Vui lòng nhập mã PIN gồm 6 chữ số</p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
              {pin.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold bg-zinc-950 border ${pinError ? "border-red-500/50 text-red-400" : digit ? "border-indigo-500 text-white" : "border-zinc-800 text-white"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner`}
                  animate={pinError ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>

            <AnimatePresence>
              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  {pinError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeTest = MOCK_TESTS.find((t) => t.id === activeTestId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-20%] w-[60%] h-[60%] bg-violet-900/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              BUI THANH TRUC
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Chọn Bài Kiểm Tra</h2>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Lựa chọn chuyên đề bạn muốn kiểm tra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {MOCK_TESTS.map((test, index) => {
              const Icon = test.icon;
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => setActiveTestId(test.id)}
                  className="group cursor-pointer bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:bg-zinc-800/60 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transition-transform group-hover:scale-110" />

                  <div className={`w-14 h-14 rounded-2xl ${test.bg} ${test.border} border flex items-center justify-center mb-6`}>
                    <Icon className={`w-7 h-7 ${test.color}`} />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{test.title}</h3>
                  <p className="text-zinc-400 leading-relaxed mb-6">{test.description}</p>

                  <div className="inline-flex items-center gap-2 text-indigo-400 font-medium group-hover:text-indigo-300 transition-colors">
                    <span>Cấu hình đề thi</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* Modal for Selecting Question Count */}
      <AnimatePresence>
        {activeTestId && activeTest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTestId(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative z-10 w-full max-w-lg"
            >
              <button
                onClick={() => setActiveTestId(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`w-16 h-16 rounded-2xl ${activeTest.bg} ${activeTest.border} border flex items-center justify-center mb-6`}>
                <activeTest.icon className={`w-8 h-8 ${activeTest.color}`} />
              </div>

              <h3 className="text-3xl font-bold text-white mb-2">{activeTest.title}</h3>
              <p className="text-zinc-400 mb-8">
                Vui lòng chọn số lượng câu hỏi bạn muốn làm.
                {isDataLoaded && <span className="block mt-1 text-indigo-400">Ngân hàng hiện có: {totalQuestionsInDb} câu</span>}
              </p>

              <div className="mb-8">
                <div className="grid grid-cols-3 gap-3">
                  {[10, 25, 50, 75, 100, "all"].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num as any)}
                      className={`relative py-3 rounded-xl text-base font-medium transition-all duration-300 ${questionCount === num
                        ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/5"
                        }`}
                    >
                      {questionCount === num && (
                        <motion.div
                          layoutId="activeModalTab"
                          className="absolute inset-0 border-2 border-indigo-400 rounded-xl"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{num === "all" ? "Tất cả" : `${num} Câu`}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startTest}
                disabled={!isDataLoaded}
                className="w-full relative inline-flex items-center justify-center gap-2 bg-white text-zinc-950 font-bold text-lg py-4 px-8 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bắt Đầu Làm Bài
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
