import { motion } from "motion/react";

interface LoginSweepProps {
  onComplete: () => void;
}

/**
 * A corner-to-corner diagonal sweep that plays once on login,
 * then calls onComplete so the splash can be shown.
 */
export function LoginSweep({ onComplete }: LoginSweepProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Dark base that fades in then out */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "oklch(0.05 0.02 240)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 1.1,
          times: [0, 0.15, 0.7, 1],
          ease: "easeInOut",
        }}
      />

      {/* Diagonal sweep stripe — top-left to bottom-right */}
      <motion.div
        className="absolute"
        style={{
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-150%",
          background:
            "linear-gradient(105deg, transparent 35%, oklch(0.72 0.25 310 / 0.55) 48%, oklch(0.82 0.2 196 / 0.7) 52%, transparent 65%)",
          filter: "blur(2px)",
        }}
        initial={{ x: "0%" }}
        animate={{ x: "150%" }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Secondary faint sweep slightly offset */}
      <motion.div
        className="absolute"
        style={{
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-150%",
          background:
            "linear-gradient(105deg, transparent 38%, oklch(0.72 0.25 310 / 0.2) 50%, transparent 62%)",
          filter: "blur(6px)",
        }}
        initial={{ x: "0%" }}
        animate={{ x: "150%" }}
        transition={{ duration: 0.9, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Invisible trigger: fires onComplete after the full animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.15 }}
        onAnimationComplete={onComplete}
      />
    </motion.div>
  );
}
