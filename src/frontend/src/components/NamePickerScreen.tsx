import { useActor } from "@/hooks/useActor";
import { ArrowRight, KeyRound, Loader2, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "NEXUS";

interface NamePickerScreenProps {
  onNameConfirmed: (userId: string, userName: string) => void;
}

export function NamePickerScreen({ onNameConfirmed }: NamePickerScreenProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { actor } = useActor();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const requiresPassword = name.trim() === "NEXUS";

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Focus password field when it appears
  useEffect(() => {
    if (requiresPassword) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [requiresPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2 || !actor) return;

    // Password gate for "admin"
    if (requiresPassword) {
      if (password !== ADMIN_PASSWORD) {
        setPasswordError(true);
        toast.error("Access denied. Invalid admin password.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const userId = await actor.registerUser(trimmed);
      onNameConfirmed(userId, trimmed);
    } catch {
      toast.error("Failed to register. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center w-full h-screen"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, oklch(0.72 0.25 310 / 0.07) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-8 px-6 w-full max-w-sm">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="font-mono text-xs tracking-[0.4em] text-neon-magenta/60 mb-3 uppercase">
            Identity Setup
          </div>
          <h2 className="font-display font-black text-4xl neon-magenta">
            WHO ARE YOU?
          </h2>
          <p className="font-mono text-xs text-neon-cyan/40 mt-3 tracking-wide">
            Choose your callsign for this session
          </p>
        </motion.div>

        {/* Name form */}
        <motion.div
          className="w-full corner-brackets p-8 rounded-sm"
          style={{
            background: "oklch(0.11 0.022 242 / 0.9)",
            border: "1px solid oklch(0.72 0.25 310 / 0.2)",
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* User icon + input row */}
            <div
              className="flex items-center gap-3 rounded-sm px-4 py-3 transition-all duration-200"
              style={{
                background: "oklch(0.15 0.03 240)",
                border: "1px solid oklch(0.72 0.25 310 / 0.3)",
              }}
            >
              <User
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.72 0.25 310 / 0.7)" }}
              />
              <input
                ref={nameInputRef}
                type="text"
                data-ocid="name.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter callsign..."
                maxLength={24}
                className="flex-1 bg-transparent font-mono text-base outline-none placeholder:text-neon-cyan/20"
                style={{ color: "oklch(0.92 0.04 200)" }}
                disabled={isSubmitting}
              />
            </div>

            {/* Character counter */}
            <div className="flex justify-between font-mono text-xs text-neon-cyan/30">
              <span>
                {name.length > 0 && name.trim().length < 2
                  ? "Min 2 characters"
                  : ""}
              </span>
              <span>{name.length}/24</span>
            </div>

            {/* Admin password field */}
            <AnimatePresence>
              {requiresPassword && (
                <motion.div
                  key="admin-password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 rounded-sm px-4 py-3 transition-all duration-200"
                    style={{
                      background: passwordError
                        ? "oklch(0.15 0.05 20)"
                        : "oklch(0.15 0.03 240)",
                      border: passwordError
                        ? "1px solid oklch(0.65 0.25 20 / 0.6)"
                        : "1px solid oklch(0.82 0.2 196 / 0.3)",
                    }}
                  >
                    <KeyRound
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color: passwordError
                          ? "oklch(0.65 0.25 20 / 0.9)"
                          : "oklch(0.82 0.2 196 / 0.7)",
                      }}
                    />
                    <input
                      ref={passwordInputRef}
                      type="password"
                      data-ocid="name.admin_password.input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(false);
                      }}
                      placeholder="Admin password..."
                      className="flex-1 bg-transparent font-mono text-base outline-none placeholder:text-neon-cyan/20"
                      style={{
                        color: passwordError
                          ? "oklch(0.75 0.15 20)"
                          : "oklch(0.92 0.04 200)",
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                  {passwordError && (
                    <p
                      className="font-mono text-xs mt-1 px-1"
                      style={{ color: "oklch(0.65 0.25 20)" }}
                    >
                      Invalid admin password
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              data-ocid="name.submit_button"
              disabled={isSubmitting || name.trim().length < 2 || !actor}
              className="flex items-center justify-center gap-2 w-full py-3 font-mono text-sm tracking-widest uppercase transition-all duration-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "oklch(0.72 0.25 310 / 0.1)",
                border: "1px solid oklch(0.72 0.25 310 / 0.5)",
                color: "oklch(0.72 0.25 310)",
                boxShadow: "0 0 16px oklch(0.72 0.25 310 / 0.15)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  Confirm Identity
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div
          className="font-mono text-xs text-neon-magenta/25 tracking-widest text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          [ SESSION AUTHENTICATED ]
        </motion.div>
      </div>
    </motion.div>
  );
}
