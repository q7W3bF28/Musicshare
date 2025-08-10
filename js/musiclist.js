// 全局变量
let musicList = [];

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
            <a href="index.html" class="upload-link">返回首页</a>
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

      // 构建音乐URL
      const musicUrl = song.url;
      let coverUrl = '';
      let lyricsUrl = '';
      
      if (song.coverUrl) {
        coverUrl = song.coverUrl;
      }
      
      if (song.lyricsUrl) {
        lyricsUrl = song.lyricsUrl;
      }
      
      // 更新音乐列表数据
      musicList[index].url = musicUrl;
      musicList[index].coverUrl = coverUrl;
      musicList[index].lyricsUrl = lyricsUrl;

      songCard.innerHTML = `
        <div class="album-art">
          ${coverUrl ? `<img src="${coverUrl}" alt="${song.title}">` : '<i class="fas fa-music"></i>'}
        </div>
        <div class="song-info">
          <h3>${song.title}</h3>
          <p><i class="fas fa-user"></i> ${song.artist}</p>
          <p class="upload-time"><i class="far fa-clock"></i> ${formatDate(song.timestamp)}</p>
          <div class="song-actions">
            <button class="action-btn play-btn" data-index="${index}">
              <i class="fas fa-play"></i> 播放
            </button>
            <a href="${musicUrl}" download="${song.title}.${getFileExtension(song.musicFileName)}" class="action-btn download-btn">
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
        playSong(index);
      });
    });
  } catch (error) {
    console.error("加载音乐列表失败:", error);
    songsContainer.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i> 
        加载失败: ${error.message || '请检查网络连接'}<br>
        <a href="index.html" class="upload-link">返回首页</a>
      </div>`;
  }
}

// 播放歌曲
function playSong(index) {
  if (index < 0 || index >= musicList.length) return;
  
  // 构建播放器页面URL
  const playerUrl = `player.html?music=${encodeURIComponent(JSON.stringify(musicList))}&index=${index}`;
  
  // 跳转到播放器页面
  window.location.href = playerUrl;
}

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

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadMusicList);