process.on('uncaughtException', (err) => {
  if (err.code !== 'EOF' && err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
    console.error('Error:', err.message);
  }
});
process.on('unhandledRejection', () => {});

const express = require('express');
const cors = require('cors');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ngrok = require('@ngrok/ngrok');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch {}

const app = express();
const PORT = process.env.PORT || 3000;

function resolveYtDlp() {
  const local = path.join(__dirname, 'yt-dlp.exe');
  if (fs.existsSync(local)) return local;

  try {
    execSync('yt-dlp --version', { stdio: 'ignore' });
    return 'yt-dlp';
  } catch {}

  const candidates = [
    'C:\\Windows\\yt-dlp.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\WinGet\\Packages\\yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe\\yt-dlp.exe'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return 'yt-dlp';
}

const YT_DLP = resolveYtDlp();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const activeDownloads = {};

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  return 'unknown';
}

function parseSizeString(str) {
  if (!str) return 0;
  const clean = str.replace('~', '').trim();
  const match = clean.match(/^([\d.]+)\s*([a-zA-Z]+)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('g')) return val * 1024 * 1024 * 1024;
  if (unit.startsWith('m')) return val * 1024 * 1024;
  if (unit.startsWith('k')) return val * 1024;
  return val;
}

function getBaseYtDlpArgs(platform = 'youtube') {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--http-chunk-size', '10M',
    '--buffer-size', '16M',
    '--concurrent-fragments', '5',
    '--socket-timeout', '30',
  ];

  const localFfmpeg = path.join(__dirname, 'ffmpeg.exe');
  if (fs.existsSync(localFfmpeg)) {
    args.push('--ffmpeg-location', __dirname);
  }

  const localDeno = path.join(__dirname, 'deno.exe');
  if (fs.existsSync(localDeno)) {
    args.push('--js-runtimes', `deno:${localDeno}`);
  }

  const cookiesPath = path.join(__dirname, 'cookies.txt');
  if (fs.existsSync(cookiesPath)) {
    args.push('--cookies', cookiesPath);
  }

  if (platform === 'youtube') {
    args.push('--extractor-args', 'youtube:player_client=ios,android,mweb,web');
  }

  return args;
}

function ytDlpInfo(url) {
  return new Promise((resolve, reject) => {
    const platform = detectPlatform(url);
    const args = [
      ...getBaseYtDlpArgs(platform),
      '--dump-json',
      url
    ];

    const proc = spawn(YT_DLP, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
      try {
        const firstLine = stdout.trim().split('\n')[0];
        resolve(JSON.parse(firstLine));
      } catch (e) {
        reject(new Error('Failed to parse yt-dlp output'));
      }
    });
  });
}

app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    return res.status(400).json({ error: 'Only YouTube and Instagram URLs are supported' });
  }

  try {
    const info = await ytDlpInfo(url);
    const rawFormats = info.formats || [];

    const audioOnlyFormats = rawFormats.filter(
      f => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none'
    );
    const bestAudio = audioOnlyFormats.sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];
    const bestAudioSize = bestAudio ? (bestAudio.filesize || bestAudio.filesize_approx || 0) : 0;

    const allVideoFormats = rawFormats
      .filter(f => f.vcodec && f.vcodec !== 'none' && f.height)
      .sort((a, b) => {
        if ((b.height || 0) !== (a.height || 0)) return (b.height || 0) - (a.height || 0);
        const aAud = (a.acodec && a.acodec !== 'none') ? 1 : 0;
        const bAud = (b.acodec && b.acodec !== 'none') ? 1 : 0;
        if (bAud !== aAud) return bAud - aAud;
        if ((b.fps || 0) !== (a.fps || 0)) return (b.fps || 0) - (a.fps || 0);
        const aH264 = (a.vcodec || '').startsWith('avc') ? 1 : 0;
        const bH264 = (b.vcodec || '').startsWith('avc') ? 1 : 0;
        return bH264 - aH264;
      });

    const videoFormats = [];
    const seenLabels = new Set();

    allVideoFormats.forEach(f => {
      const fpsTag = f.fps && Math.round(f.fps) > 30 ? `${Math.round(f.fps)}` : '';
      const label  = `${f.height}p${fpsTag}`;
      if (seenLabels.has(label)) return;
      seenLabels.add(label);

      const hasCombinedAudio = f.acodec && f.acodec !== 'none';
      const videoSize        = f.filesize || f.filesize_approx || 0;

      const totalSize = hasCombinedAudio
        ? videoSize
        : (videoSize > 0 ? videoSize + bestAudioSize : null);

      videoFormats.push({
        id: hasCombinedAudio ? f.format_id : `${f.format_id}+bestaudio/best`,
        label,
        ext: 'mp4',
        filesize: totalSize || null,
        type: 'video',
        needsMerge: !hasCombinedAudio,
      });
    });

    if (videoFormats.length === 0) {
      videoFormats.push({
        id: 'bestvideo+bestaudio/best',
        label: 'Best Quality',
        ext: 'mp4',
        filesize: null,
        type: 'video',
      });
    }

    const audioFormat = {
      id: 'bestaudio/best',
      label: 'MP3 Audio',
      ext: 'mp3',
      filesize: bestAudioSize || null,
      type: 'audio',
    };

    const formats = [...videoFormats, audioFormat];

    res.json({
      title: info.title || 'Untitled',
      thumbnail: info.thumbnail || '',
      duration: info.duration || 0,
      uploader: info.uploader || info.channel || '',
      platform,
      formats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress', (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id parameter' });
  res.json(activeDownloads[id] || { status: 'idle', percent: 0 });
});

app.get('/api/download', async (req, res) => {
  const { url, formatId, ext = 'mp4', title = 'download', type = 'video', downloadId } = req.query;
  if (!url || !formatId) {
    return res.status(400).json({ error: 'Missing url or formatId' });
  }

  const safeTitle = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'download';
  const filename  = `${safeTitle}.${ext}`;

  if (downloadId) {
    activeDownloads[downloadId] = { status: 'starting', percent: 0, speed: '', eta: '' };
  }

  const platform = detectPlatform(url);

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Cache-Control', 'no-store');

  let ytProc = null;
  let aborted = false;

  function abort() {
    if (aborted) return;
    aborted = true;
    try { if (ytProc) ytProc.kill('SIGKILL'); } catch {}
    if (downloadId) {
      delete activeDownloads[downloadId];
    }
  }

  req.on('close', abort);
  res.on('close', abort);
  res.on('error', () => { abort(); });

  const args = [
    ...getBaseYtDlpArgs(platform),
  ];

  if (type === 'audio') {
    args.push(
      '-f', formatId,
      '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
      '-o', '-',
      '--no-part',
      url
    );
  } else {
    args.push(
      '-f', formatId,
      '-o', '-',
      '--no-part',
      '--fragment-retries', '10',
      '--extractor-retries', '3',
      '--retry-sleep', '1',
      url
    );
  }

  ytProc = spawn(YT_DLP, args);

  ytProc.stderr.on('data', d => {
    const msg = d.toString();
    if (downloadId) {
      const m = msg.match(/\[download\]\s+([\d.]+)%(?:\s+of\s+~?([\d.]+\w+))?(?:\s+at\s+([\d.]+\w+\/s))?(?:\s+ETA\s+([\d:]+))?/i);
      if (m) {
        const pct = parseFloat(m[1]);
        activeDownloads[downloadId] = {
          status: pct >= 100 ? 'done' : 'downloading',
          percent: pct,
          size: m[2] || '',
          speed: m[3] || '',
          eta: m[4] || ''
        };
      }
    }
  });

  ytProc.on('error', () => { abort(); });
  ytProc.stdout.on('error', () => { abort(); });
  ytProc.stdout.pipe(res);

  ytProc.on('close', () => {
    if (!aborted && downloadId) {
      activeDownloads[downloadId] = { status: 'done', percent: 100 };
      setTimeout(() => delete activeDownloads[downloadId], 5000);
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`\nServer running at http://localhost:${PORT}`);

  const authToken = process.env.NGROK_AUTHTOKEN;
  if (authToken && authToken !== 'your_ngrok_authtoken_here') {
    try {
      const listener = await ngrok.forward({
        addr: PORT,
        authtoken: authToken
      });
      console.log(`Ngrok Public URL: ${listener.url()}\n`);
    } catch (err) {
      console.error(`Ngrok error: ${err.message}\n`);
    }
  } else {
    console.log(`To enable a public Ngrok link, set NGROK_AUTHTOKEN in your .env file\n`);
  }
});
