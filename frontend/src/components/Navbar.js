import React from 'react';
import { Link } from 'react-router-dom';

import { CricketBall } from './CricketIcons';
import { useMemeMode } from '../utils/theme';

function Navbar() {
  const [memeOn, , toggleMeme] = useMemeMode();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <CricketBall size={24} className="nav-ball" />
        <span>GullyScore</span>
        {memeOn && <span className="brand-meme-chip">meme mode</span>}
      </Link>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/teams">Teams</Link></li>
        <li><Link to="/roster">Player Pool</Link></li>
        <li><Link to="/matches/new">Create Match</Link></li>
        <li><Link to="/matches">Match History</Link></li>
        <li><Link to="/players">Records</Link></li>
        <li>
          <button
            type="button"
            className={`meme-toggle ${memeOn ? 'on' : ''}`}
            onClick={toggleMeme}
            title={
              memeOn
                ? 'Turn off meme mode'
                : 'Turn on meme mode (Tollywood vibes)'
            }
          >
            <span aria-hidden>{memeOn ? '🔥' : '🎬'}</span>
            <span className="meme-toggle-label">
              {memeOn ? 'Serious mode' : 'Meme mode'}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
