import React from 'react';
import { Link } from 'react-router-dom';

import { CricketBall } from './CricketIcons';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <CricketBall size={24} className="nav-ball" />
        <span>GullyScore</span>
      </Link>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/teams">Teams</Link></li>
        <li><Link to="/matches/new">Create Match</Link></li>
        <li><Link to="/matches">Match History</Link></li>
        <li><Link to="/players">Players</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
