"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  getRevealObserverOptions,
  motionDurations,
  REVEAL_MOUNT_DELAY_MS,
} from "@/lib/site-motion";
import { cn } from "@/lib/utils";

export type RevealVariant =
  | "fade-up"
  | "fade-up-compact"
  | "fade-up-hero-title"
  | "fade-up-hero"
  | "fade-up-card"
  | "fade"
  | "fade-image"
  | "image-mask"
  | "slide-left"
  | "slide-right";

export type RevealState = "idle" | "pending" | "visible";

type RevealProps = {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  asChild?: boolean;
  /** When true, animates on initial page load if already in viewport (hero entries). */
  animateOnLoad?: boolean;
  /**
   * When true, elements already in the viewport on mount stay visible without
   * hiding or animating. Use for hash-anchor targets (e.g. /iletisim#randevu-talebi).
   */
  preserveIfVisible?: boolean;
  className?: string;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as { current: T | null }).current = value;
  }
}

function getAsChildTarget(children: ReactNode): ReactElement | null {
  if (isValidElement(children)) {
    return children;
  }

  const nodes = Children.toArray(children);

  if (nodes.length === 1 && isValidElement(nodes[0])) {
    return nodes[0];
  }

  return null;
}

function isDomElement(element: ReactElement) {
  return typeof element.type === "string";
}

function getDefaultDuration(variant: RevealVariant) {
  switch (variant) {
    case "fade-up-compact":
    case "fade-up-hero":
      return motionDurations.compact;
    case "fade-up-hero-title":
      return motionDurations.section;
    case "fade-up-card":
      return motionDurations.card;
    case "fade-image":
    case "image-mask":
      return motionDurations.image;
    case "slide-left":
    case "slide-right":
      return motionDurations.slide;
    default:
      return motionDurations.section;
  }
}

function getPendingVariantStyle(variant: RevealVariant): CSSProperties {
  switch (variant) {
    case "fade-up":
      return { opacity: 0, transform: "translate3d(0, 52px, 0)" };
    case "fade-up-compact":
    case "fade-up-hero":
      return { opacity: 0, transform: "translate3d(0, 38px, 0)" };
    case "fade-up-hero-title":
      return { opacity: 0, transform: "translate3d(0, 46px, 0)" };
    case "fade-up-card":
      return { opacity: 0, transform: "translate3d(0, 28px, 0)" };
    case "fade":
      return { opacity: 0 };
    case "fade-image":
      return { opacity: 0, transform: "scale(1.08)" };
    case "image-mask":
      return { clipPath: "inset(0 0 18% 0)" };
    case "slide-left":
      return { opacity: 0, transform: "translate3d(-56px, 0, 0)" };
    case "slide-right":
      return { opacity: 0, transform: "translate3d(56px, 0, 0)" };
    default:
      return { opacity: 0 };
  }
}

function getRevealStyle(
  state: RevealState,
  variant: RevealVariant,
  armed: boolean,
  resolvedDelay: number,
  resolvedDuration: number,
): CSSProperties {
  const base: CSSProperties = {
    ["--reveal-duration" as string]: `${resolvedDuration}ms`,
    ["--reveal-delay" as string]: state === "visible" ? `${resolvedDelay}ms` : "0ms",
  };

  if (armed && (state === "pending" || state === "idle")) {
    return { ...base, ...getPendingVariantStyle(variant) };
  }

  return base;
}

const REVEAL_SAFETY_TIMEOUT_MS = 1200;

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration,
  once = true,
  asChild = false,
  animateOnLoad = false,
  preserveIfVisible = false,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const startsHidden = !preserveIfVisible;
  const [state, setState] = useState<RevealState>(startsHidden ? "pending" : "visible");
  const [armed, setArmed] = useState(startsHidden);
  const armedRef = useRef(startsHidden);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let isActive = true;
    let frameA = 0;
    let frameB = 0;
    let startTimer = 0;
    let safetyTimer = 0;
    let observer: IntersectionObserver | null = null;

    const cleanup = () => {
      isActive = false;
      cancelAnimationFrame(frameA);
      cancelAnimationFrame(frameB);
      window.clearTimeout(startTimer);
      window.clearTimeout(safetyTimer);
      observer?.disconnect();
      observer = null;
    };

    const revealedRef = { current: false };

    const armReveal = () => {
      if (!isActive || armedRef.current) {
        return;
      }

      armedRef.current = true;
      setArmed(true);
      setState("pending");
    };

    const reveal = () => {
      if (!isActive || revealedRef.current) {
        return;
      }

      revealedRef.current = true;
      setState("visible");
    };

    const startObserver = () => {
      if (!isActive) {
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            reveal();

            if (once) {
              observer?.disconnect();
              observer = null;
            }
          } else if (!once && isActive) {
            setState("pending");
          }
        },
        getRevealObserverOptions(),
      );

      observer.observe(element);
    };

    if (animateOnLoad) {
      requestAnimationFrame(() => {
        if (isActive) {
          reveal();
        }
      });

      safetyTimer = window.setTimeout(() => {
        if (isActive && !revealedRef.current) {
          reveal();
        }
      }, REVEAL_SAFETY_TIMEOUT_MS);

      return cleanup;
    }

    if (preserveIfVisible) {
      const rect = element.getBoundingClientRect();
      const isInitiallyVisible =
        rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0;

      if (isInitiallyVisible) {
        return cleanup;
      }

      armReveal();
      startObserver();
      safetyTimer = window.setTimeout(() => {
        if (isActive && !revealedRef.current) {
          reveal();
        }
      }, REVEAL_SAFETY_TIMEOUT_MS);

      return cleanup;
    }

    const runAfterPaint = (callback: () => void) => {
      frameA = requestAnimationFrame(() => {
        frameB = requestAnimationFrame(() => {
          startTimer = window.setTimeout(() => {
            if (isActive) {
              callback();
            }
          }, REVEAL_MOUNT_DELAY_MS);
        });
      });
    };

    runAfterPaint(() => {
      armReveal();
      startObserver();

      safetyTimer = window.setTimeout(() => {
        if (isActive && !revealedRef.current) {
          reveal();
        }
      }, REVEAL_SAFETY_TIMEOUT_MS);
    });

    return cleanup;
  }, [animateOnLoad, once, preserveIfVisible]);

  const resolvedDuration = duration ?? getDefaultDuration(variant);
  const resolvedDelay = delay;
  const revealClassName = cn("site-reveal", className);
  const revealStyle = getRevealStyle(state, variant, armed, resolvedDelay, resolvedDuration);
  const revealDataAttributes = {
    "data-reveal-state": state,
    "data-reveal-variant": variant,
    ...(armed ? { "data-reveal-armed": "true" as const } : {}),
  };

  const asChildTarget = asChild ? getAsChildTarget(children) : null;

  if (asChildTarget && isDomElement(asChildTarget)) {
    const childProps = asChildTarget.props as {
      className?: string;
      style?: CSSProperties;
      ref?: Ref<HTMLElement>;
    };

    // asChild reveal must attach the observer ref to the cloned DOM element.
    // eslint-disable-next-line react-hooks/refs -- callback ref is assigned after render commit.
    return cloneElement(asChildTarget, {
      ...(asChildTarget.props as Record<string, unknown>),
      ref: (node: HTMLElement | null) => {
        ref.current = node;
        assignRef(childProps.ref, node);
      },
      className: cn(revealClassName, childProps.className),
      style: { ...childProps.style, ...revealStyle },
      ...revealDataAttributes,
    });
  }

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      className={revealClassName}
      style={revealStyle}
      {...revealDataAttributes}
    >
      {children}
    </div>
  );
}
