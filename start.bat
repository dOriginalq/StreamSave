@echo off
title StreamSave — YouTube & Instagram Downloader
echo.
echo  ========================================
echo   StreamSave — Starting server...
echo  ========================================
echo.

SET NODE="%~dp0node-runtime\node-v20.18.0-win-x64\node.exe"
SET SERVER="%~dp0server.js"

echo  [yt-dlp]  %~dp0yt-dlp.exe
echo  [ffmpeg]  %~dp0ffmpeg.exe
echo  [deno]    %~dp0deno.exe
echo  [node]    %NODE%
echo  [server]  %SERVER%
echo.
echo  Open your browser at: http://localhost:3000
echo  Press Ctrl+C to stop the server.
echo.

%NODE% %SERVER%

pause
