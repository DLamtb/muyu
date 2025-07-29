/**
 * 经书数据加载器
 * 负责加载经书列表和内容
 */
import sutrasData from '../data/sutras/index.js';

export class SutraLoader {
    constructor() {
        this.sutrasIndex = null;
        this.loadedSutras = new Map();
    }

    /**
     * 加载经书索引
     */
    async loadSutrasIndex() {
        try {
            console.log('开始加载经书索引...');
            console.log('sutrasData:', sutrasData);
            console.log('sutrasData.index:', sutrasData.index);
            console.log('sutrasData.content:', sutrasData.content);

            this.sutrasIndex = sutrasData.index;
            console.log('经书索引加载成功:', this.sutrasIndex);
            return this.sutrasIndex;
        } catch (error) {
            console.error('加载经书索引失败:', error);
            throw error;
        }
    }

    /**
     * 获取经书列表
     */
    getSutrasList() {
        if (!this.sutrasIndex) {
            throw new Error('经书索引未加载，请先调用 loadSutrasIndex()');
        }
        return this.sutrasIndex.sutras;
    }

    /**
     * 根据ID获取经书信息
     */
    getSutraInfo(sutraId) {
        if (!this.sutrasIndex) {
            throw new Error('经书索引未加载，请先调用 loadSutrasIndex()');
        }
        return this.sutrasIndex.sutras.find(sutra => sutra.id === sutraId);
    }

    /**
     * 加载经书内容
     */
    async loadSutraContent(sutraId) {
        // 检查缓存
        if (this.loadedSutras.has(sutraId)) {
            return this.loadedSutras.get(sutraId);
        }

        const sutraInfo = this.getSutraInfo(sutraId);
        if (!sutraInfo) {
            throw new Error(`未找到经书: ${sutraId}`);
        }

        try {
            console.log(`开始加载经书内容: ${sutraId}`);
            console.log('可用的经书内容:', Object.keys(sutrasData.content));

            let content = sutrasData.content[sutraId];
            console.log(`经书 ${sutraId} 的原始内容:`, content ? content.substring(0, 100) + '...' : 'null');

            // 如果内容为空，尝试备用加载方法
            if (!content) {
                console.warn(`经书内容为空，尝试备用加载方法: ${sutraId}`);
                content = await this.loadSutraContentFallback(sutraId);
            }

            if (!content) {
                throw new Error(`经书内容未找到: ${sutraId}`);
            }

            // 缓存内容
            this.loadedSutras.set(sutraId, {
                info: sutraInfo,
                content: content.trim()
            });

            console.log(`经书内容加载成功: ${sutraInfo.title}, 内容长度: ${content.length}`);
            return this.loadedSutras.get(sutraId);
        } catch (error) {
            console.error(`加载经书内容失败 (${sutraId}):`, error);
            throw error;
        }
    }

    /**
     * 备用经书内容加载方法
     */
    async loadSutraContentFallback(sutraId) {
        try {
            console.log(`尝试备用方法加载经书: ${sutraId}`);

            // 如果是阿弥陀经，返回硬编码的内容作为备用
            if (sutraId === 'amitabha') {
                const fallbackContent = `佛說阿彌陀經如是我聞一時佛在舍衛國祇樹給孤獨園與大比丘僧千二百五十人俱皆是大阿羅漢眾所知識長老舍利弗摩訶目犍連摩訶迦葉摩訶迦栴延摩訶拘絺羅離婆多周梨槃陀迦難陀阿難陀羅睺羅憍梵波提賓頭盧頗羅墮迦留陀夷摩訶劫賓那薄俱羅阿㝹樓馱如是等諸大弟子并諸菩薩摩訶薩文殊師利法王子阿逸多菩薩乾陀訶提菩薩常精進菩薩與如是等諸大菩薩及釋提桓因等無量諸天大眾俱爾時佛告長老舍利弗從是西方過十萬億佛土有世界名曰極樂其土有佛號阿彌陀今現在說法舍利弗彼土何故名為極樂其國眾生無有眾苦但受諸樂故名極樂`;
                console.log('使用备用阿弥陀经内容');
                return fallbackContent;
            }

            // 其他经书可以在这里添加
            return null;
        } catch (error) {
            console.error('备用加载方法失败:', error);
            return null;
        }
    }

    /**
     * 获取分类列表
     */
    getCategories() {
        if (!this.sutrasIndex) {
            throw new Error('经书索引未加载，请先调用 loadSutrasIndex()');
        }
        return this.sutrasIndex.categories;
    }

    /**
     * 根据分类获取经书
     */
    getSutrasByCategory(categoryId) {
        if (!this.sutrasIndex) {
            throw new Error('经书索引未加载，请先调用 loadSutrasIndex()');
        }
        
        const category = this.sutrasIndex.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return [];
        }

        return this.sutrasIndex.sutras.filter(sutra => sutra.category === category.name);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.loadedSutras.clear();
    }

    /**
     * 预加载所有经书内容
     */
    async preloadAllSutras() {
        if (!this.sutrasIndex) {
            await this.loadSutrasIndex();
        }

        const loadPromises = this.sutrasIndex.sutras.map(sutra => 
            this.loadSutraContent(sutra.id).catch(error => {
                console.warn(`预加载经书失败 (${sutra.id}):`, error);
                return null;
            })
        );

        const results = await Promise.all(loadPromises);
        const successCount = results.filter(result => result !== null).length;
        
        console.log(`预加载完成: ${successCount}/${this.sutrasIndex.sutras.length} 部经书`);
        return successCount;
    }
}