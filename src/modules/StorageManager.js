/**
 * 本地存储管理器
 * 负责用户设置和播放进度的持久化存储
 */
export class StorageManager {
    constructor() {
        this.storagePrefix = 'buddhist-sutra-reader-';
        this.storageKeys = {
            settings: 'settings',
            progress: 'progress',
            customTexts: 'custom-texts',
            preferences: 'preferences'
        };
        
        // 检查localStorage可用性
        this.isStorageAvailable = this.checkStorageAvailability();
        
        console.log('StorageManager 初始化完成', {
            available: this.isStorageAvailable
        });

        // 监听页面卸载事件，清理缓存
        this.setupCacheCleanup();
    }

    /**
     * 设置缓存清理
     */
    setupCacheCleanup() {
        // 页面加载时清理缓存（刷新时）
        window.addEventListener('load', () => {
            this.clearCache();
            console.log('页面加载时清理缓存');
        });

        // 页面卸载时清理缓存
        window.addEventListener('beforeunload', () => {
            this.clearCache();
        });

        // 页面隐藏时清理缓存
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.clearCache();
            }
        });

        // 页面刷新时清理缓存
        window.addEventListener('pagehide', () => {
            this.clearCache();
        });

        // 立即清理一次缓存
        this.clearCache();
    }

    /**
     * 清理缓存
     */
    clearCache() {
        try {
            console.log('开始清理缓存...');

            // 清理应用缓存
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    console.log('找到缓存:', cacheNames);
                    cacheNames.forEach(cacheName => {
                        caches.delete(cacheName);
                        console.log('删除缓存:', cacheName);
                    });
                });
            }

            // 清理Service Worker缓存
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.update();
                        console.log('更新Service Worker');
                    });
                });
            }

            // 清理浏览器缓存（强制刷新）
            if (window.location.search.indexOf('nocache') === -1) {
                // 添加nocache参数强制刷新
                const url = new URL(window.location);
                url.searchParams.set('nocache', Date.now());
                console.log('准备强制刷新:', url.toString());
            }

            console.log('缓存清理完成');
        } catch (error) {
            console.warn('缓存清理失败:', error);
        }
    }

    /**
     * 强制刷新页面（清理所有缓存）
     */
    forceRefresh() {
        console.log('强制刷新页面...');

        // 清理所有缓存
        this.clearCache();

        // 添加时间戳参数强制刷新
        const url = new URL(window.location);
        url.searchParams.set('t', Date.now());
        window.location.href = url.toString();
    }

    /**
     * 检查localStorage可用性
     */
    checkStorageAvailability() {
        try {
            const testKey = this.storagePrefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage 不可用:', error);
            return false;
        }
    }

    /**
     * 获取完整的存储键名
     */
    getStorageKey(key) {
        return this.storagePrefix + key;
    }

    /**
     * 保存数据到localStorage
     */
    saveData(key, data) {
        if (!this.isStorageAvailable) {
            console.warn('存储不可用，无法保存数据');
            return false;
        }

        try {
            const storageKey = this.getStorageKey(key);
            const jsonData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: '1.0'
            });
            
            localStorage.setItem(storageKey, jsonData);
            console.log(`数据已保存: ${key}`);
            return true;
        } catch (error) {
            console.error(`保存数据失败 (${key}):`, error);
            return false;
        }
    }

    /**
     * 从localStorage加载数据
     */
    loadData(key, defaultValue = null) {
        if (!this.isStorageAvailable) {
            console.warn('存储不可用，返回默认值');
            return defaultValue;
        }

        try {
            const storageKey = this.getStorageKey(key);
            const jsonData = localStorage.getItem(storageKey);
            
            if (!jsonData) {
                return defaultValue;
            }

            const parsedData = JSON.parse(jsonData);
            
            // 验证数据结构
            if (parsedData && typeof parsedData === 'object' && 'data' in parsedData) {
                console.log(`数据已加载: ${key}`);
                return parsedData.data;
            } else {
                console.warn(`数据格式无效 (${key})，返回默认值`);
                return defaultValue;
            }
        } catch (error) {
            console.error(`加载数据失败 (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * 删除存储的数据
     */
    removeData(key) {
        if (!this.isStorageAvailable) {
            console.warn('存储不可用，无法删除数据');
            return false;
        }

        try {
            const storageKey = this.getStorageKey(key);
            localStorage.removeItem(storageKey);
            console.log(`数据已删除: ${key}`);
            return true;
        } catch (error) {
            console.error(`删除数据失败 (${key}):`, error);
            return false;
        }
    }

    /**
     * 保存用户设置
     */
    saveSettings(settings) {
        const settingsData = {
            playbackSpeed: settings.playbackSpeed || 1.0,
            fontSize: settings.fontSize || 2,
            selectedSutra: settings.selectedSutra || 'amitabha',
            customText: settings.customText || '',
            lastUpdated: Date.now()
        };

        return this.saveData(this.storageKeys.settings, settingsData);
    }

    /**
     * 加载用户设置
     */
    loadSettings() {
        const defaultSettings = {
            playbackSpeed: 1.0,
            fontSize: 2,
            selectedSutra: 'amitabha',
            customText: ''
        };

        return this.loadData(this.storageKeys.settings, defaultSettings);
    }

    /**
     * 保存播放进度
     */
    saveProgress(sutraId, progress) {
        if (!sutraId) {
            console.warn('无效的经书ID，无法保存进度');
            return false;
        }

        const progressData = this.loadData(this.storageKeys.progress, {});
        
        progressData[sutraId] = {
            percentage: progress.percentage || 0,
            characterIndex: progress.characterIndex || 0,
            timestamp: Date.now()
        };

        return this.saveData(this.storageKeys.progress, progressData);
    }

    /**
     * 加载播放进度
     */
    loadProgress(sutraId) {
        if (!sutraId) {
            return null;
        }

        const progressData = this.loadData(this.storageKeys.progress, {});
        return progressData[sutraId] || null;
    }

    /**
     * 清除播放进度
     */
    clearProgress(sutraId) {
        if (!sutraId) {
            return false;
        }

        const progressData = this.loadData(this.storageKeys.progress, {});
        
        if (progressData[sutraId]) {
            delete progressData[sutraId];
            return this.saveData(this.storageKeys.progress, progressData);
        }

        return true;
    }

    /**
     * 保存自定义文本
     */
    saveCustomText(textId, textData) {
        const customTexts = this.loadData(this.storageKeys.customTexts, {});
        
        customTexts[textId] = {
            content: textData.content || '',
            title: textData.title || '自定义文本',
            createdAt: textData.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        return this.saveData(this.storageKeys.customTexts, customTexts);
    }

    /**
     * 加载自定义文本
     */
    loadCustomText(textId) {
        const customTexts = this.loadData(this.storageKeys.customTexts, {});
        return customTexts[textId] || null;
    }

    /**
     * 获取所有自定义文本
     */
    getAllCustomTexts() {
        return this.loadData(this.storageKeys.customTexts, {});
    }

    /**
     * 删除自定义文本
     */
    deleteCustomText(textId) {
        const customTexts = this.loadData(this.storageKeys.customTexts, {});
        
        if (customTexts[textId]) {
            delete customTexts[textId];
            return this.saveData(this.storageKeys.customTexts, customTexts);
        }

        return true;
    }

    /**
     * 保存用户偏好设置
     */
    savePreferences(preferences) {
        const preferencesData = {
            autoSave: preferences.autoSave !== false, // 默认开启
            showProgress: preferences.showProgress !== false, // 默认显示
            enableKeyboardShortcuts: preferences.enableKeyboardShortcuts !== false, // 默认开启
            theme: preferences.theme || 'auto',
            lastUpdated: Date.now()
        };

        return this.saveData(this.storageKeys.preferences, preferencesData);
    }

    /**
     * 加载用户偏好设置
     */
    loadPreferences() {
        const defaultPreferences = {
            autoSave: true,
            showProgress: true,
            enableKeyboardShortcuts: true,
            theme: 'auto'
        };

        return this.loadData(this.storageKeys.preferences, defaultPreferences);
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        if (!this.isStorageAvailable) {
            return null;
        }

        try {
            let totalSize = 0;
            const usage = {};

            // 计算各个键的存储大小
            Object.values(this.storageKeys).forEach(key => {
                const storageKey = this.getStorageKey(key);
                const data = localStorage.getItem(storageKey);
                const size = data ? new Blob([data]).size : 0;
                usage[key] = size;
                totalSize += size;
            });

            return {
                total: totalSize,
                breakdown: usage,
                available: this.isStorageAvailable
            };
        } catch (error) {
            console.error('获取存储使用情况失败:', error);
            return null;
        }
    }

    /**
     * 清除所有存储数据
     */
    clearAllData() {
        if (!this.isStorageAvailable) {
            console.warn('存储不可用，无法清除数据');
            return false;
        }

        try {
            Object.values(this.storageKeys).forEach(key => {
                this.removeData(key);
            });

            console.log('所有存储数据已清除');
            return true;
        } catch (error) {
            console.error('清除存储数据失败:', error);
            return false;
        }
    }

    /**
     * 导出所有数据
     */
    exportAllData() {
        const exportData = {
            settings: this.loadSettings(),
            progress: this.loadData(this.storageKeys.progress, {}),
            customTexts: this.getAllCustomTexts(),
            preferences: this.loadPreferences(),
            exportedAt: Date.now(),
            version: '1.0'
        };

        return exportData;
    }

    /**
     * 导入数据
     */
    importData(importData) {
        if (!importData || typeof importData !== 'object') {
            console.error('无效的导入数据');
            return false;
        }

        try {
            let successCount = 0;

            // 导入设置
            if (importData.settings) {
                if (this.saveSettings(importData.settings)) {
                    successCount++;
                }
            }

            // 导入进度
            if (importData.progress) {
                if (this.saveData(this.storageKeys.progress, importData.progress)) {
                    successCount++;
                }
            }

            // 导入自定义文本
            if (importData.customTexts) {
                if (this.saveData(this.storageKeys.customTexts, importData.customTexts)) {
                    successCount++;
                }
            }

            // 导入偏好设置
            if (importData.preferences) {
                if (this.savePreferences(importData.preferences)) {
                    successCount++;
                }
            }

            console.log(`数据导入完成: ${successCount} 个项目`);
            return successCount > 0;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 数据迁移（用于版本升级）
     */
    migrateData(fromVersion, toVersion) {
        console.log(`数据迁移: ${fromVersion} -> ${toVersion}`);
        
        // 这里可以添加版本迁移逻辑
        // 目前只是占位符
        
        return true;
    }
}