import type { backendInterface } from "@/backend";
import {
  Bot,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SidebarView = "menu" | "ai" | "dm";
type DMView = "list" | "thread";

interface User {
  id: string;
  name: string;
  lastSeen: bigint;
}

interface DMMessage {
  id: bigint;
  userId: string;
  userName: string;
  text: string;
  timestamp: bigint;
}

interface AIMessage {
  id: number;
  role: "user" | "ai";
  text: string;
}

interface SidebarProps {
  userId: string;
  userName: string;
  onClose: () => void;
  actor: backendInterface | null;
}

function formatTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ userId, userName, onClose, actor }: SidebarProps) {
  const [view, setView] = useState<SidebarView>("menu");
  const [dmView, setDMView] = useState<DMView>("list");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dmMessages, setDMMessages] = useState<DMMessage[]>([]);
  const [dmInput, setDMInput] = useState("");
  const [isSendingDM, setIsSendingDM] = useState(false);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAIInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const aiMsgCounter = useRef(0);
  const dmEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message list change
  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message list change
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Fetch users when DM view opens
  useEffect(() => {
    if (view !== "dm" || !actor) return;
    const fetch = async () => {
      try {
        const list = await actor.getUsers();
        setUsers(list.filter((u) => u.id !== userId));
      } catch {
        // silent
      }
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [view, actor, userId]);

  // Poll DMs when thread open
  const fetchDMs = useCallback(async () => {
    if (!actor || !selectedUser) return;
    try {
      const msgs = await actor.getDMs(userId, selectedUser.id);
      setDMMessages(msgs);
    } catch {
      // silent
    }
  }, [actor, userId, selectedUser]);

  useEffect(() => {
    if (dmView !== "thread" || !selectedUser) return;
    fetchDMs();
    const interval = setInterval(fetchDMs, 2000);
    return () => clearInterval(interval);
  }, [dmView, selectedUser, fetchDMs]);

  const handleSendDM = async () => {
    const text = dmInput.trim();
    if (!text || !actor || !selectedUser || isSendingDM) return;
    setIsSendingDM(true);
    setDMInput("");
    try {
      await actor.sendDM(userId, selectedUser.id, text);
      await fetchDMs();
    } catch {
      toast.error("Failed to send DM");
      setDMInput(text);
    } finally {
      setIsSendingDM(false);
    }
  };

  const handleAskAI = async () => {
    const prompt = aiInput.trim();
    if (!prompt || !actor || isAILoading) return;
    setIsAILoading(true);
    setAIInput("");
    const userMsgId = ++aiMsgCounter.current;
    setAIMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: prompt },
    ]);
    try {
      const response = await actor.askAI(prompt);
      const aiMsgId = ++aiMsgCounter.current;
      setAIMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "ai", text: response },
      ]);
    } catch {
      const errMsgId = ++aiMsgCounter.current;
      setAIMessages((prev) => [
        ...prev,
        { id: errMsgId, role: "ai", text: "⚠ Unable to reach AI. Try again." },
      ]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setDMMessages([]);
    setDMView("thread");
  };

  const handleBackToList = () => {
    setDMView("list");
    setSelectedUser(null);
  };

  const sidebarBg = "oklch(0.10 0.02 242)";
  const borderColor = "oklch(0.82 0.2 196 / 0.15)";

  return (
    <>
      {/* Overlay backdrop */}
      <motion.div
        className="fixed inset-0 z-30"
        style={{ background: "oklch(0 0 0 / 0.5)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <motion.aside
        data-ocid="sidebar.panel"
        className="fixed top-0 right-0 bottom-0 z-40 flex flex-col w-80 sm:w-96"
        style={{
          background: sidebarBg,
          borderLeft: `1px solid ${borderColor}`,
          boxShadow: "-4px 0 40px oklch(0.82 0.2 196 / 0.08)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-2">
            {(view === "ai" || view === "dm") && (
              <button
                type="button"
                onClick={() => {
                  setView("menu");
                  setDMView("list");
                  setSelectedUser(null);
                }}
                className="p-1 rounded-sm transition-all duration-200 hover:bg-neon-cyan/10"
                style={{ color: "oklch(0.82 0.2 196 / 0.5)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {dmView === "thread" && view === "dm" && selectedUser && (
              <button
                type="button"
                onClick={handleBackToList}
                className="p-1 rounded-sm transition-all duration-200 hover:bg-neon-cyan/10"
                style={{ color: "oklch(0.82 0.2 196 / 0.5)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span
              className="font-mono text-sm font-semibold tracking-wider"
              style={{ color: "oklch(0.82 0.2 196 / 0.8)" }}
            >
              {view === "menu"
                ? "TOOLS"
                : view === "ai"
                  ? "AI ASSISTANT"
                  : dmView === "thread" && selectedUser
                    ? `DM · ${selectedUser.name}`
                    : "DIRECT MSG"}
            </span>
          </div>
          <button
            type="button"
            data-ocid="sidebar.close_button"
            onClick={onClose}
            className="p-1.5 rounded-sm transition-all duration-200 hover:bg-destructive/20"
            style={{ color: "oklch(0.82 0.2 196 / 0.4)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Menu view */}
          {view === "menu" && (
            <div className="p-4 flex flex-col gap-3">
              <p className="font-mono text-xs text-neon-cyan/30 tracking-widest uppercase mb-2">
                Select tool
              </p>

              {/* AI button */}
              <button
                type="button"
                data-ocid="sidebar.ai.tab"
                onClick={() => setView("ai")}
                className="group flex items-center gap-4 p-4 rounded-sm transition-all duration-200 text-left"
                style={{
                  background: "oklch(0.13 0.025 242)",
                  border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: "oklch(0.82 0.2 196 / 0.12)",
                    border: "1px solid oklch(0.82 0.2 196 / 0.3)",
                    boxShadow: "0 0 12px oklch(0.82 0.2 196 / 0.15)",
                  }}
                >
                  <Bot
                    className="w-5 h-5"
                    style={{ color: "oklch(0.82 0.2 196)" }}
                  />
                </div>
                <div>
                  <div
                    className="font-mono text-sm font-semibold mb-0.5"
                    style={{ color: "oklch(0.92 0.04 200)" }}
                  >
                    AI Assistant
                  </div>
                  <div className="font-mono text-xs text-neon-cyan/40">
                    Ask anything · Get smart replies
                  </div>
                </div>
              </button>

              {/* DM button */}
              <button
                type="button"
                data-ocid="sidebar.dm.tab"
                onClick={() => setView("dm")}
                className="group flex items-center gap-4 p-4 rounded-sm transition-all duration-200 text-left"
                style={{
                  background: "oklch(0.13 0.025 242)",
                  border: "1px solid oklch(0.72 0.25 310 / 0.15)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: "oklch(0.72 0.25 310 / 0.12)",
                    border: "1px solid oklch(0.72 0.25 310 / 0.3)",
                    boxShadow: "0 0 12px oklch(0.72 0.25 310 / 0.15)",
                  }}
                >
                  <MessageCircle
                    className="w-5 h-5"
                    style={{ color: "oklch(0.72 0.25 310)" }}
                  />
                </div>
                <div>
                  <div
                    className="font-mono text-sm font-semibold mb-0.5"
                    style={{ color: "oklch(0.92 0.04 200)" }}
                  >
                    Direct Messages
                  </div>
                  <div className="font-mono text-xs text-neon-cyan/40">
                    Private channels · Encrypted
                  </div>
                </div>
              </button>

              {/* User info */}
              <div
                className="mt-4 p-3 rounded-sm font-mono text-xs"
                style={{
                  background: "oklch(0.12 0.022 242)",
                  border: "1px solid oklch(0.22 0.04 230 / 0.5)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full pulse-dot"
                    style={{ background: "oklch(0.78 0.2 145)" }}
                  />
                  <span className="text-neon-cyan/40">
                    Connected as{" "}
                    <span style={{ color: "oklch(0.72 0.25 310 / 0.9)" }}>
                      {userName}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI view */}
          {view === "ai" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {aiMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                    <Bot
                      className="w-10 h-10 animate-neon-pulse"
                      style={{ color: "oklch(0.82 0.2 196 / 0.3)" }}
                    />
                    <p className="font-mono text-xs text-neon-cyan/30 tracking-wide">
                      How can I help?
                    </p>
                  </div>
                )}
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.role === "ai" && (
                      <div
                        className="w-6 h-6 rounded-sm flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: "oklch(0.82 0.2 196 / 0.12)",
                          border: "1px solid oklch(0.82 0.2 196 / 0.2)",
                        }}
                      >
                        <Bot
                          className="w-3 h-3"
                          style={{ color: "oklch(0.82 0.2 196 / 0.7)" }}
                        />
                      </div>
                    )}
                    <div
                      className="px-3 py-2 rounded-sm text-xs font-sora leading-relaxed max-w-[80%]"
                      style={
                        msg.role === "user"
                          ? {
                              background: "oklch(0.72 0.25 310 / 0.15)",
                              border: "1px solid oklch(0.72 0.25 310 / 0.25)",
                              color: "oklch(0.92 0.04 200)",
                            }
                          : {
                              background: "oklch(0.13 0.025 242)",
                              border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                              color: "oklch(0.88 0.04 200)",
                            }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAILoading && (
                  <div
                    data-ocid="ai.loading_state"
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full typing-dot"
                        style={{ background: "oklch(0.82 0.2 196 / 0.6)" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full typing-dot"
                        style={{ background: "oklch(0.82 0.2 196 / 0.6)" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full typing-dot"
                        style={{ background: "oklch(0.82 0.2 196 / 0.6)" }}
                      />
                    </div>
                    <span className="font-mono text-xs text-neon-cyan/40">
                      Processing...
                    </span>
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>

              {/* AI Input */}
              <div
                className="flex-shrink-0 border-t px-4 py-3"
                style={{ borderColor }}
              >
                <div className="flex gap-2">
                  <textarea
                    data-ocid="ai.textarea"
                    value={aiInput}
                    onChange={(e) => setAIInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAskAI();
                      }
                    }}
                    placeholder="Ask the AI..."
                    rows={1}
                    disabled={isAILoading}
                    className="flex-1 bg-transparent font-mono text-xs px-3 py-2 outline-none resize-none placeholder:text-neon-cyan/20 rounded-sm max-h-24"
                    style={{
                      background: "oklch(0.14 0.025 242)",
                      border: "1px solid oklch(0.82 0.2 196 / 0.2)",
                      color: "oklch(0.92 0.04 200)",
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="ai.submit_button"
                    onClick={handleAskAI}
                    disabled={!aiInput.trim() || isAILoading}
                    className="p-2 rounded-sm flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: "oklch(0.82 0.2 196 / 0.12)",
                      border: "1px solid oklch(0.82 0.2 196 / 0.3)",
                      color: "oklch(0.82 0.2 196)",
                    }}
                  >
                    {isAILoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DM view — user list */}
          {view === "dm" && dmView === "list" && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="font-mono text-xs text-neon-cyan/30 tracking-widest uppercase mb-3">
                Online users
              </p>
              {users.length === 0 && (
                <div
                  data-ocid="dm.empty_state"
                  className="text-center py-8 font-mono text-xs text-neon-cyan/25"
                >
                  No other users online
                </div>
              )}
              <div data-ocid="dm.list" className="space-y-2">
                {users.map((user, i) => {
                  const ocid = i < 10 ? `dm.item.${i + 1}` : undefined;
                  return (
                    <button
                      type="button"
                      key={user.id}
                      data-ocid={ocid}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-sm transition-all duration-200 text-left group"
                      style={{
                        background: "oklch(0.13 0.025 242)",
                        border: "1px solid oklch(0.72 0.25 310 / 0.12)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: "oklch(0.72 0.25 310 / 0.15)",
                          border: "1px solid oklch(0.72 0.25 310 / 0.3)",
                          color: "oklch(0.72 0.25 310)",
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-mono text-sm truncate"
                          style={{ color: "oklch(0.88 0.04 200)" }}
                        >
                          {user.name}
                        </div>
                      </div>
                      <MessageCircle
                        className="w-3.5 h-3.5 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
                        style={{ color: "oklch(0.72 0.25 310)" }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DM view — thread */}
          {view === "dm" && dmView === "thread" && selectedUser && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Thread messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {dmMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                    <MessageCircle
                      className="w-8 h-8"
                      style={{ color: "oklch(0.72 0.25 310 / 0.3)" }}
                    />
                    <p className="font-mono text-xs text-neon-cyan/25">
                      Start the conversation
                    </p>
                  </div>
                )}
                {dmMessages.map((msg) => {
                  const isFromMe = msg.userId === userId;
                  return (
                    <div
                      key={msg.id.toString()}
                      className={`flex gap-2 message-in ${isFromMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className="px-3 py-2 rounded-sm text-xs font-sora leading-relaxed max-w-[80%]"
                        style={
                          isFromMe
                            ? {
                                background: "oklch(0.72 0.25 310 / 0.15)",
                                border: "1px solid oklch(0.72 0.25 310 / 0.25)",
                                color: "oklch(0.92 0.04 200)",
                              }
                            : {
                                background: "oklch(0.13 0.025 242)",
                                border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                                color: "oklch(0.88 0.04 200)",
                              }
                        }
                      >
                        {msg.text}
                      </div>
                      <span
                        className="self-end font-mono text-xs"
                        style={{ color: "oklch(0.55 0.07 210 / 0.5)" }}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
                <div ref={dmEndRef} />
              </div>

              {/* DM Input */}
              <div
                className="flex-shrink-0 border-t px-4 py-3"
                style={{ borderColor }}
              >
                <div className="flex gap-2">
                  <textarea
                    data-ocid="dm.textarea"
                    value={dmInput}
                    onChange={(e) => setDMInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendDM();
                      }
                    }}
                    placeholder={`Message ${selectedUser.name}...`}
                    rows={1}
                    disabled={isSendingDM}
                    className="flex-1 bg-transparent font-mono text-xs px-3 py-2 outline-none resize-none placeholder:text-neon-cyan/20 rounded-sm max-h-24"
                    style={{
                      background: "oklch(0.14 0.025 242)",
                      border: "1px solid oklch(0.72 0.25 310 / 0.2)",
                      color: "oklch(0.92 0.04 200)",
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="dm.submit_button"
                    onClick={handleSendDM}
                    disabled={!dmInput.trim() || isSendingDM}
                    className="p-2 rounded-sm flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: "oklch(0.72 0.25 310 / 0.12)",
                      border: "1px solid oklch(0.72 0.25 310 / 0.3)",
                      color: "oklch(0.72 0.25 310)",
                    }}
                  >
                    {isSendingDM ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
