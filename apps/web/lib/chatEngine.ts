import {
  CHAT_GREETING,
  CHAT_KNOWLEDGE,
  CHAT_QUICK_REPLIES,
  CHAT_QUICK_REPLY_MAP,
  type ChatKnowledgeItem,
  type ChatLink,
  type ChatQuickReply
} from "./chatKnowledge";
import { PUBLIC_PHONE, whatsappUrl } from "./contact";

export type ChatAction = ChatLink;

export type ChatResponse = {
  text: string;
  links?: ChatAction[];
  quickReplies?: string[];
};

export type ChatMessageInput = {
  message?: string;
  quickReply?: string;
};

const FALLBACK_QUICK_REPLIES = [...CHAT_QUICK_REPLIES];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s@./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toResponse(item: ChatKnowledgeItem, quickReplies = FALLBACK_QUICK_REPLIES): ChatResponse {
  return {
    text: item.answer,
    links: item.links,
    quickReplies
  };
}

function scoreItem(item: ChatKnowledgeItem, normalized: string): number {
  let score = 0;

  for (const keyword of item.keywords) {
    const key = normalize(keyword);
    if (!key) continue;
    if (normalized.includes(key)) score += key.split(" ").length >= 2 ? 4 : 2;
  }

  const questionWords = normalize(item.question).split(" ").filter((w) => w.length > 3);
  for (const word of questionWords) {
    if (normalized.includes(word)) score += 1;
  }

  if (normalized.includes(normalize(item.id.replace(/-/g, " ")))) score += 3;

  return score;
}

function findBestMatch(normalized: string): ChatKnowledgeItem | null {
  let best: ChatKnowledgeItem | null = null;
  let bestScore = 0;

  for (const item of CHAT_KNOWLEDGE) {
    const score = scoreItem(item, normalized);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= 2 ? best : null;
}

function greetingResponse(): ChatResponse {
  return {
    text: CHAT_GREETING,
    quickReplies: [...CHAT_QUICK_REPLIES]
  };
}

function thanksResponse(): ChatResponse {
  return {
    text: "You're welcome! If you need anything else, pick a topic below or ask another question.",
    quickReplies: [...CHAT_QUICK_REPLIES]
  };
}

function humanHandoffResponse(): ChatResponse {
  const contact = CHAT_KNOWLEDGE.find((item) => item.id === "contact");
  if (contact) return toResponse(contact);
  return {
    text: "I'll connect you with our team.",
    links: [
      { label: "Contact form", href: "/#contact", kind: "page" },
      { label: "WhatsApp", href: whatsappUrl("Hi, I need to speak with the Brand2School team."), kind: "whatsapp" },
      { label: `Call ${PUBLIC_PHONE.display}`, href: PUBLIC_PHONE.telHref, kind: "tel" }
    ],
    quickReplies: [...CHAT_QUICK_REPLIES]
  };
}

function fallbackResponse(): ChatResponse {
  return {
    text:
      "I'm not sure about that one. Try a quick topic below, browse our FAQ, or contact the team directly — we'll respond as soon as we can.",
    links: [
      { label: "FAQ", href: "/#faq", kind: "page" },
      { label: "Contact form", href: "/#contact", kind: "page" },
      { label: "WhatsApp", href: whatsappUrl("Hi, I have a question about Brand2School."), kind: "whatsapp" }
    ],
    quickReplies: [...CHAT_QUICK_REPLIES]
  };
}

export function getChatGreeting(): ChatResponse {
  return greetingResponse();
}

export function answerChatMessage(input: ChatMessageInput): ChatResponse {
  if (input.quickReply) {
    const mappedId = CHAT_QUICK_REPLY_MAP[input.quickReply as ChatQuickReply];
    if (mappedId) {
      const item = CHAT_KNOWLEDGE.find((entry) => entry.id === mappedId);
      if (item) return toResponse(item);
    }
  }

  const raw = (input.message ?? input.quickReply ?? "").trim();
  if (!raw) return greetingResponse();

  const normalized = normalize(raw);

  if (/^(hi|hello|hey|howzit|good (morning|afternoon|evening)|start|help)\b/.test(normalized)) {
    return greetingResponse();
  }

  if (/^(thanks|thank you|cheers|appreciate|got it|ok thanks)\b/.test(normalized)) {
    return thanksResponse();
  }

  if (/\b(speak to|talk to|human|agent|person|call me|real person)\b/.test(normalized)) {
    return humanHandoffResponse();
  }

  const match = findBestMatch(normalized);
  if (match) return toResponse(match);

  return fallbackResponse();
}
