/**
 * 创建优化的音频文件
 * 这个脚本会创建更小、更适合移动端的音频文件
 */

import fs from 'fs';
import path from 'path';

// 音频数据 - 使用更短的音频样本
const audioData = {
    // 木鱼声音 - 短促清脆的敲击声
    muyu: {
        // 44.1kHz, 16bit, mono, 0.2秒
        duration: 0.2,
        frequency: 800, // 主频率
        type: 'percussion'
    },
    
    // 颂钵声音 - 短促的钟声
    bowl: {
        // 44.1kHz, 16bit, mono, 0.5秒
        duration: 0.5,
        frequency: 400, // 主频率
        type: 'bell'
    }
};

/**
 * 生成简单的WAV文件头
 */
function createWavHeader(sampleRate, numChannels, bitsPerSample, dataSize) {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // Byte rate
    view.setUint16(32, numChannels * bitsPerSample / 8, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // Data size
    
    return new Uint8Array(buffer);
}

/**
 * 生成木鱼声音
 */
function generateMuyuSound() {
    const sampleRate = 22050; // 降低采样率以减小文件大小
    const duration = 0.15; // 更短的持续时间
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 15); // 快速衰减
        
        // 混合多个频率创造木鱼声
        const freq1 = 800 * (1 + 0.1 * Math.sin(t * 50)); // 主频率带颤音
        const freq2 = 1600; // 高频谐波
        const noise = (Math.random() - 0.5) * 0.1; // 少量噪音
        
        const sample = envelope * (
            0.7 * Math.sin(2 * Math.PI * freq1 * t) +
            0.3 * Math.sin(2 * Math.PI * freq2 * t) +
            noise
        );
        
        samples[i] = Math.max(-32767, Math.min(32767, sample * 16000));
    }
    
    return samples;
}

/**
 * 生成颂钵声音
 */
function generateBowlSound() {
    const sampleRate = 22050; // 降低采样率
    const duration = 0.4; // 更短的持续时间
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 3); // 较慢衰减
        
        // 混合多个频率创造钟声
        const freq1 = 400; // 基频
        const freq2 = 800; // 二次谐波
        const freq3 = 1200; // 三次谐波
        
        const sample = envelope * (
            0.5 * Math.sin(2 * Math.PI * freq1 * t) +
            0.3 * Math.sin(2 * Math.PI * freq2 * t) +
            0.2 * Math.sin(2 * Math.PI * freq3 * t)
        );
        
        samples[i] = Math.max(-32767, Math.min(32767, sample * 12000));
    }
    
    return samples;
}

/**
 * 创建WAV文件
 */
function createWavFile(samples, filename) {
    const sampleRate = 22050;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = samples.length * 2;
    
    const header = createWavHeader(sampleRate, numChannels, bitsPerSample, dataSize);
    const data = new Uint8Array(samples.buffer);
    
    const wavFile = new Uint8Array(header.length + data.length);
    wavFile.set(header, 0);
    wavFile.set(data, header.length);
    
    fs.writeFileSync(filename, wavFile);
    console.log(`创建音频文件: ${filename} (${(wavFile.length / 1024).toFixed(1)} KB)`);
}

/**
 * 主函数
 */
function main() {
    console.log('开始创建优化的音频文件...');
    
    const audioDir = 'src/assets/audio';
    
    // 确保目录存在
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // 生成木鱼声音
    const muyuSamples = generateMuyuSound();
    createWavFile(muyuSamples, path.join(audioDir, 'muyu-optimized.wav'));
    
    // 生成颂钵声音
    const bowlSamples = generateBowlSound();
    createWavFile(bowlSamples, path.join(audioDir, 'bowl-optimized.wav'));
    
    console.log('优化音频文件创建完成！');
    console.log('文件大小对比:');
    
    // 显示文件大小对比
    const files = ['muyu.wav', 'bowl.wav', 'muyu-optimized.wav', 'bowl-optimized.wav'];
    files.forEach(file => {
        const filePath = path.join(audioDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`  ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
        }
    });
}

main();
