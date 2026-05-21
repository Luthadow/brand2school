import { Router } from "express";
import { z } from "zod";
import { CONTACT } from "../../lib/contacts.js";
import { contactRateLimit } from "../../middleware/rateLimit.js";
import { queueEmail } from "../../lib/notifications/dispatch.js";

const contactSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  organisation: z.string().max(160).optional(),
  phone: z.string().max(32).optional(),
  topic: z.enum(["General enquiry", "School onboarding", "Brand partnership", "Technical support", "Other"]),
  message: z.string().min(10).max(4000)
});

export const contactRouter = Router();

contactRouter.post("/", contactRateLimit, async (req, res) => {
  const payload = contactSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ message: "Validation failed.", issues: payload.error.flatten() });
    return;
  }

  const inquiry = {
    fullName: payload.data.fullName.trim(),
    email: payload.data.email.trim().toLowerCase(),
    organisation: payload.data.organisation?.trim(),
    phone: payload.data.phone?.trim(),
    topic: payload.data.topic,
    message: payload.data.message.trim()
  };

  try {
    await queueEmail({
      template: "CONTACT_INQUIRY_INFO",
      recipient: CONTACT.general,
      entityType: "CONTACT",
      immediate: true,
      priority: 5,
      metadata: { submitterEmail: inquiry.email },
      payload: inquiry
    });
    await queueEmail({
      template: "CONTACT_ACK",
      recipient: inquiry.email,
      entityType: "CONTACT",
      immediate: true,
      priority: 5,
      payload: inquiry
    });
  } catch (err) {
    console.error("[mail] Contact form delivery failed:", err);
    res.status(503).json({ message: "We could not send your message right now. Please email us directly." });
    return;
  }

  res.status(201).json({ message: "Thank you. Your enquiry has been sent." });
});
