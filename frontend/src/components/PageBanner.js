import React from 'react';

import { memeCaption } from '../utils/memeCaptions';
import { useMemeMode } from '../utils/theme';

/**
 * A large, colorful illustrated banner for page headers.
 *
 * Props:
 *  - image      (string)   - url of a background image (e.g. /images/cricket-team.png)
 *  - kicker     (ReactNode)- small label above the title
 *  - title      (string)   - main heading
 *  - subtitle   (string)   - description line below the title
 *  - tone       (string)   - optional tone class: 'tone-blue' | 'tone-orange' | 'tone-green' | 'tone-purple'
 *  - actions    (ReactNode)- buttons or links rendered on the right
 *  - children   (ReactNode)- extra content (rendered below subtitle)
 *  - memeKey    (string)   - when meme mode is on, picks a bilingual caption
 *                             and (optionally) swaps the art for a meme panel
 */
function PageBanner({
  image,
  kicker,
  title,
  subtitle,
  tone = 'tone-blue',
  actions,
  children,
  memeKey,
}) {
  const [memeOn] = useMemeMode();
  const cap = memeOn && memeKey ? memeCaption(memeKey) : null;
  const effectiveImage = cap && cap.image ? cap.image : image;

  return (
    <div className={`page-banner ${tone} ${memeOn ? 'page-banner-meme' : ''}`}>
      <div className="page-banner-content">
        {cap && (
          <div className="meme-banner-caption">
            <span className="meme-caption-te">{cap.te}</span>
            <span className="meme-caption-en">{cap.en}</span>
          </div>
        )}
        {kicker && <span className="page-banner-kicker">{kicker}</span>}
        {title && <h1 className="page-banner-title">{title}</h1>}
        {subtitle && <p className="page-banner-sub">{subtitle}</p>}
        {children}
        {actions && <div className="page-banner-actions">{actions}</div>}
      </div>
      {effectiveImage && (
        <div className="page-banner-art">
          <img src={effectiveImage} alt="" className="page-banner-image" />
        </div>
      )}
    </div>
  );
}

export default PageBanner;
