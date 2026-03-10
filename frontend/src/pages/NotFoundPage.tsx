import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/home">Go to home</Link>
    </div>
  );
}
