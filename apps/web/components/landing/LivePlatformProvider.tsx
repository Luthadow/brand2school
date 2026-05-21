"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { POLL_MS, type PlatformLivePayload } from "../../lib/platformLive";

type LiveContextValue = {
  data: PlatformLivePayload;
  refresh: () => Promise<void>;
  pulsing: boolean;
  transport: "sse" | "poll";
};

const LiveContext = createContext<LiveContextValue | null>(null);

function applyUpdate(
  next: PlatformLivePayload,
  lastUpdated: React.MutableRefObject<string>,
  setData: (v: PlatformLivePayload) => void,
  setPulsing: (v: boolean) => void
): void {
  if (next.updatedAt !== lastUpdated.current) {
    lastUpdated.current = next.updatedAt;
    setPulsing(true);
    window.setTimeout(() => setPulsing(false), 900);
  }
  setData(next);
}

export function LivePlatformProvider({
  initial,
  children
}: {
  initial: PlatformLivePayload;
  children: ReactNode;
}): JSX.Element {
  const [data, setData] = useState(initial);
  const [pulsing, setPulsing] = useState(false);
  const [transport, setTransport] = useState<"sse" | "poll">("poll");
  const lastUpdated = useRef(initial.updatedAt);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/platform/live", {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    }).catch(() => null);
    if (!res?.ok) return;
    const next = (await res.json()) as PlatformLivePayload;
    applyUpdate(next, lastUpdated, setData, setPulsing);
  }, []);

  useEffect(() => {
    let pollTimer: number | undefined;
    const es = new EventSource("/api/platform/live/stream");

    es.addEventListener("live", (event) => {
      try {
        const next = JSON.parse((event as MessageEvent).data) as PlatformLivePayload;
        applyUpdate(next, lastUpdated, setData, setPulsing);
        setTransport("sse");
      } catch {
        // ignore malformed events
      }
    });

    es.onerror = () => {
      es.close();
      setTransport("poll");
      pollTimer = window.setInterval(() => {
        void refresh();
      }, POLL_MS);
    };

    return () => {
      es.close();
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [refresh]);

  const value = useMemo(() => ({ data, refresh, pulsing, transport }), [data, refresh, pulsing, transport]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function usePlatformLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) {
    throw new Error("usePlatformLive must be used within LivePlatformProvider");
  }
  return ctx;
}
