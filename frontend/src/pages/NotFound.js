import React from 'react';
import { Link } from 'react-router-dom';

import MemeCaption from '../components/MemeCaption';
import { useMemeMode } from '../utils/theme';

function NotFound() {
  const [memeOn] = useMemeMode();
  return (
    <section className="page not-found">
      <MemeCaption captionKey="notFound" />
      {memeOn && (
        <img
          src="/images/memes/meme-empty.png"
          alt=""
          style={{ maxWidth: 360, width: '100%' }}
        />
      )}
      <h1>{memeOn ? 'Idi eedi page ra?' : '404 — Page Not Found'}</h1>
      <p className="muted">
        {memeOn
          ? 'URL lo em type chesavu? Home ki velli match aadandi.'
          : "We couldn't find that page."}
      </p>
      <Link to="/" className="btn primary">
        {memeOn ? 'Home ki velladdam' : 'Go back home'}
      </Link>
    </section>
  );
}

export default NotFound;
