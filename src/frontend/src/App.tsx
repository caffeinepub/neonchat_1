import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { ChatScreen } from "./components/ChatScreen";
import { CodeGateScreen } from "./components/CodeGateScreen";
import { NamePickerScreen } from "./components/NamePickerScreen";

type Screen = "code" | "name" | "chat";

export default function App() {
  const [screen, setScreen] = useState<Screen>("code");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Restore session from sessionStorage
  useEffect(() => {
    const storedId = sessionStorage.getItem("userId");
    const storedName = sessionStorage.getItem("userName");
    if (storedId && storedName) {
      setUserId(storedId);
      setUserName(storedName);
      setScreen("chat");
    }
  }, []);

  const handleCodeAccepted = () => {
    setScreen("name");
  };

  const handleNameConfirmed = (id: string, name: string) => {
    setUserId(id);
    setUserName(name);
    sessionStorage.setItem("userId", id);
    sessionStorage.setItem("userName", name);
    setScreen("chat");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userName");
    setUserId("");
    setUserName("");
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
