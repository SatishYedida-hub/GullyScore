import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="page home">
      <h1>Welcome to GullyScore</h1>
      <p>Your cricket scoring companion.</p>
      <ul>
        <li><Link to="/teams/new">Create a team</Link></li>
        <li><Link to="/matches/new">Create a match</Link></li>
        <li><Link to="/matches">View match history</Link></li>
      </ul>
    </section>
  );
}

export default Home;
