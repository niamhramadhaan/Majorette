/// <reference types="vite/client" />

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'JEMIMA',
  tagline: import.meta.env.VITE_APP_TAGLINE || 'Joint Engine Mini Media',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Manage and schedule media across multiple physical venues and screens.',
  logoUrl: import.meta.env.VITE_LOGO_URL || null,
  primaryColor: '#0E7B35',
  contentRoot: import.meta.env.VITE_CONTENT_ROOT || 'D:\\JEMIMA',
  serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001',
  contentTypes: {
    video: { accept: 'video/*', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov'], icon: 'Film' },
    audio: { accept: 'audio/*', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac'], icon: 'Music' },
    image: { accept: 'image/*', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'], icon: 'Image' },
  },
};
