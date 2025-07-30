/**
 * 音频播放引擎
 * 负责音频文件管理和播放控制
 */
import { audioAssets } from '../assets/audio/index.js';

export class AudioEngine {
    constructor() {
        this.audioFiles = new Map();
        this.isPlaying = false;
        this.isPaused = false;
        this.isLooping = false;
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

        // 播放状态回调
        this.onPlayStateChange = null;
        this.onSequenceProgress = null;
        this.onSequenceComplete = null;
        this.onError = null;

        console.log('AudioEngine 初始化完成');
        console.log('音频文件路径配置:', this.audioConfig);

        // 测试音频文件是否可以访问
        this.testAudioUrls();
    }

    /**
     * 测试音频URL是否可访问
     */
    async testAudioUrls() {
        console.log('开始测试音频URL...');
        for (const [key, url] of Object.entries(this.audioConfig)) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                console.log(`音频URL测试 ${key}:`, {
                    url: url,
                    status: response.status,
                    ok: response.ok
                });
            } catch (error) {
                console.error(`音频URL测试失败 ${key}:`, error);
            }
        }
    }

    /**
     * 预加载音频文件
     */
    async preloadAudioFiles() {
        console.log('开始预加载音频文件...');
        
        const loadPromises = Object.entries(this.audioConfig).map(async ([key, path]) => {
            try {
                const audio = new Audio();
                audio.preload = 'auto'; // 恢复完整预加载
                
                // 创建加载Promise
                const loadPromise = new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', () => {
                        console.log(`音频文件加载成功: ${key}`);
                        resolve();
                    });
                    
                    audio.addEventListener('error', (e) => {
                        console.error(`音频文件加载失败: ${key}`, e);
                        reject(new Error(`Failed to load ${key}: ${e.message}`));
                    });
                    
                    // 设置超时
                    setTimeout(() => {
                        reject(new Error(`Timeout loading ${key}`));
                    }, 10000);
                });
                
                // 开始加载
                audio.src = path;
                audio.load();
                
                await loadPromise;
                
                // 存储音频对象
                this.audioFiles.set(key, audio);
                
                return { key, success: true };
            } catch (error) {
                console.error(`预加载音频失败 (${key}):`, error);
                return { key, success: false, error };
            }
        });

        const results = await Promise.all(loadPromises);
        const successCount = results.filter(r => r.success).length;
        
        console.log(`音频预加载完成: ${successCount}/${results.length} 个文件`);
        
        if (successCount === 0) {
            throw new Error('所有音频文件加载失败');
        }
        
        return results;
    }

    /**
     * 播放指定音频
     */
    async playAudio(audioKey, noWait = false) {
        // 检查是否已停止播放
        if (!this.isPlaying) {
            console.log(`播放已停止，跳过 ${audioKey} 音频播放`);
            return;
        }

        // 获取音频对象
        const audio = this.audioFiles.get(audioKey);

        if (!audio) {
            const error = new Error(`音频文件未找到: ${audioKey}`);
            this.handleError(error);
            throw error;
        }

        try {
            // 重置音频到开始位置
            audio.currentTime = 0;

            // 设置播放速度（保持原始速度）
            audio.playbackRate = 1.0;

            // 播放音频
            const playPromise = audio.play();

            console.log(`播放音频: ${audioKey}${noWait ? ' (不等待完成)' : ''}`);

            if (noWait) {
                // 不等待音频播放完毕，立即返回，但处理可能的错误
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // 如果是因为播放被中断，不报错
                        if (error.name === 'AbortError' && !this.isPlaying) {
                            console.log(`${audioKey} 音频播放被正常中断`);
                        } else {
                            console.warn(`播放音频失败 (${audioKey}):`, error);
                        }
                    });
                }
                return Promise.resolve();
            } else {
                // 等待音频播放完毕
                await playPromise;
                return new Promise((resolve) => {
                    const handleEnded = () => {
                        audio.removeEventListener('ended', handleEnded);
                        resolve();
                    };
                    audio.addEventListener('ended', handleEnded);
                });
            }

        } catch (error) {
            // 如果是因为播放被中断，不报错
            if (error.name === 'AbortError' && !this.isPlaying) {
                console.log(`${audioKey} 音频播放被正常中断`);
                return;
            }

            console.error(`播放音频失败 (${audioKey}):`, error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * 播放木鱼声音
     */
    async playMuyuSound() {
        try {
            await this.playAudio('muyu');
            console.log('木鱼声音播放完成');
        } catch (error) {
            console.error('播放木鱼声音失败:', error);
            this.handleError(new Error('木鱼声音播放失败: ' + error.message));
            throw error;
        }
    }

    /**
     * 播放颂钵声音
     */
    async playBowlSound() {
        try {
            await this.playAudio('bowl');
            console.log('颂钵声音播放完成');
        } catch (error) {
            console.error('播放颂钵声音失败:', error);
            this.handleError(new Error('颂钵声音播放失败: ' + error.message));
            throw error;
        }
    }

    /**
     * 测试音频播放功能
     */
    async testAudioPlayback() {
        console.log('开始测试音频播放...');
        
        try {
            console.log('测试木鱼声音...');
            await this.playMuyuSound();
            
            // 等待一秒
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('测试颂钵声音...');
            await this.playBowlSound();
            
            console.log('音频播放测试完成');
            return true;
        } catch (error) {
            console.error('音频播放测试失败:', error);
            return false;
        }
    }

    /**
     * 创建播放序列（只为文字字符创建木鱼声）
     */
    createPlaybackSequence(textLength) {
        console.log(`开始创建播放序列，文本长度: ${textLength}, 播放速度: ${this.playbackSpeed}x`);

        const sequence = [];

        // 计算基础间隔（根据播放速度调整）
        const baseInterval = 1000 / this.playbackSpeed;

        // 第一步：播放开始颂钵
        sequence.push({
            type: 'bowl',
            delay: 0,
            description: '开始颂钵',
            noWait: false, // 等待颂钵播放完毕
            isStartBowl: true
        });

        // 第二步：创建木鱼播放序列
        // 只为文字字符创建木鱼声，跳过标点符号
        let muyuIndex = 0;
        for (let i = 0; i < textLength; i++) {
            // 获取字符信息
            const charData = this.getCharacterData ? this.getCharacterData(i) : null;

            // 只为非标点符号字符创建木鱼声
            if (!charData || (!charData.isPunctuation && !charData.isSpace)) {
                sequence.push({
                    type: 'muyu',
                    delay: muyuIndex * baseInterval, // 相对于木鱼开始时间的延迟
                    characterIndex: i,
                    description: `木鱼 ${muyuIndex + 1}`,
                    noWait: true, // 不等待木鱼播放完毕
                    isMuyu: true
                });
                muyuIndex++;
            }
        }

        console.log(`播放序列创建完成: ${sequence.length} 个事件，实际木鱼数: ${muyuIndex}，木鱼间隔: ${baseInterval.toFixed(1)}ms`);
        console.log('序列预览:', sequence.slice(0, 3).map(s => `${s.description}@${s.delay}ms`));
        return sequence;
    }

    /**
     * 开始播放序列
     */
    async startPlaybackSequence(sequence) {
        if (this.isPlaying) {
            console.warn('播放已在进行中');
            return;
        }

        this.currentSequence = sequence;
        this.sequenceIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.sequenceStartTime = Date.now();

        this.notifyPlayStateChange(true);

        console.log('开始播放序列，事件数量:', sequence.length);

        try {
            // 分阶段执行：先播放颂钵，再播放木鱼序列
            await this.executeSequenceInPhases();
        } catch (error) {
            console.error('播放序列执行失败:', error);
            this.handleError(error);
            this.stopPlayback();
        }
    }

    /**
     * 开始文本播放
     */
    async startPlayback(textManager) {
        if (!textManager || !textManager.characters || textManager.characters.length === 0) {
            const error = new Error('无效的文本管理器或空文本');
            this.handleError(error);
            throw error;
        }

        // 设置文本管理器回调
        this.textManager = textManager;

        // 设置字符数据获取方法
        this.getCharacterData = (index) => {
            return textManager.characters && textManager.characters[index] ? textManager.characters[index] : null;
        };

        // 创建播放序列（现在会跳过标点符号）
        const sequence = this.createPlaybackSequence(textManager.characters.length);

        // 开始播放序列
        await this.startPlaybackSequence(sequence);
    }

    /**
     * 分阶段执行播放序列
     */
    async executeSequenceInPhases() {
        console.log('开始分阶段执行播放序列');

        // 第一阶段：播放颂钵
        const bowlEvent = this.currentSequence.find(event => event.isStartBowl);
        if (bowlEvent) {
            console.log('第一阶段：播放开始颂钵');
            try {
                await this.playAudio(bowlEvent.type, false); // 等待颂钵播放完毕
                console.log('颂钵播放完毕，开始木鱼阶段');
            } catch (error) {
                console.error('颂钵播放失败:', error);
                throw error;
            }
        }

        // 第二阶段：播放木鱼序列
        const muyuEvents = this.currentSequence.filter(event => event.isMuyu);
        if (muyuEvents.length > 0) {
            console.log(`第二阶段：播放木鱼序列，共 ${muyuEvents.length} 个事件`);
            this.muyuStartTime = Date.now(); // 记录木鱼开始时间
            await this.executeMuyuSequence(muyuEvents);
        }
    }

    /**
     * 执行木鱼播放序列
     */
    async executeMuyuSequence(muyuEvents) {
        for (let i = 0; i < muyuEvents.length; i++) {
            if (!this.isPlaying || this.isPaused) {
                console.log('播放被停止或暂停');
                return;
            }

            const event = muyuEvents[i];
            const currentTime = Date.now();
            const elapsedTime = currentTime - this.muyuStartTime;
            const waitTime = Math.max(0, event.delay - elapsedTime);

            // 等待到正确的时间点
            if (waitTime > 0) {
                await this.waitWithPauseSupport(waitTime);
            }

            if (!this.isPlaying || this.isPaused) {
                return;
            }

            try {
                // 播放木鱼声音（不等待）
                await this.playAudio(event.type, true);

                // 通知进度更新
                this.notifySequenceProgress(i, event);

                console.log(`木鱼 ${i + 1}/${muyuEvents.length} 播放完成`);

            } catch (error) {
                // 如果是因为播放被中断，退出序列
                if (error.name === 'AbortError' && !this.isPlaying) {
                    console.log('木鱼播放被正常中断，退出序列');
                    return;
                }

                console.error(`木鱼播放失败 (${i + 1}):`, error);
                // 其他错误继续播放下一个，不中断整个序列
            }
        }

        // 所有木鱼播放完毕
        console.log('木鱼序列播放完毕');
        this.completePlayback();
    }

    /**
     * 执行播放序列（旧方法，保留作为备用）
     */
    async executeSequence() {
        if (!this.currentSequence || this.sequenceIndex >= this.currentSequence.length) {
            this.completePlayback();
            return;
        }

        const currentEvent = this.currentSequence[this.sequenceIndex];

        // 计算需要等待的时间（相对于序列开始时间）
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.sequenceStartTime;
        const waitTime = Math.max(0, currentEvent.delay - elapsedTime);

        console.log(`事件 ${this.sequenceIndex}: ${currentEvent.type} (${currentEvent.description || ''}), 等待 ${waitTime}ms`);

        // 等待到正确的时间点
        if (waitTime > 0) {
            await this.waitWithPauseSupport(waitTime);
        }

        if (!this.isPlaying || this.isPaused) {
            return;
        }

        try {
            // 播放音频（根据事件类型决定是否等待）
            const noWait = currentEvent.noWait || false;
            await this.playAudio(currentEvent.type, noWait);

            // 通知进度更新
            this.notifySequenceProgress(this.sequenceIndex, currentEvent);

            // 移动到下一个事件
            this.sequenceIndex++;

            // 继续执行序列
            await this.executeSequence();

        } catch (error) {
            console.error('执行序列事件失败:', error);
            throw error;
        }
    }

    /**
     * 支持暂停的等待函数
     */
    async waitWithPauseSupport(delay) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let remainingDelay = delay;
            
            const checkAndWait = () => {
                if (!this.isPlaying) {
                    resolve();
                    return;
                }
                
                if (this.isPaused) {
                    // 暂停状态，继续检查
                    setTimeout(checkAndWait, 100);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                remainingDelay = delay - elapsed;
                
                if (remainingDelay <= 0) {
                    resolve();
                } else {
                    setTimeout(checkAndWait, Math.min(remainingDelay, 100));
                }
            };
            
            checkAndWait();
        });
    }

    /**
     * 暂停播放
     */
    pausePlayback() {
        if (this.isPlaying && !this.isPaused) {
            this.isPaused = true;
            this.notifyPlayStateChange(false);
            console.log('播放已暂停');
        }
    }

    /**
     * 恢复播放
     */
    resumePlayback() {
        if (this.isPlaying && this.isPaused) {
            this.isPaused = false;
            this.notifyPlayStateChange(true);
            console.log('播放已恢复');
            
            // 继续执行序列
            this.executeSequence().catch(error => {
                console.error('恢复播放失败:', error);
                this.handleError(error);
                this.stopPlayback();
            });
        }
    }

    /**
     * 停止播放
     */
    stopPlayback() {
        console.log('开始停止播放...');

        this.isPlaying = false;
        this.isPaused = false;
        this.currentSequence = null;
        this.sequenceIndex = 0;

        // 停止所有音频，并处理可能的错误
        this.audioFiles.forEach((audio, key) => {
            try {
                if (!audio.paused) {
                    audio.pause();
                }
                audio.currentTime = 0;
                console.log(`已停止音频: ${key}`);
            } catch (error) {
                console.warn(`停止音频失败 (${key}):`, error);
            }
        });

        // 重置文本管理器
        if (this.textManager) {
            this.textManager.resetPosition();
        }

        this.notifyPlayStateChange(false);
        console.log('播放已完全停止');
    }

    /**
     * 重置播放状态
     */
    resetPlayback() {
        this.stopPlayback();
        
        // 清除文本高亮
        if (this.textManager) {
            this.textManager.clearHighlight();
            this.textManager.resetPosition();
        }
        
        console.log('播放状态已重置');
    }

    /**
     * 切换播放/暂停状态
     */
    togglePlayback() {
        if (!this.isPlaying) {
            // 如果没有在播放，需要外部提供文本管理器来开始播放
            console.warn('无法切换播放状态：需要先开始播放');
            return false;
        }
        
        if (this.isPaused) {
            this.resumePlayback();
        } else {
            this.pausePlayback();
        }
        
        return true;
    }

    /**
     * 动态调整播放速度（播放中调整）
     */
    adjustPlaybackSpeed(oldSpeed, newSpeed) {
        console.log(`尝试动态调整播放速度: ${oldSpeed}x → ${newSpeed}x`);
        console.log('当前状态:', {
            isPlaying: this.isPlaying,
            muyuStartTime: this.muyuStartTime,
            hasMuyuStartTime: !!this.muyuStartTime
        });

        if (!this.isPlaying) {
            console.log('未在播放中，跳过速度调整');
            return;
        }

        if (!this.muyuStartTime) {
            console.log('木鱼尚未开始，跳过速度调整');
            return;
        }

        console.log(`开始动态调整播放速度: ${oldSpeed}x → ${newSpeed}x`);

        // 计算当前已播放的时间
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.muyuStartTime;

        // 计算新的时间基准
        // 根据新速度重新计算已播放的"逻辑时间"
        const speedRatio = oldSpeed / newSpeed; // 修正比例计算
        const adjustedElapsedTime = elapsedTime * speedRatio;

        // 更新木鱼开始时间，使后续播放按新速度进行
        this.muyuStartTime = currentTime - adjustedElapsedTime;

        console.log(`播放速度调整完成，时间基准已更新`);
        console.log('调整详情:', {
            elapsedTime,
            speedRatio,
            adjustedElapsedTime,
            newMuyuStartTime: this.muyuStartTime
        });
    }

    /**
     * 设置循环播放
     */
    setLooping(isLooping) {
        this.isLooping = isLooping;
        console.log(`循环播放已${isLooping ? '开启' : '关闭'}`);
    }

    /**
     * 设置播放速度
     */
    setPlaybackSpeed(speed) {
        if (speed < 0.1 || speed > 10.0) {
            console.warn('播放速度超出范围 (0.1-10.0):', speed);
            return;
        }

        const oldSpeed = this.playbackSpeed;
        this.playbackSpeed = speed;

        // 更新当前播放中的音频速度
        this.audioFiles.forEach(audio => {
            audio.playbackRate = 1.0; // 保持音频本身的原始速度
        });

        console.log(`播放速度设置为: ${speed}x (从 ${oldSpeed}x)`);

        // 如果正在播放，动态调整播放间隔，不重新开始
        if (this.isPlaying) {
            console.log('播放中速度改变，动态调整播放间隔...');
            this.adjustPlaybackSpeed(oldSpeed, speed);
        }
    }

    /**
     * 完成播放
     */
    completePlayback() {
        if (this.isLooping && this.textManager) {
            // 循环播放：重新开始
            console.log('循环播放：重新开始播放序列');

            // 重置文本位置
            this.textManager.resetPosition();

            // 重新开始播放
            setTimeout(async () => {
                try {
                    await this.startPlayback(this.textManager);
                } catch (error) {
                    console.error('循环播放重新开始失败:', error);
                    this.handleError(error);
                    this.stopPlayback();
                }
            }, 1000); // 1秒间隔后重新开始

        } else {
            // 正常结束播放
            this.isPlaying = false;
            this.isPaused = false;
            this.notifyPlayStateChange(false);
            this.notifySequenceComplete();
            console.log('播放序列完成');
        }
    }

    /**
     * 通知播放状态变化
     */
    notifyPlayStateChange(isPlaying) {
        if (this.onPlayStateChange) {
            this.onPlayStateChange(isPlaying, this.isPaused);
        }
    }

    /**
     * 通知序列进度
     */
    notifySequenceProgress(index, event) {
        // 如果事件包含字符索引，更新文本管理器的高亮
        if (event.characterIndex !== undefined && this.textManager) {
            this.textManager.highlightCharacter(event.characterIndex);
        }
        
        if (this.onSequenceProgress) {
            this.onSequenceProgress(index, event, this.currentSequence.length);
        }
    }

    /**
     * 通知序列完成
     */
    notifySequenceComplete() {
        if (this.onSequenceComplete) {
            this.onSequenceComplete();
        }
    }

    /**
     * 处理错误
     */
    handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * 获取播放状态
     */
    getPlaybackState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            speed: this.playbackSpeed,
            sequenceIndex: this.sequenceIndex,
            sequenceLength: this.currentSequence ? this.currentSequence.length : 0,
            progress: this.currentSequence ? (this.sequenceIndex / this.currentSequence.length) * 100 : 0
        };
    }

    /**
     * 清理资源
     */
    dispose() {
        this.stopPlayback();
        
        this.audioFiles.forEach(audio => {
            audio.src = '';
            audio.load();
        });
        
        this.audioFiles.clear();
        console.log('AudioEngine 资源已清理');
    }
}