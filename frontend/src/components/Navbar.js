import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import AdminLoginModal from './AdminLoginModal';
import { CricketBall } from './CricketIcons';
import { refreshAdminStatus, useIsAdmin } from '../utils/adminMode';
import { clearAdminToken } from '../utils/adminToken';
import { useMemeMode } from '../utils/theme';

function Navbar() {
  const [memeOn, , toggleMeme] = useMemeMode();
  const { configured, canDelete } = useIsAdmin();
  const [modalOpen, setModalOpen] = useState(false);

  // "Unlocked" only means anything when the server enforces admin.
  const unlocked = configured && canDelete;

  const handleLock = () => {
    clearAdminToken();
    refreshAdminStatus(true);
  };

  const onUnlocked = () => {
    refreshAdminStatus(true);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <CricketBall size={24} className="nav-ball" />
        <span>GullyScore</span>
        {memeOn && <span className="brand-meme-chip">meme mode</span>}
        {unlocked && (
          <span className="brand-admin-chip" title="Admin mode unlocked">
            owner
          </span>
        )}
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
            className={`admin-toggle ${unlocked ? 'on' : ''} ${
              !configured ? 'warn' : ''
            }`}
            onClick={() => (unlocked ? handleLock() : setModalOpen(true))}
            title={
              !configured
                ? 'Admin protection is not configured on the server — anyone can delete'
                : unlocked
                ? 'Lock admin mode'
                : 'Unlock admin mode'
            }
          >
            <span aria-hidden>{unlocked ? '🔓' : '🔒'}</span>
            <span className="admin-toggle-label">
              {unlocked ? 'Lock' : 'Admin'}
            </span>
          </button>
        </li>
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

      <AdminLoginModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUnlocked={onUnlocked}
      />
    </nav>
  );
}

export default Navbar;
