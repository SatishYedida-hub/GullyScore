import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Teams from './pages/Teams';
import CreateTeam from './pages/CreateTeam';
import CreateMatch from './pages/CreateMatch';
import MatchSetup from './pages/MatchSetup';
import LiveScore from './pages/LiveScore';
import Scorecard from './pages/Scorecard';
import MatchHistory from './pages/MatchHistory';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Roster from './pages/Roster';
import NotFound from './pages/NotFound';
import './App.css';

function RedirectToLive() {
  const { id } = useParams();
  return <Navigate to={`/matches/${id}/live`} replace />;
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/new" element={<CreateTeam />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/matches/new" element={<CreateMatch />} />
          <Route path="/matches" element={<MatchHistory />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:name" element={<PlayerDetail />} />
          <Route path="/matches/:id/setup" element={<MatchSetup />} />
          <Route path="/matches/:id/live" element={<LiveScore />} />
          <Route path="/matches/:id/scorecard" element={<Scorecard />} />
          <Route path="/matches/:id" element={<RedirectToLive />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
