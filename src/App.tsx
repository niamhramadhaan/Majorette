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
import ScreenDetail from './pages/ScreenDetail';
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
      <Route path="/player" element={<Player />} />
      <Route path="/player/screen/:screenId" element={<ScreenPlayer />} />
      <Route path="/" element={
        <RequireAuth>
          <RequireSetup>
            <Layout />
          </RequireSetup>
        </RequireAuth>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="locations">
            <Route index element={<Locations />} />
            <Route path="screen/:id" element={<ScreenDetail />} />
        </Route>
        <Route path="films">
            <Route index element={<Films />} />
            <Route path="ingest" element={<FilmIngest />} />
            <Route path=":id" element={<FilmDetail />} />
        </Route>
        <Route path="schedule" element={<Schedule />} />
        <Route path="schedule/builder" element={<ShowBuilder />} />
        <Route path="settings" element={<Settings />} />
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
