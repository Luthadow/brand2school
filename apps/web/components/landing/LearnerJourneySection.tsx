import {
  CheckCircle2,
  MessageCircle,
  PackageOpen,
  School,
  Send,
  ShoppingBag,
  Smartphone
} from "lucide-react";
import { FadeIn } from "./FadeIn";
import { SectionHeader } from "./SectionHeader";

const journeySteps = [
  {
    icon: ShoppingBag,
    title: "Buy a participating product",
    text: "Shop at a brand in the network. Every pack includes a unique participation code inside."
  },
  {
    icon: PackageOpen,
    title: "Open the package",
    text: "Find the code, QR, or participation number — no account or registration needed."
  },
  {
    icon: Smartphone,
    title: "Open WhatsApp",
    text: "Message Brand2School. Select Submit Code. Works on any phone."
  },
  {
    icon: School,
    title: "Enter school & district",
    text: "Type the school name and district. The school is the identity — not the individual."
  },
  {
    icon: Send,
    title: "Select product & enter code",
    text: "Choose the campaign or product line, paste your code, and send."
  },
  {
    icon: CheckCircle2,
    title: "School progress updates",
    text: "Verified participation counts toward the school's campaign target and infrastructure milestone."
  }
];

const whatsappExample =
  "SUBMIT | Your School Name | Your District | campaign-slug | YOUR-PARTICIPATION-CODE";

const whatsappReply = `✅ Code Verified

Your submission helped:
[Your school name]

Campaign:
[Participating campaign]

Help unlock:
[School infrastructure milestone]

Progress:
[verified count] / [campaign target] toward milestone`;

export function LearnerJourneySection() {
  return (
    <section id="learner-journey" className="lp-section lp-learner-journey">
      <div className="lp-container">
        <FadeIn>
          <SectionHeader
            eyebrow="Community Participation"
            title="Communities Help Schools Progress"
            subtitle="No learner accounts. No child data. Buy a product, submit a code on WhatsApp, and watch your school move toward verified infrastructure milestones."
          />
        </FadeIn>

        <div className="lp-journey-grid">
          <div className="lp-journey-steps">
            {journeySteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.title} delay={i * 0.05} className="lp-journey-step">
                  <span className="lp-journey-step-num">{i + 1}</span>
                  <div className="lp-journey-step-icon">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.15} className="lp-journey-phone">
            <div className="lp-wa-mock">
              <div className="lp-wa-header">
                <span className="lp-wa-avatar">B2S</span>
                <div>
                  <strong>Brand2School</strong>
                  <span>WhatsApp · Submit Code</span>
                </div>
              </div>
              <div className="lp-wa-body">
                <div className="lp-wa-bubble lp-wa-bubble--out">
                  <span className="lp-wa-label">You</span>
                  {whatsappExample}
                </div>
                <div className="lp-wa-bubble lp-wa-bubble--in">
                  <span className="lp-wa-label">Brand2School</span>
                  {whatsappReply}
                </div>
              </div>
              <p className="lp-wa-caption">
                Example message format — your school and campaign names appear after verification. Each code is an immutable
                participation event credited to the school and brand campaign trail.
              </p>
            </div>

            <div className="lp-journey-layers">
              <h4>School-first architecture</h4>
              <ul>
                <li>
                  <strong>School identity</strong> — resolved by name + district, POPIA-safe
                </li>
                <li>
                  <strong>Brand verification</strong> — code checked against campaign database
                </li>
                <li>
                  <strong>Progress & rankings</strong> — schools compete on verified participation
                </li>
                <li>
                  <strong>Infrastructure unlock</strong> — milestones trigger visible school transformation
                </li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
