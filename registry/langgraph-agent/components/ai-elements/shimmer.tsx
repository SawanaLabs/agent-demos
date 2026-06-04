"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import { memo, useMemo } from "react";
import { motion } from "motion/react";

export interface TextShimmerProps {
  children: string;
  as?: "div" | "p" | "span";
  className?: string;
  duration?: number;
  spread?: number;
}

function getMotionProps({
  children,
  className,
  duration,
  spread,
}: Required<Pick<TextShimmerProps, "children" | "duration" | "spread">> & {
  className?: string;
}) {
  return {
    animate: { backgroundPosition: "0% center" },
    className: cn(
      "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
      "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
      className
    ),
    initial: { backgroundPosition: "100% center" },
    style: {
      "--spread": `${children.length * spread}px`,
      backgroundImage:
        "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
    } as CSSProperties,
    transition: {
      duration,
      ease: "linear" as const,
      repeat: Number.POSITIVE_INFINITY,
    },
  };
}

const ShimmerComponent = ({
  children,
  as = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const motionProps = useMemo(
    () => getMotionProps({ children, className, duration, spread }),
    [children, className, duration, spread]
  );

  if (as === "span") {
    return <motion.span {...motionProps}>{children}</motion.span>;
  }

  if (as === "div") {
    return <motion.div {...motionProps}>{children}</motion.div>;
  }

  return <motion.p {...motionProps}>{children}</motion.p>;
};

export const Shimmer = memo(ShimmerComponent);
