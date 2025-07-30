/**
 * 播放控制组件
 * 负责播放控制界面的交互和状态管理
 */
export class PlaybackControls {
    constructor() {
        this.elements = {
            playPauseBtn: document.getElementById('play-pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            loopBtn: document.getElementById('loop-btn'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            playStatus: document.getElementById('play-status'),
            readingProgress: document.getElementById('reading-progress')
        };
        
        this.isPlaying = false;
        this.isPaused = false;
        this.isLooping = false;
        this.progress = 0;

        // 回调函数
        this.onPlayPause = null;
        this.onReset = null;
        this.onProgressClick = null;
        this.onLoopToggle = null;
        
        this.initializeEventListeners();
        this.updateUI();
        
        console.log('PlaybackControls 初始化完成');
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 播放/暂停按钮
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.addEventListener('click', () => {
                this.handlePlayPause();
            });
        }

        // 重置按钮
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.handleReset();
            });
        }

        // 循环播放按钮
        if (this.elements.loopBtn) {
            this.elements.loopBtn.addEventListener('click', () => {
                this.handleLoopToggle();
            });
        }

        // 进度条点击
        if (this.elements.progressBar) {
            this.elements.progressBar.addEventListener('click', (e) => {
                this.handleProgressClick(e);
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * 处理播放/暂停
     */
    handlePlayPause() {
        if (this.onPlayPause) {
            this.onPlayPause();
        }
    }

    /**
     * 处理重置
     */
    handleReset() {
        if (this.onReset) {
            this.onReset();
        }
    }

    /**
     * 处理循环播放切换
     */
    handleLoopToggle() {
        this.isLooping = !this.isLooping;
        this.updateLoopButton();

        if (this.onLoopToggle) {
            this.onLoopToggle(this.isLooping);
        }

        console.log(`循环播放: ${this.isLooping ? '开启' : '关闭'}`);
    }

    /**
     * 处理进度条点击
     */
    handleProgressClick(event) {
        if (!this.elements.progressBar || !this.onProgressClick) {
            return;
        }

        const rect = this.elements.progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        
        // 限制在0-100范围内
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        
        console.log(`进度条点击: ${clampedPercentage.toFixed(1)}%`);
        
        if (this.onProgressClick) {
            this.onProgressClick(clampedPercentage);
        }
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(event) {
        // 防止在输入框中触发快捷键
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handlePlayPause();
                break;
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleReset();
                }
                break;
            case 'Escape':
                this.handleReset();
                break;
        }
    }

    /**
     * 更新播放状态
     */
    updatePlaybackState(isPlaying, isPaused = false) {
        this.isPlaying = isPlaying;
        this.isPaused = isPaused;
        this.updateUI();
    }

    /**
     * 更新进度
     */
    updateProgress(percentage) {
        this.progress = Math.max(0, Math.min(100, percentage));
        this.updateProgressDisplay();
        this.updateReadingProgress();
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        this.updatePlayButton();
        this.updateResetButton();
        this.updateLoopButton();
        this.updateStatusIndicator();
    }

    /**
     * 更新播放按钮
     */
    updatePlayButton() {
        if (!this.elements.playPauseBtn) return;

        let buttonText = '播放';
        let buttonClass = 'pill-button';

        if (this.isPlaying) {
            if (this.isPaused) {
                buttonText = '继续';
                buttonClass = 'pill-button';
            } else {
                buttonText = '暂停';
                buttonClass = 'pill-button';
            }
        }

        // 更新按钮文本（保留状态指示器）
        const statusIndicator = this.elements.playPauseBtn.querySelector('.status-indicator');
        this.elements.playPauseBtn.innerHTML = '';
        if (statusIndicator) {
            this.elements.playPauseBtn.appendChild(statusIndicator);
        }
        this.elements.playPauseBtn.appendChild(document.createTextNode(buttonText));

        // 更新按钮样式
        this.elements.playPauseBtn.className = buttonClass;
    }

    /**
     * 更新重置按钮
     */
    updateResetButton() {
        if (!this.elements.resetBtn) return;

        // 只有在播放或暂停状态时才启用重置按钮
        const shouldEnable = this.isPlaying || this.progress > 0;
        this.elements.resetBtn.disabled = !shouldEnable;
    }

    /**
     * 更新循环按钮
     */
    updateLoopButton() {
        if (!this.elements.loopBtn) return;

        // 切换激活状态
        if (this.isLooping) {
            this.elements.loopBtn.classList.add('active');
            this.elements.loopBtn.title = '关闭循环播放';
        } else {
            this.elements.loopBtn.classList.remove('active');
            this.elements.loopBtn.title = '开启循环播放';
        }
    }

    /**
     * 更新状态指示器
     */
    updateStatusIndicator() {
        if (!this.elements.playStatus) return;

        // 移除所有状态类
        this.elements.playStatus.classList.remove('playing', 'paused', 'stopped');

        // 添加当前状态类
        if (this.isPlaying) {
            if (this.isPaused) {
                this.elements.playStatus.classList.add('paused');
            } else {
                this.elements.playStatus.classList.add('playing');
            }
        } else {
            this.elements.playStatus.classList.add('stopped');
        }
    }

    /**
     * 更新进度条显示
     */
    updateProgressDisplay() {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${this.progress}%`;
        }
    }

    /**
     * 更新阅读进度显示
     */
    updateReadingProgress() {
        if (!this.elements.readingProgress) return;

        if (this.progress > 0) {
            this.elements.readingProgress.textContent = `${Math.round(this.progress)}%`;
            this.elements.readingProgress.style.display = 'block';
        } else {
            this.elements.readingProgress.style.display = 'none';
        }
    }

    /**
     * 重置所有状态
     */
    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.progress = 0;
        this.updateUI();
        this.updateProgress(0);
        console.log('播放控制状态已重置');
    }

    /**
     * 设置加载状态
     */
    setLoadingState(isLoading) {
        if (!this.elements.playPauseBtn) return;

        if (isLoading) {
            this.elements.playPauseBtn.disabled = true;
            this.elements.playPauseBtn.innerHTML = '<span class="loading-spinner"></span>加载中...';
        } else {
            this.elements.playPauseBtn.disabled = false;
            this.updateUI();
        }
    }

    /**
     * 显示错误状态
     */
    showError(message) {
        console.error('播放控制错误:', message);
        
        // 可以在这里添加错误提示UI
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.style.background = '#ff3b30';
            setTimeout(() => {
                this.elements.playPauseBtn.style.background = '';
                this.updateUI();
            }, 2000);
        }
    }

    /**
     * 获取当前状态
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            progress: this.progress
        };
    }

    /**
     * 设置回调函数
     */
    setCallbacks(callbacks) {
        if (callbacks.onPlayPause) this.onPlayPause = callbacks.onPlayPause;
        if (callbacks.onReset) this.onReset = callbacks.onReset;
        if (callbacks.onProgressClick) this.onProgressClick = callbacks.onProgressClick;
        if (callbacks.onLoopToggle) this.onLoopToggle = callbacks.onLoopToggle;
    }
}