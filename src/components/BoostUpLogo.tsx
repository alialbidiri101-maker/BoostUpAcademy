import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "color";
  showText?: boolean;
}

export const BoostUpLogo: React.FC<LogoProps> = ({
  className = "h-12",
  variant = "color",
  showText = true,
}) => {
  // Determine color theme based on variant
  // "light" is for dark backgrounds (e.g. Loading Screen / Footer / Dark card) -> white lines & white text
  // "color" or "dark" is for light backgrounds (e.g. Navbar) -> dark slate lines & text
  const strokeColor = variant === "light" ? "#ffffff" : "#002025";
  const horizonColor = variant === "light" ? "#ffffff" : "#0ca5b0";
  const academyColor = variant === "light" ? "#cbd5e1" : "#475569"; // slate-300 or slate-600
  
  return (
    <div className={`flex items-center gap-2 select-none ${className}`} dir="ltr">
      {/* Brand Text on the Left */}
      {showText && (
        <div className="flex flex-col items-end text-right justify-center leading-none">
          <div className="flex items-baseline font-sans text-xl sm:text-2xl font-black tracking-tight" style={{ lineHeight: "1" }}>
            <span style={{ color: strokeColor }}>Boost</span>
            <span className="text-[#0ca5b0]">Up</span>
          </div>
          <span 
            className="font-sans font-black uppercase tracking-[0.25em] text-[8.5px] sm:text-[9.5px] -mr-0.5 mt-1" 
            style={{ color: academyColor }}
          >
            ACADEMY
          </span>
        </div>
      )}

      {/* Rig Icon on the Right */}
      <svg
        viewBox="120 40 160 210"
        className="h-full w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxHeight: "100%" }}
      >
        <defs>
          <linearGradient id="flameGoldGradHorizontal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* 1. Curved Horizon Line */}
        <path
          d="M 130 235 Q 200 215 270 235"
          stroke={horizonColor}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* 2. Petroleum Tower Structure */}
        {/* Outer Legs */}
        <path
          d="M 175 230 C 182 170, 190 130, 194 100 L 206 100 C 210 130, 218 170, 225 230"
          stroke={strokeColor}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Horizontal cross lattices */}
        <line x1="179" y1="200" x2="221" y2="200" stroke={strokeColor} strokeWidth="2.5" />
        <line x1="182" y1="170" x2="218" y2="170" stroke={strokeColor} strokeWidth="2.5" />
        <line x1="186" y1="142" x2="214" y2="142" stroke={strokeColor} strokeWidth="2" />
        <line x1="190" y1="118" x2="210" y2="118" stroke={strokeColor} strokeWidth="2" />
        <line x1="194" y1="100" x2="206" y2="100" stroke={strokeColor} strokeWidth="2" />

        {/* Diagonal X-braces (X-patterns) */}
        <line x1="175" y1="230" x2="221" y2="200" stroke={strokeColor} strokeWidth="1.5" opacity="0.8" />
        <line x1="225" y1="230" x2="179" y2="200" stroke={strokeColor} strokeWidth="1.5" opacity="0.8" />
        <line x1="179" y1="200" x2="218" y2="170" stroke={strokeColor} strokeWidth="1.5" opacity="0.8" />
        <line x1="221" y1="200" x2="182" y2="170" stroke={strokeColor} strokeWidth="1.5" opacity="0.8" />
        <line x1="182" y1="170" x2="214" y2="142" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" />
        <line x1="218" y1="170" x2="186" y2="142" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" />
        <line x1="186" y1="142" x2="210" y2="118" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" />
        <line x1="214" y1="142" x2="190" y2="118" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" />
        <line x1="190" y1="118" x2="206" y2="100" stroke={strokeColor} strokeWidth="1" opacity="0.8" />
        <line x1="210" y1="118" x2="194" y2="100" stroke={strokeColor} strokeWidth="1" opacity="0.8" />

        {/* Flame on top */}
        {/* Outer yellow-gold flame */}
        <path
          d="M 200 45 C 191 68 197 83 200 100 C 203 83 209 68 200 45 Z"
          fill="url(#flameGoldGradHorizontal)"
        />
        {/* Inner white core flame */}
        <path
          d="M 200 65 C 196 75 198 85 200 100 C 202 85 204 75 200 65 Z"
          fill="#fef08a"
          opacity="0.95"
        />
      </svg>
    </div>
  );
};
