import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SUSPICIOUS_PATTERNS = [
  /\.\.\//,
  /<script/i,
  /union\s+select/i,
  /;\s*drop\s+table/i,
  /\x00/
];

export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  res.setHeader("X-Request-Id", requestId);
  (req as Request & { requestId?: string }).requestId = requestId;

  const target = `${req.path}?${JSON.stringify(req.query)}`;
  if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(target))) {
    res.status(400).json({ message: "Invalid request." });
    return;
  }

  next();
}
