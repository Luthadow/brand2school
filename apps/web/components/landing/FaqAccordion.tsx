"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items: FaqItem[] }): JSX.Element {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="ds-faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`ds-faq-item${isOpen ? " ds-faq-item--open" : ""}`}>
            <button
              type="button"
              className="ds-faq-trigger"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <ChevronDown size={20} className={`ds-faq-chevron${isOpen ? " ds-faq-chevron--open" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  className="ds-faq-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p>{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
