/**
 * 使用Web Audio API的音频引擎
 * 专门解决移动端播放问题
 */

import audioAssets from '../assets/audio/index.js';

export default class WebAudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = new Map();
        this.isPlaying = false;
        this.isPaused = false;
        this.playbackSpeed = 1.0;
        this.currentSequence = null;
        this.sequenceIndex = 0;
        this.sequenceStartTime = 0;
        this.playbackTimer = null;
        
        // 移动端检测
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 音频文件路径配置
        this.audioConfig = {
            muyu: audioAssets.muyu,
            bowl: audioAssets.bowl
        };
        
        // 回调函数
        this.onPlayStateChange = null;
        this.onCharacterHighlight = null;
        this.onSequenceComplete = null;
        this.onError = null;
        
        console.log('WebAudioEngine 初始化完成');
    }
    
    /**
     * 初始化Web Audio Context
     */
    async initializeAudioContext() {
        if (this.audioContext) return;
        
        try {
            // 创建AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // 移动端需要用户交互来启动AudioContext
            if (this.audioContext.state === 'suspended') {
                console.log('AudioContext被暂停，等待用户交互...');
                
                const resumeAudio = async () => {
                    try {
                        await this.audioContext.resume();
                        console.log('AudioContext已恢复');
                        document.removeEventListener('touchstart', resumeAudio);
                        document.removeEventListener('click', resumeAudio);
                    } catch (error) {
                        console.warn('恢复AudioContext失败:', error);
                    }
                };
                
                document.addEventListener('touchstart', resumeAudio, { once: true });
                document.addEventListener('click', resumeAudio, { once: true });
            }
            
            console.log('AudioContext初始化完成');
        } catch (error) {
            console.error('初始化AudioContext失败:', error);
            throw error;
        }
    }
    
    /**
     * 预加载音频文件
     */
    async preloadAudioFiles() {
        console.log('开始预加载音频文件...');
        
        await this.initializeAudioContext();
        
        const loadPromises = Object.entries(this.audioConfig).map(async ([key, url]) => {
            try {
                console.log(`加载音频文件: ${key} from ${url}`);
                
                // 获取音频文件
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                
                // 解码音频数据
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                this.audioBuffers.set(key, audioBuffer);
                console.log(`音频文件 ${key} 预加载完成`);
                
            } catch (error) {
                console.error(`预加载音频文件 ${key} 失败:`, error);
                throw error;
            }
        });
        
        try {
            await Promise.all(loadPromises);
            console.log('所有音频文件预加载完成');
        } catch (error) {
            console.error('音频文件预加载失败:', error);
            throw error;
        }
    }
    
    /**
     * 播放音频
     */
    async playAudio(audioKey, noWait = true) {
        if (!this.audioContext) {
            await this.initializeAudioContext();
        }
        
        if (this.audioContext.state === 'suspended') {
            console.warn('AudioContext仍然被暂停，尝试恢复...');
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('恢复AudioContext失败:', error);
            }
        }
        
        const audioBuffer = this.audioBuffers.get(audioKey);
        if (!audioBuffer) {
            const error = new Error(`音频文件未找到: ${audioKey}`);
            this.handleError(error);
            throw error;
        }
        
        try {
            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 连接到输出
            source.connect(this.audioContext.destination);
            
            // 播放
            source.start(0);
            
            console.log(`播放音频: ${audioKey}`);
            
            if (!noWait) {
                // 等待播放完成
                return new Promise((resolve) => {
                    source.onended = () => {
                        console.log(`音频播放完成: ${audioKey}`);
                        resolve();
                    };
                });
            }
            
            return Promise.resolve();
            
        } catch (error) {
            console.error(`播放音频失败 (${audioKey}):`, error);
            this.handleError(error);
            throw error;
        }
    }
    
    /**
     * 播放音频序列
     */
    async playSequence(sequence, speed = 1.0) {
        if (this.isPlaying) {
            console.warn('已有序列在播放中');
            return;
        }
        
        this.currentSequence = sequence;
        this.playbackSpeed = speed;
        this.sequenceIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.sequenceStartTime = Date.now();
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true, false);
        }
        
        console.log(`开始播放序列，长度: ${sequence.length}, 速度: ${speed}x`);
        
        try {
            await this.playNextInSequence();
        } catch (error) {
            console.error('播放序列失败:', error);
            this.stopSequence();
            throw error;
        }
    }
    
    /**
     * 播放序列中的下一个音频
     */
    async playNextInSequence() {
        if (!this.isPlaying || this.isPaused || this.sequenceIndex >= this.currentSequence.length) {
            if (this.sequenceIndex >= this.currentSequence.length) {
                console.log('序列播放完成');
                this.stopSequence();
                if (this.onSequenceComplete) {
                    this.onSequenceComplete();
                }
            }
            return;
        }
        
        const item = this.currentSequence[this.sequenceIndex];
        
        try {
            // 触发字符高亮回调
            if (this.onCharacterHighlight && typeof item.charIndex === 'number') {
                this.onCharacterHighlight(item.charIndex);
            }
            
            // 播放音频
            if (item.audioKey) {
                await this.playAudio(item.audioKey, true);
            }
            
            this.sequenceIndex++;
            
            // 计算下一次播放的延迟
            const baseDelay = item.delay || 500;
            const adjustedDelay = baseDelay / this.playbackSpeed;
            
            // 设置定时器播放下一个
            this.playbackTimer = setTimeout(() => {
                this.playNextInSequence();
            }, adjustedDelay);
            
        } catch (error) {
            console.error('播放序列项失败:', error);
            this.stopSequence();
            throw error;
        }
    }
    
    /**
     * 停止序列播放
     */
    stopSequence() {
        this.isPlaying = false;
        this.isPaused = false;
        
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(false, false);
        }
        
        console.log('序列播放已停止');
    }
    
    /**
     * 暂停序列播放
     */
    pauseSequence() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.isPaused = true;
        
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true, true);
        }
        
        console.log('序列播放已暂停');
    }
    
    /**
     * 恢复序列播放
     */
    resumeSequence() {
        if (!this.isPlaying || !this.isPaused) return;
        
        this.isPaused = false;
        
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true, false);
        }
        
        console.log('序列播放已恢复');
        this.playNextInSequence();
    }
    
    /**
     * 设置播放速度
     */
    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
        console.log(`播放速度设置为: ${this.playbackSpeed}x`);
    }
    
    /**
     * 错误处理
     */
    handleError(error) {
        console.error('AudioEngine错误:', error);
        if (this.onError) {
            this.onError(error);
        }
    }
    
    /**
     * 销毁引擎
     */
    destroy() {
        this.stopSequence();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.audioBuffers.clear();
        console.log('WebAudioEngine已销毁');
    }
}
