#!/usr/bin/env node

/**
 * 资源优化脚本
 * 用于构建后的资源优化和压缩
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

console.log('开始优化构建资源...');

// 检查dist目录是否存在
if (!fs.existsSync(distDir)) {
    console.error('构建目录不存在，请先运行 npm run build');
    process.exit(1);
}

// 优化HTML文件
function optimizeHtmlFiles() {
    console.log('优化HTML文件...');
    
    const htmlFiles = findFiles(distDir, '.html');
    
    htmlFiles.forEach(filePath => {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 移除多余的空白字符
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/>\s+</g, '><');
        
        // 添加预加载提示
        if (content.includes('<head>')) {
            const preloadHints = `
                <link rel="dns-prefetch" href="//fonts.googleapis.com">
                <link rel="preconnect" href="//fonts.gstatic.com" crossorigin>
            `;
            content = content.replace('<head>', '<head>' + preloadHints);
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`优化完成: ${path.relative(distDir, filePath)}`);
    });
}

// 优化CSS文件
function optimizeCssFiles() {
    console.log('优化CSS文件...');
    
    const cssFiles = findFiles(distDir, '.css');
    
    cssFiles.forEach(filePath => {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 移除注释和多余空白
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/;\s*}/g, '}');
        content = content.replace(/{\s*/g, '{');
        content = content.replace(/;\s*/g, ';');
        
        fs.writeFileSync(filePath, content);
        console.log(`优化完成: ${path.relative(distDir, filePath)}`);
    });
}

// 生成资源清单
function generateAssetManifest() {
    console.log('生成资源清单...');
    
    const manifest = {
        version: process.env.npm_package_version || '1.0.0',
        buildTime: new Date().toISOString(),
        assets: {}
    };
    
    // 收集所有资源文件
    const allFiles = findAllFiles(distDir);
    
    allFiles.forEach(filePath => {
        const relativePath = path.relative(distDir, filePath);
        const stats = fs.statSync(filePath);
        
        manifest.assets[relativePath] = {
            size: stats.size,
            modified: stats.mtime.toISOString()
        };
    });
    
    // 写入清单文件
    const manifestPath = path.join(distDir, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('资源清单生成完成: asset-manifest.json');
}

// 创建.nojekyll文件（GitHub Pages需要）
function createNoJekyllFile() {
    const nojekyllPath = path.join(distDir, '.nojekyll');
    fs.writeFileSync(nojekyllPath, '');
    console.log('创建.nojekyll文件');
}

// 复制重要文件到根目录
function copyImportantFiles() {
    console.log('复制重要文件...');
    
    const filesToCopy = [
        { src: '../_headers', dest: '_headers' },
        { src: '../README.md', dest: 'README.md' }
    ];
    
    filesToCopy.forEach(({ src, dest }) => {
        const srcPath = path.resolve(__dirname, src);
        const destPath = path.join(distDir, dest);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`复制完成: ${dest}`);
        }
    });
}

// 生成构建报告
function generateBuildReport() {
    console.log('生成构建报告...');
    
    const report = {
        buildTime: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        files: {},
        totalSize: 0
    };
    
    const allFiles = findAllFiles(distDir);
    
    allFiles.forEach(filePath => {
        const relativePath = path.relative(distDir, filePath);
        const stats = fs.statSync(filePath);
        const ext = path.extname(filePath);
        
        if (!report.files[ext]) {
            report.files[ext] = { count: 0, size: 0 };
        }
        
        report.files[ext].count++;
        report.files[ext].size += stats.size;
        report.totalSize += stats.size;
    });
    
    // 转换大小为可读格式
    Object.keys(report.files).forEach(ext => {
        report.files[ext].sizeFormatted = formatBytes(report.files[ext].size);
    });
    report.totalSizeFormatted = formatBytes(report.totalSize);
    
    // 写入报告文件
    const reportPath = path.join(distDir, 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('构建报告生成完成: build-report.json');
    console.log(`总文件大小: ${report.totalSizeFormatted}`);
    
    // 显示文件类型统计
    console.log('\n文件类型统计:');
    Object.entries(report.files).forEach(([ext, info]) => {
        console.log(`  ${ext || '无扩展名'}: ${info.count} 个文件, ${info.sizeFormatted}`);
    });
}

// 工具函数：查找指定扩展名的文件
function findFiles(dir, extension) {
    const files = [];
    
    function walk(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
            const itemPath = path.join(currentDir, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                walk(itemPath);
            } else if (path.extname(item) === extension) {
                files.push(itemPath);
            }
        });
    }
    
    walk(dir);
    return files;
}

// 工具函数：查找所有文件
function findAllFiles(dir) {
    const files = [];
    
    function walk(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
            const itemPath = path.join(currentDir, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                walk(itemPath);
            } else {
                files.push(itemPath);
            }
        });
    }
    
    walk(dir);
    return files;
}

// 工具函数：格式化字节大小
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 主执行函数
async function main() {
    try {
        optimizeHtmlFiles();
        optimizeCssFiles();
        generateAssetManifest();
        createNoJekyllFile();
        copyImportantFiles();
        generateBuildReport();
        
        console.log('\n✅ 资源优化完成！');
        console.log(`📁 构建目录: ${distDir}`);
        console.log('🚀 现在可以部署到Cloudflare Pages了');
        
    } catch (error) {
        console.error('❌ 资源优化失败:', error);
        process.exit(1);
    }
}

// 运行脚本
main();