"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DeviceCarouselItem = {
  title: string;
  description: string;
  image: string;
  imageSrc: string | null;
};

type DeviceCardsCarouselProps = {
  items: DeviceCarouselItem[];
};

const SWIPE_THRESHOLD = 48;
const TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

export function DeviceCardsCarousel({ items }: DeviceCardsCarouselProps) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const lastIndex = items.length - 1;
  const canPrev = active > 0;
  const canNext = active < lastIndex;
  const activeItem = items[active];

  const goTo = useCallback(
    (index: number) => {
      setActive(Math.max(0, Math.min(lastIndex, index)));
    },
    [lastIndex],
  );

  const go = useCallback(
    (direction: -1 | 1) => {
      goTo(active + direction);
    },
    [active, goTo],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        go(-1);
      }
      if (event.key === "ArrowRight") {
        go(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  const onPointerDown = (clientX: number) => {
    touchStartX.current = clientX;
    dragDelta.current = 0;
  };

  const onPointerMove = (clientX: number) => {
    if (touchStartX.current == null) {
      return;
    }
    dragDelta.current = clientX - touchStartX.current;
  };

  const onPointerUp = () => {
    if (touchStartX.current == null) {
      return;
    }

    if (dragDelta.current <= -SWIPE_THRESHOLD) {
      go(1);
    } else if (dragDelta.current >= SWIPE_THRESHOLD) {
      go(-1);
    }

    touchStartX.current = null;
    dragDelta.current = 0;
  };

  const sideNavButtonClassName = cn(
    "absolute top-1/2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full",
    "border border-[#eadfca] bg-white text-[#071225]",
    "shadow-[0_8px_24px_rgba(15,23,42,0.12)]",
    "transition duration-300 ease-out",
    "hover:border-[#C49A3A]/70 hover:bg-[#C49A3A] hover:text-white hover:shadow-[0_10px_28px_rgba(196,154,58,0.28)]",
    "active:scale-95",
    "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
    "sm:size-12",
  );

  const bottomNavButtonClassName = cn(
    "inline-flex h-11 min-w-11 flex-1 items-center justify-center gap-2 rounded-xl",
    "border border-[#eadfca] bg-white px-4 text-sm font-bold text-[#071225]",
    "shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
    "transition duration-300 ease-out",
    "hover:border-[#C49A3A]/70 hover:bg-[#C49A3A] hover:text-white",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
  );

  return (
    <div className="relative w-full max-w-full min-w-0 overflow-visible">
      {/* Side arrows: tablet+ only — outside the clipped track so parents cannot crop them. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden h-[280px] sm:block sm:h-[360px] lg:h-[400px]">
        <button
          type="button"
          aria-label="Önceki kart"
          disabled={!canPrev}
          onClick={() => go(-1)}
          className={cn(sideNavButtonClassName, "pointer-events-auto left-3 lg:left-8")}
        >
          <ChevronLeft className="size-5 sm:size-6" strokeWidth={2.25} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Sonraki kart"
          disabled={!canNext}
          onClick={() => go(1)}
          className={cn(sideNavButtonClassName, "pointer-events-auto right-3 lg:right-8")}
        >
          <ChevronRight className="size-5 sm:size-6" strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative mx-auto h-[280px] w-full max-w-full min-w-0 select-none touch-pan-y overflow-x-clip overflow-y-visible sm:h-[360px] lg:h-[400px]"
        onTouchStart={(event) => onPointerDown(event.touches[0]?.clientX ?? 0)}
        onTouchMove={(event) => onPointerMove(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={onPointerUp}
        onMouseDown={(event) => onPointerDown(event.clientX)}
        onMouseMove={(event) => {
          if (touchStartX.current != null) {
            onPointerMove(event.clientX);
          }
        }}
        onMouseUp={onPointerUp}
        onMouseLeave={() => {
          if (touchStartX.current != null) {
            onPointerUp();
          }
        }}
      >
        {items.map((device, index) => {
          const offset = index - active;
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;
          const isPreview = absOffset >= 1 && absOffset <= 2;
          const isVisible = absOffset <= 2;
          const previewScale = absOffset === 1 ? 0.88 : 0.76;
          const previewOpacity = absOffset === 1 ? 0.78 : 0.5;

          return (
            <m.article
              key={device.title}
              className={cn(
                "absolute top-1/2 left-1/2 flex origin-center flex-col overflow-hidden rounded-[1.75rem] border bg-white",
                isActive
                  ? "w-[min(20rem,calc(100vw-5.5rem))] max-w-[420px] border-[#D4AF37]/45 shadow-[0_22px_50px_rgba(15,23,42,0.14)] sm:w-[min(26.5rem,50vw)] lg:w-[min(28.5rem,34vw)]"
                  : "w-[min(18rem,calc(100vw-7rem))] max-w-[380px] border-[#eadfca] shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:w-[min(24rem,46vw)] lg:w-[min(26rem,30vw)]",
                isPreview && "cursor-pointer",
              )}
              initial={false}
              animate={{
                // Mobile peek kept small so side cards don't cover controls or force page scroll.
                x: `calc(-50% + ${offset * 16}vw)`,
                y: "-50%",
                scale: isActive ? 1 : previewScale,
                opacity: isVisible ? (isActive ? 1 : previewOpacity) : 0,
                zIndex: isActive ? 20 : Math.max(0, 10 - absOffset * 4),
              }}
              transition={TRANSITION}
              aria-hidden={!isVisible}
              onClick={() => {
                if (isPreview) {
                  goTo(index);
                }
              }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)]">
                {device.imageSrc ? (
                  <Image
                    src={device.imageSrc}
                    alt={device.title}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 26rem, (min-width: 640px) 24rem, calc(100vw - 5.5rem)"
                    className="object-cover"
                    draggable={false}
                  />
                ) : null}
              </div>
            </m.article>
          );
        })}
      </div>

      {/* Mobile: full visible controls below the clipped track (never cropped by overflow). */}
      <div className="mt-4 flex gap-3 px-1 sm:hidden">
        <button
          type="button"
          aria-label="Önceki kart"
          disabled={!canPrev}
          onClick={() => go(-1)}
          className={bottomNavButtonClassName}
        >
          <ChevronLeft className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          Önceki
        </button>
        <button
          type="button"
          aria-label="Sonraki kart"
          disabled={!canNext}
          onClick={() => go(1)}
          className={bottomNavButtonClassName}
        >
          Sonraki
          <ChevronRight className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>

      <div className="relative mx-auto mt-6 min-h-[7.5rem] w-full max-w-2xl min-w-0 overflow-hidden px-4 text-center sm:mt-8 sm:min-h-[6.5rem]">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <m.div
              key={activeItem.title}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={TRANSITION}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B88A28]">
                Seçili cihaz
              </p>
              <h3 className="mt-2 break-words font-serif text-2xl font-bold tracking-tight text-[#071225] sm:text-[1.75rem]">
                {activeItem.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xl break-words text-sm leading-7 text-slate-600">
                {activeItem.description}
              </p>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
