/**
 * 歌词式文本管理器
 * 实现类似歌词的滚动显示效果
 */
export class LyricsTextManager {
    constructor(textDisplayElement) {
        this.textDisplayElement = textDisplayElement;
        this.currentText = '';
        this.lines = [];
        this.characters = [];
        this.currentCharIndex = 0;
        this.currentLineIndex = 0;
        this.fontSize = 'medium';
        this.isHighlightEnabled = true;
        
        // 显示配置（根据屏幕大小自适应）
        this.config = this.getResponsiveConfig();
        
        // 字体大小映射
        this.fontSizeMap = {
            1: 'font-small',
            2: 'font-medium', 
            3: 'font-large',
            4: 'font-extra-large'
        };
        
        this.initializeLyricsDisplay();
        this.setupResponsiveHandlers();
    }

    /**
     * 设置响应式处理器
     */
    setupResponsiveHandlers() {
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 监听屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const newConfig = this.getResponsiveConfig();
        const configChanged = JSON.stringify(newConfig) !== JSON.stringify(this.config);

        if (configChanged) {
            this.config = newConfig;
            this.applyLyricsStyles();

            // 重新渲染以适应新配置
            if (this.lines.length > 0) {
                this.renderLyrics();
                // 只有在不是第一行时才滚动
                if (this.currentLineIndex > 0) {
                    this.scrollToCurrentLine();
                }
            }
        }
    }

    /**
     * 获取响应式配置
     */
    getResponsiveConfig() {
        const isMobile = window.innerWidth <= 768;
        const isSmallScreen = window.innerHeight <= 600;

        // 根据当前字体大小计算行高
        const baseLineHeight = isMobile ? 45 : 55;
        const fontSizeMultiplier = this.getFontSizeMultiplier();
        const dynamicLineHeight = Math.round(baseLineHeight * fontSizeMultiplier);

        return {
            visibleLines: isMobile ? (isSmallScreen ? 8 : 10) : 12,
            currentLinePosition: isMobile ? 3 : 4,
            lineHeight: dynamicLineHeight,
            animationDuration: 400,
            charactersPerLine: isMobile ? 15 : 20
        };
    }

    /**
     * 获取字体大小倍数
     */
    getFontSizeMultiplier() {
        const fontSizeMultipliers = {
            1: 0.85,  // font-small (1rem) -> 0.85倍行高
            2: 1.0,   // font-medium (1.2rem) -> 1倍行高
            3: 1.25,  // font-large (1.5rem) -> 1.25倍行高
            4: 1.5    // font-extra-large (1.8rem) -> 1.5倍行高
        };

        return fontSizeMultipliers[this.fontSize] || 1.0;
    }



    /**
     * 初始化歌词显示容器
     */
    initializeLyricsDisplay() {
        console.log('初始化歌词显示容器...');

        if (!this.textDisplayElement) {
            console.error('textDisplayElement 不存在！');
            return;
        }

        console.log('textDisplayElement 存在，开始初始化');

        this.textDisplayElement.innerHTML = '';
        this.textDisplayElement.className = 'lyrics-display';

        // 创建滚动容器
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'lyrics-scroll-container';

        // 创建行容器
        this.linesContainer = document.createElement('div');
        this.linesContainer.className = 'lyrics-lines-container';

        this.scrollContainer.appendChild(this.linesContainer);
        this.textDisplayElement.appendChild(this.scrollContainer);

        // 设置CSS样式
        this.applyLyricsStyles();

        console.log('歌词显示容器初始化完成');
        console.log('DOM结构:', {
            textDisplayElement: !!this.textDisplayElement,
            scrollContainer: !!this.scrollContainer,
            linesContainer: !!this.linesContainer
        });
    }

    /**
     * 应用歌词样式
     */
    applyLyricsStyles() {
        // 设置容器高度
        if (this.textDisplayElement) {
            this.textDisplayElement.style.setProperty('--lyrics-height',
                `${this.config.visibleLines * this.config.lineHeight}px`);
        }

        // 动态设置行高
        const style = document.createElement('style');
        style.textContent = `
            .lyrics-line {
                min-height: ${this.config.lineHeight}px;
            }

            .lyrics-lines-container {
                transition: transform ${this.config.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
        `;

        // 移除旧样式
        const existingStyle = document.getElementById('lyrics-dynamic-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        style.id = 'lyrics-dynamic-styles';
        document.head.appendChild(style);
    }

    /**
     * 加载并解析文本内容
     */
    loadText(text) {
        console.log('LyricsTextManager: 开始加载文本，长度:', text ? text.length : 0);

        // 如果没有文本，显示测试内容
        if (!text || text.trim().length === 0) {
            console.warn('文本为空，显示测试内容');
            this.showTestContent();
            return;
        }

        this.currentText = text;
        this.parseTextToLines();

        // 确保渲染完成并重置到开头
        setTimeout(() => {
            this.renderLyrics();
            this.resetPosition(); // 确保从头开始显示
            console.log('LyricsTextManager: 文本加载和渲染完成，行数:', this.lines.length);
            console.log('文本已重置到开头位置');
        }, 100);
    }

    /**
     * 显示测试内容
     */
    showTestContent() {
        console.log('显示测试内容...');

        if (!this.linesContainer) {
            console.error('linesContainer 不存在，无法显示测试内容');
            return;
        }

        // 创建测试文本
        const testText = '佛说阿弥陀经如是我聞一时佛在舍卫国祇树给孤独园与大比丘僧千二百五十人俱皆是大阿罗汉众所知识';

        // 直接设置测试内容
        this.linesContainer.innerHTML = `
            <div class="lyrics-line current">佛说阿弥陀经如是我聞一时佛在舍卫国</div>
            <div class="lyrics-line next">祇树给孤独园与大比丘僧千二百五十人俱</div>
            <div class="lyrics-line">皆是大阿罗汉众所知识长老舍利弗摩诃目</div>
        `;

        console.log('测试内容显示完成');
    }

    /**
     * 将文本解析为行和字符（按原始行结构分行）
     */
    parseTextToLines() {
        if (!this.currentText) {
            this.lines = [];
            this.characters = [];
            return;
        }

        console.log('开始解析佛经文本...');

        // 按原始行结构分割，但移除每行的标点符号
        const originalLines = this.currentText
            .replace(/\r\n/g, '\n')  // 统一换行符
            .replace(/\r/g, '\n')    // 统一换行符
            .split('\n')             // 按行分割
            .map(line => line.trim()) // 清理每行的空白
            .filter(line => line.length > 0) // 移除空行
            .map(line => line.replace(/[。！？；：，、""''（）【】《》]/g, '')) // 移除每行的标点符号
            .filter(line => line.length > 0); // 移除清理后为空的行

        console.log(`原始行数: ${originalLines.length}`);

        if (originalLines.length === 0) {
            console.warn('清理后没有有效行');
            this.lines = [];
            this.characters = [];
            return;
        }

        this.lines = [];
        this.characters = [];
        let charIndex = 0;

        originalLines.forEach(lineText => {
            const lineChars = [];

            for (let i = 0; i < lineText.length; i++) {
                const char = lineText[i];
                const charData = {
                    char: char,
                    index: charIndex,
                    lineIndex: this.lines.length,
                    positionInLine: lineChars.length,
                    isPunctuation: false, // 已移除标点符号，都是文字
                    isSpace: false        // 已移除空格，都是文字
                };

                lineChars.push(charData);
                this.characters.push(charData);
                charIndex++;
            }

            this.lines.push({
                text: lineText,
                characters: lineChars,
                startCharIndex: lineChars[0]?.index || 0,
                endCharIndex: lineChars[lineChars.length - 1]?.index || 0
            });
        });

        console.log(`佛经文本解析完成: ${this.lines.length} 行, ${this.characters.length} 个字符`);
        console.log('前5行预览:', this.lines.slice(0, 5).map(line => line.text));
    }

    /**
     * 智能分行（现在按原始行结构分行，不需要此方法）
     */
    smartLineBreak(text) {
        // 此方法现在不再使用，因为我们按原始行结构分行
        console.log('smartLineBreak 方法已废弃，使用原始行结构');
        return [text];
    }

    /**
     * 基于标点符号的分行
     */
    punctuationBasedLineBreak(text, maxLength) {
        const lines = [];

        // 按句号等强分割符分割
        const sentences = text.split(/([。！？])/);
        let currentLine = '';

        console.log(`标点分行: 分割后句子数量=${sentences.length}`);

        for (let i = 0; i < sentences.length; i += 2) {
            const sentence = sentences[i] || '';
            const punctuation = sentences[i + 1] || '';
            const fullSentence = sentence + punctuation;

            // 如果当前行加上新句子不超过最大长度
            if (currentLine.length + fullSentence.length <= maxLength) {
                currentLine += fullSentence;
            } else {
                // 如果当前行不为空，先保存
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }

                // 如果单个句子太长，需要强制分割
                if (fullSentence.length > maxLength) {
                    const chunks = this.forceBreakLongSentence(fullSentence, maxLength);
                    lines.push(...chunks);
                    currentLine = '';
                } else {
                    currentLine = fullSentence;
                }
            }
        }

        // 处理最后一行
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        console.log(`标点分行完成: ${lines.length} 行`);
        return lines.length > 0 ? lines : [text];
    }

    /**
     * 强制分割过长的句子
     */
    forceBreakLongSentence(sentence, maxLength) {
        const chunks = [];
        for (let i = 0; i < sentence.length; i += maxLength) {
            chunks.push(sentence.substring(i, i + maxLength));
        }
        return chunks;
    }

    /**
     * 固定长度分行（适用于佛经无标点文本）
     */
    fixedLengthLineBreak(text, maxLength) {
        const lines = [];

        for (let i = 0; i < text.length; i += maxLength) {
            const line = text.substring(i, i + maxLength);
            if (line.trim()) {
                lines.push(line);
            }
        }

        console.log(`固定长度分行: ${text.length}字符 → ${lines.length}行，每行${maxLength}字符`);
        return lines.length > 0 ? lines : [text];
    }

    /**
     * 检查是否为标点符号（佛经文本通常无标点）
     */
    isPunctuation(char) {
        // 佛经文本通常不包含标点符号，但保留检测功能以防万一
        return /[，。！？；：""''（）【】《》、]/.test(char);
    }

    /**
     * 渲染歌词显示
     */
    renderLyrics() {
        console.log('开始渲染歌词，行数:', this.lines.length);

        // 确保容器存在
        if (!this.textDisplayElement) {
            console.error('textDisplayElement 不存在');
            return;
        }

        // 如果容器结构不存在，重新初始化
        if (!this.linesContainer) {
            console.log('linesContainer 不存在，重新初始化');
            this.initializeLyricsDisplay();
        }

        if (this.lines.length === 0) {
            console.warn('没有文本行可以渲染');
            if (this.linesContainer) {
                this.linesContainer.innerHTML = '<div class="lyrics-line">请选择经典或输入自定义文本开始阅读</div>';
            }
            return;
        }

        // 添加测试信息
        console.log('准备渲染的行数据:', this.lines.slice(0, 2));

        // 清空并重新渲染
        this.linesContainer.innerHTML = '';

        this.lines.forEach((line, lineIndex) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'lyrics-line';
            lineElement.dataset.lineIndex = lineIndex;

            // 创建字符元素
            line.characters.forEach(charData => {
                const charElement = document.createElement('span');
                charElement.className = 'lyrics-character';
                charElement.textContent = charData.char;
                charElement.dataset.charIndex = charData.index;

                if (charData.isPunctuation) {
                    charElement.classList.add('punctuation');
                }
                if (charData.isSpace) {
                    charElement.classList.add('space');
                }

                lineElement.appendChild(charElement);
            });

            this.linesContainer.appendChild(lineElement);
        });

        console.log('歌词渲染完成，DOM元素数量:', this.linesContainer.children.length);
        console.log('容器HTML:', this.textDisplayElement.innerHTML.substring(0, 200) + '...');

        this.applyCurrentFontSize();
        this.updateLineStates();
    }

    /**
     * 高亮当前字符
     */
    highlightCharacter(charIndex) {
        if (!this.isHighlightEnabled || charIndex < 0 || charIndex >= this.characters.length) {
            return;
        }

        // 清除之前的高亮
        this.clearHighlight();

        const charData = this.characters[charIndex];
        const newLineIndex = charData.lineIndex;

        // 更新当前位置
        this.currentCharIndex = charIndex;
        
        // 如果换行了，滚动到新行
        if (newLineIndex !== this.currentLineIndex) {
            this.currentLineIndex = newLineIndex;
            this.scrollToCurrentLine();
        }

        // 高亮当前字符
        const charElement = this.textDisplayElement.querySelector(`[data-char-index="${charIndex}"]`);
        if (charElement) {
            charElement.classList.add('highlighted');
        }

        // 标记已完成的字符
        for (let i = 0; i < charIndex; i++) {
            const completedElement = this.textDisplayElement.querySelector(`[data-char-index="${i}"]`);
            if (completedElement) {
                completedElement.classList.add('completed');
                completedElement.classList.remove('highlighted');
            }
        }

        this.updateLineStates();
    }

    /**
     * 滚动到当前行
     */
    scrollToCurrentLine() {
        if (!this.linesContainer) return;

        const targetPosition = this.currentLineIndex - this.config.currentLinePosition;
        const scrollOffset = Math.max(0, targetPosition) * this.config.lineHeight;

        this.linesContainer.style.transform = `translateY(-${scrollOffset}px)`;

        console.log(`滚动到行 ${this.currentLineIndex}, 偏移: ${scrollOffset}px`);
    }

    /**
     * 更新行状态
     */
    updateLineStates() {
        const lines = this.textDisplayElement.querySelectorAll('.lyrics-line');

        lines.forEach((lineElement, index) => {
            lineElement.classList.remove('current', 'next', 'prev');

            if (index === this.currentLineIndex) {
                lineElement.classList.add('current');
            } else if (index === this.currentLineIndex + 1) {
                lineElement.classList.add('next');
            } else if (index === this.currentLineIndex - 1) {
                lineElement.classList.add('prev');
            }
        });
    }

    /**
     * 清除高亮
     */
    clearHighlight() {
        const highlightedElements = this.textDisplayElement.querySelectorAll('.highlighted');
        highlightedElements.forEach(element => {
            element.classList.remove('highlighted');
        });
    }

    /**
     * 重置位置
     */
    resetPosition() {
        console.log('开始重置位置...');

        this.currentCharIndex = 0;
        this.currentLineIndex = 0;
        this.clearHighlight();

        // 清除所有完成状态
        const completedElements = this.textDisplayElement.querySelectorAll('.completed');
        completedElements.forEach(element => {
            element.classList.remove('completed');
        });

        // 强制重置滚动位置到最顶部
        if (this.linesContainer) {
            this.linesContainer.style.transform = 'translateY(0px)';
            this.linesContainer.style.transition = 'none'; // 暂时禁用动画
            console.log('滚动位置已重置到顶部');
        }

        // 先更新行状态，但不触发滚动
        this.updateLineStatesOnly();

        // 延迟一点再次确保位置正确，并恢复动画
        setTimeout(() => {
            if (this.linesContainer) {
                this.linesContainer.style.transform = 'translateY(0px)';
                this.linesContainer.style.transition = ''; // 恢复动画
                console.log('二次确认滚动位置重置');
            }
        }, 50);

        console.log('位置重置完成，当前行:', this.currentLineIndex, '当前字符:', this.currentCharIndex);
    }

    /**
     * 只更新行状态，不触发滚动
     */
    updateLineStatesOnly() {
        const lines = this.textDisplayElement.querySelectorAll('.lyrics-line');

        lines.forEach((lineElement, index) => {
            lineElement.classList.remove('current', 'next', 'prev');

            if (index === this.currentLineIndex) {
                lineElement.classList.add('current');
            } else if (index === this.currentLineIndex + 1) {
                lineElement.classList.add('next');
            } else if (index === this.currentLineIndex - 1) {
                lineElement.classList.add('prev');
            }
        });
    }

    /**
     * 设置字体大小
     */
    setFontSize(size) {
        if (this.fontSizeMap[size]) {
            // 移除旧的字体类
            Object.values(this.fontSizeMap).forEach(className => {
                this.textDisplayElement.classList.remove(className);
            });

            // 添加新的字体类
            this.textDisplayElement.classList.add(this.fontSizeMap[size]);
            this.fontSize = size;

            // 重新计算配置以适应新的字体大小
            this.config = this.getResponsiveConfig();
            this.applyLyricsStyles();

            // 重新滚动到当前位置以适应新的行高
            if (this.lines.length > 0) {
                this.scrollToCurrentLine();
            }

            console.log(`字体大小设置为: ${this.fontSizeMap[size]}, 新行高: ${this.config.lineHeight}px`);
        }
    }

    /**
     * 应用当前字体大小
     */
    applyCurrentFontSize() {
        if (this.fontSize && this.fontSizeMap[this.fontSize]) {
            this.textDisplayElement.classList.add(this.fontSizeMap[this.fontSize]);
        }
    }

    /**
     * 更新字体大小（兼容性方法）
     */
    updateFontSize() {
        this.applyCurrentFontSize();
    }

    /**
     * 获取当前字符
     */
    getCurrentCharacter() {
        return this.currentCharIndex >= 0 && this.currentCharIndex < this.characters.length 
            ? this.characters[this.currentCharIndex] 
            : null;
    }

    /**
     * 获取文本统计信息
     */
    getTextStats() {
        return {
            totalCharacters: this.characters.length,
            totalLines: this.lines.length,
            currentCharIndex: this.currentCharIndex,
            currentLineIndex: this.currentLineIndex,
            progress: this.characters.length === 0 ? 0 : (this.currentCharIndex / (this.characters.length - 1)) * 100,
            hasText: this.characters.length > 0
        };
    }

    /**
     * 清空内容
     */
    clear() {
        this.currentText = '';
        this.lines = [];
        this.characters = [];
        this.currentCharIndex = 0;
        this.currentLineIndex = 0;
        
        if (this.linesContainer) {
            this.linesContainer.innerHTML = '';
        }
    }

    /**
     * 设置高亮启用状态
     */
    setHighlightEnabled(enabled) {
        this.isHighlightEnabled = enabled;
        if (!enabled) {
            this.clearHighlight();
        }
    }

    /**
     * 跳转到指定位置
     */
    jumpToPosition(charIndex) {
        if (charIndex >= 0 && charIndex < this.characters.length) {
            this.highlightCharacter(charIndex);
        }
    }

    /**
     * 根据进度设置位置
     */
    setProgressPosition(percentage) {
        const targetIndex = Math.floor((percentage / 100) * (this.characters.length - 1));
        this.jumpToPosition(targetIndex);
    }

    /**
     * 强制重新渲染
     */
    forceRender() {
        console.log('强制重新渲染文本');

        // 重新初始化容器
        this.initializeLyricsDisplay();

        // 如果有文本，重新渲染
        if (this.lines.length > 0) {
            this.renderLyrics();
            this.updateLineStates();
        }
    }
}
