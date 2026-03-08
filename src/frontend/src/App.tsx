import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useEffect, useState } from "react";
import { ChatScreen } from "./components/ChatScreen";
import { CodeGateScreen } from "./components/CodeGateScreen";
import { NamePickerScreen } from "./components/NamePickerScreen";

type Screen = "code" | "name" | "chat";

export default function App() {
  const [screen, setScreen] = useState<Screen>("code");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRank, setUserRank] = useState<string>("Friend");
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

  const handleCodeAccepted = () => {
    setScreen("name");
  };

  const handleNameConfirmed = (id: string, name: string) => {
    setUserId(id);
    setUserName(name);
    // NEXUS auto-gets Admin; others start as Friend until backend confirms
    const initialRank = name === "NEXUS" ? "Admin" : "Friend";
    setUserRank(initialRank);
    sessionStorage.setItem("userId", id);
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("userRank", initialRank);
    setScreen("chat");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userRank");
    setUserId("");
    setUserName("");
    setUserRank("Friend");
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
