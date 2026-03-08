import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { BannedScreen } from "./components/BannedScreen";
import { ChatScreen } from "./components/ChatScreen";
import { CodeGateScreen } from "./components/CodeGateScreen";
import { LoginSweep } from "./components/LoginSweep";
import { NamePickerScreen } from "./components/NamePickerScreen";
import { SplashModal } from "./components/SplashModal";

type Screen = "code" | "name" | "chat" | "banned";

interface BanInfo {
  expiresAt: bigint;
  reason: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("code");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRank, setUserRank] = useState<string>("Friend");
  const [showSweep, setShowSweep] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashText, setSplashText] = useState("");
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const { actor } = useActor();

  // Restore session from sessionStorage
  useEffect(() => {
    const storedId = sessionStorage.getItem("userId");
    const storedName = sessionStorage.getItem("userName");
    const storedRank = sessionStorage.getItem("userRank");
    if (storedId && storedName) {
      setUserId(storedId);
      setUserName(storedName);
      setUserRank(storedRank ?? "Friend");
      setScreen("chat");
    }
  }, []);

  // Fetch rank from backend when actor is ready and user is logged in
  useEffect(() => {
    if (!actor || !userId) return;
    actor
      .getUserRank(userId)
      .then((rank) => {
        setUserRank(rank);
        sessionStorage.setItem("userRank", rank);
      })
      .catch(() => {});
  }, [actor, userId]);

  // Periodic ban check every 30s while in chat
  useEffect(() => {
    if (screen !== "chat" || !actor || !userId) return;
    const checkBan = async () => {
      try {
        const result = await actor.checkBan(userId);
        if (result.banned) {
          setBanInfo({ expiresAt: result.expiresAt, reason: result.reason });
          setScreen("banned");
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(checkBan, 30_000);
    return () => clearInterval(interval);
  }, [screen, actor, userId]);

  // Poll isKicked every 5s while in chat — force logout if kicked by admin
  useEffect(() => {
    if (screen !== "chat" || !actor || !userId) return;
    const checkKicked = async () => {
      try {
        const kicked = await actor.isKicked(userId);
        if (kicked) {
          handleLogout();
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(checkKicked, 5_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, actor, userId]);

  const handleCodeAccepted = () => {
    setScreen("name");
  };

  const handleNameConfirmed = async (id: string, name: string) => {
    setUserId(id);
    setUserName(name);
    // PhillyNEXUS auto-gets Admin; others start as Friend until backend confirms
    const initialRank = name === "PhillyNEXUS" ? "Admin" : "Friend";
    setUserRank(initialRank);
    sessionStorage.setItem("userId", id);
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("userRank", initialRank);

    // Check ban before entering chat
    if (actor) {
      try {
        const result = await actor.checkBan(id);
        if (result.banned) {
          setBanInfo({ expiresAt: result.expiresAt, reason: result.reason });
          setScreen("banned");
          return;
        }
      } catch {
        // silent — if check fails, allow into chat
      }

      // Fetch and show splash
      try {
        const splash = await actor.getSplash();
        setSplashText(splash);
      } catch {
        setSplashText("");
      }
    }

    setScreen("chat");
    // Play the sweep animation first; splash fires in onSweepComplete
    setShowSweep(true);
  };

  const handleSweepComplete = () => {
    setShowSweep(false);
    setShowSplash(true);
  };

  const handleTryAgainAfterBan = async () => {
    if (!actor || !userId) return;
    try {
      const result = await actor.checkBan(userId);
      if (result.banned) {
        setBanInfo({ expiresAt: result.expiresAt, reason: result.reason });
        // Stay on banned screen
      } else {
        setBanInfo(null);
        setScreen("chat");
        setShowSweep(true);
      }
    } catch {
      // If check fails, let them back in
      setBanInfo(null);
      setScreen("chat");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userRank");
    setUserId("");
    setUserName("");
    setUserRank("Friend");
    setBanInfo(null);
    setShowSweep(false);
    setShowSplash(false);
    setScreen("code");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-deep-bg font-sora">
      {/* Background grid overlay */}
      <div className="grid-overlay" aria-hidden="true" />
      {/* Scanlines */}
      <div className="scanlines" aria-hidden="true" />

      {/* Screens */}
      {screen === "code" && (
        <CodeGateScreen onCodeAccepted={handleCodeAccepted} />
      )}
      {screen === "name" && (
        <NamePickerScreen onNameConfirmed={handleNameConfirmed} />
      )}
      {screen === "chat" && (
        <ChatScreen
          userId={userId}
          userName={userName}
          userRank={userRank}
          onLogout={handleLogout}
        />
      )}
      {screen === "banned" && banInfo && (
        <BannedScreen
          reason={banInfo.reason}
          expiresAt={banInfo.expiresAt}
          onTryAgain={handleTryAgainAfterBan}
        />
      )}

      {/* Corner-to-corner login sweep */}
      <AnimatePresence>
        {showSweep && (
          <LoginSweep key="login-sweep" onComplete={handleSweepComplete} />
        )}
      </AnimatePresence>

      {/* Splash modal overlay */}
      <AnimatePresence>
        {showSplash && screen === "chat" && (
          <SplashModal
            splashText={splashText}
            onClose={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.12 0.025 240)",
            border: "1px solid oklch(0.82 0.2 196 / 0.3)",
            color: "oklch(0.92 0.04 200)",
          },
        }}
      />
    </div>
  );
}
