"use client";

import { m } from "motion/react";
import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  getMotionCardStaggerDelay,
  MOTION_CARD_DURATION,
  MOTION_CARD_EASE,
  MOTION_CARD_ENTER,
  MOTION_CARD_HOVER,
  MOTION_CARD_HOVER_DURATION,
  MOTION_CARD_IMAGE_HOVER_DURATION,
  MOTION_CARD_IMAGE_HOVER_SCALE,
  MOTION_CARD_TAP_SCALE,
  MOTION_CARD_VIEWPORT,
  MOTION_CARD_VISIBLE,
} from "@/lib/motion-card";
import { cn } from "@/lib/utils";

type MotionCardElement = "article" | "div" | "li" | "a";

type MotionCardProps = {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: MotionCardElement;
} & Omit<ComponentPropsWithoutRef<"article">, "children">;

function useIsMobileStagger() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  return canHover;
}

const motionElements = {
  article: m.article,
  div: m.div,
  li: m.li,
  a: m.a,
} as const;

export function MotionCard({
  children,
  index = 0,
  className,
  as = "article",
  ...rest
}: MotionCardProps) {
  const isMobile = useIsMobileStagger();
  const canHover = useCanHover();
  const Component = motionElements[as];
  const delay = getMotionCardStaggerDelay(index, { mobile: isMobile });

  return (
    <Component
      className={cn(className)}
      custom={delay}
      initial="hidden"
      style={{ opacity: 0, ...rest.style }}
      whileInView="visible"
      whileHover={canHover ? "hover" : undefined}
      whileTap={canHover ? "tap" : undefined}
      viewport={MOTION_CARD_VIEWPORT}
      variants={{
        hidden: MOTION_CARD_ENTER,
        visible: (staggerDelay: number) => ({
          ...MOTION_CARD_VISIBLE,
          transition: {
            duration: MOTION_CARD_DURATION,
            ease: MOTION_CARD_EASE,
            delay: staggerDelay,
          },
        }),
        hover: {
          ...MOTION_CARD_HOVER,
          transition: {
            duration: MOTION_CARD_HOVER_DURATION,
            ease: MOTION_CARD_EASE,
          },
        },
        tap: { scale: MOTION_CARD_TAP_SCALE },
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

type MotionCardImageProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function MotionCardImage({ children, className, style }: MotionCardImageProps) {
  const canHover = useCanHover();

  if (!canHover) {
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={cn(className)}
      style={style}
      variants={{
        hover: {
          scale: MOTION_CARD_IMAGE_HOVER_SCALE,
          transition: {
            duration: MOTION_CARD_IMAGE_HOVER_DURATION,
            ease: MOTION_CARD_EASE,
          },
        },
      }}
    >
      {children}
    </m.div>
  );
}
