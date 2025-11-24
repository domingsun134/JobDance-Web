"use client";

import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center mb-4 sm:mb-8 animate-fade-in ${className}`}>
      {/* Animated Bars - Centered to allow up and down animation */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 h-16 sm:h-24 mb-2 sm:mb-4">
        {/* Bar 1 - Short, timing 1 */}
        <div 
          className="w-3 sm:w-4 bg-gradient-to-b from-blue-400 to-blue-300 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 2 - Long, expands when 1,3,5 are at min */}
        <div 
          className="w-3 sm:w-4 bg-gradient-to-b from-orange-400 to-orange-300 rounded-lg animate-bar-long"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 3 - Short, timing 1 */}
        <div 
          className="w-3 sm:w-4 bg-gradient-to-b from-blue-500 to-blue-400 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 4 - Long, expands when 1,3,5 are at min */}
        <div 
          className="w-3 sm:w-4 bg-gradient-to-b from-pink-400 to-pink-300 rounded-lg animate-bar-long"
          style={{ animationDelay: "0s" }}
        ></div>
        {/* Bar 5 - Short, timing 1 */}
        <div 
          className="w-3 sm:w-4 bg-gradient-to-b from-green-400 to-green-300 rounded-lg animate-bar-short"
          style={{ animationDelay: "0s" }}
        ></div>
      </div>
      {/* Logo Image */}
      <Image
        src="/logo-text.png"
        alt="JobDance.ai Logo"
        width={300}
        height={80}
        className="h-auto w-auto max-w-[200px] sm:max-w-[280px] md:max-w-[320px]"
        priority
      />
    </div>
  );
}

