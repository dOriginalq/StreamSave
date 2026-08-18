# StreamSave — YouTube & Instagram Video Downloader

A clean, zero-storage web application to download videos and audio from YouTube and Instagram in all available resolutions (4K, 1440p, 1080p, 720p, 480p, 360p, 240p, 144p, and MP3).

## Features

- **All Resolutions Supported**: 4K, 1440p, 1080p60, 720p, 480p, 360p, and MP3 audio extraction.
- **Zero Storage**: Streams media straight to the browser without saving files on disk.
- **DASH Stream Muxing**: In-flight video and audio muxing for high-definition video formats.
- **Multi-Platform**: Full support for YouTube and Instagram URLs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/)
- [Deno](https://deno.com/) (recommended for YouTube JS challenge solving)

Ensure `yt-dlp`, `ffmpeg`, and `deno` are available in your system PATH or placed in the project root directory.

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/stream-save.git
cd stream-save
npm install
```

## Running

```bash
npm start
```

Open your browser at `http://localhost:3000`.

## Project Structure

```
stream-save/
├── server.js        # Express backend
├── package.json     # Node.js dependencies
├── README.md        # Documentation
├── .gitignore       # Git ignore rules
└── public/
    ├── index.html   # Main UI
    ├── style.css    # Stylesheet
    └── app.js       # Frontend application logic
```
