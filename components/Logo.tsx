"use client";

import Image from "next/image";

type LogoOrientation = "stacked" | "inline";

type LogoProps = {
  className?: string;
  orientation?: LogoOrientation;
};

export default function Logo({ className = "", orientation = "stacked" }: LogoProps) {
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

  const barHeightClass = isInline ? "h-10 sm:h-12" : "h-16 sm:h-24";
  const imageWidthClass = isInline
    ? "max-w-[150px] sm:max-w-[220px]"
    : "max-w-[200px] sm:max-w-[280px] md:max-w-[320px]";

  return (
    <div className={containerClasses}>
      {/* Animated Bars - Centered to allow up and down animation */}
      <div className={`flex items-end justify-center gap-1.5 sm:gap-2.5 ${barHeightClass}`}>
        {/* Bar 1 - Short, timing 1 */}
        <div
          className="w-3 sm:w-4 h-full bg-gradient-to-b from-blue-400 to-blue-300 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 2 - Long, expands when 1,3,5 are at min */}
        <div
          className="w-3 sm:w-4 h-full bg-gradient-to-b from-orange-400 to-orange-300 rounded-lg animate-bar-long"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 3 - Short, timing 1 */}
        <div
          className="w-3 sm:w-4 h-full bg-gradient-to-b from-blue-500 to-blue-400 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 4 - Long, expands when 1,3,5 are at min */}
        <div
          className="w-3 sm:w-4 h-full bg-gradient-to-b from-pink-400 to-pink-300 rounded-lg animate-bar-long"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 5 - Short, timing 1 */}
        <div
          className="w-3 sm:w-4 h-full bg-gradient-to-b from-green-400 to-green-300 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
      </div>
      {/* Logo Image */}
      <Image
        src="/JD_TextLogo_White.png"
        alt="JobDance.ai Logo"
        width={300}
        height={80}
        className={`h-auto w-auto ${imageWidthClass}`}
        priority
      />
    </div>
  );
}

