import React from 'react';
import { Link } from 'react-router-dom';

import {
  CricketBall,
  CricketBat,
  Stumps,
  Trophy,
} from '../components/CricketIcons';

const TILES = [
  {
    to: '/teams',
    title: 'Teams',
    desc: 'Add, view or delete your squads',
    Icon: Stumps,
    tone: 'tile-teams',
  },
  {
    to: '/matches/new',
    title: 'Start a Match',
    desc: 'Pick teams, overs and openers',
    Icon: CricketBat,
    tone: 'tile-match',
  },
  {
    to: '/matches',
    title: 'Match History',
    desc: 'Live scores and past scorecards',
    Icon: Trophy,
    tone: 'tile-history',
  },
];

function Home() {
  return (
    <section className="page home">
      <div className="hero">
        <div className="hero-text">
          <span className="hero-kicker">
            <CricketBall size={18} /> Score like the pros
          </span>
          <h1>Welcome to GullyScore</h1>
          <p className="hero-sub">
            Ball-by-ball scoring for your gully cricket matches — two innings,
            player stats, wickets, extras and full scorecards.
          </p>
          <div className="hero-actions">
            <Link to="/matches/new" className="btn primary">
              Start a match
            </Link>
            <Link to="/teams" className="btn">
              Manage teams
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/images/cricket-hero.png"
            alt="Cricket stumps, bat and ball on a sunset field"
            className="hero-image"
          />
          <div className="hero-ball-float" aria-hidden="true">
            <CricketBall size={48} />
          </div>
        </div>
      </div>

      <div className="home-tiles">
        {TILES.map(({ to, title, desc, Icon, tone }) => (
          <Link key={to} to={to} className={`home-tile ${tone}`}>
            <div className="home-tile-icon">
              <Icon size={40} />
            </div>
            <div className="home-tile-body">
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Home;
