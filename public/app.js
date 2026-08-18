const state = {
  platform: 'youtube',
  videoData: null,
  activeTab: 'video',
};

const $ = (id) => document.getElementById(id);
const dom = {
  navYoutube:     $('nav-youtube'),
  navInstagram:   $('nav-instagram'),
  heroBadge:      $('heroBadge'),
  badgeIcon:      $('badgeIcon'),
  badgeText:      $('badgeText'),
  heroTitle:      $('heroTitle'),
  heroSubtitle:   $('heroSubtitle'),
  videoUrl:       $('videoUrl'),
  clearBtn:       $('clearBtn'),
  fetchBtn:       $('fetchBtn'),
  errorToast:     $('errorToast'),
  errorMsg:       $('errorMsg'),
  loadingSection: $('loadingSection'),
  resultsSection: $('resultsSection'),
  resultsCard:    $('resultsCard'),
  videoThumb:     $('videoThumb'),
  videoTitle:     $('videoTitle'),
  videoUploader:  $('videoUploader'),
  videoDuration:  $('videoDuration'),
  platformTagIcon:$('platformTagIcon'),
  platformTagText:$('platformTagText'),
  videoPlatformTag:$('videoPlatformTag'),
  tabVideo:       $('tabVideo'),
  tabAudio:       $('tabAudio'),
  qualityVideo:   $('qualityVideo'),
  qualityAudio:   $('qualityAudio'),
  videoQualityGrid: $('videoQualityGrid'),
  audioQualityGrid: $('audioQualityGrid'),
  downloadProgress: $('downloadProgress'),
  downloadProgressText: $('downloadProgressText'),
  newDownloadBtn: $('newDownloadBtn'),
  burgerBtn:      $('burgerBtn'),
  sidebar:        $('sidebar'),
  sidebarOverlay: $('sidebarOverlay'),
};

const PLATFORMS = {
  youtube: {
    name: 'YouTube',
    placeholder: 'Paste YouTube URL here… (e.g. https://youtu.be/...)',
    title: 'Download YouTube\n<span class="gradient-text">Videos & Audio</span>',
    subtitle: 'Paste any YouTube link and download in your preferred quality — MP4 video or MP3 audio. No signups, no storage, instant download.',
    badge: 'YouTube Downloader',
    badgeSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    tagClass: 'yt',
    tagText: 'YouTube',
  },
  instagram: {
    name: 'Instagram',
    placeholder: 'Paste Instagram URL here… (e.g. https://instagram.com/reel/...)',
    title: 'Download Instagram\n<span class="gradient-text">Reels & Posts</span>',
    subtitle: 'Paste any Instagram Reel, Post or Story link and download in full quality. No account needed, direct to your device.',
    badge: 'Instagram Downloader',
    badgeSvg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    tagClass: 'ig',
    tagText: 'Instagram',
  },
};

function switchPlatform(platform, keepUrl = false) {
  if (state.platform === platform) return;
  state.platform = platform;

  const cfg = PLATFORMS[platform];

  dom.navYoutube.classList.toggle('active', platform === 'youtube');
  dom.navInstagram.classList.toggle('active', platform === 'instagram');

  dom.badgeIcon.innerHTML = cfg.badgeSvg;
  dom.badgeText.textContent = cfg.badge;

  dom.heroTitle.innerHTML = cfg.title.replace('\n', '<br/>');
  dom.heroSubtitle.textContent = cfg.subtitle;
  dom.videoUrl.placeholder = cfg.placeholder;

  hideError();
  hideResults();
  if (!keepUrl) {
    dom.videoUrl.value = '';
    toggleClearBtn();
    dom.videoUrl.focus();
  }
}

function toggleClearBtn() {
  dom.clearBtn.classList.toggle('visible', dom.videoUrl.value.length > 0);
}

dom.videoUrl.addEventListener('input', toggleClearBtn);

dom.clearBtn.addEventListener('click', () => {
  dom.videoUrl.value = '';
  toggleClearBtn();
  hideError();
  dom.videoUrl.focus();
});

dom.videoUrl.addEventListener('paste', () => {
  setTimeout(() => {
    toggleClearBtn();
    if (dom.videoUrl.value.trim()) {
      fetchVideo();
    }
  }, 100);
});

dom.videoUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchVideo();
});

dom.burgerBtn.addEventListener('click', () => {
  dom.sidebar.classList.add('open');
  dom.sidebarOverlay.classList.add('open');
});

dom.sidebarOverlay.addEventListener('click', () => {
  dom.sidebar.classList.remove('open');
  dom.sidebarOverlay.classList.remove('open');
});

dom.navYoutube.addEventListener('click', () => {
  switchPlatform('youtube');
  dom.sidebar.classList.remove('open');
  dom.sidebarOverlay.classList.remove('open');
});

dom.navInstagram.addEventListener('click', () => {
  switchPlatform('instagram');
  dom.sidebar.classList.remove('open');
  dom.sidebarOverlay.classList.remove('open');
});

dom.tabVideo.addEventListener('click', () => switchTab('video'));
dom.tabAudio.addEventListener('click', () => switchTab('audio'));

function switchTab(tab) {
  state.activeTab = tab;
  dom.tabVideo.classList.toggle('active', tab === 'video');
  dom.tabAudio.classList.toggle('active', tab === 'audio');
  dom.tabVideo.setAttribute('aria-pressed', tab === 'video');
  dom.tabAudio.setAttribute('aria-pressed', tab === 'audio');
  dom.qualityVideo.classList.toggle('hidden', tab !== 'video');
  dom.qualityAudio.classList.toggle('hidden', tab !== 'audio');
}

dom.fetchBtn.addEventListener('click', fetchVideo);
dom.newDownloadBtn.addEventListener('click', () => {
  hideResults();
  dom.videoUrl.value = '';
  toggleClearBtn();
  hideError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => dom.videoUrl.focus(), 400);
});

async function fetchVideo() {
  const url = dom.videoUrl.value.trim();
  if (!url) {
    showError('Please paste a video URL first.');
    return;
  }

  if (!isValidUrl(url)) {
    showError('Please enter a valid URL starting with http:// or https://');
    return;
  }

  const detected = detectUrlPlatform(url);
  if (detected && detected !== state.platform) {
    switchPlatform(detected, true);
  }

  hideError();
  hideResults();
  showLoading(true);

  try {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch video information.');
    }

    state.videoData = data;
    renderResults(data);
  } catch (err) {
    showError(err.message || 'Could not fetch video. Check the URL and try again.');
  } finally {
    showLoading(false);
  }
}

function renderResults(data) {
  dom.videoThumb.src = data.thumbnail || '';
  dom.videoThumb.alt = data.title;
  dom.videoTitle.textContent = data.title;
  dom.videoUploader.textContent = data.uploader || 'Unknown Creator';
  dom.videoDuration.textContent = data.duration ? formatDuration(data.duration) : '';

  const isYt = data.platform === 'youtube';
  dom.platformTagIcon.innerHTML = isYt ? PLATFORMS.youtube.badgeSvg : PLATFORMS.instagram.badgeSvg;
  dom.platformTagText.textContent = isYt ? 'YouTube' : 'Instagram';
  dom.videoPlatformTag.className = `video-platform-tag ${isYt ? 'yt' : 'ig'}`;

  const videoFormats = (data.formats || []).filter((f) => f.type === 'video');
  const audioFormats = (data.formats || []).filter((f) => f.type === 'audio');

  renderQualityGrid(dom.videoQualityGrid, videoFormats, data);
  renderQualityGrid(dom.audioQualityGrid, audioFormats, data);

  switchTab('video');
  showResults();

  dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderQualityGrid(container, formats, videoData) {
  container.innerHTML = '';

  if (!formats || formats.length === 0) {
    container.innerHTML = `<div class="empty-formats">No formats available for this category.</div>`;
    return;
  }

  formats.forEach((fmt) => {
    const card = document.createElement('div');
    card.className = 'quality-card';

    const isVideo = fmt.type === 'video';
    const isHD = fmt.label && (fmt.label.includes('1080') || fmt.label.includes('720') || fmt.label.includes('1440') || fmt.label.includes('2160') || fmt.label.includes('4K'));
    const is4K = fmt.label && (fmt.label.includes('2160') || fmt.label.includes('4K'));

    let badgeHtml = '';
    if (is4K) {
      badgeHtml = `<span class="quality-badge badge-4k">4K UHD</span>`;
    } else if (isHD) {
      badgeHtml = `<span class="quality-badge badge-hd">HD</span>`;
    } else if (!isVideo) {
      badgeHtml = `<span class="quality-badge badge-audio">HQ Audio</span>`;
    }

    const iconSvg = isVideo
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;

    const sizeStr = fmt.filesize ? formatBytes(fmt.filesize) : (fmt.needsMerge ? 'HD' : '');

    card.innerHTML = `
      <div class="quality-card-left">
        <div class="quality-icon ${isVideo ? 'video-icon' : 'audio-icon'}">${iconSvg}</div>
        <div class="quality-meta">
          <div class="quality-label-row">
            <span class="quality-label">${fmt.label}</span>
            ${badgeHtml}
          </div>
          <div class="quality-sub">
            <span class="quality-ext">${(fmt.ext || 'mp4').toUpperCase()}</span>
            ${sizeStr ? `<span class="quality-dot">·</span><span class="quality-size">${sizeStr}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="btn-download" data-format-id="${fmt.id}" data-ext="${fmt.ext || 'mp4'}" data-type="${fmt.type}" data-size="${fmt.filesize || ''}">
        <svg class="dl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span class="btn-text">Download</span>
      </button>
    `;

    const btn = card.querySelector('.btn-download');
    btn.addEventListener('click', () => downloadFormat(btn, fmt, videoData));

    container.appendChild(card);
  });
}

function downloadFormat(btn, fmt, videoData) {
  const url = dom.videoUrl.value.trim();
  const formatId = fmt.id;
  const ext = fmt.ext || (fmt.type === 'audio' ? 'mp3' : 'mp4');
  const title = videoData.title || 'download';
  const type = fmt.type;

  const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&formatId=${encodeURIComponent(formatId)}&ext=${ext}&title=${encodeURIComponent(title)}&type=${type}`;

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-sm"></span> Starting…`;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 60000);
  }, 2500);
}

function showLoading(show) {
  dom.loadingSection.classList.toggle('hidden', !show);
  dom.fetchBtn.disabled = show;
  dom.fetchBtn.classList.toggle('btn-loading', show);
  if (show) {
    dom.loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showResults() {
  dom.resultsSection.classList.remove('hidden');
}

function hideResults() {
  dom.resultsSection.classList.add('hidden');
  state.videoData = null;
}

function showError(msg) {
  dom.errorMsg.textContent = msg;
  dom.errorToast.classList.remove('hidden');
  dom.errorToast.classList.add('visible');

  clearTimeout(dom.errorToast._timer);
  dom.errorToast._timer = setTimeout(hideError, 5000);
}

function hideError() {
  dom.errorToast.classList.remove('visible');
  setTimeout(() => dom.errorToast.classList.add('hidden'), 250);
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function detectUrlPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  return null;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
