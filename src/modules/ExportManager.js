/**
 * 音频导出管理器
 * 负责录制和导出音频功能
 */
export class ExportManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.audioContext = null;
        this.destination = null;
        
        // 录制配置
        this.recordingConfig = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        };
        
        // 回调函数
        this.onRecordingStart = null;
        this.onRecordingProgress = null;
        this.onRecordingComplete = null;
        this.onRecordingError = null;
        
        console.log('ExportManager 初始化完成');
    }

    /**
     * 检查浏览器支持
     */
    checkBrowserSupport() {
        const support = {
            mediaRecorder: typeof MediaRecorder !== 'undefined',
            audioContext: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined',
            getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function'
        };

        console.log('浏览器支持检查:', support);
        return support;
    }

    /**
     * 初始化音频上下文
     */
    async initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 创建目标节点用于录制
            this.destination = this.audioContext.createMediaStreamDestination();
            
            console.log('音频上下文初始化成功');
            return true;
        } catch (error) {
            console.error('音频上下文初始化失败:', error);
            return false;
        }
    }

    /**
     * 设置MediaRecorder
     */
    setupMediaRecorder(stream) {
        try {
            // 检查支持的MIME类型
            const supportedTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus'
            ];

            let selectedType = null;
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedType = type;
                    break;
                }
            }

            if (!selectedType) {
                throw new Error('浏览器不支持音频录制');
            }

            this.recordingConfig.mimeType = selectedType;
            
            // 创建MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, this.recordingConfig);
            
            // 设置事件监听器
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('录制错误:', event.error);
                if (this.onRecordingError) {
                    this.onRecordingError(event.error);
                }
            };

            console.log('MediaRecorder 设置完成:', selectedType);
            return true;
        } catch (error) {
            console.error('MediaRecorder 设置失败:', error);
            return false;
        }
    }

    /**
     * 开始录制
     */
    async startRecording(textManager) {
        if (this.isRecording) {
            console.warn('录制已在进行中');
            return false;
        }

        if (!textManager || !textManager.characters.length) {
            throw new Error('没有可录制的文本内容');
        }

        try {
            // 检查浏览器支持
            const support = this.checkBrowserSupport();
            if (!support.mediaRecorder || !support.audioContext) {
                throw new Error('浏览器不支持音频录制功能');
            }

            // 初始化音频上下文
            if (!this.audioContext) {
                const initialized = await this.initializeAudioContext();
                if (!initialized) {
                    throw new Error('音频上下文初始化失败');
                }
            }

            // 设置MediaRecorder
            const stream = this.destination.stream;
            const setupSuccess = this.setupMediaRecorder(stream);
            if (!setupSuccess) {
                throw new Error('录制器设置失败');
            }

            // 清空之前的录制数据
            this.recordedChunks = [];
            
            // 开始录制
            this.mediaRecorder.start(1000); // 每秒收集一次数据
            this.isRecording = true;

            console.log('开始录制音频');
            
            if (this.onRecordingStart) {
                this.onRecordingStart();
            }

            // 开始播放并录制
            await this.recordPlayback(textManager);

            return true;
        } catch (error) {
            console.error('开始录制失败:', error);
            this.isRecording = false;
            throw error;
        }
    }

    /**
     * 录制播放过程
     */
    async recordPlayback(textManager) {
        try {
            // 连接音频引擎的输出到录制目标
            // 注意：这里需要修改AudioEngine以支持音频上下文连接
            
            // 创建播放序列
            const sequence = this.audioEngine.createPlaybackSequence(textManager.characters.length);
            
            // 开始播放序列（这里需要修改以支持录制）
            await this.audioEngine.startPlaybackSequence(sequence);
            
        } catch (error) {
            console.error('录制播放失败:', error);
            this.stopRecording();
            throw error;
        }
    }

    /**
     * 停止录制
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('没有正在进行的录制');
            return false;
        }

        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            console.log('录制已停止');
            return true;
        } catch (error) {
            console.error('停止录制失败:', error);
            return false;
        }
    }

    /**
     * 处理录制完成
     */
    handleRecordingComplete() {
        try {
            if (this.recordedChunks.length === 0) {
                throw new Error('没有录制到音频数据');
            }

            // 创建音频Blob
            const audioBlob = new Blob(this.recordedChunks, {
                type: this.recordingConfig.mimeType
            });

            console.log('录制完成:', {
                size: audioBlob.size,
                type: audioBlob.type,
                chunks: this.recordedChunks.length
            });

            if (this.onRecordingComplete) {
                this.onRecordingComplete(audioBlob);
            }

            // 清理录制数据
            this.recordedChunks = [];
            
        } catch (error) {
            console.error('处理录制完成失败:', error);
            if (this.onRecordingError) {
                this.onRecordingError(error);
            }
        }
    }

    /**
     * 导出音频文件
     */
    async exportAudio(audioBlob, filename = null) {
        try {
            if (!audioBlob) {
                throw new Error('没有可导出的音频数据');
            }

            // 生成文件名
            if (!filename) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                filename = `佛经诵读_${timestamp}.webm`;
            }

            // 创建下载链接
            const url = URL.createObjectURL(audioBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';

            // 触发下载
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // 清理URL对象
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            console.log('音频文件导出成功:', filename);
            return true;
        } catch (error) {
            console.error('导出音频文件失败:', error);
            throw error;
        }
    }

    /**
     * 转换音频格式（如果需要）
     */
    async convertAudioFormat(audioBlob, targetFormat = 'mp3') {
        // 注意：浏览器原生不支持MP3编码
        // 这里只是一个占位符，实际实现需要使用Web Audio API或第三方库
        console.warn('音频格式转换功能需要额外的库支持');
        
        // 目前直接返回原始音频
        return audioBlob;
    }

    /**
     * 获取录制状态
     */
    getRecordingState() {
        return {
            isRecording: this.isRecording,
            isSupported: this.checkBrowserSupport(),
            recordedChunks: this.recordedChunks.length,
            currentFormat: this.recordingConfig.mimeType
        };
    }

    /**
     * 预览录制的音频
     */
    previewRecording(audioBlob) {
        try {
            if (!audioBlob) {
                throw new Error('没有可预览的音频数据');
            }

            // 创建音频元素
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = URL.createObjectURL(audioBlob);
            
            // 创建预览容器
            const previewContainer = document.createElement('div');
            previewContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--glass-bg);
                backdrop-filter: var(--backdrop-blur);
                -webkit-backdrop-filter: var(--backdrop-blur);
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                text-align: center;
            `;

            const title = document.createElement('h3');
            title.textContent = '录制预览';
            title.style.marginBottom = '1rem';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '关闭';
            closeBtn.className = 'pill-button secondary';
            closeBtn.style.marginTop = '1rem';
            closeBtn.onclick = () => {
                document.body.removeChild(previewContainer);
                URL.revokeObjectURL(audio.src);
            };

            previewContainer.appendChild(title);
            previewContainer.appendChild(audio);
            previewContainer.appendChild(closeBtn);
            document.body.appendChild(previewContainer);

            console.log('录制预览已打开');
        } catch (error) {
            console.error('预览录制失败:', error);
            throw error;
        }
    }

    /**
     * 设置回调函数
     */
    setCallbacks(callbacks) {
        if (callbacks.onRecordingStart) this.onRecordingStart = callbacks.onRecordingStart;
        if (callbacks.onRecordingProgress) this.onRecordingProgress = callbacks.onRecordingProgress;
        if (callbacks.onRecordingComplete) this.onRecordingComplete = callbacks.onRecordingComplete;
        if (callbacks.onRecordingError) this.onRecordingError = callbacks.onRecordingError;
    }

    /**
     * 清理资源
     */
    dispose() {
        try {
            if (this.isRecording) {
                this.stopRecording();
            }

            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }

            this.mediaRecorder = null;
            this.destination = null;
            this.recordedChunks = [];

            console.log('ExportManager 资源已清理');
        } catch (error) {
            console.error('清理ExportManager资源失败:', error);
        }
    }
}