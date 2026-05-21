import type { Request, Response } from "express";
import { getPlatformLive } from "./getPlatformLive.js";

const STREAM_INTERVAL_MS = 10_000;

export function platformLiveStreamHandler(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let lastFingerprint = "";
  let closed = false;

  const push = async (): Promise<void> => {
    if (closed) return;
    try {
      const live = await getPlatformLive();
      const fingerprint = `${live.updatedAt}:${live.stats.validSubmissions}:${live.feed[0]?.id ?? ""}`;
      if (fingerprint !== lastFingerprint) {
        lastFingerprint = fingerprint;
        res.write(`event: live\ndata: ${JSON.stringify(live)}\n\n`);
      } else {
        res.write(": keepalive\n\n");
      }
    } catch {
      res.write(`event: error\ndata: ${JSON.stringify({ message: "stream error" })}\n\n`);
    }
  };

  void push();
  const timer = setInterval(() => {
    void push();
  }, STREAM_INTERVAL_MS);

  req.on("close", () => {
    closed = true;
    clearInterval(timer);
  });
}
