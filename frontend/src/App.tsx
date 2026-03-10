import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { GameLobbyPage } from './pages/games/GameLobbyPage';
import { GameSessionPage } from './pages/games/GameSessionPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RootRedirect() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <Navigate to={token ? '/home' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:gameType/lobby"
          element={
            <ProtectedRoute>
              <GameLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:gameType/session/:sessionId"
          element={
            <ProtectedRoute>
              <GameSessionPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
