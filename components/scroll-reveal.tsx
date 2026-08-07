"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
};

/**
 * Fade + rise entrance when a feed card enters the viewport.
 * Only animates opacity/y so CSS hover scale on the same node can work.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(element, { clearProps: "all" });
        return;
      }

      gsap.set(element, { autoAlpha: 0, y: 28 });

      const tween = gsap.to(element, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        delay: delay / 1000,
        ease: "power3.out",
        // Clear only the entrance translate so CSS hover:scale can take over.
        onComplete: () => {
          gsap.set(element, { clearProps: "transform" });
        },
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref, dependencies: [delay] },
  );

  return (
    <div ref={ref} className={cn("origin-center", className)}>
      {children}
    </div>
  );
}
