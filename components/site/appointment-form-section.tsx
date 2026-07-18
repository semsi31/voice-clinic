"use client";

import { m } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const FORM_EASE = [0.22, 1, 0.36, 1] as const;
const HASH_ID = "randevu-talebi";

type AppointmentFormSectionProps = {
  children: ReactNode;
};

export function AppointmentFormSection({ children }: AppointmentFormSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const playEntrance = useCallback((scroll: boolean) => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    if (scroll) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setVisible(false);
    window.setTimeout(() => {
      setAnimKey((key) => key + 1);
      setVisible(true);
    }, scroll ? 180 : 40);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const isHashTarget = () =>
      window.location.hash.replace(/^#/, "") === HASH_ID;

    if (isHashTarget()) {
      playEntrance(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    if (!isHashTarget()) {
      observer.observe(section);
    }

    const onHashChange = () => {
      if (isHashTarget()) {
        playEntrance(true);
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [playEntrance]);

  return (
    <section
      id={HASH_ID}
      ref={sectionRef}
      className="scroll-mt-28 px-4 py-6 pb-12 sm:scroll-mt-32 sm:px-6 lg:px-8 lg:pb-14"
    >
      <m.div
        key={animKey}
        className="mx-auto max-w-4xl rounded-[1.75rem] border border-[#eadfca] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={
          visible
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 48, scale: 0.96 }
        }
        transition={{ duration: 0.7, ease: FORM_EASE }}
      >
        {children}
      </m.div>
    </section>
  );
}
