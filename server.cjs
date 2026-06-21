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
  return process.env.CONTENT_ROOT || 'D:\\Majorette';
}

const CONTENT_ROOT = getContentRoot();

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

app.listen(PORT, () => {
  console.log('Majorette content server running on http://localhost:' + PORT);
  console.log('Content root: ' + CONTENT_ROOT);
  if (!fs.existsSync(CONTENT_ROOT)) {
    console.log('WARNING: Content root does not exist. Create it and add media files.');
  }
});
