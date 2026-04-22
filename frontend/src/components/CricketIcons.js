import React from 'react';

// Bright red cricket ball with stitching
export function CricketBall({ size = 24, className = '' }) {
  return (
    <svg
      className={`cricket-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="ballGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#ballGrad)" />
      <path
        d="M 8 32 Q 32 20 56 32"
        fill="none"
        stroke="#fef2f2"
        strokeWidth="1.6"
        strokeDasharray="3 2"
      />
      <path
        d="M 8 32 Q 32 44 56 32"
        fill="none"
        stroke="#fef2f2"
        strokeWidth="1.6"
        strokeDasharray="3 2"
      />
      <ellipse cx="22" cy="22" rx="6" ry="3" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

// Wooden cricket bat
export function CricketBat({ size = 24, className = '' }) {
  return (
    <svg
      className={`cricket-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="batGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="30" y="6" width="6" height="16" rx="2" fill="#78350f" />
      <rect
        x="20"
        y="22"
        width="26"
        height="34"
        rx="5"
        fill="url(#batGrad)"
        stroke="#78350f"
        strokeWidth="1.5"
      />
      <line x1="25" y1="28" x2="25" y2="52" stroke="#78350f" strokeWidth="1" opacity="0.4" />
      <line x1="33" y1="28" x2="33" y2="52" stroke="#78350f" strokeWidth="1" opacity="0.4" />
      <line x1="41" y1="28" x2="41" y2="52" stroke="#78350f" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// Three stumps with bails
export function Stumps({ size = 24, className = '' }) {
  return (
    <svg
      className={`cricket-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="stumpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <rect x="22" y="8" width="8" height="4" rx="1" fill="#78350f" />
      <rect x="34" y="8" width="8" height="4" rx="1" fill="#78350f" />
      <rect x="14" y="12" width="6" height="44" rx="2" fill="url(#stumpGrad)" />
      <rect x="29" y="12" width="6" height="44" rx="2" fill="url(#stumpGrad)" />
      <rect x="44" y="12" width="6" height="44" rx="2" fill="url(#stumpGrad)" />
    </svg>
  );
}

// Trophy
export function Trophy({ size = 24, className = '' }) {
  return (
    <svg
      className={`cricket-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trophyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M 18 10 H 46 V 22 C 46 32 40 38 32 38 C 24 38 18 32 18 22 Z"
        fill="url(#trophyGrad)"
        stroke="#78350f"
        strokeWidth="1.5"
      />
      <path d="M 18 14 H 10 C 10 22 14 26 20 26" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 46 14 H 54 C 54 22 50 26 44 26" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="38" width="8" height="8" fill="#92400e" />
      <rect x="20" y="46" width="24" height="6" rx="2" fill="#78350f" />
      <ellipse cx="28" cy="18" rx="2" ry="4" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

// Full cricket scene (fallback SVG hero, if image fails)
export function CricketSceneSVG({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 360"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="55%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <rect width="800" height="240" fill="url(#sky)" />
      <circle cx="640" cy="120" r="50" fill="#fde047" opacity="0.85" />
      <path
        d="M 0 220 Q 200 170 400 210 T 800 200 V 360 H 0 Z"
        fill="url(#grass)"
      />
      <g transform="translate(340 140)">
        <rect x="0" y="0" width="8" height="90" rx="2" fill="#b45309" />
        <rect x="22" y="0" width="8" height="90" rx="2" fill="#b45309" />
        <rect x="44" y="0" width="8" height="90" rx="2" fill="#b45309" />
        <rect x="-2" y="-6" width="16" height="6" rx="1" fill="#78350f" />
        <rect x="24" y="-6" width="16" height="6" rx="1" fill="#78350f" />
      </g>
      <g transform="translate(230 210) rotate(-30)">
        <rect x="30" y="-10" width="6" height="20" fill="#78350f" />
        <rect x="20" y="10" width="26" height="60" rx="4" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
      </g>
      <g transform="translate(500 260)">
        <circle cx="0" cy="0" r="20" fill="#dc2626" />
        <path d="M -20 0 Q 0 -10 20 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="3 2" />
        <path d="M -20 0 Q 0 10 20 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="3 2" />
      </g>
    </svg>
  );
}
