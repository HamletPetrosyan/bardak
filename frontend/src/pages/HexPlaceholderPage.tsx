import { Link } from 'react-router-dom';

export function HexPlaceholderPage() {
  return (
    <div className="page">
      <h1>Hex</h1>
      <p>This is a placeholder page. Lobby and game flow will be added later.</p>
      <Link to="/home">Back to home</Link>
    </div>
  );
}
