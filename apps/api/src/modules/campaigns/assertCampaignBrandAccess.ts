import type { Request } from "express";

export function campaignForbiddenForBrandAdmin(req: Request, campaignBrandId: string): boolean {
  return req.user?.role === "BRAND_ADMIN" && req.user.brandId !== campaignBrandId;
}
