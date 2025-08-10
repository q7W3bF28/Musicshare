// 全局变量
let currentAudio = null;
let currentPlayingSong = null;
let musicList = [];
let currentSongIndex = -1;

// 加载音乐列表函数
async function loadMusicList() {
  const songsContainer = document.getElementById("songs-container");
  if (!songsContainer) return;

  songsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载音乐中...</div>';

  try {
    // 从URL参数获取音乐数据
    const urlParams = new URLSearchParams(window.location.search);
    const musicData = urlParams.get('music');
    
    if (musicData) {
      try {
        musicList = JSON.parse(decodeURIComponent(musicData));
      } catch (e) {
        console.error("解析音乐数据失败:", e);
        songsContainer.innerHTML = `
          <div class="error">
            <i class="fas fa-exclamation-triangle"></i> 
            加载失败: 无效的音乐数据<br>
            <a href="upload.html" class="upload-link">上传新音乐</a>
          </div>`;
        return;
      }
    } else {
      // 如果没有URL参数，显示提示信息
      songsContainer.innerHTML = '<div class="no-songs"><i class="fas fa-music"></i> 暂无音乐，<a href="upload.html">上传第一首歌曲</a></div>';
      return;
    }

    // 渲染音乐列表
    songsContainer.innerHTML = "";
    if (musicList.length === 0) {
      songsContainer.innerHTML = '<div class="no-songs"><i class="fas fa-music"></i> 暂无音乐，<a href="upload.html">上传第一首歌曲</a></div>';
      return;
    }
    
    musicList.forEach((song, index) => {
      const songCard = document.createElement("div");
      songCard.className = "song-card";
      songCard.dataset.index = index;

      songCard.innerHTML = `
        <div class="album-art">
          ${song.coverUrl ? `<img src="${song.coverUrl}" alt="${song.title}">` : '<i class="fas fa-music"></i>'}
        </div>
        <div class="song-info">
          <h3>${song.title}</h3>
          <p><i class="fas fa-user"></i> ${song.artist}</p>
          <p class="upload-time"><i class="far fa-clock"></i> ${formatDate(song.timestamp)}</p>
          <div class="song-actions">
            <button class="action-btn play-btn" data-index="${index}">
              <i class="fas fa-play"></i> 播放
            </button>
            <a href="${song.url}" download="${song.title}.${getFileExtension(song.fileName)}" class="action-btn download-btn">
              <i class="fas fa-download"></i> 下载
            </a>
          </div>
        </div>
      `;

      songsContainer.appendChild(songCard);
    });

    // 添加播放事件监听
    document.querySelectorAll(".play-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const index = parseInt(this.dataset.index);
        playSongByIndex(index);
      });
    });
  } catch (error) {
    console.error("加载音乐列表失败:", error);
    songsContainer.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i> 
        加载失败: ${error.message || '请检查网络连接'}<br>
        <a href="upload.html" class="upload-link">上传新音乐</a>
      </div>`;
  }
}

// 通过索引播放歌曲
function playSongByIndex(index) {
  if (index < 0 || index >= musicList.length) return;
  
  const song = musicList[index];
  currentSongIndex = index;
  playSong(song.url, song.title, song.artist);
}

// 播放歌曲
function playSong(url, title, artist) {
  const audioPlayer = document.getElementById("audio-player");
  const nowPlaying = document.getElementById("now-playing");
  const nowArtist = document.getElementById("now-artist");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const progressBar = document.getElementById("progress-bar");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const volumeSlider = document.getElementById("volume-slider");
  const retryBtn = document.getElementById("retry-btn");
  const globalPlayer = document.getElementById("global-player");
  const albumArtSmall = document.querySelector('.album-art-small');

  if (!audioPlayer || !nowPlaying || !playPauseBtn) return;

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

  nowPlaying.textContent = title;
  nowArtist.textContent = artist;
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

  // 显示播放器
  globalPlayer.style.display = "flex";

  // 更新专辑封面
  const song = musicList[currentSongIndex];
  if (song.coverUrl) {
    albumArtSmall.innerHTML = `<img src="${song.coverUrl}" alt="${song.title}">`;
  } else {
    albumArtSmall.innerHTML = '<i class="fas fa-music"></i>';
  }

  // 更新进度条
  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
      const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progress.style.width = percent + "%";
      
      // 更新时间显示
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
      durationEl.textContent = formatTime(audioPlayer.duration);
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
  const nowPlaying = document.getElementById("now-playing");
  const nowArtist = document.getElementById("now-artist");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const retryBtn = document.getElementById("retry-btn");
  
  nowPlaying.textContent = "播放失败";
  nowArtist.textContent = "--";
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  
  // 显示重试按钮
  retryBtn.style.display = 'block';
  retryBtn.onclick = () => playSong(url, title, artist);
}

// 格式化时间 (秒 -> mm:ss)
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 播放下一首
function playNextSong() {
  if (currentSongIndex === -1 || musicList.length === 0) return;
  
  const nextIndex = (currentSongIndex + 1) % musicList.length;
  playSongByIndex(nextIndex);
}

// 播放上一首
function playPrevSong() {
  if (currentSongIndex === -1 || musicList.length === 0) return;
  
  const prevIndex = (currentSongIndex - 1 + musicList.length) % musicList.length;
  playSongByIndex(prevIndex);
}

// 页面加载时执行
document.addEventListener("DOMContentLoaded", () => {
  // 全局播放器控制
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
});

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 获取文件扩展名
function getFileExtension(filename) {
  return filename.split(".").pop();
}