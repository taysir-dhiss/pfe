import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { connectSocket, disconnectSocket } from "../../socket";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-violet-400", "bg-sky-400", "bg-emerald-400",
  "bg-amber-400",  "bg-rose-400", "bg-indigo-400",
  "bg-teal-400",   "bg-orange-400",
];
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function applyReaction(msg, emoji, userId) {
  const reactions = { ...(msg.reactions || {}) };
  const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
  const idx = users.indexOf(userId);
  if (idx >= 0) users.splice(idx, 1);
  else users.push(userId);
  if (users.length === 0) delete reactions[emoji];
  else reactions[emoji] = users;
  return { ...msg, reactions };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ username, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full ${avatarColor(username)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm select-none`}>
      {getInitials(username)}
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose, align = "left" }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // align="right" → right-0 keeps picker inside the chat for own messages
  // align="left"  → left-0 keeps picker inside for others' messages
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={ref}
      className={`absolute bottom-full mb-2 ${alignClass} z-50 bg-white border border-gray-100 rounded-2xl shadow-xl px-2 py-1.5 flex gap-0.5 whitespace-nowrap`}
      style={{ animation: "fadeInUp 0.15s ease" }}
    >
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          onClick={() => { onSelect(e); onClose(); }}
          className="text-xl p-1.5 rounded-xl hover:bg-brand-50 hover:scale-125 transition-all duration-100"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────
function ReactionBar({ reactions = {}, messageId, currentUserId, canReact, isOwn, onReact, activePicker, onShowPicker }) {
  const hasReactions = Object.values(reactions).some((u) => u.length > 0);
  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {hasReactions &&
        Object.entries(reactions).map(([emoji, users]) =>
          users.length > 0 ? (
            <button
              key={emoji}
              onClick={() => canReact && onReact(messageId, emoji)}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all duration-150 ${
                users.includes(currentUserId)
                  ? "bg-brand-100 border-brand-300 text-brand-700 font-semibold"
                  : "bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-brand-50"
              } ${canReact ? "cursor-pointer" : "cursor-default"}`}
            >
              <span>{emoji}</span>
              <span>{users.length}</span>
            </button>
          ) : null
        )}
      {canReact && (
        <div className="relative">
          <button
            onClick={() => onShowPicker(activePicker === messageId ? null : messageId)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-500 transition-colors text-sm"
            title="Réagir"
          >
            <span className="text-base leading-none">＋</span>
          </button>
          {activePicker === messageId && (
            <EmojiPicker
              onSelect={(emoji) => onReact(messageId, emoji)}
              onClose={() => onShowPicker(null)}
              align={isOwn ? "right" : "left"}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single Message Bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, currentUserId, canInteract, isReply, onReact, onReply, onDelete, activePicker, onShowPicker }) {
  const isOwn = msg.userId === currentUserId;
  return (
    <div className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : "flex-row"} ${isReply ? "ml-10" : ""}`}>
      {!isReply && <Avatar username={msg.username} />}
      {isReply && <div className="w-7 flex-shrink-0" />}

      <div className={`flex flex-col max-w-[72%] sm:max-w-[60%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold text-gray-700">{msg.username}</span>
            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
          </div>
        )}

        {/* Reply indicator */}
        {isReply && (
          <div className="text-[10px] text-gray-400 italic px-1 mb-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Réponse
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words transition-all ${
            isOwn
              ? "bg-brand-500 text-white rounded-tr-sm"
              : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
          }`}
          style={{ animation: "messageIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {msg.content}
        </div>

        {isOwn && (
          <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
        )}

        {/* Reactions + actions */}
        <div className="flex items-center gap-2 mt-0.5 px-0.5">
          <ReactionBar
            reactions={msg.reactions}
            messageId={msg._id}
            currentUserId={currentUserId}
            canReact={canInteract}
            isOwn={isOwn}
            onReact={onReact}
            activePicker={activePicker}
            onShowPicker={onShowPicker}
          />

          {canInteract && !isReply && (
            <button
              onClick={() => onReply(msg)}
              className="opacity-0 group-hover:opacity-100 text-[11px] text-gray-400 hover:text-brand-500 transition-all duration-150 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Répondre
            </button>
          )}

          {canInteract && isOwn && (
            <button
              onClick={() => onDelete(msg._id, isReply)}
              className="opacity-0 group-hover:opacity-100 text-[11px] text-gray-300 hover:text-red-400 transition-all duration-150"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Message Thread (parent + replies) ───────────────────────────────────────
function MessageThread({ msg, currentUserId, canInteract, onReact, onReply, onDelete, activePicker, onShowPicker }) {
  return (
    <div className="mt-4">
      <MessageBubble
        msg={msg}
        currentUserId={currentUserId}
        canInteract={canInteract}
        isReply={false}
        onReact={onReact}
        onReply={onReply}
        onDelete={onDelete}
        activePicker={activePicker}
        onShowPicker={onShowPicker}
      />
      {msg.replies?.length > 0 && (
        <div className="ml-10 pl-3 border-l-2 border-gray-100 mt-2 space-y-2">
          {msg.replies.map((r) => (
            <MessageBubble
              key={r._id}
              msg={r}
              currentUserId={currentUserId}
              canInteract={canInteract}
              isReply
              onReact={onReact}
              onReply={onReply}
              onDelete={onDelete}
              activePicker={activePicker}
              onShowPicker={onShowPicker}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Online indicator dot ─────────────────────────────────────────────────────
function OnlineDot({ connected }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"} flex-shrink-0`} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityChat() {
  const { user, token } = useAuth();
  const canInteract = user?.role === "patiente";
  const currentUserId = user?.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [activePicker, setActivePicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const feedRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const initialScrollDone = useRef(false);

  // ── Initial load ────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const { data } = await api.get("/community/messages");
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // ── Socket.io real-time connection ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    // New message from any client
    socket.on("community:message", (msg) => {
      setMessages((prev) => {
        // If it's a reply, attach it to the parent
        if (msg.parentMessageId) {
          return prev.map((m) =>
            m._id === msg.parentMessageId
              ? { ...m, replies: [...(m.replies || []), msg] }
              : m
          );
        }
        // Skip if already in state (own optimistic update)
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, { ...msg, replies: [] }];
      });
    });

    // Reaction update
    socket.on("community:reaction", ({ messageId, parentMessageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) return { ...m, reactions };
          if (parentMessageId && m._id === parentMessageId) {
            return {
              ...m,
              replies: (m.replies || []).map((r) =>
                r._id === messageId ? { ...r, reactions } : r
              ),
            };
          }
          return m;
        })
      );
    });

    // Message deleted
    socket.on("community:delete", ({ messageId, parentMessageId }) => {
      setMessages((prev) => {
        if (parentMessageId) {
          return prev.map((m) =>
            m._id === parentMessageId
              ? { ...m, replies: (m.replies || []).filter((r) => r._id !== messageId) }
              : m
          );
        }
        return prev.filter((m) => m._id !== messageId);
      });
    });

    return () => {
      socket.off("community:message");
      socket.off("community:reaction");
      socket.off("community:delete");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      disconnectSocket();
    };
  }, [token]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bottomRef.current) return;
    if (!initialScrollDone.current && !loading) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
      initialScrollDone.current = true;
      return;
    }
    if (!feedRef.current) return;
    const el = feedRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");

    // Optimistic insert for own message
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      userId: currentUserId,
      username: user?.nom || "Patient",
      content: text,
      reactions: {},
      replies: [],
      createdAt: new Date().toISOString(),
      parentMessageId: replyingTo?._id || null,
    };

    if (replyingTo) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === replyingTo._id
            ? { ...m, replies: [...(m.replies || []), optimistic] }
            : m
        )
      );
    } else {
      setMessages((prev) => [...prev, optimistic]);
    }

    const captured = replyingTo;
    setInputText("");
    setReplyingTo(null);

    try {
      const payload = { content: text };
      if (captured) payload.parentMessageId = captured._id;
      const { data: saved } = await api.post("/community/messages", payload);

      // Swap optimistic entry with real server response
      setMessages((prev) => {
        if (captured) {
          return prev.map((m) =>
            m._id === captured._id
              ? { ...m, replies: (m.replies || []).map((r) => r._id === tempId ? saved : r) }
              : m
          );
        }
        return prev.map((m) => (m._id === tempId ? saved : m));
      });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi.");
      // Roll back optimistic update
      setMessages((prev) => {
        if (captured) {
          return prev.map((m) =>
            m._id === captured._id
              ? { ...m, replies: (m.replies || []).filter((r) => r._id !== tempId) }
              : m
          );
        }
        return prev.filter((m) => m._id !== tempId);
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── React ───────────────────────────────────────────────────────────────────
  const handleReact = async (messageId, emoji) => {
    // Optimistic
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id === messageId) return applyReaction(m, emoji, currentUserId);
        return {
          ...m,
          replies: (m.replies || []).map((r) =>
            r._id === messageId ? applyReaction(r, emoji, currentUserId) : r
          ),
        };
      })
    );
    try {
      await api.post(`/community/messages/${messageId}/react`, { emoji });
    } catch {
      loadMessages(); // re-sync on failure
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (messageId, isReplyMsg) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await api.delete(`/community/messages/${messageId}`);
      // Socket event will handle the state update for other clients;
      // apply locally immediately
      setMessages((prev) => {
        if (isReplyMsg) {
          return prev.map((m) => ({
            ...m,
            replies: (m.replies || []).filter((r) => r._id !== messageId),
          }));
        }
        return prev.filter((m) => m._id !== messageId);
      });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  // ── Reply ───────────────────────────────────────────────────────────────────
  const handleSetReply = (msg) => {
    setReplyingTo(msg);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-gray-400 text-sm">Chargement du chat…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* keyframe animations */}
      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: scale(0.88) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="max-w-2xl mx-auto px-3 sm:px-4 py-4 flex flex-col"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-900 text-base leading-tight">Chat Communautaire</h1>
              {!canInteract && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-9l-7 4v5c0 5.25 3.5 9.74 7 11 3.5-1.26 7-5.75 7-11V7l-7-4z" />
                  </svg>
                  Lecture seule
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <OnlineDot connected={connected} />
              <span className="text-[11px] text-gray-400">
                {connected ? "Connecté en temps réel" : "Reconnexion…"}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-gray-400">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Feed ── */}
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm px-4 py-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#f9a8d4 transparent" }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">Aucun message pour l'instant.</p>
              {canInteract && <p className="text-gray-300 text-xs">Soyez le premier à écrire ✨</p>}
            </div>
          ) : (
            messages.map((msg) => (
              <MessageThread
                key={msg._id}
                msg={msg}
                currentUserId={currentUserId}
                canInteract={canInteract}
                onReact={handleReact}
                onReply={handleSetReply}
                onDelete={handleDelete}
                activePicker={activePicker}
                onShowPicker={setActivePicker}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Admin notice ── */}
        {!canInteract && (
          <div className="flex-shrink-0 mt-3 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-2 text-amber-700 text-xs">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Les administrateurs peuvent consulter le chat mais pas y participer.
          </div>
        )}

        {/* ── Input (patients only) ── */}
        {canInteract && (
          <div className="flex-shrink-0 mt-2" style={{ animation: "slideUp 0.2s ease" }}>
            {/* Error */}
            {error && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
                <button onClick={() => setError("")} className="ml-auto hover:text-red-800">✕</button>
              </div>
            )}

            {/* Reply preview */}
            {replyingTo && (
              <div
                className="mb-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-2"
                style={{ animation: "slideUp 0.15s ease" }}
              >
                <svg className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-600">{replyingTo.username}</p>
                  <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-2 focus-within:border-brand-300 focus-within:shadow-md transition-all duration-200">
              <Avatar username={user?.nom || "?"} size="sm" />
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder={replyingTo ? `Répondre à ${replyingTo.username}…` : "Écrire un message…"}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed max-h-24 overflow-y-auto pt-1"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  inputText.trim() && !sending
                    ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:scale-95"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {sending ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1">
              Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
            </p>
          </div>
        )}
      </div>
    </>
  );
}
