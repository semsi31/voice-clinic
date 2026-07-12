export const motionDurations = {
  fast: 180,
  standard: 320,
  section: 780,
  compact: 700,
  card: 860,
  image: 900,
  page: 400,
  slide: 780,
} as const;

export const motionEase = "cubic-bezier(0.22, 1, 0.36, 1)";

export const REVEAL_THRESHOLD = 0.12;
export const REVEAL_ROOT_MARGIN = "0px 0px -4% 0px";
export const MOBILE_REVEAL_THRESHOLD = 0.1;
export const MOBILE_REVEAL_ROOT_MARGIN = "0px 0px -2% 0px";

export const PAGE_ENTER_OFFSET_PX = 14;

export const MOBILE_MENU_STAGGER_MS = 55;
export const MOBILE_MENU_MAX_STAGGER_MS = 330;
export const MOBILE_MENU_CLOSE_MS = 360;

export const heroDelays = {
  breadcrumb: 0,
  eyebrow: 90,
  title: 180,
  description: 280,
  cta: 380,
  image: 160,
} as const;

export const sectionHeadingDelays = {
  eyebrow: 0,
  title: 90,
  description: 170,
  content: 240,
  action: 240,
} as const;

export const CARD_STAGGER_MS = 100;
export const CARD_STAGGER_MAX_MS = 520;
export const MOBILE_CARD_STAGGER_MS = 75;
export const MOBILE_CARD_STAGGER_MAX_MS = 360;

export const TRUST_STAGGER_MS = 80;
export const TRUST_STAGGER_MAX_MS = 240;

export const COUNT_UP_START_DELAY_MS = 350;
export const COUNT_UP_STAGGER_MS = 180;

export function getCountUpDuration(
  end: number,
  options?: { reducedMotion?: boolean },
) {
  const reducedMotion = options?.reducedMotion ?? false;

  if (end >= 500) {
    return reducedMotion ? 2800 : 6000;
  }

  if (end >= 50) {
    return reducedMotion ? 2000 : 3600;
  }

  return reducedMotion ? 1600 : 2800;
}

export const PROCESS_STAGGER_MS = 80;
export const PROCESS_STAGGER_MAX_MS = 400;

export const SPLIT_TEXT_DELAY_MS = 100;

export const FOOTER_DURATION_MS = 640;

export const FOOTER_DELAYS = {
  brand: 0,
  services: 100,
  quickLinks: 180,
  contact: 260,
  legal: 320,
} as const;

export const FOOTER_DELAYS_MOBILE = {
  brand: 0,
  services: 60,
  quickLinks: 120,
  contact: 180,
  legal: 240,
} as const;

export type FooterRevealColumn = keyof typeof FOOTER_DELAYS;

export function getFooterRevealDelay(
  column: FooterRevealColumn,
  options?: { mobile?: boolean },
) {
  const delays = options?.mobile ? FOOTER_DELAYS_MOBILE : FOOTER_DELAYS;
  return delays[column];
}

export const IMAGE_REVEAL_DURATION_MS = 900;

/** Brief delay after mount so in-viewport reveals are visible to the user. */
export const REVEAL_MOUNT_DELAY_MS = 180;

export function getCardStaggerDelay(
  index: number,
  options?: { mobile?: boolean },
) {
  const step = options?.mobile ? MOBILE_CARD_STAGGER_MS : CARD_STAGGER_MS;
  const max = options?.mobile ? MOBILE_CARD_STAGGER_MAX_MS : CARD_STAGGER_MAX_MS;

  return Math.min(index * step, max);
}

export function getTrustStaggerDelay(index: number, options?: { mobile?: boolean }) {
  const step = options?.mobile ? MOBILE_CARD_STAGGER_MS : TRUST_STAGGER_MS;
  const max = options?.mobile ? MOBILE_CARD_STAGGER_MAX_MS : TRUST_STAGGER_MAX_MS;

  return Math.min(index * step, max);
}

export function getProcessStaggerDelay(index: number, options?: { mobile?: boolean }) {
  const step = options?.mobile ? MOBILE_CARD_STAGGER_MS : PROCESS_STAGGER_MS;
  const max = options?.mobile ? MOBILE_CARD_STAGGER_MAX_MS : PROCESS_STAGGER_MAX_MS;

  return Math.min(index * step, max);
}

export function getGridCardDelay(
  index: number,
  options?: { mobile?: boolean },
) {
  return sectionHeadingDelays.content + getCardStaggerDelay(index, options);
}

export function getRevealObserverOptions() {
  if (typeof window === "undefined") {
    return {
      threshold: REVEAL_THRESHOLD,
      rootMargin: REVEAL_ROOT_MARGIN,
    };
  }

  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  return {
    threshold: isMobile ? MOBILE_REVEAL_THRESHOLD : REVEAL_THRESHOLD,
    rootMargin: isMobile ? MOBILE_REVEAL_ROOT_MARGIN : REVEAL_ROOT_MARGIN,
  };
}
