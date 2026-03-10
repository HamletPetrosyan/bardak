import { Link } from 'react-router-dom';

export function BelotePlaceholderPage() {
  return (
    <div className="page">
      <h1>Belote</h1>
      <p>This is a placeholder page. Lobby and game flow will be added later.</p>
      <Link to="/home">Back to home</Link>
    </div>
  );
}
