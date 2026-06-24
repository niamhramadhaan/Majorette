import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Films from './pages/Films';
import FilmIngest from './pages/FilmIngest';
import FilmDetail from './pages/FilmDetail';
import Schedule from './pages/Schedule';
import ShowBuilder from './pages/ShowBuilder';
import Login from './pages/Login';
import Settings from './pages/Settings';
import QuickStart from './pages/QuickStart';
import Player from './pages/Player';
import ScreenPlayer from './pages/ScreenPlayer';
import PlayerConfig from './pages/PlayerConfig';
import ScreenDetail from './pages/ScreenDetail';
import Tutorial from './pages/Tutorial';
import ErrorBoundary from './components/ErrorBoundary';
import { getSettings, getUserName } from './lib/storage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const userName = getUserName();
  if (!userName) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireSetup({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  if (!settings.setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const userName = getUserName();

  return (
    <Routes>
      <Route path="/login" element={userName ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/setup" element={
        <RequireAuth>
          <QuickStart />
        </RequireAuth>
      } />
      <Route path="/player" element={<ErrorBoundary><Player /></ErrorBoundary>} />
      <Route path="/player/config" element={<PlayerConfig />} />
      <Route path="/player/screen/:screenId" element={<ErrorBoundary><ScreenPlayer /></ErrorBoundary>} />
        <Route path="/" element={
          <RequireAuth>
            <RequireSetup>
              <Layout />
            </RequireSetup>
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="locations">
              <Route index element={<ErrorBoundary><Locations /></ErrorBoundary>} />
              <Route path="screen/:id" element={<ErrorBoundary><ScreenDetail /></ErrorBoundary>} />
          </Route>
          <Route path="films">
              <Route index element={<ErrorBoundary><Films /></ErrorBoundary>} />
              <Route path="ingest" element={<ErrorBoundary><FilmIngest /></ErrorBoundary>} />
              <Route path=":id" element={<ErrorBoundary><FilmDetail /></ErrorBoundary>} />
          </Route>
          <Route path="schedule" element={<ErrorBoundary><Schedule /></ErrorBoundary>} />
          <Route path="schedule/builder" element={<ErrorBoundary><ShowBuilder /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          <Route path="tutorial" element={<ErrorBoundary><Tutorial /></ErrorBoundary>} />
        </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
