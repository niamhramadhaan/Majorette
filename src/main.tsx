import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { migrateOldKeys, getSettings } from './lib/storage';
import { applyTheme } from './lib/theme';

migrateOldKeys();
applyTheme(getSettings().accentTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
