import PDFDocument from "pdfkit";
import { LETTERHEAD } from "../../lib/company.js";
import { resolveBrandLogoPath } from "../../lib/pdf/pdfKitHelpers.js";
import { formatReportGeneratedAt, REPORT_BRAND_BLUE } from "../../lib/pdf/reportLayout.js";

const MARGIN = 48;
const BRAND_GREEN = "#6CC24A";

const BRAND_TYPES = [
  "FMCG Companies",
  "Retailers",
  "Financial Institutions",
  "Fuel & Energy Companies",
  "Telecommunications Providers",
  "Automotive Manufacturers",
  "Mining Companies",
  "Healthcare Companies",
  "Technology Companies",
  "Government Departments",
  "Municipalities"
];

const COMMUNITY_ORG_TYPES = [
  "NGOs",
  "NPOs",
  "Foundations",
  "Feeding Schemes",
  "Environmental Organisations",
  "Sports Development Centres",
  "Youth Development Programmes",
  "Faith-Based Organisations",
  "Arts & Culture Organisations",
  "Skills Development Centres",
  "Community Development Projects"
];

const CAMPAIGN_OWNER_TYPES = [
  "Foundations",
  "Community Trusts",
  "Traditional Councils",
  "Municipalities",
  "Government Programmes",
  "Recycling Initiatives",
  "Literacy Projects",
  "Tree Planting Campaigns",
  "Community Health Campaigns",
  "School Competitions"
];

const STRATEGIC_PARTNERS = [
  "Recycling Companies",
  "Environmental Agencies",
  "Educational Institutions",
  "Technology Providers",
  "Logistics Partners",
  "Research Organisations",
  "Corporate Sponsors",
  "Media Partners",
  "Development Agencies"
];

const CAMPAIGN_CREATION_ITEMS = [
  "Campaign objectives",
  "Participation rules",
  "Verification requirements",
  "Duration",
  "Reward structure",
  "Expected impact",
  "Performance indicators"
];

const PARTICIPATION_ACTIVITIES = [
  "Purchasing participating products or services",
  "Recycling cans, bottles and paper",
  "Tree planting",
  "Community clean-up campaigns",
  "Reading and literacy programmes",
  "Sports competitions",
  "Digital skills initiatives",
  "Other approved campaign activities"
];

const VERIFICATION_METHODS = [
  "Unique campaign codes",
  "QR code validation",
  "GPS location verification",
  "Photo and video evidence",
  "Digital confirmations",
  "Partner verification",
  "Digital signatures",
  "Audit trails",
  "Real-time participation analytics"
];

const MEASUREMENT_METRICS = [
  "Participation levels",
  "Campaign progress",
  "Schools and organisations involved",
  "Community engagement",
  "Verified activities",
  "Impact metrics",
  "ESG and CSI performance indicators"
];

const IMPACT_OUTCOMES = [
  "Educational resources",
  "Infrastructure improvements",
  "Technology equipment",
  "Environmental projects",
  "Sports equipment",
  "Feeding scheme support",
  "Educational excursions",
  "Community development funding",
  "Other verified campaign rewards"
];

const CAMPAIGN_CATEGORIES: Array<{ title: string; text: string }> = [
  {
    title: "Education Development",
    text: "Supporting schools through classroom resources, infrastructure improvements, learner development programmes and educational competitions."
  },
  {
    title: "Environmental Sustainability",
    text: "Recycling campaigns, waste management initiatives, tree planting, environmental awareness programmes and community clean-up projects."
  },
  {
    title: "Food Security",
    text: "School nutrition programmes, community feeding schemes, agricultural development and food sustainability initiatives."
  },
  {
    title: "Sports Development",
    text: "Sports tournaments, equipment sponsorships, coaching programmes and youth talent development."
  },
  {
    title: "Technology & Digital Skills",
    text: "Coding programmes, robotics competitions, digital literacy campaigns and technology access initiatives."
  },
  {
    title: "Literacy & Reading",
    text: "Reading challenges, library development, book donation campaigns and literacy improvement programmes."
  },
  {
    title: "Youth Development",
    text: "Leadership programmes, entrepreneurship initiatives, career guidance and life skills development."
  },
  {
    title: "Arts, Culture & Heritage",
    text: "Creative arts programmes, music, drama, cultural preservation and community festivals."
  },
  {
    title: "Health & Wellness",
    text: "Health awareness campaigns, wellness programmes, hygiene initiatives and preventative healthcare projects."
  },
  {
    title: "Community Upliftment",
    text: "Infrastructure projects, skills development, housing support, public space improvements and local economic development initiatives."
  }
];

const MARKETPLACE_OWNERS = [
  "Corporate Brands",
  "Government Departments",
  "Municipalities",
  "Foundations",
  "NGOs & NPOs",
  "Community Organisations",
  "Educational Institutions",
  "Traditional Councils",
  "Industry Associations",
  "Development Agencies"
];

const INDUSTRIES = [
  "Retail & FMCG",
  "Banking & Financial Services",
  "Telecommunications",
  "Mining",
  "Automotive",
  "Energy & Fuel",
  "Agriculture",
  "Manufacturing",
  "Healthcare",
  "Education",
  "Environmental Services",
  "Public Sector"
];

const MARKETPLACE_TRUST = [
  "Structured campaign management",
  "Configurable verification processes",
  "Real-time participation tracking",
  "Live impact dashboards",
  "Audit-ready reporting",
  "Transparent performance measurement",
  "ESG and CSI reporting tools"
];

const VERIFY_OPTIONS = [
  "Unique Campaign Codes",
  "QR Code Validation",
  "GPS Location Verification",
  "Digital Signatures",
  "Photo & Video Evidence",
  "Partner Verification",
  "Digital Collection Receipts",
  "School Confirmation",
  "Community Organisation Confirmation",
  "Time & Date Validation",
  "Live Participation Analytics",
  "Audit Trail Management"
];

const MULTI_LAYER = [
  "The participating school",
  "The participating community organisation",
  "An authorised campaign partner",
  "A registered collection partner or recycler",
  "Brand2School's automated verification systems"
];

const REALTIME_MONITOR = [
  "Participation levels",
  "Campaign progress",
  "Verified activities",
  "Geographic participation",
  "Community engagement",
  "Environmental impact",
  "Educational outcomes",
  "Campaign performance",
  "Verified social impact"
];

const AUDIT_RECORDS = [
  "Participant information",
  "Verification method used",
  "GPS coordinates",
  "Date and time stamps",
  "Supporting evidence",
  "Verification history",
  "Campaign progress records",
  "Final impact reports"
];

const VALUES: Array<{ title: string; text: string }> = [
  {
    title: "Integrity",
    text: "We conduct our business with honesty, fairness and professionalism. We are committed to ethical practices and always act in the best interests of our partners, communities and stakeholders."
  },
  {
    title: "Transparency",
    text: "Trust is earned through openness and accountability. Every campaign on Brand2School is supported by transparent verification processes, measurable reporting and real-time visibility, ensuring that every stakeholder can see how participation creates impact."
  },
  {
    title: "Innovation",
    text: "We believe technology should solve real-world challenges. By continuously developing innovative digital solutions, we create smarter ways for brands and communities to collaborate, participate and measure meaningful social impact."
  },
  {
    title: "Community",
    text: "Communities are at the heart of everything we do. Every campaign is designed to empower people, strengthen local initiatives and create opportunities that improve lives and build stronger, more resilient communities."
  },
  {
    title: "Collaboration",
    text: "Sustainable impact is achieved when organisations work together. We foster partnerships between brands, schools, community organisations, campaign owners and communities to achieve shared goals that no single organisation could accomplish alone."
  },
  {
    title: "Accountability",
    text: "We take responsibility for the impact we create. Every activity on Brand2School is measurable, verifiable and supported by reliable data, ensuring that commitments are honoured and results can be trusted."
  },
  {
    title: "Sustainability",
    text: "We believe meaningful impact should create lasting change. Our platform promotes initiatives that deliver long-term social, environmental and economic value, helping communities grow stronger well beyond the duration of individual campaigns."
  },
  {
    title: "Excellence",
    text: "We are committed to delivering the highest standards in everything we do. From platform development and campaign management to stakeholder support and reporting, we continuously strive for quality, professionalism and continuous improvement."
  },
  {
    title: "Inclusion",
    text: "We believe everyone has a role to play in creating positive change. Brand2School is designed to bring together brands, schools, community organisations and individuals from all backgrounds, ensuring that opportunities to participate and make an impact are accessible to everyone."
  },
  {
    title: "Purpose-Driven Impact",
    text: "Everything we build is guided by a single purpose: creating measurable social impact. We believe that every purchase, every campaign and every act of participation should contribute to building stronger schools, empowered communities and a better future for South Africa."
  }
];

const PARTNER_POINTS: Array<{ title: string; text: string }> = [
  {
    title: "Measurable Social Impact",
    text: "Every campaign is designed with clear objectives, measurable outcomes and transparent reporting, allowing organisations to demonstrate the real difference their investments make."
  },
  {
    title: "Stronger Customer Engagement",
    text: "Move beyond traditional promotions by giving customers meaningful opportunities to participate in initiatives that improve schools, communities and the environment. Purpose-driven engagement strengthens customer loyalty, increases brand affinity and builds long-term relationships."
  },
  {
    title: "ESG & CSI Alignment",
    text: "Brand2School helps organisations achieve Environmental, Social and Governance (ESG) objectives while strengthening Corporate Social Investment (CSI) programmes through measurable participation campaigns supported by reliable data and impact reporting."
  },
  {
    title: "Transparent Verification",
    text: "Every qualifying activity is independently verified using Brand2School's Verification Engine. This ensures that campaign participation is credible, auditable and trusted by brands, campaign owners, participating organisations and communities."
  },
  {
    title: "Real-Time Reporting",
    text: "Access live dashboards that provide complete visibility into campaign performance — participation levels, community engagement, campaign progress, verified activities, impact metrics and ESG & CSI performance indicators — all from a single platform."
  },
  {
    title: "Scalable Campaign Management",
    text: "Whether supporting a single local initiative or managing a nationwide programme, Brand2School provides the infrastructure required to scale participation campaigns efficiently while maintaining transparency and accountability."
  },
  {
    title: "National Reach",
    text: "Our platform is designed to connect organisations with schools and community organisations across South Africa, creating opportunities for brands to expand their impact while supporting communities where they operate."
  },
  {
    title: "Data-Driven Decision Making",
    text: "Comprehensive analytics and measurable impact reporting provide valuable insights that help organisations evaluate campaign performance, improve future initiatives and maximise return on social investment."
  },
  {
    title: "Enhanced Brand Reputation",
    text: "Consumers increasingly support organisations that demonstrate genuine commitment to the communities they serve. Brand2School enables brands to build trust through authentic participation campaigns that create measurable social value rather than one-off marketing activities."
  },
  {
    title: "A Trusted Community Impact Partner",
    text: "Brand2School is more than a technology platform — we are a long-term strategic partner committed to helping organisations design, manage, verify and measure meaningful community participation campaigns."
  },
  {
    title: "Creating Shared Value",
    text: "When organisations partner with Brand2School, they do more than sponsor a campaign. They become part of a national movement that empowers brands, schools, campaign owners, community organisations and communities to work together towards a common purpose."
  }
];

export function companyProfileContentDisposition(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `attachment; filename="brand2school-company-profile-${date}.pdf"`;
}

function drawFullLetterhead(doc: InstanceType<typeof PDFDocument>, bannerTitle: string): void {
  const logoPath = resolveBrandLogoPath();
  const top = 36;
  const rightX = 200;

  if (logoPath) {
    try {
      doc.image(logoPath, MARGIN, top, { fit: [130, 52] });
    } catch {
      doc.fontSize(16).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text("Brand2School", MARGIN, top + 12);
    }
  } else {
    doc.fontSize(16).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text("Brand2School", MARGIN, top + 12);
  }

  doc.fontSize(9).font("Helvetica-Bold").fillColor("#111827").text(LETTERHEAD.companyName, rightX, top);
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#374151")
    .text(LETTERHEAD.registrationNo, rightX, top + 14)
    .text(LETTERHEAD.taxNo, rightX, top + 26)
    .text(LETTERHEAD.address, rightX, top + 38, { width: doc.page.width - rightX - MARGIN })
    .text(LETTERHEAD.phone, rightX, top + 62);

  doc.rect(0, 108, doc.page.width, 32).fill(REPORT_BRAND_BLUE);
  doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold").text("Brand2School", MARGIN, 114);
  doc.fontSize(9).font("Helvetica").text(bannerTitle, MARGIN, 128);
  doc.fillColor("#374151");
  doc.x = MARGIN;
  doc.y = 156;
}

function ensureSpace(doc: InstanceType<typeof PDFDocument>, needed = 72): void {
  const bottomY = doc.page.height - 56;
  if (doc.y + needed > bottomY) {
    doc.addPage();
    drawFullLetterhead(doc, "Company Profile — continued");
  }
}

function drawHeading(doc: InstanceType<typeof PDFDocument>, title: string): void {
  ensureSpace(doc, 40);
  doc.moveDown(0.55);
  doc.fontSize(13).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(title, MARGIN, doc.y, {
    width: doc.page.width - MARGIN * 2
  });
  doc
    .moveTo(MARGIN, doc.y + 4)
    .lineTo(MARGIN + 72, doc.y + 4)
    .strokeColor(BRAND_GREEN)
    .lineWidth(2)
    .stroke();
  doc.lineWidth(1);
  doc.moveDown(0.5);
  doc.fillColor("#374151").font("Helvetica");
}

function drawSubheading(doc: InstanceType<typeof PDFDocument>, title: string): void {
  ensureSpace(doc, 28);
  doc.moveDown(0.25);
  doc.fontSize(11).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(title, MARGIN, doc.y, {
    width: doc.page.width - MARGIN * 2
  });
  doc.moveDown(0.25);
  doc.fillColor("#374151").font("Helvetica");
}

function drawParagraph(doc: InstanceType<typeof PDFDocument>, text: string, options?: { italic?: boolean }): void {
  ensureSpace(doc, 36);
  doc
    .fontSize(10)
    .font(options?.italic ? "Helvetica-Oblique" : "Helvetica")
    .fillColor("#374151")
    .text(text, MARGIN, doc.y, {
      width: doc.page.width - MARGIN * 2,
      align: "justify",
      lineGap: 2
    });
  doc.moveDown(0.4);
  doc.font("Helvetica");
}

function drawBullets(doc: InstanceType<typeof PDFDocument>, items: string[]): void {
  for (const item of items) {
    ensureSpace(doc, 16);
    doc.fontSize(10).fillColor("#374151").text(`•  ${item}`, MARGIN + 4, doc.y, {
      width: doc.page.width - MARGIN * 2 - 4
    });
  }
  doc.moveDown(0.3);
}

function drawAudienceBlock(doc: InstanceType<typeof PDFDocument>, title: string, text: string): void {
  ensureSpace(doc, 48);
  doc.fontSize(10.5).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(title, MARGIN, doc.y);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#374151")
    .text(text, MARGIN, doc.y + 2, { width: doc.page.width - MARGIN * 2, align: "justify" });
  doc.moveDown(0.35);
}

function drawServiceBlock(doc: InstanceType<typeof PDFDocument>, title: string, text: string, bullets?: string[]): void {
  drawSubheading(doc, title);
  drawParagraph(doc, text);
  if (bullets?.length) drawBullets(doc, bullets);
}

function drawPageFooters(doc: InstanceType<typeof PDFDocument>): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const y = doc.page.height - 40;
    doc
      .moveTo(MARGIN, y - 8)
      .lineTo(doc.page.width - MARGIN, y - 8)
      .strokeColor("#E5E7EB")
      .stroke();
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text(LETTERHEAD.productLine, MARGIN, y, {
        width: doc.page.width - MARGIN * 2 - 60,
        align: "left",
        lineBreak: false
      });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, y, {
      width: doc.page.width - MARGIN * 2,
      align: "right",
      lineBreak: false
    });
  }
}

export async function buildCompanyProfilePdf(): Promise<Buffer> {
  const generated = formatReportGeneratedAt(new Date().toISOString());

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawFullLetterhead(doc, "Company Profile");

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(REPORT_BRAND_BLUE)
      .text("BRAND2SCHOOL", MARGIN, doc.y, { width: doc.page.width - MARGIN * 2 });
    doc.fontSize(14).fillColor("#111827").text("Company Profile", MARGIN, doc.y + 4);
    doc.moveDown(0.35);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#374151")
      .text("Transforming Everyday Participation into Lasting Community Impact", {
        width: doc.page.width - MARGIN * 2
      });
    doc.moveDown(0.3);
    doc.fontSize(8).font("Helvetica").fillColor("#6B7280").text(`Generated ${generated}`);

    drawHeading(doc, "Company Overview");
    drawParagraph(
      doc,
      "Brand2School is South Africa's Community Participation & Impact Platform, designed to connect brands, schools, community organisations, campaign owners and communities through verified participation campaigns that create measurable and sustainable social impact."
    );
    drawParagraph(
      doc,
      "The platform enables businesses and organisations to transform everyday customer participation into meaningful opportunities that support education, environmental sustainability, youth development, food security, sports development, technology access and community upliftment."
    );
    drawParagraph(
      doc,
      "Unlike traditional Corporate Social Investment (CSI) initiatives, Brand2School empowers communities to actively participate in creating positive change rather than simply receiving support. Every campaign is supported by a robust technology platform that verifies participation, measures impact and provides transparent real-time reporting to all stakeholders."
    );
    drawParagraph(
      doc,
      "By bringing together brands seeking meaningful customer engagement, campaign owners driving community initiatives, schools pursuing development opportunities and communities committed to making a difference, Brand2School creates a collaborative ecosystem where participation is transformed into measurable impact."
    );
    drawParagraph(
      doc,
      "Developed and operated by Nkanyezi Tech Solutions (Pty) Ltd, Brand2School represents a new generation of impact technology—where innovation, transparency and collaboration enable organisations to deliver measurable Environmental, Social and Governance (ESG), Corporate Social Investment (CSI) and community development outcomes while building stronger relationships with the people they serve."
    );
    drawParagraph(
      doc,
      "Brand2School is more than a technology platform—it is a movement that empowers brands and communities to work together in building a more inclusive, sustainable and prosperous South Africa."
    );

    drawHeading(doc, "Vision");
    drawParagraph(
      doc,
      "To become Africa's leading community participation platform where brands, organisations and communities collaborate to create measurable, transparent and sustainable social impact."
    );

    drawHeading(doc, "Mission");
    drawParagraph(
      doc,
      "To provide a trusted technology platform that enables brands, schools, community organisations and communities to collaborate through verified participation campaigns that improve lives while strengthening engagement, accountability and impact measurement."
    );

    drawHeading(doc, "Why Brand2School Exists");
    drawParagraph(
      doc,
      "Every day, millions of South Africans purchase products and services from brands they know and trust. At the same time, thousands of schools and community organisations continue to face challenges such as limited resources, inadequate infrastructure, funding shortages and a lack of sustainable development opportunities."
    );
    drawParagraph(
      doc,
      "For decades, brands have invested significantly in marketing campaigns, customer loyalty programmes, Corporate Social Investment (CSI) initiatives and Environmental, Social and Governance (ESG) programmes. While these investments have created value, they have often been disconnected from the everyday communities that support those brands."
    );
    drawParagraph(doc, "Brand2School was created to bridge this gap.");
    drawParagraph(
      doc,
      "We believe that meaningful social impact should not rely solely on donations or once-off sponsorships. Instead, it should be driven by everyday participation—where customers, schools, community organisations and brands work together towards a shared purpose."
    );
    drawParagraph(
      doc,
      "Our platform transforms everyday purchases and community participation into measurable opportunities that support education, environmental sustainability, youth development, food security, sports development, digital inclusion and community upliftment."
    );
    drawParagraph(
      doc,
      "Through transparent technology, intelligent verification and real-time impact reporting, Brand2School enables every campaign to deliver measurable outcomes that benefit both communities and the organisations that invest in them."
    );
    drawParagraph(
      doc,
      "Brand2School exists to prove that every purchase, every campaign and every community action has the power to create lasting social impact when participation is measured, verified and connected to purpose."
    );

    drawHeading(doc, "Who Brand2School Is For");
    drawParagraph(
      doc,
      "Brand2School has been designed as a collaborative ecosystem that brings together organisations, institutions and communities with a shared commitment to creating measurable social impact. Every stakeholder plays a unique role in transforming participation into meaningful outcomes."
    );

    drawAudienceBlock(
      doc,
      "Brands",
      "Brand2School empowers businesses to build stronger customer relationships while delivering measurable Environmental, Social and Governance (ESG) and Corporate Social Investment (CSI) outcomes. Through purpose-driven participation campaigns, brands can increase customer engagement, strengthen loyalty, enhance brand reputation and demonstrate transparent community impact. Our platform is suitable for:"
    );
    drawBullets(doc, BRAND_TYPES);

    drawAudienceBlock(
      doc,
      "Schools",
      "Schools participate in verified campaigns that create opportunities for learners, educators and surrounding communities. Through Brand2School, schools gain access to development initiatives, educational programmes, environmental campaigns, sports opportunities, technology projects and other community-driven activities designed to improve learning environments and learner outcomes."
    );

    drawAudienceBlock(
      doc,
      "Community Organisations",
      "Brand2School provides community organisations with a platform to manage, promote and measure the impact of their programmes. By participating in or leading verified campaigns, organisations can attract partners, increase visibility and demonstrate measurable outcomes to sponsors and stakeholders. Examples include:"
    );
    drawBullets(doc, COMMUNITY_ORG_TYPES);

    drawAudienceBlock(
      doc,
      "Campaign Owners",
      "Campaign Owners are organisations that design and manage community initiatives through the Brand2School platform. They use our technology to launch campaigns, monitor participation, verify activities and measure impact. Examples include:"
    );
    drawBullets(doc, CAMPAIGN_OWNER_TYPES);

    drawAudienceBlock(
      doc,
      "Communities",
      "Communities are the driving force behind every Brand2School campaign. Parents, guardians, learners, educators, alumni, local businesses and community members actively participate through purchases, volunteer activities and community initiatives that contribute towards meaningful social development."
    );

    drawAudienceBlock(
      doc,
      "Strategic Partners",
      "Brand2School also collaborates with organisations that provide specialist expertise, resources or services to strengthen campaign delivery and impact. These may include:"
    );
    drawBullets(doc, STRATEGIC_PARTNERS);

    drawParagraph(
      doc,
      "Brand2School is built for everyone who believes that meaningful social impact is created through collaboration. By connecting brands, campaign owners, schools, community organisations, strategic partners and communities on one trusted platform, we transform everyday participation into measurable and sustainable change."
    );

    drawHeading(doc, "The Challenge");
    drawParagraph(
      doc,
      "South Africa is home to thousands of schools and community organisations working tirelessly to improve the lives of learners, families and local communities. Despite their commitment, many continue to face significant challenges, including limited funding, ageing infrastructure, shortages of educational resources, environmental concerns and restricted access to sustainable development opportunities."
    );
    drawParagraph(
      doc,
      "At the same time, businesses across the country invest billions of rand each year in customer engagement initiatives, Corporate Social Investment (CSI) programmes, Environmental, Social and Governance (ESG) commitments, marketing campaigns and community development projects. While these investments are substantial, many organisations struggle to demonstrate measurable impact, engage communities in meaningful ways or connect their initiatives directly to the people who support their brands."
    );
    drawParagraph(doc, "This disconnect has created two significant challenges:");
    drawBullets(doc, [
      "Schools and community organisations often lack sustainable platforms to attract long-term support, showcase their needs and measure the outcomes of development initiatives.",
      "Brands and organisations require innovative ways to strengthen customer engagement while ensuring their social investments are transparent, measurable and aligned with their ESG and CSI objectives."
    ]);
    drawParagraph(
      doc,
      "Traditional approaches often rely on donations or once-off sponsorships that provide limited visibility, minimal community participation and little measurable long-term impact."
    );
    drawParagraph(doc, "Brand2School was created to solve this challenge.");
    drawParagraph(
      doc,
      "By connecting brands, campaign owners, schools, community organisations and communities through one trusted technology platform, Brand2School transforms everyday participation into verified, measurable and transparent community impact. Every campaign is monitored, every activity is verified and every outcome is reported in real time, ensuring that social investment creates lasting value for both communities and the organisations that support them."
    );

    drawHeading(doc, "Our Solution");
    drawParagraph(
      doc,
      "Brand2School provides a secure, transparent and technology-driven ecosystem that connects brands, campaign owners, schools, community organisations and communities through structured participation campaigns designed to create measurable and sustainable social impact."
    );
    drawParagraph(
      doc,
      "Our platform enables brands to move beyond traditional Corporate Social Investment (CSI) and Environmental, Social and Governance (ESG) initiatives by creating campaigns that actively involve the communities they serve. Instead of relying solely on donations or once-off sponsorships, Brand2School transforms everyday customer participation into verified opportunities that support education, environmental sustainability, youth development, food security, sports development and community upliftment."
    );
    drawParagraph(
      doc,
      "Through our integrated Campaign Marketplace, organisations can design, launch and manage participation campaigns while schools and community organisations register to take part in initiatives aligned with their needs and objectives. Communities participate through qualifying purchases or approved campaign activities, creating a shared responsibility for positive social change."
    );
    drawParagraph(
      doc,
      "Every campaign is supported by Brand2School's Verification Engine, ensuring that all participation is accurately recorded, independently verified and transparently reported. Whether participation involves product purchases, recycling initiatives, tree planting, literacy programmes or community projects, every activity is measured using configurable verification methods, including digital confirmations, GPS validation, photo evidence, partner verification and real-time analytics."
    );
    drawParagraph(doc, "This creates a trusted ecosystem where:");
    drawBullets(doc, [
      "Brands strengthen customer engagement while achieving measurable ESG and CSI outcomes.",
      "Campaign Owners manage and scale impactful community initiatives with confidence.",
      "Schools and Community Organisations gain access to structured opportunities that support sustainable development.",
      "Communities become active participants in creating positive change rather than passive beneficiaries."
    ]);
    drawParagraph(
      doc,
      "By combining participation, technology and transparency, Brand2School transforms every verified action into measurable impact—providing organisations with real-time insights, auditable reporting and evidence of meaningful social value."
    );
    drawParagraph(
      doc,
      "Brand2School is not simply a campaign management platform; it is a national ecosystem that empowers organisations and communities to work together in building a more inclusive, sustainable and prosperous South Africa."
    );

    drawHeading(doc, "How Brand2School Works");
    drawParagraph(
      doc,
      "Brand2School follows a structured six-stage process that transforms customer participation into measurable community impact. Every campaign is designed to ensure transparency, accountability and meaningful outcomes for all stakeholders."
    );

    drawSubheading(doc, "Stage 1 – Campaign Creation");
    drawParagraph(
      doc,
      "A brand or verified Campaign Owner creates a participation campaign through the Brand2School platform. Campaigns are designed around specific social impact objectives such as education, environmental sustainability, recycling, food security, youth development, sports development, technology access or community upliftment. Each campaign includes:"
    );
    drawBullets(doc, CAMPAIGN_CREATION_ITEMS);

    drawSubheading(doc, "Stage 2 – Registration & Campaign Participation");
    drawParagraph(
      doc,
      "Schools and Community Organisations register on the Brand2School platform and create verified organisational profiles. Each participant provides information about their organisation, beneficiaries, development priorities and campaign interests. Once approved, they become eligible to participate in campaigns that align with their objectives."
    );

    drawSubheading(doc, "Stage 3 – Community Participation");
    drawParagraph(
      doc,
      "Customers and community members actively participate in campaigns through qualifying purchases or approved community activities. Depending on the campaign, participation may include:"
    );
    drawBullets(doc, PARTICIPATION_ACTIVITIES);
    drawParagraph(doc, "Every action contributes towards measurable community impact.");

    drawSubheading(doc, "Stage 4 – Verification");
    drawParagraph(
      doc,
      "Every qualifying activity is processed through Brand2School's Verification Engine to ensure transparency and accountability. Verification methods may include:"
    );
    drawBullets(doc, VERIFICATION_METHODS);
    drawParagraph(
      doc,
      "This ensures every campaign remains credible, transparent and independently verifiable."
    );

    drawSubheading(doc, "Stage 5 – Measurement & Reporting");
    drawParagraph(
      doc,
      "As participation grows, Brand2School continuously measures campaign performance using real-time dashboards and impact reporting tools. Brands, campaign owners, schools and community organisations can monitor:"
    );
    drawBullets(doc, MEASUREMENT_METRICS);
    drawParagraph(
      doc,
      "This provides organisations with accurate, data-driven insights throughout the campaign lifecycle."
    );

    drawSubheading(doc, "Stage 6 – Community Impact");
    drawParagraph(
      doc,
      "Once campaign objectives have been achieved and participation has been verified, the agreed community support, rewards or investments are delivered based on measurable results. Depending on the campaign, this may include:"
    );
    drawBullets(doc, IMPACT_OUTCOMES);
    drawParagraph(
      doc,
      "Every campaign concludes with transparent impact reporting, providing brands, campaign owners and participating organisations with measurable evidence of the positive change created."
    );

    drawSubheading(doc, "Turning Participation into Impact");
    drawParagraph(
      doc,
      "At its core, Brand2School transforms a simple idea into a powerful process: Brands launch purpose-driven campaigns. Communities participate. Brand2School verifies every activity. Real-time technology measures the results. Verified participation becomes measurable impact that strengthens schools, empowers organisations and improves communities."
    );
    drawParagraph(
      doc,
      "This structured approach ensures that every campaign is transparent, accountable and capable of creating lasting social value for everyone involved."
    );

    drawHeading(doc, "Campaign Marketplace");
    drawParagraph(
      doc,
      "At the heart of Brand2School is the Campaign Marketplace—a central digital hub where brands, campaign owners, schools and community organisations connect through verified participation campaigns designed to create measurable social impact."
    );
    drawParagraph(
      doc,
      "The Campaign Marketplace enables organisations to design, launch, discover, participate in and sponsor campaigns that address real community needs while delivering transparent and measurable outcomes."
    );
    drawParagraph(
      doc,
      "Rather than creating one-size-fits-all programmes, Brand2School provides a flexible platform where campaigns can be tailored to different industries, social priorities and community development objectives. Every campaign is supported by structured participation rules, configurable verification methods, real-time reporting and measurable impact dashboards."
    );

    drawSubheading(doc, "How the Campaign Marketplace Works");
    drawBullets(doc, [
      "Campaign Owners or participating brands create campaigns aligned with specific social impact objectives.",
      "Schools and community organisations register to participate in campaigns relevant to their needs.",
      "Communities engage through qualifying purchases or approved campaign activities.",
      "Brand2School verifies every qualifying activity using its Verification Engine.",
      "Brands and campaign owners monitor campaign performance through live dashboards while measuring participation, community engagement and social impact."
    ]);

    drawSubheading(doc, "Campaign Categories");
    drawParagraph(
      doc,
      "The Campaign Marketplace supports a wide range of participation campaigns, including but not limited to:"
    );
    for (const category of CAMPAIGN_CATEGORIES) {
      ensureSpace(doc, 36);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(category.title, MARGIN, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(category.text, MARGIN, doc.y + 1, { width: doc.page.width - MARGIN * 2 });
      doc.moveDown(0.3);
    }

    drawSubheading(doc, "Campaign Owners");
    drawParagraph(doc, "Campaigns may be created and managed by:");
    drawBullets(doc, MARKETPLACE_OWNERS);
    drawParagraph(
      doc,
      "Each Campaign Owner is verified before campaigns are published to ensure credibility, transparency and accountability."
    );

    drawSubheading(doc, "Designed for Every Industry");
    drawParagraph(
      doc,
      "The Campaign Marketplace is industry-agnostic, allowing organisations from different sectors to create campaigns that align with their strategic objectives. Examples include:"
    );
    drawBullets(doc, INDUSTRIES);

    drawSubheading(doc, "A Marketplace Built on Trust");
    drawParagraph(doc, "Every campaign published on Brand2School is supported by:");
    drawBullets(doc, MARKETPLACE_TRUST);
    drawParagraph(
      doc,
      "This ensures that brands, campaign owners, participating organisations and communities have complete visibility into campaign performance from launch to completion."
    );

    drawSubheading(doc, "One Platform. Unlimited Possibilities.");
    drawParagraph(
      doc,
      "The Brand2School Campaign Marketplace transforms isolated community initiatives into a connected national ecosystem where brands, campaign owners, schools, community organisations and communities work together to create measurable, transparent and sustainable impact."
    );
    drawParagraph(
      doc,
      "Whether the objective is to improve education, protect the environment, empower young people or strengthen local communities, the Campaign Marketplace provides the technology, governance and transparency needed to turn participation into lasting social change."
    );
    drawParagraph(
      doc,
      "The Campaign Marketplace is where purpose meets participation, and participation becomes measurable impact."
    );

    drawHeading(doc, "Verification Engine");
    drawParagraph(
      doc,
      "Trust, transparency and accountability are the foundation of every Brand2School campaign. To ensure that every participation activity is genuine, measurable and auditable, Brand2School has developed a comprehensive Verification Engine that validates campaign participation from the moment an activity is performed until measurable impact is delivered."
    );
    drawParagraph(
      doc,
      "Rather than relying on manual reporting or unverified claims, the Verification Engine applies intelligent verification processes tailored to the specific requirements of each campaign. Whether a campaign involves product purchases, recycling initiatives, tree planting, sports competitions, feeding schemes or educational programmes, every qualifying activity follows a structured verification workflow designed to ensure credibility and transparency."
    );
    drawParagraph(
      doc,
      "The Verification Engine allows brands, campaign owners, schools and community organisations to confidently monitor campaign performance while providing communities with assurance that their participation contributes to genuine and measurable social impact."
    );

    drawSubheading(doc, "Intelligent Campaign Verification");
    drawParagraph(
      doc,
      "Each campaign defines its own verification requirements based on the nature of the activity being measured. Depending on the campaign, Brand2School may verify participation using:"
    );
    drawBullets(doc, VERIFY_OPTIONS);
    drawParagraph(
      doc,
      "This flexible approach ensures that every campaign is verified using the most appropriate methods while maintaining consistent standards across the platform."
    );

    drawSubheading(doc, "Multi-Layer Verification");
    drawParagraph(
      doc,
      "To maximise transparency and reduce the risk of fraud, Brand2School applies a multi-layer verification framework. A single activity may be confirmed by multiple stakeholders, including:"
    );
    drawBullets(doc, MULTI_LAYER);
    drawParagraph(
      doc,
      "By combining human verification with technology-driven validation, the platform delivers reliable and trustworthy campaign results."
    );

    drawSubheading(doc, "Real-Time Monitoring");
    drawParagraph(
      doc,
      "Every verified activity is automatically recorded and reflected on live dashboards available to authorised stakeholders. This enables brands and campaign owners to monitor:"
    );
    drawBullets(doc, REALTIME_MONITOR);
    drawParagraph(
      doc,
      "Real-time reporting ensures that decisions are based on accurate, up-to-date information throughout the campaign lifecycle."
    );

    drawSubheading(doc, "Audit & Compliance");
    drawParagraph(
      doc,
      "Every verified activity generates a secure digital audit trail that can be reviewed at any stage of the campaign. Audit records may include:"
    );
    drawBullets(doc, AUDIT_RECORDS);
    drawParagraph(
      doc,
      "These records provide brands with confidence that campaign results are transparent, independently verifiable and suitable for ESG, CSI, sustainability and stakeholder reporting."
    );

    drawSubheading(doc, "Designed to Support Every Campaign");
    drawParagraph(
      doc,
      "The Brand2School Verification Engine has been designed to support virtually any measurable participation campaign."
    );
    drawAudienceBlock(
      doc,
      "Product Purchase Campaigns",
      "Verification through unique campaign codes, receipts or QR codes."
    );
    drawAudienceBlock(
      doc,
      "Recycling Campaigns",
      "Verification through weight measurements, collection partners, digital collection receipts, photographs and GPS validation."
    );
    drawAudienceBlock(
      doc,
      "Tree Planting Campaigns",
      "Verification through GPS coordinates, photographic evidence and environmental partner confirmation."
    );
    drawAudienceBlock(
      doc,
      "Feeding Scheme Campaigns",
      "Verification through beneficiary records, delivery confirmations and school acknowledgements."
    );
    drawAudienceBlock(
      doc,
      "Sports Development",
      "Verification through fixture reports, attendance registers, coach confirmations and competition results."
    );
    drawAudienceBlock(
      doc,
      "Literacy & Education",
      "Verification through learner participation, teacher confirmations and programme completion records."
    );

    drawSubheading(doc, "Built for Trust");
    drawParagraph(
      doc,
      "The Brand2School Verification Engine transforms participation into trusted, measurable and transparent impact. By combining intelligent technology, configurable verification methods and real-time reporting, the platform gives brands, campaign owners, schools and communities confidence that every verified action contributes to genuine social development."
    );
    drawParagraph(
      doc,
      "Because meaningful impact can only be achieved when participation is trusted, verified and measurable."
    );

    drawHeading(doc, "Services");
    drawParagraph(
      doc,
      "Brand2School provides a comprehensive range of technology-driven solutions that enable brands, campaign owners, schools and community organisations to design, manage, verify and measure participation campaigns from start to finish. Our services are designed to strengthen customer engagement, improve transparency and deliver measurable community impact through one integrated platform."
    );

    drawServiceBlock(
      doc,
      "Customer Participation Campaign Management",
      "We design and manage structured participation campaigns that connect brands with schools, community organisations and communities through measurable social impact initiatives. Our platform supports campaign planning, registration, participation tracking, verification and performance reporting from launch to completion."
    );
    drawServiceBlock(
      doc,
      "Campaign Marketplace",
      "Brand2School hosts a central marketplace where brands and verified campaign owners can launch, discover and manage community impact campaigns. The marketplace supports campaigns across education, environmental sustainability, recycling, food security, sports development, youth empowerment, technology, literacy and community development."
    );
    drawServiceBlock(
      doc,
      "School Participation Programmes",
      "We provide schools with secure digital access to participate in verified campaigns, monitor progress and showcase measurable impact. Schools benefit from:",
      [
        "Campaign registration",
        "Participation tracking",
        "School dashboards",
        "Impact reporting",
        "Development opportunities",
        "Community engagement"
      ]
    );
    drawServiceBlock(
      doc,
      "Community Organisation Programmes",
      "Brand2School empowers NGOs, NPOs, foundations, sports organisations, environmental groups and other community organisations to participate in or manage campaigns through structured digital tools. Our platform helps organisations:",
      [
        "Register and verify programmes",
        "Manage participation",
        "Monitor campaign performance",
        "Demonstrate measurable impact",
        "Attract sponsors and strategic partners"
      ]
    );
    drawServiceBlock(
      doc,
      "Campaign Owner Solutions",
      "Organisations that manage community initiatives can use Brand2School to create, administer and monitor participation campaigns at local, regional or national level. Campaign owners have access to:",
      [
        "Campaign creation tools",
        "Participant management",
        "Verification workflows",
        "Performance dashboards",
        "Impact analytics",
        "Sponsor reporting"
      ]
    );
    drawServiceBlock(
      doc,
      "Verification Services",
      "Every campaign is supported by Brand2School's Verification Engine, ensuring that participation is transparent, credible and independently verifiable. Verification methods may include:",
      [
        "Campaign code validation",
        "QR code scanning",
        "GPS verification",
        "Digital confirmations",
        "Photo and video evidence",
        "Partner verification",
        "Audit trails",
        "Digital signatures"
      ]
    );
    drawServiceBlock(
      doc,
      "Real-Time Dashboards & Reporting",
      "Our intelligent dashboards provide live visibility into campaign performance. Stakeholders can monitor:",
      [
        "Participation levels",
        "Campaign progress",
        "Geographic reach",
        "Schools and organisations involved",
        "Verified activities",
        "Community engagement",
        "Impact metrics",
        "ESG and CSI performance indicators"
      ]
    );
    drawServiceBlock(
      doc,
      "Impact Measurement & Analytics",
      "Brand2School converts campaign participation into measurable social outcomes through advanced reporting and analytics. Our impact measurement tools help organisations evaluate:",
      [
        "Educational outcomes",
        "Environmental impact",
        "Community participation",
        "Campaign effectiveness",
        "Return on social investment",
        "ESG and CSI performance"
      ]
    );
    drawServiceBlock(
      doc,
      "Brand Engagement Solutions",
      "We help brands strengthen customer relationships by transforming everyday purchases and participation into meaningful social impact. Through purpose-driven campaigns, organisations can increase customer loyalty while creating measurable value for the communities they serve."
    );
    drawServiceBlock(
      doc,
      "School & Community Portals",
      "Brand2School provides secure digital portals that enable participating schools and community organisations to:",
      [
        "Register for campaigns",
        "Update organisational profiles",
        "Submit participation records",
        "Upload verification evidence",
        "Track campaign progress",
        "Access reports and certificates",
        "Communicate with campaign owners and sponsors"
      ]
    );
    drawServiceBlock(
      doc,
      "ESG & CSI Reporting",
      "Our platform provides brands and organisations with comprehensive reporting tools that support Environmental, Social and Governance (ESG) objectives as well as Corporate Social Investment (CSI) programmes. Reports include verified participation data, campaign outcomes, community impact metrics and audit-ready documentation, enabling organisations to demonstrate accountability and measurable social value."
    );
    drawServiceBlock(
      doc,
      "Consultation & Campaign Design",
      "Brand2School works with brands, government departments, municipalities and community organisations to design customised participation campaigns that align with strategic objectives and community priorities. Our team assists with:",
      [
        "Campaign planning",
        "Participation strategy",
        "Verification framework design",
        "Impact measurement",
        "Stakeholder engagement",
        "Reporting structures"
      ]
    );
    drawServiceBlock(
      doc,
      "A Complete Community Impact Platform",
      "Brand2School is more than a technology provider. We deliver the tools, expertise and infrastructure required to transform ideas into verified participation campaigns, campaigns into measurable outcomes, and measurable outcomes into lasting community impact. From campaign creation to impact reporting, Brand2School provides a complete end-to-end solution for organisations committed to building stronger communities through meaningful participation."
    );

    drawHeading(doc, "Values");
    drawParagraph(
      doc,
      "At Brand2School, our values define who we are, how we work and the impact we strive to create. They guide every campaign we launch, every partnership we build and every decision we make."
    );
    for (const value of VALUES) {
      ensureSpace(doc, 40);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(value.title, MARGIN, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(value.text, MARGIN, doc.y + 2, { width: doc.page.width - MARGIN * 2, align: "justify" });
      doc.moveDown(0.35);
    }
    drawParagraph(
      doc,
      "These values are more than guiding principles—they are the foundation of the Brand2School ecosystem and the standard by which we measure our success."
    );

    drawHeading(doc, "Why Partner With Brand2School");
    drawParagraph(
      doc,
      "Partnering with Brand2School means joining a trusted ecosystem that transforms customer participation into measurable community impact. Our platform enables organisations to strengthen customer relationships while delivering transparent, accountable and sustainable social investment."
    );
    drawParagraph(
      doc,
      "Rather than managing multiple disconnected initiatives, Brand2School provides a single technology platform where brands, campaign owners, schools, community organisations and communities collaborate through verified participation campaigns that create real, measurable change."
    );
    drawParagraph(
      doc,
      "By combining innovative technology, intelligent verification and real-time reporting, Brand2School helps organisations maximise the value of their social investments while building stronger connections with the communities they serve."
    );
    for (const point of PARTNER_POINTS) {
      ensureSpace(doc, 40);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(point.title, MARGIN, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(point.text, MARGIN, doc.y + 2, { width: doc.page.width - MARGIN * 2, align: "justify" });
      doc.moveDown(0.35);
    }
    drawParagraph(
      doc,
      "Together, we transform everyday participation into measurable impact, strengthen communities, build trust and create a more sustainable future for South Africa."
    );
    drawParagraph(
      doc,
      "Brand2School doesn't just help organisations invest in communities—it helps them build lasting partnerships that create measurable value for everyone involved."
    );

    ensureSpace(doc, 36);
    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text("Confidential company profile · For partnership and stakeholder use · www.brand2school.co.za", {
        align: "center"
      });

    drawPageFooters(doc);
    doc.end();
  });
}
