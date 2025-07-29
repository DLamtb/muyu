/**
 * UI控制器
 * 负责协调各个UI组件和业务逻辑模块
 */
import { SutraLoader } from './SutraLoader.js';
import { LyricsTextManager } from './LyricsTextManager.js';
import { AudioEngine } from './AudioEngine.js';
import { PlaybackControls } from './PlaybackControls.js';
import { SettingsControls } from './SettingsControls.js';
import { StorageManager } from './StorageManager.js';
import { ExportManager } from './ExportManager.js';

export class UIController {
    constructor() {
        // 初始化各个模块
        this.sutraLoader = new SutraLoader();
        this.textManager = null;
        this.audioEngine = new AudioEngine();
        this.playbackControls = new PlaybackControls();
        this.settingsControls = new SettingsControls();
        this.storageManager = new StorageManager();
        this.exportManager = null; // 延迟初始化
        
        // 应用状态
        this.isInitialized = false;
        this.currentSutraId = null;
        this.isLoading = false;
        
        // 获取文本显示元素
        this.textDisplayElement = document.getElementById('text-display');

        this.initializeController();
        
        console.log('UIController 初始化完成');
    }

    /**
     * 初始化控制器
     */
    async initializeController() {
        try {
            // 设置各模块的回调函数
            this.setupCallbacks();
            
            // 预加载音频文件
            await this.audioEngine.preloadAudioFiles();
            
            // 加载经书索引
            await this.sutraLoader.loadSutrasIndex();
            
            // 初始化文本管理器（使用歌词式显示）
            this.textManager = new LyricsTextManager(this.textDisplayElement);
            
            // 恢复用户设置
            await this.restoreUserSettings();
            
            // 加载默认经书或恢复上次的经书
            await this.loadDefaultSutra();
            
            // 初始化导出管理器
            this.exportManager = new ExportManager(this.audioEngine);
            this.setupExportCallbacks();
            
            // 设置自动保存
            this.setupAutoSave();
            
            this.isInitialized = true;
            console.log('UIController 初始化完成');
            
        } catch (error) {
            console.error('UIController 初始化失败:', error);
            this.showError('应用初始化失败: ' + error.message);
        }
    }



    /**
     * 设置各模块的回调函数
     */
    setupCallbacks() {
        // 播放控制回调
        this.playbackControls.setCallbacks({
            onPlayPause: () => this.handlePlayPause(),
            onReset: () => this.handleReset(),
            onProgressClick: (percentage) => this.handleProgressClick(percentage)
        });

        // 设置控制回调
        this.settingsControls.setCallbacks({
            onSpeedChange: (speed) => this.handleSpeedChange(speed),
            onFontSizeChange: (size) => this.handleFontSizeChange(size),
            onSutraChange: (sutraId) => this.handleSutraChange(sutraId),
            onCustomTextChange: (text) => this.handleCustomTextChange(text)
        });

        // 音频引擎回调
        this.audioEngine.onPlayStateChange = (isPlaying, isPaused) => {
            this.playbackControls.updatePlaybackState(isPlaying, isPaused);
        };

        this.audioEngine.onSequenceProgress = (index, event, total) => {
            const progress = (index / total) * 100;
            this.playbackControls.updateProgress(progress);
        };

        this.audioEngine.onSequenceComplete = () => {
            this.playbackControls.updatePlaybackState(false, false);
            this.playbackControls.updateProgress(100);
            this.showMessage('播放完成');
        };

        this.audioEngine.onError = (error) => {
            this.showError('音频播放错误: ' + error.message);
            this.playbackControls.updatePlaybackState(false, false);
        };
    }





    /**
     * 处理播放/暂停
     */
    async handlePlayPause() {
        if (!this.isInitialized) {
            this.showError('应用尚未初始化完成');
            return;
        }

        if (!this.textManager || !this.textManager.characters.length) {
            this.showError('请先加载文本内容');
            return;
        }

        try {
            if (this.audioEngine.isPlaying) {
                // 切换播放/暂停状态
                this.audioEngine.togglePlayback();
            } else {
                // 开始播放
                await this.audioEngine.startPlayback(this.textManager);
            }
        } catch (error) {
            console.error('播放控制失败:', error);
            this.showError('播放控制失败: ' + error.message);
        }
    }

    /**
     * 处理重置
     */
    handleReset() {
        try {
            this.audioEngine.resetPlayback();
            this.playbackControls.reset();
            
            if (this.textManager) {
                this.textManager.resetPosition();
            }
            
            this.showMessage('已重置');
        } catch (error) {
            console.error('重置失败:', error);
            this.showError('重置失败: ' + error.message);
        }
    }

    /**
     * 处理进度条点击
     */
    handleProgressClick(percentage) {
        try {
            if (this.textManager) {
                this.textManager.setProgressPosition(percentage);
                this.playbackControls.updateProgress(percentage);
            }
        } catch (error) {
            console.error('设置进度失败:', error);
            this.showError('设置进度失败: ' + error.message);
        }
    }



    /**
     * 处理字体大小变化
     */
    handleFontSizeChange(size) {
        try {
            if (this.textManager) {
                this.textManager.setFontSize(size);
                const sizeLabels = ['小', '中', '大', '特大'];
                this.settingsControls.showSettingsTip(`字体大小: ${sizeLabels[size - 1]}`);
            }
        } catch (error) {
            console.error('设置字体大小失败:', error);
            this.showError('设置字体大小失败: ' + error.message);
        }
    }

    /**
     * 处理经书选择变化
     */
    async handleSutraChange(sutraId) {
        if (sutraId === 'custom') {
            // 切换到自定义文本模式
            this.currentSutraId = null;
            this.textManager.clear();
            this.playbackControls.reset();
            this.showMessage('请输入自定义文本');
        } else {
            // 加载选中的经书
            await this.loadSutra(sutraId);
        }
    }

    /**
     * 处理自定义文本变化
     */
    handleCustomTextChange(text) {
        try {
            // 验证文本
            const validation = this.settingsControls.validateCustomText(text);
            
            if (validation.valid) {
                this.textManager.loadText(text);
                this.currentSutraId = null;
                this.playbackControls.reset();
                
                if (text.trim().length > 0) {
                    this.showMessage(`自定义文本已加载 (${text.length} 字符)`);
                }
            } else {
                this.showError(validation.message);
            }
        } catch (error) {
            console.error('处理自定义文本失败:', error);
            this.showError('处理自定义文本失败: ' + error.message);
        }
    }

    /**
     * 设置加载状态
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        this.playbackControls.setLoadingState(isLoading);
        this.settingsControls.setDisabled(isLoading);

        console.log(`设置加载状态: ${isLoading ? '加载中' : '加载完成'}`);

        // 更新文本显示区域
        if (this.textDisplayElement) {
            if (isLoading) {
                this.textDisplayElement.classList.add('loading');
                this.textDisplayElement.innerHTML = '加载中...';
            } else {
                this.textDisplayElement.classList.remove('loading');
                // 加载完成后，确保文本管理器重新渲染
                if (this.textManager && this.textManager.lines && this.textManager.lines.length > 0) {
                    console.log('加载完成，重新渲染文本');
                    this.textManager.renderLyrics();
                } else {
                    console.warn('加载完成但没有文本内容可显示');
                }
            }
        }
    }

    /**
     * 显示消息
     */
    showMessage(message) {
        console.log('消息:', message);
        // 可以在这里添加消息提示UI
        this.settingsControls.showSettingsTip(message, 2000);
    }

    /**
     * 显示错误
     */
    showError(message) {
        console.error('错误:', message);
        this.playbackControls.showError(message);
        
        // 创建错误提示
        const errorTip = document.createElement('div');
        errorTip.className = 'error-tip';
        errorTip.textContent = message;
        errorTip.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff3b30;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1000;
            animation: slideInDown 0.3s ease;
            max-width: 80%;
            text-align: center;
        `;
        
        document.body.appendChild(errorTip);
        
        // 自动移除错误提示
        setTimeout(() => {
            errorTip.style.animation = 'slideOutUp 0.3s ease';
            setTimeout(() => {
                if (errorTip.parentNode) {
                    errorTip.parentNode.removeChild(errorTip);
                }
            }, 300);
        }, 4000);
    }

    /**
     * 获取应用状态
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            currentSutraId: this.currentSutraId,
            playbackState: this.playbackControls.getState(),
            settings: this.settingsControls.getSettings(),
            textStats: this.textManager ? this.textManager.getTextStats() : null,
            audioState: this.audioEngine.getPlaybackState()
        };
    }

    /**
     * 恢复用户设置
     */
    async restoreUserSettings() {
        try {
            const savedSettings = this.storageManager.loadSettings();
            const preferences = this.storageManager.loadPreferences();
            
            // 应用保存的设置
            this.settingsControls.applySettings(savedSettings);
            
            // 应用音频引擎设置
            this.audioEngine.setPlaybackSpeed(savedSettings.playbackSpeed);
            
            // 如果有保存的经书选择，更新选择
            if (savedSettings.selectedSutra && savedSettings.selectedSutra !== 'amitabha') {
                this.settingsControls.setSelectedSutra(savedSettings.selectedSutra);
            }
            
            // 如果有自定义文本，恢复它
            if (savedSettings.selectedSutra === 'custom' && savedSettings.customText) {
                this.settingsControls.setCustomText(savedSettings.customText);
            }
            
            console.log('用户设置已恢复');
        } catch (error) {
            console.error('恢复用户设置失败:', error);
        }
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        // 定期保存设置（每30秒）
        setInterval(() => {
            this.saveCurrentSettings();
        }, 30000);

        // 在页面卸载前保存设置
        window.addEventListener('beforeunload', () => {
            this.saveCurrentSettings();
            this.saveCurrentProgress();
        });

        console.log('自动保存已设置');
    }

    /**
     * 保存当前设置
     */
    saveCurrentSettings() {
        try {
            const currentSettings = this.settingsControls.getSettings();
            this.storageManager.saveSettings(currentSettings);
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 保存当前播放进度
     */
    saveCurrentProgress() {
        try {
            if (this.currentSutraId && this.textManager) {
                const textStats = this.textManager.getTextStats();
                const progress = {
                    percentage: textStats.progress,
                    characterIndex: textStats.currentIndex
                };
                
                this.storageManager.saveProgress(this.currentSutraId, progress);
            }
        } catch (error) {
            console.error('保存播放进度失败:', error);
        }
    }

    /**
     * 恢复播放进度
     */
    restorePlaybackProgress(sutraId) {
        try {
            const savedProgress = this.storageManager.loadProgress(sutraId);
            
            if (savedProgress && this.textManager) {
                // 恢复到保存的位置
                this.textManager.jumpToPosition(savedProgress.characterIndex);
                this.playbackControls.updateProgress(savedProgress.percentage);
                
                console.log(`播放进度已恢复: ${savedProgress.percentage.toFixed(1)}%`);
                this.showMessage(`已恢复到上次播放位置 (${savedProgress.percentage.toFixed(1)}%)`);
            }
        } catch (error) {
            console.error('恢复播放进度失败:', error);
        }
    }

    /**
     * 重写加载默认经书方法以支持进度恢复
     */
    async loadDefaultSutra() {
        const savedSettings = this.storageManager.loadSettings();
        const sutraId = savedSettings.selectedSutra || 'amitabha';

        await this.loadSutra(sutraId);

        // 默认从头开始显示，不自动恢复进度
        // 用户可以通过播放按钮手动恢复进度
        console.log('经书加载完成，从头开始显示');
    }

    /**
     * 重写加载经书方法以支持自动保存
     */
    async loadSutra(sutraId) {
        if (this.isLoading) {
            console.warn('正在加载中，请稍候...');
            return;
        }

        try {
            this.setLoadingState(true);
            
            const sutraData = await this.sutraLoader.loadSutraContent(sutraId);
            
            if (sutraData && sutraData.content) {
                console.log(`开始加载经书文本: ${sutraData.info.title}, 内容长度: ${sutraData.content.length}`);

                // 加载文本到显示器
                this.textManager.loadText(sutraData.content);
                this.currentSutraId = sutraId;

                // 验证文本是否正确加载
                const textStats = this.textManager.getTextStats();
                console.log('文本加载统计:', textStats);

                // 强制重新渲染并重置到开头
                setTimeout(() => {
                    if (this.textManager.forceRender) {
                        this.textManager.forceRender();
                    }
                    // 确保重置到开头位置
                    this.textManager.resetPosition();
                    console.log('UIController: 文本已重置到开头位置');

                    // 再次延迟确保重置生效
                    setTimeout(() => {
                        this.textManager.resetPosition();
                        console.log('UIController: 二次确认重置位置');
                    }, 100);
                }, 300);

                // 重置播放状态
                this.playbackControls.reset();

                // 保存当前选择
                this.saveCurrentSettings();

                console.log(`经书加载成功: ${sutraData.info.title}`);
                this.showMessage(`已加载: ${sutraData.info.title} (${textStats.totalCharacters}字)`);
            } else {
                throw new Error('经书内容为空');
            }
            
        } catch (error) {
            console.error('加载经书失败:', error);
            this.showError('加载经书失败: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * 重写设置变化处理方法以支持自动保存
     */
    handleSpeedChange(speed) {
        try {
            this.audioEngine.setPlaybackSpeed(speed);
            this.settingsControls.showSettingsTip(`播放速度: ${speed.toFixed(1)}x`);
            
            // 自动保存设置
            setTimeout(() => this.saveCurrentSettings(), 1000);
        } catch (error) {
            console.error('设置播放速度失败:', error);
            this.showError('设置播放速度失败: ' + error.message);
        }
    }

    handleFontSizeChange(size) {
        try {
            if (this.textManager) {
                this.textManager.setFontSize(size);
                const sizeLabels = ['小', '中', '大', '特大'];
                this.settingsControls.showSettingsTip(`字体大小: ${sizeLabels[size - 1]}`);
                
                // 自动保存设置
                setTimeout(() => this.saveCurrentSettings(), 1000);
            }
        } catch (error) {
            console.error('设置字体大小失败:', error);
            this.showError('设置字体大小失败: ' + error.message);
        }
    }

    async handleSutraChange(sutraId) {
        if (sutraId === 'custom') {
            // 切换到自定义文本模式
            this.currentSutraId = null;
            this.textManager.clear();
            this.playbackControls.reset();
            this.showMessage('请输入自定义文本');
        } else {
            // 加载选中的经书
            await this.loadSutra(sutraId);
        }
        
        // 自动保存设置
        setTimeout(() => this.saveCurrentSettings(), 1000);
    }

    handleCustomTextChange(text) {
        try {
            // 验证文本
            const validation = this.settingsControls.validateCustomText(text);
            
            if (validation.valid) {
                this.textManager.loadText(text);
                this.currentSutraId = null;
                this.playbackControls.reset();
                
                if (text.trim().length > 0) {
                    this.showMessage(`自定义文本已加载 (${text.length} 字符)`);
                }
                
                // 自动保存自定义文本
                setTimeout(() => this.saveCurrentSettings(), 2000);
            } else {
                this.showError(validation.message);
            }
        } catch (error) {
            console.error('处理自定义文本失败:', error);
            this.showError('处理自定义文本失败: ' + error.message);
        }
    }











    /**
     * 设置导出管理器回调
     */
    setupExportCallbacks() {
        if (!this.exportManager) return;

        this.exportManager.setCallbacks({
            onRecordingStart: () => {
                this.showExportProgress('开始录制...');
                this.setExportButtonState('recording');
            },
            onRecordingProgress: (progress) => {
                this.showExportProgress(`录制中... ${Math.round(progress)}%`);
            },
            onRecordingComplete: (audioBlob) => {
                this.handleExportComplete(audioBlob);
            },
            onRecordingError: (error) => {
                this.showError('录制失败: ' + error.message);
                this.setExportButtonState('idle');
            }
        });

        // 设置导出按钮事件
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExportRequest();
            });
        }
    }

    /**
     * 处理导出请求
     */
    async handleExportRequest() {
        if (!this.isInitialized) {
            this.showError('应用尚未初始化完成');
            return;
        }

        if (!this.textManager || !this.textManager.characters.length) {
            this.showError('请先加载文本内容');
            return;
        }

        if (!this.exportManager) {
            this.showError('导出功能不可用');
            return;
        }

        try {
            // 检查浏览器支持
            const support = this.exportManager.checkBrowserSupport();
            if (!support.mediaRecorder) {
                this.showError('您的浏览器不支持音频录制功能');
                return;
            }

            // 确认导出操作
            const confirmed = await this.showExportConfirmation();
            if (!confirmed) {
                return;
            }

            // 开始录制
            this.setExportButtonState('recording');
            await this.exportManager.startRecording(this.textManager);

        } catch (error) {
            console.error('导出失败:', error);
            this.showError('导出失败: ' + error.message);
            this.setExportButtonState('idle');
        }
    }

    /**
     * 显示导出确认对话框
     */
    async showExportConfirmation() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: var(--glass-bg);
                backdrop-filter: var(--backdrop-blur);
                -webkit-backdrop-filter: var(--backdrop-blur);
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                text-align: center;
            `;

            const textStats = this.textManager.getTextStats();
            const estimatedTime = Math.ceil(textStats.totalCharacters / this.settingsControls.getSettings().playbackSpeed);

            dialog.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">导出音频</h3>
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    将录制完整的诵读音频<br>
                    预计时长: ${Math.floor(estimatedTime / 60)}分${estimatedTime % 60}秒<br>
                    文字数量: ${textStats.totalCharacters} 字符
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="confirm-export" class="pill-button">开始录制</button>
                    <button id="cancel-export" class="pill-button secondary">取消</button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // 事件处理
            dialog.querySelector('#confirm-export').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };

            dialog.querySelector('#cancel-export').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            };
        });
    }

    /**
     * 设置导出按钮状态
     */
    setExportButtonState(state) {
        const exportBtn = document.getElementById('export-btn');
        const exportSpinner = document.getElementById('export-spinner');
        
        if (!exportBtn) return;

        switch (state) {
            case 'idle':
                exportBtn.disabled = false;
                exportBtn.innerHTML = '导出MP3';
                if (exportSpinner) exportSpinner.style.display = 'none';
                break;
            case 'recording':
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<span class="loading-spinner"></span>录制中...';
                if (exportSpinner) exportSpinner.style.display = 'inline-block';
                break;
            case 'processing':
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<span class="loading-spinner"></span>处理中...';
                if (exportSpinner) exportSpinner.style.display = 'inline-block';
                break;
        }
    }

    /**
     * 显示导出进度
     */
    showExportProgress(message) {
        this.showMessage(message);
    }

    /**
     * 处理导出完成
     */
    async handleExportComplete(audioBlob) {
        try {
            this.setExportButtonState('processing');
            
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const sutraTitle = this.currentSutraId ? 
                (await this.sutraLoader.getSutraInfo(this.currentSutraId))?.title || '自定义文本' : 
                '自定义文本';
            const filename = `${sutraTitle}_${timestamp}.webm`;

            // 导出文件
            await this.exportManager.exportAudio(audioBlob, filename);
            
            this.showMessage('音频导出成功！');
            this.setExportButtonState('idle');

            // 显示导出完成对话框
            this.showExportCompleteDialog(audioBlob, filename);

        } catch (error) {
            console.error('处理导出完成失败:', error);
            this.showError('导出处理失败: ' + error.message);
            this.setExportButtonState('idle');
        }
    }

    /**
     * 显示导出完成对话框
     */
    showExportCompleteDialog(audioBlob, filename) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--glass-bg);
            backdrop-filter: var(--backdrop-blur);
            -webkit-backdrop-filter: var(--backdrop-blur);
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            text-align: center;
        `;

        const fileSize = (audioBlob.size / 1024 / 1024).toFixed(2);

        dialog.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">导出完成</h3>
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                文件已成功导出<br>
                文件名: ${filename}<br>
                文件大小: ${fileSize} MB
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button id="preview-audio" class="pill-button secondary">预览</button>
                <button id="download-again" class="pill-button secondary">重新下载</button>
                <button id="close-dialog" class="pill-button">关闭</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // 事件处理
        dialog.querySelector('#preview-audio').onclick = () => {
            this.exportManager.previewRecording(audioBlob);
        };

        dialog.querySelector('#download-again').onclick = async () => {
            try {
                await this.exportManager.exportAudio(audioBlob, filename);
                this.showMessage('文件重新下载成功');
            } catch (error) {
                this.showError('重新下载失败: ' + error.message);
            }
        };

        dialog.querySelector('#close-dialog').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    /**
     * 清理资源
     */
    dispose() {
        try {
            // 保存当前状态
            this.saveCurrentSettings();
            this.saveCurrentProgress();
            
            if (this.exportManager) {
                this.exportManager.dispose();
            }
            
            if (this.audioEngine) {
                this.audioEngine.dispose();
            }
            
            if (this.scrollSyncController) {
                this.scrollSyncController.dispose();
            }
            
            if (this.textManager) {
                this.textManager.clear();
            }
            
            console.log('UIController 资源已清理');
        } catch (error) {
            console.error('清理资源失败:', error);
        }
    }
}