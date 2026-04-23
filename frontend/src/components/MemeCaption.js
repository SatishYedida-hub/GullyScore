import React from 'react';

import { memeCaption } from '../utils/memeCaptions';
import { useMemeMode } from '../utils/theme';

/**
 * A short Impact-style caption strip that appears only while meme mode is
 * on. Renders the romanized-Telugu headline on top with the English helper
 * line below it. Pages pass a `captionKey` that resolves to the bilingual
 * pair in `memeCaptions.js`.
 *
 * If `panel` is true, the caption is wrapped in a cinematic black bar with
 * yellow accent — suitable above a banner.
 */
function MemeCaption({ captionKey, panel = false, className = '', children }) {
  const [on] = useMemeMode();
  if (!on) return null;

  const cap = memeCaption(captionKey);
  if (!cap && !children) return null;

  return (
    <div className={`meme-caption ${panel ? 'meme-caption-panel' : ''} ${className}`}>
      {cap && (
        <>
          <span className="meme-caption-te">{cap.te}</span>
          <span className="meme-caption-en">{cap.en}</span>
        </>
      )}
      {children}
    </div>
  );
}

export default MemeCaption;
