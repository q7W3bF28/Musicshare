// 全局变量
let currentAudio = null;
let currentPlayingSong = null;
let musicList = [];
let currentSongIndex = -1;
let lyricsData = null;

// 初始化播放器
function initPlayer() {
  // 从URL参数获取音乐数据
  const urlParams = new URLSearchParams(window.location.search);
  const musicData = urlParams.get('music');
  const songIndex = urlParams.get('index');
  
  if (musicData) {
    try {
      musicList = JSON.parse(decodeURIComponent(musicData));
      currentSongIndex = parseInt(songIndex) || 0;
      
      if (currentSongIndex >= 0 && currentSongIndex < musicList.length) {
        loadSong(currentSongIndex);
      } else {
        showError("无效的歌曲索引");
      }
    } catch (e) {
      console.error("解析音乐数据失败:", e);
      showError("加载失败: 无效的音乐数据");
    }
  } else {
    showError("没有找到音乐数据");
  }
  
  // 设置播放器控制事件
  setupPlayerControls();
}

// 加载歌曲
function loadSong(index) {
  if (index < 0 || index >= musicList.length) return;
  
  const song = musicList[index];
  currentSongIndex = index;
  
  // 更新歌曲信息
  document.getElementById("now-playing").textContent = song.title;
  document.getElementById("now-artist").textContent = song.artist;
  
  // 设置专辑封面
  const albumArt = document.getElementById("album-art");
  if (song.coverUrl) {
    albumArt.innerHTML = `<img src="${song.coverUrl}" alt="${song.title}">`;
  } else {
    albumArt.innerHTML = '<i class="fas fa-music"></i>';
  }
  
  // 加载歌词
  if (song.lyricsUrl) {
    loadLyrics(song.lyricsUrl);
  } else {
    document.getElementById("lyrics-content").innerHTML = '<p>暂无歌词</p>';
  }
  
  // 播放歌曲
  playSong(song.url, song.title, song.artist);
}

// 播放歌曲
function playSong(url, title, artist) {
  const audioPlayer = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const progressBar = document.getElementById("progress-bar");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const volumeSlider = document.getElementById("volume-slider");
  const retryBtn = document.getElementById("retry-btn");

  if (!audioPlayer || !playPauseBtn) return;

  // 如果点击的是同一首歌，暂停/播放
  if (currentPlayingSong === url) {
    if (audioPlayer.paused) {
      audioPlayer.play().catch(error => {
        handlePlaybackError(error, url, title, artist);
      });
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      audioPlayer.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    return;
  }

  // 播放新歌曲
  currentPlayingSong = url;
  audioPlayer.src = url;
  audioPlayer.volume = volumeSlider.value;
  
  // 重置重试按钮
  retryBtn.style.display = 'none';
  
  // 处理音频加载错误
  audioPlayer.onerror = () => {
    handlePlaybackError(new Error("音频加载失败"), url, title, artist);
  };
  
  audioPlayer.play().catch(error => {
    handlePlaybackError(error, url, title, artist);
  });

  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

  // 更新进度条
  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
      const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progress.style.width = percent + "%";
      
      // 更新时间显示
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
      durationEl.textContent = formatTime(audioPlayer.duration);
      
      // 更新歌词高亮
      updateLyricsHighlight(audioPlayer.currentTime);
    }
  });

  // 点击进度条跳转
  if (progressBar) {
    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioPlayer.currentTime = pos * audioPlayer.duration;
    });
  }

  // 播放结束时恢复按钮状态
  audioPlayer.addEventListener("ended", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    // 自动播放下一首
    playNextSong();
  });

  // 更新播放按钮状态
  audioPlayer.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  });

  audioPlayer.addEventListener("play", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  });
}

// 处理播放错误
function handlePlaybackError(error, url, title, artist) {
  console.error("播放失败:", error);
  const playPauseBtn = document.getElementById("play-pause-btn");
  const retryBtn = document.getElementById("retry-btn");
  
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  
  // 显示重试按钮
  retryBtn.style.display = 'block';
  retryBtn.onclick = () => playSong(url, title, artist);
}

// 设置播放器控制
function setupPlayerControls() {
  const audioPlayer = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const volumeSlider = document.getElementById("volume-slider");

  if (playPauseBtn && audioPlayer) {
    playPauseBtn.addEventListener("click", () => {
      if (audioPlayer.paused) {
        audioPlayer.play().catch(error => {
          console.error("播放失败:", error);
        });
      } else {
        audioPlayer.pause();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", playPrevSong);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", playNextSong);
  }

  if (volumeSlider && audioPlayer) {
    volumeSlider.addEventListener("input", () => {
      audioPlayer.volume = volumeSlider.value;
    });
  }
}

// 播放下一首
function playNextSong() {
  if (currentSongIndex === -1 || musicList.length === 0) return;
  
  const nextIndex = (currentSongIndex + 1) % musicList.length;
  loadSong(nextIndex);
}

// 播放上一首
function playPrevSong() {
  if (currentSongIndex === -1 || musicList.length === 0) return;
  
  const prevIndex = (currentSongIndex - 1 + musicList.length) % musicList.length;
  loadSong(prevIndex);
}

// 加载歌词
function loadLyrics(url) {
  fetch(url)
    .then(response => response.text())
    .then(text => {
      parseLyrics(text);
    })
    .catch(error => {
      console.error("加载歌词失败:", error);
      document.getElementById("lyrics-content").innerHTML = '<p>歌词加载失败</p>';
    });
}

// 解析歌词
function parseLyrics(text) {
  const lines = text.split('\n');
  const lyrics = [];
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const content = match[4].trim();
      
      if (content) {
        lyrics.push({ time, content });
      }
    }
  }
  
  lyricsData = lyrics;
  displayLyrics();
}

// 显示歌词
function displayLyrics() {
  const lyricsContent = document.getElementById("lyrics-content");
  
  if (!lyricsData || lyricsData.length === 0) {
    lyricsContent.innerHTML = '<p>暂无歌词</p>';
    return;
  }
  
  lyricsContent.innerHTML = '';
  
  for (const lyric of lyricsData) {
    const lyricLine = document.createElement('div');
    lyricLine.className = 'lyric-line';
    lyricLine.dataset.time = lyric.time;
    lyricLine.textContent = lyric.content;
    lyricsContent.appendChild(lyricLine);
  }
}

// 更新歌词高亮
function updateLyricsHighlight(currentTime) {
  if (!lyricsData || lyricsData.length === 0) return;
  
  const lyricLines = document.querySelectorAll('.lyric-line');
  let activeIndex = -1;
  
  // 找到当前时间对应的歌词行
  for (let i = 0; i < lyricsData.length; i++) {
    if (lyricsData[i].time <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }
  
  // 更新歌词高亮
  for (let i = 0; i < lyricLines.length; i++) {
    if (i === activeIndex) {
      lyricLines[i].classList.add('active');
      // 滚动到当前歌词
      lyricLines[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      lyricLines[i].classList.remove('active');
    }
  }
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 显示错误信息
function showError(message) {
  const playerContent = document.querySelector('.player-content');
  playerContent.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>出错了</h2>
      <p>${message}</p>
      <a href="musiclist.html" class="btn"><i class="fas fa-arrow-left"></i> 返回歌单</a>
    </div>
  `;
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', initPlayer);