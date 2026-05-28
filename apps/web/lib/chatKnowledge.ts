import { CONTACT, mailto, PUBLIC_CONTACT_LIST, PUBLIC_PHONE, whatsappUrl } from "./contact";

export type ChatLink = {
  label: string;
  href: string;
  kind?: "page" | "email" | "whatsapp" | "tel";
};

export type ChatKnowledgeItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  links?: ChatLink[];
};

/** Homepage FAQ accordion — shared with chatbot knowledge base. */
export const homepageFaqItems = [
  {
    q: "Is Brand2School a donation platform?",
    a: "No. Brand2School is educational commerce infrastructure. Brands, retailers, and communities participate through everyday purchases — not handouts. Every contribution is tied to verified transactions and measurable outcomes."
  },
  {
    q: "How do you prevent fraud and fake schools?",
    a: "Every school is verified before joining. Every code is validated against purchase records. Admin moderation, audit logs, and automated fraud detection run on every submission. Support is only released when milestones are confirmed."
  },
  {
    q: "Is my data safe under POPIA?",
    a: "Yes. Brand2School is built with POPIA compliance at its core. Personal data is encrypted, access is controlled, and we only collect what is necessary to verify participation and deliver impact."
  },
  {
    q: "How does a school join?",
    a: "Register at /schools/register with your school details and WhatsApp number. Principals get a portal login. Families submit product codes via WhatsApp using school name + district — no learner registration required."
  },
  {
    q: "What do brands get in return?",
    a: "Measurable ESG impact, live analytics, brand visibility in communities, campaign reporting, and alignment with national education outcomes — all backed by transparent, auditable data."
  }
] as const;

export const CHAT_GREETING =
  "Hi! I'm the Brand2School assistant. I can help with submitting codes, school registration, brand partnerships, POPIA & trust, and how to reach our team.";

export const CHAT_QUICK_REPLIES = [
  "Submit a product code",
  "Register my school",
  "Brand partnership",
  "Is this a donation platform?",
  "Contact the team"
] as const;

export type ChatQuickReply = (typeof CHAT_QUICK_REPLIES)[number];

const registerSchoolLinks: ChatLink[] = [
  { label: "Register a school", href: "/schools/register", kind: "page" },
  { label: "School login", href: "/school/login", kind: "page" },
  { label: `Email ${CONTACT.schools}`, href: mailto(CONTACT.schools, "School onboarding enquiry"), kind: "email" }
];

const submitCodeLinks: ChatLink[] = [
  { label: "Submit online", href: "/submit", kind: "page" },
  { label: "WhatsApp us", href: whatsappUrl("Hi, I need help submitting a product code."), kind: "whatsapp" },
  { label: "How it works", href: "/#how-it-works", kind: "page" }
];

const brandLinks: ChatLink[] = [
  { label: "For brands", href: "/for-brands", kind: "page" },
  { label: "Apply as a brand", href: "/for-brands#contact", kind: "page" },
  { label: `Email ${CONTACT.brands}`, href: mailto(CONTACT.brands, "Brand partnership enquiry"), kind: "email" }
];

const contactLinks: ChatLink[] = [
  { label: "Contact form", href: "/#contact", kind: "page" },
  { label: `Call ${PUBLIC_PHONE.display}`, href: PUBLIC_PHONE.telHref, kind: "tel" },
  { label: "WhatsApp", href: PUBLIC_PHONE.whatsappHref, kind: "whatsapp" },
  ...PUBLIC_CONTACT_LIST.map((item) => ({
    label: item.label,
    href: mailto(item.email),
    kind: "email" as const
  }))
];

export const CHAT_KNOWLEDGE: ChatKnowledgeItem[] = [
  {
    id: "what-is-b2s",
    question: "What is Brand2School?",
    answer:
      "Brand2School is a school infrastructure impact network. Brands, retailers, and communities participate through everyday purchases — verified product codes fund measurable school transformation, not handouts.",
    keywords: ["what is", "brand2school", "about", "platform", "purpose", "mission", "who are you"]
  },
  {
    id: "donation",
    question: "Is Brand2School a donation platform?",
    answer: homepageFaqItems[0].a,
    keywords: ["donation", "donate", "charity", "handout", "free money", "ngo"]
  },
  {
    id: "submit-code",
    question: "How do I submit a product code?",
    answer:
      "Buy a participating product, find the code inside the pack, then submit at brand2school.co.za/submit or message Brand2School on WhatsApp. Enter your school name and district, select the product or campaign, and paste the code. No learner account is required.",
    keywords: ["submit", "code", "product code", "participation", "enter code", "redeem", "scan", "qr"],
    links: submitCodeLinks
  },
  {
    id: "whatsapp",
    question: "How does WhatsApp participation work?",
    answer:
      `Message Brand2School on WhatsApp (${PUBLIC_PHONE.display}). Reply MENU for options: (1) submit a product code, (2) check school progress, (3) view campaigns, (4) school status. You can also submit codes on the website at /submit.`,
    keywords: ["whatsapp", "wa", "message", "menu", "chat"],
    links: [
      { label: "Open WhatsApp", href: whatsappUrl("MENU"), kind: "whatsapp" },
      { label: "Submit online", href: "/submit", kind: "page" }
    ]
  },
  {
    id: "school-register",
    question: "How does a school register?",
    answer:
      "Schools register at /schools/register with province, district, EMIS details, and a WhatsApp number for the school. After review, principals receive portal login access. Families then submit codes linked to the school name and district.",
    keywords: ["register school", "school register", "join school", "onboard school", "sign up school", "emis"],
    links: registerSchoolLinks
  },
  {
    id: "school-login",
    question: "How do schools log in?",
    answer:
      "Registered principals and school admins log in at /school/login with the email used during registration. Use the forgot-password link if you need to reset access.",
    keywords: ["school login", "principal login", "school portal", "school dashboard"],
    links: [
      { label: "School login", href: "/school/login", kind: "page" },
      { label: "Forgot password", href: "/school/login", kind: "page" }
    ]
  },
  {
    id: "brand-partnership",
    question: "How do brands partner with Brand2School?",
    answer:
      "Enterprise brands apply at /for-brands with company details and campaign intent. Brand2School offers territorial packages (school, district, province, or national scope), ESG reporting, and verified school impact. Our team reviews applications before activation.",
    keywords: ["brand", "partner", "partnership", "sponsor", "enterprise", "csi", "esg", "retailer"],
    links: brandLinks
  },
  {
    id: "brand-pricing",
    question: "What does it cost for brands?",
    answer:
      "Brands pay a mandatory platform and ESG infrastructure fee (activation + annual subscription). Optional transformation pools can fund on-the-ground infrastructure. Schools and learners are never charged. Exact commercial terms are shared during onboarding — contact our partnerships team for a tailored quote.",
    keywords: ["price", "pricing", "cost", "fee", "subscription", "activation", "how much", "pay"],
    links: brandLinks
  },
  {
    id: "brand-launch",
    question: "What must be paid before a campaign launches?",
    answer:
      "Before go-live: signed participation agreement, POPIA acceptance, verified platform fee (deposit + activation tranches), approved product codes, configured campaign rules, and admin launch approval.",
    keywords: ["launch", "before launch", "go live", "requirements", "activation", "agreement"]
  },
  {
    id: "schools-charged",
    question: "Are schools charged?",
    answer: "No. Schools and learners participate without paywalls. Brands fund platform intelligence and optional infrastructure pools.",
    keywords: ["schools charged", "school fee", "pay school", "cost school", "learner fee"]
  },
  {
    id: "territory",
    question: "How is territory defined?",
    answer:
      "By school, district, province, or national scope. Participation follows geography, campaign rules, and infrastructure phases — not arbitrary submission caps.",
    keywords: ["territory", "territorial", "district", "province", "national", "scope", "geography"]
  },
  {
    id: "fraud",
    question: "How do you prevent fraud?",
    answer: homepageFaqItems[1].a,
    keywords: ["fraud", "fake", "verify", "verification", "trust", "scam", "moderation"],
    links: [{ label: "Trust & verification", href: "/trust", kind: "page" }]
  },
  {
    id: "popia",
    question: "Is my data safe under POPIA?",
    answer: homepageFaqItems[2].a,
    keywords: ["popia", "privacy", "data", "safe", "personal information", "gdpr"]
  },
  {
    id: "brand-benefits",
    question: "What do brands get in return?",
    answer: homepageFaqItems[4].a,
    keywords: ["benefit", "return", "analytics", "reporting", "visibility", "impact report"]
  },
  {
    id: "password-reset",
    question: "How do I reset my password?",
    answer:
      "Use the forgot-password link on the school or brand login page. You'll receive a reset email from noreply@brand2school.co.za. If it doesn't arrive, check spam or email support@brand2school.co.za.",
    keywords: ["password", "reset", "forgot", "login problem", "locked out", "cant log in"],
    links: [
      { label: "School login", href: "/school/login", kind: "page" },
      { label: "Brand login", href: "/brand/login", kind: "page" },
      { label: `Email ${CONTACT.support}`, href: mailto(CONTACT.support, "Password reset help"), kind: "email" }
    ]
  },
  {
    id: "brand-login",
    question: "How do brands log in?",
    answer: "Brand admins log in at /brand/login with the email linked to their brand account.",
    keywords: ["brand login", "brand portal", "brand dashboard"],
    links: [{ label: "Brand login", href: "/brand/login", kind: "page" }]
  },
  {
    id: "contact",
    question: "How do I contact Brand2School?",
    answer: `General: ${CONTACT.general} · Schools: ${CONTACT.schools} · Brands: ${CONTACT.brands} · Support: ${CONTACT.support} · Phone & WhatsApp: ${PUBLIC_PHONE.display}`,
    keywords: ["contact", "email", "phone", "call", "reach", "talk", "human", "support team", "help me"],
    links: contactLinks
  },
  {
    id: "impact",
    question: "What impact areas does Brand2School cover?",
    answer:
      "Verified campaigns support school infrastructure across nutrition, digital learning, sports development, water & sanitation, power, and broader ecosystem transformation. See the Impact page for live platform data.",
    keywords: ["impact", "infrastructure", "nutrition", "digital", "sports", "water", "transformation"],
    links: [
      { label: "Impact dashboard", href: "/impact", kind: "page" },
      { label: "Impact areas", href: "/#impact-areas", kind: "page" }
    ]
  },
  {
    id: "how-it-works",
    question: "How does Brand2School work?",
    answer:
      "Shop → open the pack → submit the code online or on WhatsApp → enter school name and district → verified participation counts toward the school's campaign target and infrastructure milestone.",
    keywords: ["how it works", "how does it work", "process", "steps", "flow", "journey"],
    links: [
      { label: "How it works", href: "/#how-it-works", kind: "page" },
      { label: "Submit a code", href: "/submit", kind: "page" }
    ]
  },
  {
    id: "learner-account",
    question: "Do learners need an account?",
    answer:
      "No. Learners and community members do not register individually. The school name and district identify participation — submit a code via the website or WhatsApp.",
    keywords: ["learner", "student", "account", "sign up", "registration", "parent", "community"]
  },
  {
    id: "progress",
    question: "How do I check school progress?",
    answer:
      "On WhatsApp, reply MENU and choose option 2 (check school progress). Schools can also view progress in the school dashboard after logging in.",
    keywords: ["progress", "status", "milestone", "target", "campaign progress", "how far"],
    links: [
      { label: "WhatsApp", href: whatsappUrl("MENU"), kind: "whatsapp" },
      { label: "School dashboard", href: "/school/dashboard", kind: "page" }
    ]
  },
  {
    id: "renewals",
    question: "How do brand renewals work?",
    answer:
      "Annual transformation licences renew with the platform fee and updated terms. Renewal notices are issued before expiry according to commercial governance.",
    keywords: ["renewal", "renew", "annual", "licence", "license", "expire"]
  },
  {
    id: "multi-sponsor",
    question: "Can multiple brands sponsor one school?",
    answer:
      "Yes over time — different infrastructure phases (water, digital, power, nutrition) may have category sponsors as the ecosystem matures.",
    keywords: ["multiple brands", "co-sponsor", "sponsor one school", "shared"]
  }
];

/** Maps quick-reply chip labels to knowledge item ids. */
export const CHAT_QUICK_REPLY_MAP: Record<ChatQuickReply, string> = {
  "Submit a product code": "submit-code",
  "Register my school": "school-register",
  "Brand partnership": "brand-partnership",
  "Is this a donation platform?": "donation",
  "Contact the team": "contact"
};
