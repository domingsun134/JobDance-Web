"use client";

import type { CSSProperties } from "react";
import Image from "next/image";

type LogoOrientation = "stacked" | "inline";
type LogoSize = "default" | "compact";

type LogoProps = {
  className?: string;
  orientation?: LogoOrientation;
  size?: LogoSize;
};

export default function Logo({
  className = "",
  orientation = "stacked",
  size,
}: LogoProps) {
  const isInline = orientation === "inline";

  const containerClasses = [
    "flex animate-fade-in",
    isInline
      ? "flex-row items-center justify-start gap-3 sm:gap-4"
      : "flex-col items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-8",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedSize = size ?? (isInline ? "compact" : "default");
  const scale = resolvedSize === "compact" ? 0.82 : 1;

  const buildClamp = (
    min: number,
    preferred: number,
    max: number,
    unit: "rem" | "px",
    vwContribution = 0
  ) => {
    const format = (value: number) => `${Number((value * scale).toFixed(3))}${unit}`;
    const preferredValue =
      vwContribution > 0
        ? `calc(${format(preferred)} + ${vwContribution}vw)`
        : format(preferred);

    return `clamp(${format(min)}, ${preferredValue}, ${format(max)})`;
  };

  const barHeight = buildClamp(4, 3.25, 6, "rem", 0.5);
  const barWidth = buildClamp(0.75, 0.65, 1, "rem", 0.15);
  const barGap = buildClamp(0.4, 0.35, 0.65, "rem", 0.2);
  const imageMaxWidth = isInline
    ? buildClamp(160, 190, 260, "px", 1.5)
    : buildClamp(220, 260, 340, "px", 2.5);

  const barsContainerStyle: CSSProperties = {
    gap: barGap,
    height: barHeight,
    minHeight: barHeight,
  };

  const barStyle: CSSProperties = {
    width: barWidth,
    height: barHeight,
  };

  return (
    <div className={containerClasses}>
      {/* Animated Bars - Centered to allow up and down animation */}
      <div className="flex items-center justify-center" style={barsContainerStyle}>
        {/* Bar 1 - Short, timing 1 */}
        <div
          className="bg-gradient-to-b from-blue-400 to-blue-300 rounded-lg animate-bar-short"
          style={{ ...barStyle, animationDelay: "0s" }}
        ></div>
        {/* Bar 2 - Long, expands when 1,3,5 are at min */}
        <div
          className="bg-gradient-to-b from-orange-400 to-orange-300 rounded-lg animate-bar-long"
          style={{ ...barStyle, animationDelay: "0s" }}
        ></div>
        {/* Bar 3 - Short, timing 1 */}
        <div
          className="bg-gradient-to-b from-blue-500 to-blue-400 rounded-lg animate-bar-short"
          style={{ ...barStyle, animationDelay: "0s" }}
        ></div>
        {/* Bar 4 - Long, expands when 1,3,5 are at min */}
        <div
          className="bg-gradient-to-b from-pink-400 to-pink-300 rounded-lg animate-bar-long"
          style={{ ...barStyle, animationDelay: "0s" }}
        ></div>
        {/* Bar 5 - Short, timing 1 */}
        <div
          className="bg-gradient-to-b from-green-400 to-green-300 rounded-lg animate-bar-short"
          style={{ ...barStyle, animationDelay: "0s" }}
        ></div>
      </div>
      {/* Logo Image */}
      <Image
        src="/JD_TextLogo_White.png"
        alt="JobDance.ai Logo"
        width={300}
        height={80}
        className="h-auto w-auto"
        style={{ maxWidth: imageMaxWidth }}
        priority
      />
    </div>
  );
}

