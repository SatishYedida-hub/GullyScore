import React from 'react';
import { Link } from 'react-router-dom';

import {
  CricketBall,
  CricketBat,
  Stumps,
  Trophy,
} from '../components/CricketIcons';
import MemeCaption from '../components/MemeCaption';
import { useMemeMode } from '../utils/theme';

const TILES = [
  {
    to: '/teams',
    title: 'Teams',
    desc: 'Add, view or delete your squads',
    Icon: Stumps,
    tone: 'tile-teams',
  },
  {
    to: '/roster',
    title: 'Player Pool',
    desc: 'Add players once, reuse in any team',
    Icon: CricketBat,
    tone: 'tile-pool',
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
  const [memeOn] = useMemeMode();

  return (
    <section className="page home">
      <MemeCaption captionKey="home" />
      <div className="hero">
        <div className="hero-text">
          <span className="hero-kicker">
            <CricketBall size={18} />{' '}
            {memeOn ? 'Gully lo direct entry!' : 'Score like the pros'}
          </span>
          <h1>{memeOn ? 'GullyScore — Street Cricket Ki King' : 'Welcome to GullyScore'}</h1>
          <p className="hero-sub">
            {memeOn
              ? 'Ball-by-ball score cheppandi. Two innings, player stats, extras — antha ready. Toss gelisthe chalu, match start cheseddham.'
              : 'Ball-by-ball scoring for your gully cricket matches — two innings, player stats, wickets, extras and full scorecards.'}
          </p>
          <div className="hero-actions">
            <Link to="/matches/new" className="btn primary">
              {memeOn ? 'Match start cheyyi!' : 'Start a match'}
            </Link>
            <Link to="/teams" className="btn">
              {memeOn ? 'Teams chudandi' : 'Manage teams'}
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <img
            src={
              memeOn ? '/images/memes/meme-hero.png' : '/images/cricket-hero.png'
            }
            alt={
              memeOn
                ? 'Cartoon gully cricketer mid-shot'
                : 'Cricket stumps, bat and ball on a sunset field'
            }
            className="hero-image"
          />
          {!memeOn && (
            <div className="hero-ball-float" aria-hidden="true">
              <CricketBall size={48} />
            </div>
          )}
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
            src={
              memeOn
                ? '/images/memes/meme-out.png'
                : '/images/cricket-action.png'
            }
            alt={
              memeOn
                ? 'Cartoon umpire raising finger'
                : 'Batsman playing a cover drive'
            }
            className="feature-card-image"
          />
          <div className="feature-card-body">
            <span className="feature-card-kicker">
              {memeOn ? 'OUT ante OUT!' : 'Live scoring'}
            </span>
            <h3>
              {memeOn
                ? 'Prati ball ki react cheyyi'
                : 'Ball-by-ball, just like the pros'}
            </h3>
            <p className="muted">
              {memeOn
                ? 'Run button press cheyyi, wicket ki OUT kottu, extras appudu wide ani chepp — scorecard ready chestundi.'
                : 'Tap runs, wickets and extras. Strike rotates automatically, overs flip the bowler, and the scorecard keeps up in real time.'}
            </p>
          </div>
        </div>

        <div className="feature-card">
          <img
            src={
              memeOn
                ? '/images/memes/meme-celebrate.png'
                : '/images/cricket-victory.png'
            }
            alt={
              memeOn
                ? 'Cartoon fans celebrating a win'
                : 'Gold trophy with fireworks'
            }
            className="feature-card-image"
          />
          <div className="feature-card-body">
            <span className="feature-card-kicker">
              {memeOn ? 'Chase complete!' : 'Two innings'}
            </span>
            <h3>
              {memeOn
                ? 'Idhe ra assalu game!'
                : 'Full chases, full scorecards'}
            </h3>
            <p className="muted">
              {memeOn
                ? 'Target ichi, over-by-over chase track cheyyi — final ball drama kuda capture avthadi.'
                : 'Complete second innings with targets, run-rate tracking, results and match-winning moments saved to your history.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
