import { useActor } from "@/hooks/useActor";
import { LogOut, Radio, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RankBadge } from "./RankBadge";
import { Sidebar } from "./Sidebar";

interface Message {
  id: bigint;
  userId: string;
  userName: string;
  userRank: string;
  text: string;
  timestamp: bigint;
}

interface ChatScreenProps {
  userId: string;
  userName: string;
  userRank: string;
  onLogout: () => void;
}

function formatTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatScreen({
  userId,
  userName,
  userRank,
  onLogout,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<bigint>(BigInt(0));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { actor } = useActor();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Poll messages every 1.5s
  useEffect(() => {
    if (!actor) return;

    const fetchMessages = async () => {
      try {
        const newMsgs = await actor.getMessages(lastMessageId);
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id.toString()));
            const fresh = newMsgs.filter(
              (m) => !existingIds.has(m.id.toString()),
            );
            if (fresh.length === 0) return prev;
            const highest = fresh.reduce(
              (max, m) => (m.id > max ? m.id : max),
              BigInt(0),
            );
            setLastMessageId((cur) => (highest > cur ? highest : cur));
            return [...prev, ...fresh];
          });
        }
      } catch {
        // silent poll fail
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [actor, lastMessageId]);

  // Update last seen every 10s
  useEffect(() => {
    if (!actor || !userId) return;
    const interval = setInterval(() => {
      actor.updateLastSeen(userId).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, [actor, userId]);

  // Scroll to bottom on new messages - triggered by message count change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-runs when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !actor || isSending) return;

    setIsSending(true);
    setInputText("");
    try {
      await actor.sendMessage(userId, text);
    } catch {
      toast.error("Failed to send message");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isOwnMessage = (msg: Message) => msg.userId === userId;

  return (
    <div className="relative z-10 flex flex-col h-screen w-full">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0"
        style={{
          background: "oklch(0.09 0.018 245 / 0.95)",
          borderColor: "oklch(0.82 0.2 196 / 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full pulse-dot"
              style={{ background: "oklch(0.78 0.2 145)" }}
            />
            <span className="font-display font-black text-xl neon-cyan tracking-tight">
              NEXUS
            </span>
          </div>
          <div
            className="hidden sm:block font-mono text-xs px-2 py-0.5 rounded-sm"
            style={{
              background: "oklch(0.82 0.2 196 / 0.08)",
              border: "1px solid oklch(0.82 0.2 196 / 0.2)",
              color: "oklch(0.82 0.2 196 / 0.7)",
            }}
          >
            GLOBAL CHANNEL
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Current user indicator */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center font-mono text-xs font-bold"
              style={{
                background: "oklch(0.72 0.25 310 / 0.2)",
                border: "1px solid oklch(0.72 0.25 310 / 0.4)",
                color: "oklch(0.72 0.25 310)",
              }}
            >
              {getInitials(userName)}
            </div>
            <span
              className="hidden sm:block font-mono text-sm"
              style={{ color: "oklch(0.72 0.25 310)" }}
            >
              {userName}
            </span>
            {userRank && (
              <span className="hidden sm:inline-flex">
                <RankBadge rank={userRank} />
              </span>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title="Disconnect"
            className="p-1.5 rounded-sm transition-all duration-200 hover:bg-neon-cyan/10"
            style={{ color: "oklch(0.82 0.2 196 / 0.4)" }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
        {messages.length === 0 && (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full gap-3 text-center"
          >
            <Radio
              className="w-10 h-10 animate-neon-pulse"
              style={{ color: "oklch(0.82 0.2 196 / 0.3)" }}
            />
            <p className="font-mono text-xs tracking-widest text-neon-cyan/30 uppercase">
              Awaiting transmission...
            </p>
          </div>
        )}

        <div data-ocid="chat.list">
          {messages.map((msg, idx) => {
            const own = isOwnMessage(msg);
            const ocid = idx < 10 ? `chat.item.${idx + 1}` : undefined;
            return (
              <motion.div
                key={msg.id.toString()}
                data-ocid={ocid}
                className={`message-in flex gap-3 mb-3 ${own ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                {!own && (
                  <div
                    className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold"
                    style={{
                      background: "oklch(0.82 0.2 196 / 0.12)",
                      border: "1px solid oklch(0.82 0.2 196 / 0.2)",
                      color: "oklch(0.82 0.2 196 / 0.8)",
                    }}
                  >
                    {getInitials(msg.userName)}
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${own ? "items-end" : "items-start"}`}
                >
                  {/* Name + rank + time */}
                  <div
                    className={`flex items-center gap-1.5 flex-wrap ${own ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{
                        color: own
                          ? "oklch(0.72 0.25 310 / 0.8)"
                          : "oklch(0.82 0.2 196 / 0.7)",
                      }}
                    >
                      {own ? "YOU" : msg.userName}
                    </span>
                    {msg.userRank && <RankBadge rank={msg.userRank} />}
                    <span
                      className="font-mono text-xs"
                      style={{ color: "oklch(0.55 0.07 210 / 0.6)" }}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className="px-4 py-2.5 rounded-sm font-sora text-sm leading-relaxed"
                    style={
                      own
                        ? {
                            background: "oklch(0.72 0.25 310 / 0.15)",
                            border: "1px solid oklch(0.72 0.25 310 / 0.3)",
                            color: "oklch(0.92 0.04 200)",
                            boxShadow: "0 0 12px oklch(0.72 0.25 310 / 0.1)",
                          }
                        : {
                            background: "oklch(0.13 0.025 242 / 0.9)",
                            border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                            color: "oklch(0.88 0.04 200)",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </main>

      {/* Input bar */}
      <footer
        className="flex-shrink-0 px-4 sm:px-6 py-3 border-t"
        style={{
          background: "oklch(0.09 0.018 245 / 0.95)",
          borderColor: "oklch(0.82 0.2 196 / 0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-end gap-3">
          <div
            className="flex-1 relative rounded-sm"
            style={{
              background: "oklch(0.14 0.025 242)",
              border: "1px solid oklch(0.82 0.2 196 / 0.2)",
            }}
          >
            <textarea
              ref={inputRef}
              data-ocid="chat.textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit message..."
              rows={1}
              disabled={isSending}
              className="w-full bg-transparent font-mono text-sm px-4 py-3 outline-none resize-none placeholder:text-neon-cyan/20 max-h-32"
              style={{ color: "oklch(0.92 0.04 200)" }}
            />
          </div>

          <button
            type="button"
            data-ocid="chat.submit_button"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-sm flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "oklch(0.82 0.2 196 / 0.12)",
              border: "1px solid oklch(0.82 0.2 196 / 0.4)",
              color: "oklch(0.82 0.2 196)",
              boxShadow: inputText.trim()
                ? "0 0 12px oklch(0.82 0.2 196 / 0.25)"
                : "none",
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Footer branding */}
        <div className="mt-2 text-center font-mono text-xs text-neon-cyan/15">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-cyan/40 transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>

      {/* Sidebar toggle button */}
      <button
        type="button"
        data-ocid="sidebar.toggle"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-20 w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-200 group"
        style={{
          background: "oklch(0.82 0.2 196 / 0.12)",
          border: "1px solid oklch(0.82 0.2 196 / 0.4)",
          boxShadow: "0 0 20px oklch(0.82 0.2 196 / 0.25)",
        }}
        title="Open tools panel"
      >
        <span
          className="font-mono text-xs font-bold group-hover:scale-110 transition-transform"
          style={{ color: "oklch(0.82 0.2 196)" }}
        >
          ⊕
        </span>
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            userId={userId}
            userName={userName}
            userRank={userRank}
            onClose={() => setSidebarOpen(false)}
            actor={actor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
