import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requireInternalApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = env.INTERNAL_API_KEY;
  const provided = req.headers["x-b2s-internal-key"];

  if (!expected || typeof provided !== "string" || provided !== expected) {
    res.status(401).json({ message: "Valid internal API key required." });
    return;
  }

  next();
}
