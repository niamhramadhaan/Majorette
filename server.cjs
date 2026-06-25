const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

function getContentRoot() {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--content-root');
  if (rootIndex !== -1 && args[rootIndex + 1]) {
    return args[rootIndex + 1];
  }
  return process.env.CONTENT_ROOT || './media';
}

const CONTENT_ROOT = path.resolve(getContentRoot());

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mkv', '.avi', '.mov',
  '.mp3', '.wav', '.ogg', '.flac', '.aac',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
]);

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mkv', '.avi', '.mov']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function getFileType(ext) {
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return null;
}

app.use(cors());

function ensureDirectory() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    try {
      fs.mkdirSync(CONTENT_ROOT, { recursive: true });
      console.log('Created directory: ' + CONTENT_ROOT);
    } catch (err) {
      console.error('Failed to create directory: ' + CONTENT_ROOT);
      console.error(err.message);
    }
  }
}

app.get('/health', (req, res) => {
  const exists = fs.existsSync(CONTENT_ROOT);
  let fileCount = 0;
  if (exists) {
    try {
      const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });
      fileCount = entries.filter(e => e.isFile()).length;
    } catch {
      fileCount = -1;
    }
  }
  res.json({
    status: 'ok',
    contentRoot: CONTENT_ROOT,
    exists: exists,
    fileCount: fileCount,
  });
});

app.use('/content', (req, res) => {
  const decodedPath = decodeURIComponent(req.path);
  const filePath = path.join(CONTENT_ROOT, decodedPath);

  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return res.status(404).json({ error: 'File not found', path: filePath });
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    return res.status(400).json({ error: 'Cannot serve directory' });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileSize = stat.size;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'HEAD') {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    return res.end();
  }

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, {
        'Content-Range': 'bytes */' + fileSize,
      });
      return res.end();
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    stream.pipe(res);
    stream.on('error', () => { try { res.end(); } catch {} });
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => { try { res.end(); } catch {} });
  }
});

app.get('/files', (req, res) => {
  const typeFilter = req.query.type;

  try {
    if (!fs.existsSync(CONTENT_ROOT)) {
      return res.json([]);
    }

    const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!MEDIA_EXTENSIONS.has(ext)) continue;

      const type = getFileType(ext);
      if (!type) continue;

      if (typeFilter && type !== typeFilter) continue;

      const filePath = path.join(CONTENT_ROOT, entry.name);
      const stat = fs.statSync(filePath);

      files.push({
        name: entry.name,
        path: entry.name,
        type: type,
        size: stat.size,
      });
    }

    res.json(files);
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

ensureDirectory();

// ─── Data API (persists app data for cross-context access) ──────────────────
function getDataPath(envKey, fallbackName) {
  if (process.env[envKey]) return process.env[envKey];
  return path.join(path.dirname(CONTENT_ROOT), fallbackName);
}

function createDataEndpoint(getPath, endpoint) {
  app.get(endpoint, (req, res) => {
    try {
      const filePath = getPath();
      if (!fs.existsSync(filePath)) return res.json([]);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.json(data);
    } catch (err) {
      console.error(`Error reading ${endpoint}:`, err);
      res.json([]);
    }
  });

  app.post(endpoint, express.json(), (req, res) => {
    try {
      const filePath = getPath();
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      res.json({ ok: true });
    } catch (err) {
      console.error(`Error writing ${endpoint}:`, err);
      res.status(500).json({ error: `Failed to save ${endpoint}` });
    }
  });
}

createDataEndpoint(() => getDataPath('SCREENS_DATA_PATH', 'screens.json'), '/api/screens');
createDataEndpoint(() => getDataPath('CONTENT_DATA_PATH', 'content.json'), '/api/content');
createDataEndpoint(() => getDataPath('SCHEDULES_DATA_PATH', 'schedules.json'), '/api/schedules');
createDataEndpoint(() => getDataPath('VENUES_DATA_PATH', 'venues.json'), '/api/venues');
createDataEndpoint(() => getDataPath('SETTINGS_DATA_PATH', 'settings.json'), '/api/settings');

// Serve built React app (Electron mode / production)
const isAsar = __dirname.includes('app.asar');
const distPath = isAsar
  ? path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'dist')
  : path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — non-API routes return index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/content') && !req.path.startsWith('/files') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('JEMIMA content server running on http://localhost:' + PORT);
  console.log('Content root: ' + CONTENT_ROOT);
  if (fs.existsSync(CONTENT_ROOT)) {
    const count = fs.readdirSync(CONTENT_ROOT).filter(f => {
      const ext = path.extname(f).toLowerCase().slice(1);
      return MEDIA_EXTENSIONS.has(ext);
    }).length;
    console.log('Found ' + count + ' media file(s) in content folder.');
  } else {
    console.log('Content folder does not exist. It will be created when you add media.');
  }
  console.log('Put your media files in: ' + CONTENT_ROOT);
});

module.exports = app;
