import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="page not-found">
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go back home</Link>
    </section>
  );
}

export default NotFound;
