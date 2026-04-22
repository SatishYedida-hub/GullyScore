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
  {
    to: '/players',
    title: 'Player Records',
    desc: 'Career batting and bowling stats',
    Icon: CricketBall,
    tone: 'tile-players',
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

      <div className="feature-strip">
        <div className="feature-card">
          <img
            src="/images/cricket-action.png"
            alt="Batsman playing a cover drive"
            className="feature-card-image"
          />
          <div className="feature-card-body">
            <span className="feature-card-kicker">Live scoring</span>
            <h3>Ball-by-ball, just like the pros</h3>
            <p className="muted">
              Tap runs, wickets and extras. Strike rotates automatically, overs
              flip the bowler, and the scorecard keeps up in real time.
            </p>
          </div>
        </div>

        <div className="feature-card">
          <img
            src="/images/cricket-victory.png"
            alt="Gold trophy with fireworks"
            className="feature-card-image"
          />
          <div className="feature-card-body">
            <span className="feature-card-kicker">Two innings</span>
            <h3>Full chases, full scorecards</h3>
            <p className="muted">
              Complete second innings with targets, run-rate tracking, results
              and match-winning moments saved to your history.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
