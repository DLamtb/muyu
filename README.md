# 佛经诵读应用

一个现代化的Web应用，用于佛经诵读学习，支持音频同步、文本高亮和离线使用。

## ✨ 功能特性

- 🎵 **音频同步诵读** - 木鱼和颂钵声音配合文字高亮
- 📖 **智能文本显示** - 自动滚动和字符级高亮
- ⚙️ **个性化设置** - 播放速度、字体大小可调节
- 📱 **响应式设计** - 完美适配手机、平板和桌面
- 🔄 **离线支持** - PWA技术，支持离线使用
- 💾 **自动保存** - 设置和进度自动保存
- 🎧 **音频导出** - 支持导出诵读音频
- 📝 **自定义文本** - 支持输入自定义经文

## 🚀 快速开始

### 在线使用

访问 [https://buddhist-sutra-reader.pages.dev](https://buddhist-sutra-reader.pages.dev) 即可开始使用。

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd buddhist-sutra-reader
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **构建生产版本**
   ```bash
   pnpm build
   ```

## 📁 项目结构

```
buddhist-sutra-reader/
├── src/                          # 源代码目录
│   ├── assets/                   # 静态资源
│   │   ├── audio/               # 音频文件
│   │   └── styles/              # 样式文件
│   ├── data/                    # 数据文件
│   │   └── sutras/              # 经书文本
│   ├── modules/                 # JavaScript模块
│   │   ├── AudioEngine.js       # 音频播放引擎
│   │   ├── TextManager.js       # 文本管理器
│   │   ├── UIController.js      # UI控制器
│   │   ├── StorageManager.js    # 存储管理器
│   │   ├── ExportManager.js     # 导出管理器
│   │   └── ...                  # 其他模块
│   ├── index.html               # 主页面
│   └── main.js                  # 应用入口
├── public/                      # 公共资源
│   ├── manifest.json            # PWA清单
│   ├── sw.js                    # Service Worker
│   └── icons/                   # 应用图标
├── scripts/                     # 构建脚本
├── vite.config.js              # Vite配置
├── package.json                # 项目配置
└── README.md                   # 项目说明
```

## 🛠️ 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **构建工具**: Vite
- **样式**: CSS3 (苹果风格设计)
- **音频处理**: Web Audio API
- **存储**: localStorage
- **PWA**: Service Worker + Web App Manifest
- **部署**: Cloudflare Pages

## 📱 PWA支持

本应用支持PWA（渐进式Web应用）功能：

- ✅ 可安装到设备主屏幕
- ✅ 离线使用支持
- ✅ 后台同步
- ✅ 推送通知（预留）
- ✅ 响应式设计

### 安装到设备

1. 在支持的浏览器中访问应用
2. 点击地址栏的"安装"按钮
3. 或通过浏览器菜单选择"添加到主屏幕"

## 🎯 使用指南

### 基本操作

1. **选择经典**: 从下拉菜单选择要诵读的经典
2. **调整设置**: 设置播放速度和字体大小
3. **开始诵读**: 点击播放按钮开始音频同步诵读
4. **进度控制**: 点击进度条跳转到指定位置

### 高级功能

- **自定义文本**: 选择"自定义文本"输入任意经文
- **音频导出**: 点击"导出MP3"录制完整诵读音频
- **键盘快捷键**: 
  - 空格键: 播放/暂停
  - Esc键: 重置
  - Ctrl+R: 重置

### 移动端优化

- 触摸友好的界面设计
- 横屏模式自动布局调整
- 手势操作支持
- 电池优化

## 🔧 配置说明

### 音频配置

音频文件位于 `src/assets/audio/` 目录：
- `muyu.wav` - 木鱼声音
- `bowl.wav` - 颂钵声音

### 经书配置

经书数据位于 `src/data/sutras/` 目录：
- `index.json` - 经书索引配置
- `*.txt` - 经书文本文件

添加新经书：
1. 在 `sutras` 目录添加文本文件
2. 更新 `index.json` 配置
3. 重新构建应用

## 🚀 部署指南

### Cloudflare Pages部署

1. **准备代码**
   ```bash
   pnpm build
   ```

2. **连接Git仓库**
   - 登录Cloudflare Dashboard
   - 进入Pages页面
   - 点击"创建项目"
   - 连接Git仓库

3. **配置构建设置**
   - Framework preset: `Vite`
   - 构建命令: `pnpm build`
   - 构建输出目录: `dist`
   - Root directory: `/` (默认)
   - Node.js版本: `20`
   - 环境变量:
     - `NODE_VERSION=20`
     - `PNPM_VERSION=latest`

4. **部署完成**
   - 自动部署完成后获得访问链接
   - 支持自定义域名

### 其他部署平台

- **Vercel**: 支持零配置部署
- **Netlify**: 拖拽dist目录即可部署
- **GitHub Pages**: 需要配置GitHub Actions

## 🔍 性能优化

### 已实现的优化

- ✅ 代码分割和懒加载
- ✅ 资源压缩和缓存
- ✅ 图片和音频优化
- ✅ Service Worker缓存
- ✅ 虚拟滚动（大文本）
- ✅ 防抖和节流
- ✅ 内存管理

### 性能指标

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## 🐛 问题排查

### 常见问题

1. **音频无法播放**
   - 检查浏览器是否支持Web Audio API
   - 确认用户已进行交互（点击播放按钮）

2. **文本显示异常**
   - 检查经书文件格式是否正确
   - 确认网络连接正常

3. **离线功能不工作**
   - 检查Service Worker是否正确注册
   - 清除浏览器缓存后重试

### 调试模式

在浏览器控制台中访问 `window.app` 获取应用实例进行调试。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发流程

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 代码规范

- 使用ES6+语法
- 遵循现有代码风格
- 添加必要的注释
- 确保功能完整测试

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交GitHub Issue
- 发送邮件至项目维护者

---

**愿此应用能帮助更多人学习和诵读佛经，获得内心的平静与智慧。** 🙏