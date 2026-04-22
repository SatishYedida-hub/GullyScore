import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateTeam from './pages/CreateTeam';
import CreateMatch from './pages/CreateMatch';
import LiveScore from './pages/LiveScore';
import MatchHistory from './pages/MatchHistory';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teams/new" element={<CreateTeam />} />
          <Route path="/matches/new" element={<CreateMatch />} />
          <Route path="/matches" element={<MatchHistory />} />
          <Route path="/matches/:id/live" element={<LiveScore />} />
          <Route path="/matches/:id" element={<Navigate to="live" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
