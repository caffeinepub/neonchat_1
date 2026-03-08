import { Bell, X } from "lucide-react";
import { motion } from "motion/react";

interface SplashModalProps {
  splashText: string;
  onClose: () => void;
}

export function SplashModal({ splashText, onClose }: SplashModalProps) {
  const displayText =
    splashText.trim() === "" ? "No active announcements." : splashText;

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "oklch(0 0 0 / 0.65)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        data-ocid="splash.modal"
        className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md pointer-events-auto corner-brackets"
          style={{
            background: "oklch(0.10 0.02 242 / 0.97)",
            border: "1px solid oklch(0.82 0.2 196 / 0.3)",
            boxShadow:
              "0 0 60px oklch(0.82 0.2 196 / 0.12), 0 24px 48px oklch(0 0 0 / 0.5)",
            backdropFilter: "blur(16px)",
          }}
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "oklch(0.82 0.2 196 / 0.15)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.82 0.2 196 / 0.1)",
                  border: "1px solid oklch(0.82 0.2 196 / 0.3)",
                  boxShadow: "0 0 12px oklch(0.82 0.2 196 / 0.2)",
                }}
              >
                <Bell
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.2 196)" }}
                />
              </div>
              <div>
                <div
                  className="font-mono text-xs tracking-[0.3em] uppercase"
                  style={{ color: "oklch(0.82 0.2 196 / 0.6)" }}
                >
                  System Broadcast
                </div>
                <div
                  className="font-display font-bold text-sm"
                  style={{ color: "oklch(0.92 0.04 200)" }}
                >
                  ANNOUNCEMENTS
                </div>
              </div>
            </div>

            <button
              type="button"
              data-ocid="splash.close_button"
              onClick={onClose}
              className="p-1.5 rounded-sm transition-all duration-200 hover:bg-destructive/20"
              style={{ color: "oklch(0.82 0.2 196 / 0.4)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-5">
            {/* Scan line decorative strip */}
            <div
              className="w-full h-px mb-4"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.82 0.2 196 / 0.4), transparent)",
              }}
            />

            <p
              className="font-sora text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "oklch(0.88 0.04 200)" }}
            >
              {displayText}
            </p>

            <div
              className="w-full h-px mt-4"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.82 0.2 196 / 0.2), transparent)",
              }}
            />
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <span
              className="font-mono text-xs"
              style={{ color: "oklch(0.55 0.07 210 / 0.5)" }}
            >
              [ NEXUS NETWORK ]
            </span>
            <button
              type="button"
              data-ocid="splash.confirm_button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                background: "oklch(0.82 0.2 196 / 0.1)",
                border: "1px solid oklch(0.82 0.2 196 / 0.4)",
                color: "oklch(0.82 0.2 196)",
                boxShadow: "0 0 12px oklch(0.82 0.2 196 / 0.15)",
              }}
            >
              Acknowledged
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
