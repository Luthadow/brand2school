import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../lib/jwt.js";

const BRAND_ROLES = new Set(["BRAND_ADMIN", "SUPER_ADMIN", "ADMIN_STAFF"]);

export const requireAnalyticsAccess = (req: Request, res: Response, next: NextFunction): void => {
  const internalKey = env.INTERNAL_API_KEY;
  const headerKey = req.headers["x-b2s-internal-key"];

  if (internalKey && typeof headerKey === "string" && headerKey === internalKey) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      if (BRAND_ROLES.has(payload.role)) {
        req.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          brandId: payload.brandId
        };
        if (payload.role === "BRAND_ADMIN" && payload.brandId) {
          req.brandId = payload.brandId;
        }
        next();
        return;
      }
    } catch {
      // fall through
    }
  }

  res.status(401).json({
    message: "Analytics access requires authentication or a valid internal API key."
  });
};
