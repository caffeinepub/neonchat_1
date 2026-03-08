import { useActor } from "@/hooks/useActor";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CodeGateScreenProps {
  onCodeAccepted: () => void;
}

const CODE_LENGTH = 4;

export function CodeGateScreen({ onCodeAccepted }: CodeGateScreenProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { actor } = useActor();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!actor || code.length !== CODE_LENGTH) return;
      setIsVerifying(true);
      setError(false);
      try {
        const valid = await actor.verifyCode(code);
        if (valid) {
          setSuccess(true);
          setTimeout(() => {
            onCodeAccepted();
          }, 800);
        } else {
          setError(true);
          setErrorMessage("ACCESS DENIED — INVALID CODE");
          setDigits(["", "", "", ""]);
          setActiveIndex(0);
          setTimeout(() => setError(false), 2000);
        }
      } catch {
        setError(true);
        setErrorMessage("CONNECTION ERROR");
        setTimeout(() => setError(false), 2000);
      } finally {
        setIsVerifying(false);
      }
    },
    [actor, onCodeAccepted],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[activeIndex] !== "") {
        newDigits[activeIndex] = "";
        setDigits(newDigits);
      } else if (activeIndex > 0) {
        newDigits[activeIndex - 1] = "";
        setDigits(newDigits);
        setActiveIndex(activeIndex - 1);
      }
    } else if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[activeIndex] = e.key;
      setDigits(newDigits);
      if (activeIndex < CODE_LENGTH - 1) {
        setActiveIndex(activeIndex + 1);
      } else {
        // Last digit filled — verify
        const code = newDigits.join("");
        if (code.length === CODE_LENGTH) {
          setTimeout(() => handleVerify(code), 100);
        }
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    if (!val) return;
    const newDigits = [...digits];
    newDigits[activeIndex] = val;
    setDigits(newDigits);
    if (activeIndex < CODE_LENGTH - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        setTimeout(() => handleVerify(code), 100);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length === CODE_LENGTH) {
      handleVerify(code);
    }
  };

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center w-full h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
    >
      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.65 0.22 260 / 0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* Logo / Header */}
        <motion.div
          className="text-center"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        >
          <div className="font-mono text-xs tracking-[0.4em] text-neon-cyan/60 mb-3 uppercase">
            Secure Channel
          </div>
          <h1
            className="font-display font-black text-5xl sm:text-6xl tracking-tight neon-cyan cursor-blink"
            style={{ letterSpacing: "-0.02em" }}
          >
            NEXUS
          </h1>
          <div className="font-mono text-xs tracking-[0.3em] text-neon-magenta/70 mt-2 uppercase">
            Real-Time Chat Protocol
          </div>
        </motion.div>

        {/* Code entry box */}
        <motion.div
          className="relative corner-brackets p-8 rounded-sm"
          style={{
            background: "oklch(0.11 0.022 242 / 0.9)",
            border: "1px solid oklch(0.82 0.2 196 / 0.2)",
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div className="font-mono text-xs text-neon-cyan/50 text-center mb-6 tracking-widest uppercase">
            Enter Access Code
          </div>

          <form onSubmit={handleSubmit}>
            {/* Hidden real input for keyboard */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className="absolute opacity-0 w-0 h-0"
              value={digits.join("")}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              aria-label="Access code input"
              maxLength={CODE_LENGTH}
              data-ocid="code.input"
            />

            {/* Visual digit display */}
            <div
              className="flex gap-3 justify-center mb-6"
              onClick={() => inputRef.current?.focus()}
              onKeyDown={() => inputRef.current?.focus()}
              role="presentation"
            >
              {([0, 1, 2, 3] as const).map((i) => (
                <div
                  key={i}
                  className={`code-digit ${i === activeIndex && !isVerifying && !error ? "active" : ""} ${error ? "error" : ""} ${success ? "border-neon-cyan" : ""}`}
                  style={
                    success
                      ? {
                          borderColor: "oklch(0.78 0.2 145 / 0.8)",
                          color: "oklch(0.78 0.2 145)",
                          boxShadow: "0 0 12px oklch(0.78 0.2 145 / 0.5)",
                        }
                      : {}
                  }
                >
                  {digits[i] ? "●" : ""}
                  {i === activeIndex && !digits[i] && !isVerifying && (
                    <span
                      className="absolute"
                      style={{
                        animation: "blink 1s step-end infinite",
                        color: "oklch(0.82 0.2 196)",
                      }}
                    >
                      _
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  data-ocid="code.error_state"
                  className="flex items-center gap-2 justify-center mb-4 font-mono text-xs"
                  style={{ color: "oklch(0.62 0.24 25)" }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success indicator */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="flex items-center gap-2 justify-center mb-4 font-mono text-xs"
                  style={{ color: "oklch(0.78 0.2 145)" }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  ACCESS GRANTED
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              data-ocid="code.submit_button"
              disabled={
                isVerifying || digits.join("").length < CODE_LENGTH || success
              }
              className="w-full py-3 font-mono text-sm tracking-widest uppercase transition-all duration-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  isVerifying || success
                    ? "oklch(0.82 0.2 196 / 0.15)"
                    : "oklch(0.82 0.2 196 / 0.1)",
                border: "1px solid oklch(0.82 0.2 196 / 0.4)",
                color: "oklch(0.82 0.2 196)",
                boxShadow: "0 0 16px oklch(0.82 0.2 196 / 0.15)",
              }}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Authenticate"
              )}
            </button>
          </form>
        </motion.div>

        {/* Decorative footer text */}
        <motion.div
          className="font-mono text-xs text-neon-cyan/25 tracking-widest text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          [ NEXUS SECURE PROTOCOL v2.4.1 ]
        </motion.div>
      </div>
    </motion.div>
  );
}
