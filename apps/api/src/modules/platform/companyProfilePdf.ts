import PDFDocument from "pdfkit";
import { LETTERHEAD } from "../../lib/company.js";
import { resolveBrandLogoPath } from "../../lib/pdf/pdfKitHelpers.js";
import { formatReportGeneratedAt, REPORT_BRAND_BLUE } from "../../lib/pdf/reportLayout.js";

const MARGIN = 48;
const BRAND_GREEN = "#6CC24A";

const STAKEHOLDERS = [
  "Corporate Brands",
  "Retailers",
  "FMCG Companies",
  "Financial Institutions",
  "Telecommunications Companies",
  "Fuel Companies",
  "Automotive Companies",
  "Mining Companies",
  "Government Departments",
  "Municipalities",
  "NGOs & NPOs",
  "Schools",
  "Community Organisations",
  "Campaign Owners",
  "Communities"
];

const CAMPAIGN_TYPES = [
  "Education Development",
  "Recycling Competitions",
  "Environmental Sustainability",
  "Feeding Schemes",
  "Tree Planting",
  "Sports Development",
  "Digital Skills",
  "Reading Challenges",
  "Community Clean-Up Campaigns",
  "Youth Development",
  "Arts & Culture",
  "Community Upliftment"
];

const VERIFICATION_METHODS = [
  "Unique campaign codes",
  "GPS location validation",
  "Photo and video evidence",
  "Digital signatures",
  "Partner verification",
  "QR code validation",
  "Audit trails",
  "Real-time analytics",
  "Live reporting dashboards"
];

const SERVICES = [
  "Customer Participation Campaign Management",
  "Campaign Marketplace",
  "School Participation Programmes",
  "Community Organisation Programmes",
  "Campaign Owner Portals",
  "Verification Services",
  "Real-Time Dashboards",
  "Impact Measurement",
  "ESG & CSI Reporting",
  "Brand Engagement Solutions",
  "Community Participation Management",
  "Performance Analytics"
];

const VALUES = [
  { title: "Integrity", text: "We operate honestly and ethically." },
  { title: "Transparency", text: "Every campaign is measurable and accountable." },
  { title: "Innovation", text: "Technology should solve meaningful social challenges." },
  { title: "Community", text: "Communities remain at the heart of every campaign." },
  { title: "Collaboration", text: "Lasting impact is created through partnerships." },
  { title: "Accountability", text: "Every stakeholder is responsible for measurable outcomes." },
  { title: "Sustainability", text: "We focus on creating long-term social value rather than once-off interventions." }
];

const PARTNER_BENEFITS = [
  "Measurable customer engagement",
  "Verified campaign participation",
  "Transparent impact reporting",
  "Stronger ESG and CSI performance",
  "Real-time dashboards",
  "National participation reach",
  "Community trust",
  "Increased brand visibility",
  "Scalable campaign management",
  "Data-driven decision making"
];

const HOW_IT_WORKS = [
  {
    title: "Campaign Creation",
    text: "A brand or verified campaign owner launches a structured participation campaign."
  },
  {
    title: "Registration",
    text: "Schools and community organisations register and complete verified profiles."
  },
  {
    title: "Participation",
    text: "Communities participate through qualifying purchases or approved campaign activities such as recycling, tree planting, literacy programmes or sports development."
  },
  {
    title: "Verification",
    text: "Every activity is validated using Brand2School's Verification Engine."
  },
  {
    title: "Measurement",
    text: "Real-time dashboards track campaign performance, participation levels and verified impact."
  },
  {
    title: "Community Impact",
    text: "Verified campaign results determine how support, rewards or investments are allocated."
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
  doc
    .fillColor("#ffffff")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Brand2School", MARGIN, 114);
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
  doc.moveDown(0.6);
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
  doc.moveDown(0.55);
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
  doc.moveDown(0.45);
  doc.font("Helvetica");
}

function drawBullets(doc: InstanceType<typeof PDFDocument>, items: string[]): void {
  for (const item of items) {
    ensureSpace(doc, 18);
    doc.fontSize(10).fillColor("#374151").text(`•  ${item}`, MARGIN + 4, doc.y, {
      width: doc.page.width - MARGIN * 2 - 4
    });
  }
  doc.moveDown(0.35);
}

function drawKeyValue(doc: InstanceType<typeof PDFDocument>, label: string, value: string): void {
  ensureSpace(doc, 18);
  const y = doc.y;
  doc.fontSize(10).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(label, MARGIN, y, {
    width: 150,
    lineBreak: false
  });
  doc.font("Helvetica").fillColor("#374151").text(value, MARGIN + 155, y, {
    width: doc.page.width - MARGIN * 2 - 155
  });
  doc.y = Math.max(doc.y, y + 16);
}

function drawAudienceBlock(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
  text: string
): void {
  ensureSpace(doc, 48);
  doc.fontSize(10.5).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(title, MARGIN, doc.y);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#374151")
    .text(text, MARGIN, doc.y + 2, { width: doc.page.width - MARGIN * 2, align: "justify" });
  doc.moveDown(0.4);
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
    doc
      .fontSize(14)
      .fillColor("#111827")
      .text("Company Profile", MARGIN, doc.y + 4);
    doc.moveDown(0.35);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#374151")
      .text("Transforming Everyday Participation into Lasting Community Impact", {
        width: doc.page.width - MARGIN * 2
      });
    doc.moveDown(0.45);
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .fillColor(REPORT_BRAND_BLUE)
      .text('"Connecting Brands, Communities and Purpose through Verified Participation."', {
        width: doc.page.width - MARGIN * 2
      });
    doc.moveDown(0.35);
    doc.fontSize(8).font("Helvetica").fillColor("#6B7280").text(`Generated ${generated}`);

    drawHeading(doc, "Company Overview");
    drawParagraph(
      doc,
      "Brand2School is South Africa's Community Participation & Impact Platform, designed to connect brands, schools, community organisations, campaign owners and communities through verified participation campaigns that generate measurable social impact."
    );
    drawParagraph(
      doc,
      "Unlike traditional Corporate Social Investment (CSI) or donation programmes, Brand2School enables organisations to create structured campaigns where customers and communities actively participate in solving real social challenges. Every campaign is supported by technology that measures participation, verifies outcomes and provides transparent reporting."
    );
    drawParagraph(
      doc,
      "The platform empowers brands to strengthen customer engagement while creating meaningful opportunities for schools and community organisations. Through innovative technology, intelligent verification systems and live performance dashboards, Brand2School transforms ordinary customer participation into measurable community development."
    );
    drawParagraph(
      doc,
      "Brand2School is proudly developed and operated by Nkanyezi Tech Solutions (Pty) Ltd, a South African technology company committed to building innovative digital solutions that solve real-world challenges."
    );

    drawHeading(doc, "Company Information");
    drawKeyValue(doc, "Company Name", "Brand2School");
    drawKeyValue(doc, "Parent Company", "Nkanyezi Tech Solutions (Pty) Ltd");
    drawKeyValue(doc, "Industry", "Social Impact Technology");
    drawKeyValue(doc, "Business Model", "Community Participation & Impact Platform");
    drawKeyValue(doc, "Head Office", "South Africa");
    drawKeyValue(doc, "Founder", "Raphael Luthando Sogoni");
    drawKeyValue(doc, "Registration No.", LETTERHEAD.registrationNo.replace("Registration No.: ", ""));
    drawKeyValue(doc, "Tax No.", LETTERHEAD.taxNo.replace("Tax No.: ", ""));
    drawKeyValue(doc, "Registered Office", LETTERHEAD.address);
    drawKeyValue(doc, "Contact", LETTERHEAD.phone);
    doc.moveDown(0.35);
    doc.fontSize(10).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text("Primary Stakeholders");
    doc.moveDown(0.2);
    drawBullets(doc, STAKEHOLDERS);

    drawHeading(doc, "Our Vision");
    drawParagraph(
      doc,
      "To become Africa's leading Community Participation Platform, where brands, campaign owners and communities collaborate through technology to create measurable, transparent and sustainable social impact."
    );
    drawParagraph(
      doc,
      "We envision a future where every purchase, every campaign and every community activity contributes towards improving education, protecting the environment, empowering young people and strengthening communities across Africa."
    );

    drawHeading(doc, "Our Mission");
    drawParagraph(
      doc,
      "To provide a trusted digital ecosystem that enables brands, schools, community organisations, campaign owners and communities to collaborate through verified participation campaigns that deliver measurable impact, transparent reporting and long-term sustainable development."
    );

    drawHeading(doc, "Why Brand2School Exists");
    drawParagraph(
      doc,
      "South Africa faces significant challenges in education, environmental sustainability, youth development and community upliftment."
    );
    drawParagraph(
      doc,
      "Thousands of schools operate with limited resources while community organisations work tirelessly to solve social problems with minimal funding. At the same time, millions of consumers purchase products from brands every day. Traditionally, these two worlds have remained disconnected."
    );
    drawParagraph(doc, "Brand2School was created to bridge this gap.");
    drawParagraph(
      doc,
      "Rather than asking people to donate more, we help brands transform everyday customer participation into measurable community impact. Every purchase, every campaign and every verified activity becomes an opportunity to create meaningful change."
    );

    drawHeading(doc, "Who Brand2School Is For");
    drawParagraph(doc, "Brand2School has been designed to serve an entire ecosystem of stakeholders.");
    drawAudienceBlock(
      doc,
      "Brands",
      "Businesses looking to strengthen customer loyalty while creating measurable social impact through purpose-driven campaigns."
    );
    drawAudienceBlock(
      doc,
      "Schools",
      "Schools seeking opportunities to participate in verified campaigns that improve education, infrastructure, technology and learner development."
    );
    drawAudienceBlock(
      doc,
      "Community Organisations",
      "NGOs, NPOs, sports organisations, feeding schemes, environmental organisations and youth development programmes looking to participate in or manage impactful campaigns."
    );
    drawAudienceBlock(
      doc,
      "Campaign Owners",
      "Foundations, municipalities, traditional councils, government departments and organisations that already run community initiatives and wish to manage them using Brand2School's technology."
    );
    drawAudienceBlock(
      doc,
      "Communities",
      "Parents, educators, learners, alumni, businesses and local residents who actively participate in campaigns that improve their own communities."
    );

    drawHeading(doc, "The Challenge");
    drawParagraph(
      doc,
      "Every year, organisations invest billions of rand into marketing campaigns, customer loyalty programmes, CSI initiatives and ESG commitments. Despite these investments, many programmes struggle to demonstrate measurable community outcomes."
    );
    drawParagraph(
      doc,
      "Schools continue to experience infrastructure shortages. Community organisations continue to compete for limited funding. Brands continue searching for authentic ways to engage customers while demonstrating real social impact."
    );
    drawParagraph(
      doc,
      "The missing ingredient has always been a trusted platform capable of connecting all these stakeholders through transparent participation."
    );

    drawHeading(doc, "Our Solution");
    drawParagraph(doc, "Brand2School provides that missing connection.");
    drawParagraph(
      doc,
      "We create a verified ecosystem where brands launch campaigns, schools and organisations participate, communities engage and every activity is measured and independently verified. The platform delivers value to every stakeholder by combining participation, technology and measurable impact into one integrated solution."
    );

    drawHeading(doc, "How Brand2School Works");
    HOW_IT_WORKS.forEach((step, index) => {
      ensureSpace(doc, 36);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(REPORT_BRAND_BLUE)
        .text(`${index + 1}. ${step.title}`, MARGIN, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(step.text, MARGIN, doc.y + 1, { width: doc.page.width - MARGIN * 2 });
      doc.moveDown(0.35);
    });

    drawHeading(doc, "Campaign Marketplace");
    drawParagraph(
      doc,
      "Brand2School hosts a growing marketplace of verified participation campaigns. Campaigns may include:"
    );
    drawBullets(doc, CAMPAIGN_TYPES);
    drawParagraph(
      doc,
      "Each campaign has its own dashboard, verification process, measurable outcomes and impact reports."
    );

    drawHeading(doc, "Verification Engine");
    drawParagraph(doc, "Transparency is the foundation of Brand2School.");
    drawParagraph(
      doc,
      "Every campaign is supported by a configurable Verification Engine that may include:"
    );
    drawBullets(doc, VERIFICATION_METHODS);
    drawParagraph(
      doc,
      "Different campaign types use different verification methods while maintaining the same level of accountability and transparency."
    );

    drawHeading(doc, "Our Services");
    drawParagraph(doc, "Brand2School provides:");
    drawBullets(doc, SERVICES);

    drawHeading(doc, "Our Values");
    for (const value of VALUES) {
      ensureSpace(doc, 28);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(REPORT_BRAND_BLUE).text(value.title, MARGIN, doc.y);
      doc.font("Helvetica").fillColor("#374151").text(value.text, MARGIN, doc.y + 1, {
        width: doc.page.width - MARGIN * 2
      });
      doc.moveDown(0.3);
    }

    drawHeading(doc, "Why Partner with Brand2School");
    drawParagraph(doc, "Organisations partnering with Brand2School benefit from:");
    drawBullets(doc, PARTNER_BENEFITS);

    drawHeading(doc, "About Nkanyezi Tech Solutions");
    drawParagraph(
      doc,
      "Nkanyezi Tech Solutions (Pty) Ltd is a South African technology company focused on building innovative digital platforms that solve real social and business challenges."
    );
    drawParagraph(
      doc,
      "The company develops technology that connects people, organisations and communities through measurable digital solutions. Brand2School represents Nkanyezi Tech Solutions' flagship social impact platform."
    );

    drawHeading(doc, "Founder's Message");
    drawParagraph(
      doc,
      '"Brand2School was born from a simple belief: every purchase has the potential to change a life.',
      { italic: true }
    );
    drawParagraph(
      doc,
      "For too long, brands, schools and communities have operated independently despite sharing the same desire to build a better future.",
      { italic: true }
    );
    drawParagraph(
      doc,
      "Brand2School brings these worlds together through technology, transparency and participation. Our vision is not simply to build another platform, but to create a movement where every campaign, every purchase and every community action contributes to measurable social impact.",
      { italic: true }
    );
    drawParagraph(
      doc,
      'Together, we are redefining how brands engage communities and how communities shape their own future."',
      { italic: true }
    );
    ensureSpace(doc, 48);
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827").text("Raphael Luthando Sogoni", MARGIN, doc.y);
    doc.font("Helvetica").fillColor("#374151").text("Founder", MARGIN, doc.y + 2);
    doc.text("Brand2School & Nkanyezi Tech Solutions (Pty) Ltd");

    drawHeading(doc, "Building Stronger Communities Together");
    drawParagraph(doc, "Brand2School is more than a technology platform.");
    drawParagraph(
      doc,
      "It is a national movement bringing together brands, campaign owners, schools, community organisations and communities to create measurable, transparent and sustainable social impact."
    );
    drawParagraph(doc, "Every campaign tells a story.");
    drawParagraph(doc, "Every participant creates change.");
    drawParagraph(doc, "Every verified activity builds trust.");
    drawParagraph(doc, "Together, we are transforming everyday participation into lasting community impact.");

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
