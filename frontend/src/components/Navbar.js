import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">GullyScore</Link>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/teams/new">Create Team</Link></li>
        <li><Link to="/matches/new">Create Match</Link></li>
        <li><Link to="/matches">Match History</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
