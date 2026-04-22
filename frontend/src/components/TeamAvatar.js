import React from 'react';

// A fixed, pleasing gradient palette. We hash team name into an index so the
// same team always gets the same color.
const PALETTES = [
  ['#2563eb', '#7c3aed'], // blue → violet
  ['#f59e0b', '#ef4444'], // amber → red
  ['#10b981', '#059669'], // emerald shades
  ['#ec4899', '#8b5cf6'], // pink → purple
  ['#0ea5e9', '#14b8a6'], // sky → teal
  ['#f97316', '#eab308'], // orange → yellow
  ['#6366f1', '#06b6d4'], // indigo → cyan
  ['#dc2626', '#f59e0b'], // red → amber
];

const hashName = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/**
 * Circular avatar that shows a team's initials on a colorful gradient.
 * The color is deterministic per team name.
 */
function TeamAvatar({ name, size = 44, className = '' }) {
  const initials = getInitials(name);
  const [c1, c2] = PALETTES[hashName(name) % PALETTES.length];

  return (
    <span
      className={`team-avatar ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export default TeamAvatar;
