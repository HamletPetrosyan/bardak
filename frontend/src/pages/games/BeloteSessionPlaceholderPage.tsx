import { Link } from 'react-router-dom';

export function BeloteSessionPlaceholderPage({ sessionId }: { sessionId: string }) {
  return (
    <div className="page">
      <h1>Belote Session (Placeholder)</h1>
      <p>Belote gameplay is not implemented yet.</p>
      <p>
        <strong>Session ID:</strong> {sessionId}
      </p>
      <Link to="/games/belote/lobby">Back to Belote lobby</Link>
    </div>
  );
}
