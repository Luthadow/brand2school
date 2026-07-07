import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getCommunityPortal } from "./getCommunityPortal.js";
import { isCommunityOrganization } from "../../lib/communityOrganizations.js";
import { getSchoolForUser } from "../schools/registerSchool.js";

export const communityRouter = Router();

communityRouter.get("/portal", requireAuth, requireRole(["SCHOOL_ADMIN"]), async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const school = await getSchoolForUser(req.user.id);
  if (!school) {
    res.status(404).json({ message: "No organisation linked to this account." });
    return;
  }

  if (!isCommunityOrganization(school.organizationCategory)) {
    res.status(403).json({
      message: "Community Hub access is for community, NGO, and faith-based organisations.",
      organizationCategory: school.organizationCategory
    });
    return;
  }

  try {
    const portal = await getCommunityPortal(req.user.id);
    if (!portal) {
      res.status(404).json({ message: "Could not load community portal." });
      return;
    }
    res.json(portal);
  } catch (err) {
    console.error("[community/portal]", err);
    res.status(500).json({ message: "Could not load community portal." });
  }
});
