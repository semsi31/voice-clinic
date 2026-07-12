export const MOTION_CARD_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_CARD_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -6% 0px",
} as const;

export const MOTION_CARD_ENTER = {
  opacity: 0,
  y: 48,
  scale: 0.965,
} as const;

export const MOTION_CARD_VISIBLE = {
  opacity: 1,
  y: 0,
  scale: 1,
} as const;

export const MOTION_CARD_DURATION = 0.68;

export const MOTION_CARD_HOVER = {
  y: -8,
  scale: 1.012,
} as const;

export const MOTION_CARD_HOVER_DURATION = 0.28;

export const MOTION_CARD_TAP_SCALE = 0.99;

export const MOTION_CARD_IMAGE_HOVER_SCALE = 1.055;

export const MOTION_CARD_IMAGE_HOVER_DURATION = 0.5;

export function getMotionCardStaggerDelay(
  index: number,
  options?: { mobile?: boolean; reducedMotion?: boolean },
) {
  if (options?.reducedMotion) {
    return 0;
  }

  if (options?.mobile) {
    return Math.min(index * 0.05, 0.12);
  }

  return Math.min(index * 0.11, 0.36);
}
