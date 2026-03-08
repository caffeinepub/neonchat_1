import { RefreshCw, ShieldOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface BannedScreenProps {
  reason: string;
  expiresAt: bigint;
  onTryAgain: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export function BannedScreen({
  reason,
  expiresAt,
  onTryAgain,
}: BannedScreenProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // expiresAt is in nanoseconds
  const expiresMs = Number(expiresAt) / 1_000_000;
  const remaining = expiresMs - now;
  const isExpired = remaining <= 0;

  return (
    <div
      data-ocid="banned.panel"
      className="relative z-10 flex items-center justify-center w-full h-screen"
    >
      {/* Red glow radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.62 0.24 25 / 0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative flex flex-col items-center gap-8 px-6 w-full max-w-md text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-sm flex items-center justify-center"
          style={{
            background: "oklch(0.62 0.24 25 / 0.1)",
            border: "1px solid oklch(0.62 0.24 25 / 0.4)",
            boxShadow:
              "0 0 30px oklch(0.62 0.24 25 / 0.2), inset 0 0 20px oklch(0.62 0.24 25 / 0.05)",
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          <ShieldOff
            className="w-10 h-10"
            style={{ color: "oklch(0.72 0.24 25)" }}
          />
        </motion.div>

        {/* Title */}
        <div>
          <div
            className="font-mono text-xs tracking-[0.4em] mb-3 uppercase"
            style={{ color: "oklch(0.72 0.24 25 / 0.6)" }}
          >
            Access Terminated
          </div>
          <h1
            className="font-display font-black text-4xl"
            style={{
              color: "oklch(0.72 0.24 25)",
              textShadow:
                "0 0 20px oklch(0.62 0.24 25 / 0.6), 0 0 40px oklch(0.62 0.24 25 / 0.3)",
            }}
          >
            BANNED
          </h1>
        </div>

        {/* Details card */}
        <div
          className="w-full corner-brackets p-6 rounded-sm"
          style={{
            background: "oklch(0.10 0.02 242 / 0.9)",
            border: "1px solid oklch(0.62 0.24 25 / 0.25)",
          }}
        >
          {/* Reason */}
          <div className="mb-5">
            <div
              className="font-mono text-xs tracking-widest uppercase mb-2"
              style={{ color: "oklch(0.62 0.24 25 / 0.7)" }}
            >
              Reason
            </div>
            <p
              className="font-sora text-sm leading-relaxed"
              style={{ color: "oklch(0.88 0.04 200 / 0.9)" }}
            >
              {reason || "No reason provided."}
            </p>
          </div>

          <div
            className="w-full h-px mb-5"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.62 0.24 25 / 0.3), transparent)",
            }}
          />

          {/* Countdown */}
          <div>
            <div
              className="font-mono text-xs tracking-widest uppercase mb-3"
              style={{ color: "oklch(0.62 0.24 25 / 0.7)" }}
            >
              {isExpired ? "Ban Expired" : "Time Remaining"}
            </div>
            <div
              className="font-jetbrains text-3xl font-bold tabular-nums"
              style={{
                color: isExpired
                  ? "oklch(0.78 0.2 145)"
                  : "oklch(0.72 0.24 25)",
                textShadow: isExpired
                  ? "0 0 12px oklch(0.78 0.2 145 / 0.5)"
                  : "0 0 12px oklch(0.62 0.24 25 / 0.5)",
              }}
            >
              {isExpired ? "EXPIRED" : formatCountdown(remaining)}
            </div>
            {!isExpired && (
              <p
                className="font-mono text-xs mt-2"
                style={{ color: "oklch(0.55 0.07 210 / 0.5)" }}
              >
                Until{" "}
                {new Date(expiresMs).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Try again button */}
        <button
          type="button"
          data-ocid="banned.button"
          onClick={onTryAgain}
          className="flex items-center gap-2 px-6 py-3 rounded-sm font-mono text-sm tracking-widest uppercase transition-all duration-200"
          style={{
            background: "oklch(0.82 0.2 196 / 0.08)",
            border: "1px solid oklch(0.82 0.2 196 / 0.3)",
            color: "oklch(0.82 0.2 196)",
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
