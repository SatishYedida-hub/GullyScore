import React from 'react';

/**
 * A large, colorful illustrated banner for page headers.
 *
 * Props:
 *  - image   (string) - url of a background image (e.g. /images/cricket-team.png)
 *  - kicker  (string) - small label above the title
 *  - title   (string) - main heading
 *  - subtitle(string) - description line below the title
 *  - tone    (string) - optional tone class: 'tone-blue' | 'tone-orange' | 'tone-green' | 'tone-purple'
 *  - actions (ReactNode) - buttons or links rendered on the right
 *  - children(ReactNode) - extra content (rendered below subtitle)
 */
function PageBanner({
  image,
  kicker,
  title,
  subtitle,
  tone = 'tone-blue',
  actions,
  children,
}) {
  return (
    <div className={`page-banner ${tone}`}>
      <div className="page-banner-content">
        {kicker && <span className="page-banner-kicker">{kicker}</span>}
        {title && <h1 className="page-banner-title">{title}</h1>}
        {subtitle && <p className="page-banner-sub">{subtitle}</p>}
        {children}
        {actions && <div className="page-banner-actions">{actions}</div>}
      </div>
      {image && (
        <div className="page-banner-art">
          <img src={image} alt="" className="page-banner-image" />
        </div>
      )}
    </div>
  );
}

export default PageBanner;
