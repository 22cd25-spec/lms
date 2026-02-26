"use client";

import { FormEvent, useMemo, useState } from "react";

type Module = {
  id: string;
  title: string;
  videoId: string;
  description: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };
type AuthMode = "login" | "register" | "forgot_password";

const modules: Module[] = [
  { id: "unreal-5", title: "UNREAL ENGINE 5", videoId: "k-zMkzmduqI", description: "Lumen, Nanite, realtime workflows" },
  { id: "blender-4-1", title: "BLENDER 4.1", videoId: "Xbc6C2f0pn0", description: "Modeling, denoise stack, render controls" },
  { id: "prompt-engineering", title: "AI PROMPT ENGINEERING", videoId: "dOxUroR57xs", description: "Structured prompting for production" },
  { id: "godot-4", title: "GODOT 4.0", videoId: "nAh_Kx5Zh5Q", description: "GDScript architecture and scene systems" }
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authError, setAuthError] = useState("");
  const [status, setStatus] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "SYSTEM CO-PILOT ONLINE. Authenticate and start your first module." }
  ]);

  const unlockedCount = completedIds.length + 1;
  const progress = Math.round((completedIds.length / modules.length) * 100);
  const currentModule = modules[activeIndex];

  const badges = useMemo(
    () => [
      { id: "badge-1", label: "TACTICAL INIT", unlocked: progress >= 25, color: "text-blue-400" },
      { id: "badge-2", label: "SYSTEM ASCENT", unlocked: progress >= 75, color: "text-emerald-400" }
    ],
    [progress]
  );

  async function requestOtp(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    setStatus("Dispatching OTP...");
    try {
      const response = await fetch(`${apiUrl}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode: authMode })
      });
      if (!response.ok) {
        throw new Error("OTP request failed");
      }
      setOtpRequested(true);
      setStatus("OTP generated in backend terminal. Enter 6 digits.");
    } catch {
      setStatus("");
      setAuthError("Connection failure. Confirm FastAPI backend is online.");
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, mode: authMode })
      });
      if (!response.ok) {
        throw new Error("Invalid OTP");
      }
      setAuthenticated(true);
      setStatus("ACCESS GRANTED");
    } catch {
      setAuthError("Invalid OTP. Read the latest code from the backend terminal.");
    }
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch(`${apiUrl}/chat/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: userMessage, current_video_id: currentModule.id, current_module: currentModule.title })
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "SYSTEM ERROR: backend unavailable." }]);
    }
  }

  function completeCurrentModule() {
    if (completedIds.includes(currentModule.id)) {
      return;
    }

    const updated = [...completedIds, currentModule.id];
    setCompletedIds(updated);
    if (activeIndex < modules.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  }

  if (!authenticated) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#09090b] px-4">
        <section className="w-full max-w-xl panel p-6">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-blue-500">TUTORIALHUB // AUTH TERMINAL</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Restricted access • OTP gate required</p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-xs uppercase tracking-[0.2em]">
            {(["login", "register", "forgot_password"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAuthMode(mode);
                  setOtpRequested(false);
                  setStatus("");
                  setAuthError("");
                }}
                className={`border px-3 py-2 ${authMode === mode ? "border-blue-500 text-blue-400" : "border-zinc-700 text-zinc-400"}`}
              >
                {mode.replace("_", " ")}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-3" onSubmit={otpRequested ? verifyOtp : requestOtp}>
            <input
              required
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm uppercase outline-none focus:border-blue-500"
            />
            {otpRequested && (
              <input
                required
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="ENTER 6-DIGIT OTP"
                className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm uppercase outline-none focus:border-emerald-500"
              />
            )}
            <button className="w-full border border-blue-500 bg-blue-500/10 px-3 py-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              {otpRequested ? "VERIFY + ENTER DASHBOARD" : "REQUEST OTP"}
            </button>
          </form>

          {status && <p className="mt-3 text-xs text-emerald-400">{status}</p>}
          {authError && <p className="mt-3 text-xs text-red-400">{authError}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#09090b] p-3">
      <div className="grid h-full grid-cols-[280px_1fr_360px] gap-3">
        <aside className="panel flex h-full flex-col overflow-hidden p-3">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-blue-500">MODULE STACK</h2>
          <div className="mt-3 h-2 w-full bg-zinc-800">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-zinc-400">XP PROGRESS {progress}%</p>

          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {modules.map((module, index) => {
              const unlocked = index < unlockedCount;
              const active = module.id === currentModule.id;
              const complete = completedIds.includes(module.id);
              return (
                <button
                  key={module.id}
                  disabled={!unlocked}
                  onClick={() => unlocked && setActiveIndex(index)}
                  className={`w-full border p-3 text-left ${
                    active ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-900"
                  } ${!unlocked ? "opacity-40" : ""}`}
                >
                  <p className="text-sm font-bold uppercase tracking-[0.15em]">{module.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-zinc-400">{complete ? "Complete" : unlocked ? "Unlocked" : "Locked"}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 border border-zinc-800 p-2">
                <svg viewBox="0 0 24 24" className={`h-6 w-6 ${badge.unlocked ? badge.color : "text-zinc-700"}`} fill="currentColor">
                  <path d="M12 2l2.7 5.47 6.03.88-4.36 4.24 1.03 5.99L12 15.77l-5.4 2.81 1.03-5.99L3.27 8.35l6.03-.88L12 2z" />
                </svg>
                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="panel flex h-full flex-col overflow-hidden p-3">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">{currentModule.title}</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">{currentModule.description}</p>
          <div className="mt-3 flex-1 overflow-hidden border border-zinc-800 bg-black">
            <iframe
              key={currentModule.videoId}
              title={currentModule.title}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${currentModule.videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            onClick={completeCurrentModule}
            className="mt-3 border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400"
          >
            Mark as Completed + Load Next
          </button>
        </section>

        <aside className="panel flex h-full flex-col overflow-hidden p-3">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-blue-500">AI CO-PILOT</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">Clinical mode • context aware</p>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`border px-3 py-2 text-xs ${
                  message.role === "assistant" ? "border-blue-900 bg-blue-950/30" : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">{message.role}</p>
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Query current module"
              className="flex-1 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs uppercase outline-none focus:border-blue-500"
            />
            <button className="border border-blue-500 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-blue-300">Send</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
