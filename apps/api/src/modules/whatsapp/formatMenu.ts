import type { WhatsAppMenuOption } from "./conversationTypes.js";
import { WA_LIST_PAGE_SIZE } from "./conversationTypes.js";

export function paginateOptions<T>(
  items: T[],
  page: number,
  mapRow: (item: T, index: number) => WhatsAppMenuOption
): { options: WhatsAppMenuOption[]; page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } {
  const totalPages = Math.max(1, Math.ceil(items.length / WA_LIST_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = items.slice(safePage * WA_LIST_PAGE_SIZE, safePage * WA_LIST_PAGE_SIZE + WA_LIST_PAGE_SIZE);
  return {
    options: slice.map((item, i) => mapRow(item, safePage * WA_LIST_PAGE_SIZE + i)),
    page: safePage,
    totalPages,
    hasNext: safePage < totalPages - 1,
    hasPrev: safePage > 0
  };
}

export function formatNumberedMenu(input: {
  title: string;
  options: WhatsAppMenuOption[];
  page?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  footer?: string;
}): string {
  const lines = [input.title, ""];
  input.options.forEach((opt, index) => {
    const detail = opt.detail ? ` — ${opt.detail}` : "";
    lines.push(`${index + 1}. ${opt.label}${detail}`);
  });
  lines.push("");
  if (input.hasPrev) lines.push("Reply 0 for previous page");
  if (input.hasNext) lines.push(`Reply * for next page (${(input.page ?? 0) + 2}/${input.totalPages ?? 1})`);
  lines.push(input.footer ?? "Reply MENU to start over · CANCEL to stop");
  return lines.join("\n");
}

export function resolveMenuPick(
  text: string,
  options: WhatsAppMenuOption[] | undefined
): WhatsAppMenuOption | null {
  const trimmed = text.trim();
  if (!options?.length) return null;
  if (trimmed === "*") return { key: "__next__", label: "next" };
  if (trimmed === "0" && options.length > 0) return { key: "__prev__", label: "prev" };

  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < 1 || num > options.length) return null;
  return options[num - 1] ?? null;
}
