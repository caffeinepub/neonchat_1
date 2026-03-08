import { useActor } from "@/hooks/useActor";
import {
  CornerDownRight,
  LogOut,
  Pencil,
  Radio,
  Reply,
  Send,
  Trash2,
  X,
} from "lucide-react";
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
  edited: boolean;
  replyToId?: bigint;
  replyToText?: string;
}

interface ChatScreenProps {
  userId: string;
  userName: string;
  userRank: string;
  onLogout: () => void;
}

interface ReplyTarget {
  id: bigint;
  userName: string;
  text: string;
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
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [hoveredId, setHoveredId] = useState<bigint | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const { actor } = useActor();

  const isAdmin = userRank === "Admin";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!actor) return;
    try {
      const msgs = await actor.getMessages(BigInt(0));
      setMessages(msgs);
      if (msgs.length > 0) {
        const highest = msgs.reduce(
          (max, m) => (m.id > max ? m.id : max),
          BigInt(0),
        );
        setLastMessageId(highest);
      }
    } catch {
      // silent
    }
  }, [actor]);

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

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-runs when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingId !== null) {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  }, [editingId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !actor || isSending) return;

    const replyId = replyingTo?.id ?? null;
    const replyText = replyingTo?.text ?? null;

    setIsSending(true);
    setInputText("");
    setReplyingTo(null);
    try {
      await actor.sendMessage(userId, text, replyId, replyText);
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
    if (e.key === "Escape") {
      setReplyingTo(null);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setDeletingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (msgId: bigint) => {
    const text = editText.trim();
    if (!text || !actor || isEditing) return;
    setIsEditing(true);
    try {
      const success = await actor.editMessage(userId, msgId, text);
      if (success) {
        // Update locally for instant feedback
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text, edited: true } : m)),
        );
        setEditingId(null);
        setEditText("");
        toast.success("Message edited");
      } else {
        toast.error("Failed to edit message");
      }
    } catch {
      toast.error("Error editing message");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteMessage = async (msgId: bigint) => {
    if (!actor) return;
    try {
      const success = await actor.deleteMessage(userId, msgId);
      if (success) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        setDeletingId(null);
        toast.success("Message deleted");
      } else {
        toast.error("Failed to delete message");
      }
    } catch {
      toast.error("Error deleting message");
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
            const isHovered = hoveredId === msg.id;
            const isBeingEdited = editingId === msg.id;
            const isConfirmingDelete = deletingId === msg.id;

            return (
              <motion.div
                key={msg.id.toString()}
                data-ocid={ocid}
                className={`message-in flex gap-3 mb-3 ${own ? "flex-row-reverse" : "flex-row"}`}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => {
                  if (editingId !== msg.id && deletingId !== msg.id) {
                    setHoveredId(null);
                  }
                }}
              >
                {/* Avatar */}
                {!own && (
                  <div
                    className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold self-start mt-5"
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
                    {msg.edited && (
                      <span
                        className="font-mono text-[9px] italic"
                        style={{ color: "oklch(0.55 0.07 210 / 0.5)" }}
                      >
                        (edited)
                      </span>
                    )}
                  </div>

                  {/* Reply quote block */}
                  {msg.replyToText && (
                    <div
                      className={`flex items-start gap-1.5 max-w-full ${own ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <CornerDownRight
                        className="w-3 h-3 flex-shrink-0 mt-0.5"
                        style={{ color: "oklch(0.55 0.07 210 / 0.5)" }}
                      />
                      <div
                        className="px-2 py-1 rounded-sm font-mono text-[10px] max-w-[90%] truncate"
                        style={{
                          background: "oklch(0.82 0.2 196 / 0.06)",
                          border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                          color: "oklch(0.65 0.08 200 / 0.7)",
                          borderLeft: own
                            ? undefined
                            : "2px solid oklch(0.82 0.2 196 / 0.3)",
                          borderRight: own
                            ? "2px solid oklch(0.72 0.25 310 / 0.3)"
                            : undefined,
                        }}
                      >
                        {msg.replyToText}
                      </div>
                    </div>
                  )}

                  {/* Bubble */}
                  {isBeingEdited ? (
                    <div
                      className="w-full min-w-[240px] rounded-sm p-2"
                      style={{
                        background: "oklch(0.13 0.025 242)",
                        border: "1px solid oklch(0.82 0.2 196 / 0.3)",
                        boxShadow: "0 0 12px oklch(0.82 0.2 196 / 0.1)",
                      }}
                    >
                      <textarea
                        ref={editInputRef}
                        data-ocid="chat.editor"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(msg.id);
                          }
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        rows={2}
                        className="w-full bg-transparent font-sora text-sm outline-none resize-none"
                        style={{ color: "oklch(0.92 0.04 200)" }}
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          type="button"
                          data-ocid="chat.cancel_button"
                          onClick={handleCancelEdit}
                          disabled={isEditing}
                          className="font-mono text-xs px-2 py-1 rounded-sm transition-all duration-150"
                          style={{
                            color: "oklch(0.55 0.07 210 / 0.7)",
                            border: "1px solid oklch(0.55 0.07 210 / 0.2)",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          data-ocid="chat.save_button"
                          onClick={() => handleSaveEdit(msg.id)}
                          disabled={isEditing || !editText.trim()}
                          className="font-mono text-xs px-2 py-1 rounded-sm transition-all duration-150 disabled:opacity-30"
                          style={{
                            background: "oklch(0.82 0.2 196 / 0.12)",
                            border: "1px solid oklch(0.82 0.2 196 / 0.35)",
                            color: "oklch(0.82 0.2 196)",
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {/* Delete confirm inline */}
                  <AnimatePresence>
                    {isConfirmingDelete && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <span
                          className="font-mono text-xs"
                          style={{ color: "oklch(0.72 0.24 25 / 0.8)" }}
                        >
                          Delete?
                        </span>
                        <button
                          type="button"
                          data-ocid="chat.confirm_button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="font-mono text-xs px-2 py-0.5 rounded-sm transition-all duration-150"
                          style={{
                            background: "oklch(0.62 0.24 25 / 0.15)",
                            border: "1px solid oklch(0.62 0.24 25 / 0.4)",
                            color: "oklch(0.72 0.24 25)",
                          }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          data-ocid="chat.cancel_button"
                          onClick={() => {
                            setDeletingId(null);
                            setHoveredId(null);
                          }}
                          className="font-mono text-xs px-2 py-0.5 rounded-sm transition-all duration-150"
                          style={{
                            color: "oklch(0.55 0.07 210 / 0.6)",
                            border: "1px solid oklch(0.55 0.07 210 / 0.15)",
                          }}
                        >
                          No
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message action toolbar */}
                  <AnimatePresence>
                    {isHovered && !isBeingEdited && !isConfirmingDelete && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className={`flex items-center gap-1 ${own ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Reply button */}
                        <button
                          type="button"
                          data-ocid="chat.secondary_button"
                          title="Reply"
                          onClick={() =>
                            setReplyingTo({
                              id: msg.id,
                              userName: msg.userName,
                              text: msg.text,
                            })
                          }
                          className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[10px] transition-all duration-150"
                          style={{
                            background: "oklch(0.82 0.2 196 / 0.07)",
                            border: "1px solid oklch(0.82 0.2 196 / 0.15)",
                            color: "oklch(0.82 0.2 196 / 0.6)",
                          }}
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>

                        {/* Admin controls */}
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              data-ocid="chat.edit_button"
                              title="Edit message"
                              onClick={() => handleStartEdit(msg)}
                              className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[10px] transition-all duration-150"
                              style={{
                                background: "oklch(0.85 0.19 80 / 0.08)",
                                border: "1px solid oklch(0.85 0.19 80 / 0.2)",
                                color: "oklch(0.85 0.19 80 / 0.7)",
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              data-ocid="chat.delete_button"
                              title="Delete message"
                              onClick={() => {
                                setDeletingId(msg.id);
                                setEditingId(null);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[10px] transition-all duration-150"
                              style={{
                                background: "oklch(0.62 0.24 25 / 0.08)",
                                border: "1px solid oklch(0.62 0.24 25 / 0.2)",
                                color: "oklch(0.72 0.24 25 / 0.7)",
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
        {/* Reply preview bar */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mb-2"
            >
              <div
                data-ocid="chat.panel"
                className="flex items-center gap-3 px-3 py-2 rounded-sm"
                style={{
                  background: "oklch(0.82 0.2 196 / 0.06)",
                  border: "1px solid oklch(0.82 0.2 196 / 0.2)",
                  borderLeft: "3px solid oklch(0.82 0.2 196 / 0.5)",
                }}
              >
                <Reply
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.82 0.2 196 / 0.6)" }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="font-mono text-[10px] font-semibold"
                    style={{ color: "oklch(0.82 0.2 196 / 0.7)" }}
                  >
                    Replying to {replyingTo.userName}
                  </span>
                  <p
                    className="font-mono text-[10px] truncate"
                    style={{ color: "oklch(0.65 0.08 200 / 0.6)" }}
                  >
                    {replyingTo.text}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="chat.close_button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-shrink-0 p-0.5 rounded-sm transition-all duration-200 hover:bg-neon-cyan/10"
                  style={{ color: "oklch(0.82 0.2 196 / 0.4)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            onMessagesRefresh={refreshMessages}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
