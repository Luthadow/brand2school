"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { csrfHeaders } from "../../lib/clientFetch";
import { getChatGreeting, type ChatResponse } from "../../lib/chatEngine";
import type { ChatLink } from "../../lib/chatKnowledge";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  links?: ChatLink[];
  quickReplies?: string[];
};

let messageId = 0;
function nextId(): string {
  messageId += 1;
  return String(messageId);
}

function toBotMessage(response: ChatResponse): ChatMessage {
  return {
    id: nextId(),
    role: "bot",
    text: response.text,
    links: response.links,
    quickReplies: response.quickReplies
  };
}

function ChatLinks({ links }: { links: ChatLink[] }): JSX.Element {
  return (
    <div className="chat-links">
      {links.map((link) =>
        link.kind === "page" ? (
          <Link key={link.href + link.label} href={link.href as Route} className="chat-link">
            {link.label}
          </Link>
        ) : (
          <a
            key={link.href + link.label}
            href={link.href}
            className="chat-link"
            target={link.kind === "email" ? undefined : "_blank"}
            rel={link.kind === "email" ? undefined : "noopener noreferrer"}
          >
            {link.label}
          </a>
        )
      )}
    </div>
  );
}

export function ChatPanel({ onClose }: { onClose: () => void }): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [toBotMessage(getChatGreeting())]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (payload: { message?: string; quickReply?: string }): Promise<void> => {
    const userText = payload.quickReply ?? payload.message?.trim();
    if (!userText || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: userText }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify(payload)
      });
      const data = (await res.json().catch(() => null)) as ChatResponse | { message?: string } | null;

      if (!res.ok || !data || !("text" in data)) {
        const apiMessage = data && "message" in data ? data.message : null;
        setError(apiMessage ?? "Could not get a reply. Please try again.");
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, toBotMessage(data)]);
    } catch {
      setError("Connection problem. Please try again or use the contact form.");
    } finally {
      setLoading(false);
    }
  };

  const latestQuickReplies = [...messages].reverse().find((m) => m.role === "bot" && m.quickReplies?.length)?.quickReplies;

  return (
    <div className="chat-panel" role="dialog" aria-label="Brand2School assistant">
      <header className="chat-panel-header">
        <div>
          <p className="chat-panel-title">Brand2School Assistant</p>
          <p className="chat-panel-sub">Answers about codes, schools, brands & support</p>
        </div>
        <button type="button" className="chat-panel-close" onClick={onClose} aria-label="Close chat">
          <X size={20} />
        </button>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
            <p>{msg.text}</p>
            {msg.links?.length ? <ChatLinks links={msg.links} /> : null}
          </div>
        ))}
        {loading ? <div className="chat-bubble chat-bubble--bot chat-bubble--typing">Typing…</div> : null}
        {error ? <p className="chat-error">{error}</p> : null}
      </div>

      {latestQuickReplies?.length ? (
        <div className="chat-quick-replies">
          {latestQuickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              className="chat-quick-reply"
              disabled={loading}
              onClick={() => send({ quickReply: reply })}
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="chat-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          void send({ message: input });
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about codes, schools, brands…"
          maxLength={500}
          disabled={loading}
          aria-label="Chat message"
        />
        <button type="submit" className="chat-send" disabled={loading || !input.trim()} aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export function ChatWidget(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="chat-widget">
      {open ? <ChatPanel onClose={() => setOpen(false)} /> : null}
      <button
        type="button"
        className={`chat-launcher${open ? " chat-launcher--open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open Brand2School assistant"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
