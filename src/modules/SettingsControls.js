/**
 * 设置控制组件
 * 负责用户设置界面的交互和状态管理
 */
export class SettingsControls {
    constructor() {
        this.elements = {
            speedSlider: document.getElementById('speed-slider'),
            speedInput: document.getElementById('speed-input'),
            speedDisplay: document.getElementById('speed-display'),
            fontSizeSlider: document.getElementById('font-size-slider'),
            fontSizeDisplay: document.getElementById('font-size-display'),
            sutraSelect: document.getElementById('sutra-select'),
            customTextContainer: document.getElementById('custom-text-container'),
            customTextInput: document.getElementById('custom-text-input')
        };
        
        // 当前设置值
        this.settings = {
            playbackSpeed: 1.0,
            fontSize: 2,
            selectedSutra: 'amitabha',
            customText: ''
        };
        
        // 字体大小标签映射
        this.fontSizeLabels = ['小', '中', '大', '特大'];
        
        // 回调函数
        this.onSpeedChange = null;
        this.onFontSizeChange = null;
        this.onSutraChange = null;
        this.onCustomTextChange = null;
        
        this.initializeEventListeners();
        this.updateAllDisplays();
        
        console.log('SettingsControls 初始化完成');
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 播放速度滑块
        if (this.elements.speedSlider) {
            this.elements.speedSlider.addEventListener('input', (e) => {
                this.handleSpeedChange(parseFloat(e.target.value));
            });
        }

        // 速度输入框事件
        if (this.elements.speedInput) {
            this.elements.speedInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    this.handleSpeedChange(value);
                }
            });

            this.elements.speedInput.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 1 || value > 10) {
                    // 如果输入无效，恢复到当前设置值
                    e.target.value = this.settings.playbackSpeed.toFixed(1);
                }
            });

            this.elements.speedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur(); // 触发blur事件进行验证
                }
            });
        }

        // 字体大小滑块
        if (this.elements.fontSizeSlider) {
            this.elements.fontSizeSlider.addEventListener('input', (e) => {
                this.handleFontSizeChange(parseInt(e.target.value));
            });
        }

        // 经典选择下拉菜单
        if (this.elements.sutraSelect) {
            this.elements.sutraSelect.addEventListener('change', (e) => {
                this.handleSutraChange(e.target.value);
            });
        }

        // 自定义文本输入
        if (this.elements.customTextInput) {
            // 使用防抖处理文本输入
            let textInputTimeout;
            this.elements.customTextInput.addEventListener('input', (e) => {
                clearTimeout(textInputTimeout);
                textInputTimeout = setTimeout(() => {
                    this.handleCustomTextChange(e.target.value);
                }, 500); // 500ms 防抖
            });

            // 立即处理粘贴事件
            this.elements.customTextInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.handleCustomTextChange(e.target.value);
                }, 10);
            });
        }
    }

    /**
     * 处理播放速度变化
     */
    handleSpeedChange(speed) {
        this.settings.playbackSpeed = speed;
        this.updateSpeedDisplay();
        
        console.log(`播放速度调整为: ${speed}x`);
        
        if (this.onSpeedChange) {
            this.onSpeedChange(speed);
        }
    }

    /**
     * 处理字体大小变化
     */
    handleFontSizeChange(size) {
        this.settings.fontSize = size;
        this.updateFontSizeDisplay();
        
        console.log(`字体大小调整为: ${this.fontSizeLabels[size - 1]}`);
        
        if (this.onFontSizeChange) {
            this.onFontSizeChange(size);
        }
    }

    /**
     * 处理经典选择变化
     */
    handleSutraChange(sutraId) {
        this.settings.selectedSutra = sutraId;
        this.updateCustomTextVisibility();
        
        console.log(`经典选择: ${sutraId}`);
        
        if (this.onSutraChange) {
            this.onSutraChange(sutraId);
        }
    }

    /**
     * 处理自定义文本变化
     */
    handleCustomTextChange(text) {
        this.settings.customText = text;
        
        console.log(`自定义文本更新: ${text.length} 个字符`);
        
        if (this.onCustomTextChange) {
            this.onCustomTextChange(text);
        }
    }

    /**
     * 更新播放速度显示
     */
    updateSpeedDisplay() {
        if (this.elements.speedDisplay) {
            this.elements.speedDisplay.textContent = `${this.settings.playbackSpeed.toFixed(1)}x`;
        }
        if (this.elements.speedInput) {
            this.elements.speedInput.value = this.settings.playbackSpeed.toFixed(1);
        }
    }

    /**
     * 更新字体大小显示
     */
    updateFontSizeDisplay() {
        if (this.elements.fontSizeDisplay) {
            const label = this.fontSizeLabels[this.settings.fontSize - 1] || '中';
            this.elements.fontSizeDisplay.textContent = label;
        }
    }

    /**
     * 更新自定义文本容器可见性
     */
    updateCustomTextVisibility() {
        if (this.elements.customTextContainer) {
            const isCustom = this.settings.selectedSutra === 'custom';
            this.elements.customTextContainer.style.display = isCustom ? 'block' : 'none';
            
            // 如果切换到自定义模式，聚焦到文本输入框
            if (isCustom && this.elements.customTextInput) {
                setTimeout(() => {
                    this.elements.customTextInput.focus();
                }, 100);
            }
        }
    }

    /**
     * 更新所有显示
     */
    updateAllDisplays() {
        this.updateSpeedDisplay();
        this.updateFontSizeDisplay();
        this.updateCustomTextVisibility();
    }

    /**
     * 设置播放速度
     */
    setPlaybackSpeed(speed) {
        if (speed < 1.0 || speed > 10.0) {
            console.warn('播放速度超出范围 (1.0-10.0):', speed);
            return;
        }
        
        this.settings.playbackSpeed = speed;
        
        if (this.elements.speedSlider) {
            this.elements.speedSlider.value = speed;
        }

        // 更新输入框
        if (this.elements.speedInput) {
            this.elements.speedInput.value = speed.toFixed(1);
        }

        this.updateSpeedDisplay();
    }

    /**
     * 设置字体大小
     */
    setFontSize(size) {
        if (size < 1 || size > 4) {
            console.warn('字体大小超出范围 (1-4):', size);
            return;
        }
        
        this.settings.fontSize = size;
        
        if (this.elements.fontSizeSlider) {
            this.elements.fontSizeSlider.value = size;
        }
        
        this.updateFontSizeDisplay();
    }

    /**
     * 设置选中的经典
     */
    setSelectedSutra(sutraId) {
        this.settings.selectedSutra = sutraId;
        
        if (this.elements.sutraSelect) {
            this.elements.sutraSelect.value = sutraId;
        }
        
        this.updateCustomTextVisibility();
    }

    /**
     * 设置自定义文本
     */
    setCustomText(text) {
        this.settings.customText = text;
        
        if (this.elements.customTextInput) {
            this.elements.customTextInput.value = text;
        }
    }

    /**
     * 获取当前设置
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * 应用设置
     */
    applySettings(settings) {
        if (settings.playbackSpeed !== undefined) {
            this.setPlaybackSpeed(settings.playbackSpeed);
        }
        
        if (settings.fontSize !== undefined) {
            this.setFontSize(settings.fontSize);
        }
        
        if (settings.selectedSutra !== undefined) {
            this.setSelectedSutra(settings.selectedSutra);
        }
        
        if (settings.customText !== undefined) {
            this.setCustomText(settings.customText);
        }
        
        console.log('设置已应用:', settings);
    }

    /**
     * 重置为默认设置
     */
    resetToDefaults() {
        const defaultSettings = {
            playbackSpeed: 1.0,
            fontSize: 2,
            selectedSutra: 'amitabha',
            customText: ''
        };
        
        this.applySettings(defaultSettings);
        console.log('设置已重置为默认值');
    }

    /**
     * 验证自定义文本
     */
    validateCustomText(text) {
        if (!text || text.trim().length === 0) {
            return {
                valid: false,
                message: '自定义文本不能为空'
            };
        }
        
        if (text.length > 10000) {
            return {
                valid: false,
                message: '文本长度不能超过10000个字符'
            };
        }
        
        return {
            valid: true,
            message: '文本有效'
        };
    }

    /**
     * 获取当前文本内容
     */
    getCurrentText() {
        if (this.settings.selectedSutra === 'custom') {
            return this.settings.customText;
        }
        return null; // 非自定义文本需要通过其他方式获取
    }

    /**
     * 设置回调函数
     */
    setCallbacks(callbacks) {
        if (callbacks.onSpeedChange) this.onSpeedChange = callbacks.onSpeedChange;
        if (callbacks.onFontSizeChange) this.onFontSizeChange = callbacks.onFontSizeChange;
        if (callbacks.onSutraChange) this.onSutraChange = callbacks.onSutraChange;
        if (callbacks.onCustomTextChange) this.onCustomTextChange = callbacks.onCustomTextChange;
    }

    /**
     * 禁用所有控件
     */
    setDisabled(disabled) {
        Object.values(this.elements).forEach(element => {
            if (element && typeof element.disabled !== 'undefined') {
                element.disabled = disabled;
            }
        });
        
        console.log(`设置控件${disabled ? '已禁用' : '已启用'}`);
    }

    /**
     * 显示设置提示
     */
    showSettingsTip(message, duration = 3000) {
        // 创建提示元素
        const tip = document.createElement('div');
        tip.className = 'settings-tip';
        tip.textContent = message;
        tip.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(tip);
        
        // 自动移除提示
        setTimeout(() => {
            tip.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (tip.parentNode) {
                    tip.parentNode.removeChild(tip);
                }
            }, 300);
        }, duration);
    }
}