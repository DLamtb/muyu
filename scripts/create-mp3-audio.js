/**
 * 创建MP3格式的音频文件
 * 使用Web Audio API生成高质量但小文件的音频
 */

import fs from 'fs';
import path from 'path';

/**
 * 生成WAV文件（临时用于转换）
 */
function createWavFile(samples, sampleRate = 44100) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = samples.length * 2;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);
    
    // Audio data
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(44 + i * 2, samples[i], true);
    }
    
    return new Uint8Array(buffer);
}

/**
 * 生成优化的木鱼声音 - 保持原有特色但减小文件
 */
function generateOptimizedMuyuSound() {
    const sampleRate = 44100;
    const duration = 0.25; // 稍微缩短但保持自然
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 保持木鱼的真实声学特性
        const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 120));
        
        // 木鱼的主要频率成分
        const f1 = 800;  // 基频
        const f2 = 1600; // 二次谐波
        const f3 = 2400; // 三次谐波
        
        // 频率调制
        const freqMod = 1 + 0.03 * Math.sin(t * 60) * Math.exp(-t * 25);
        
        // 混合频率
        let sample = 0;
        sample += 0.5 * Math.sin(2 * Math.PI * f1 * freqMod * t);
        sample += 0.3 * Math.sin(2 * Math.PI * f2 * freqMod * t);
        sample += 0.2 * Math.sin(2 * Math.PI * f3 * freqMod * t);
        
        // 木质共鸣
        sample += 0.15 * Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 10);
        
        // 轻微噪音
        const noise = (Math.random() - 0.5) * 0.015 * Math.exp(-t * 20);
        sample += noise;
        
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 18000));
    }
    
    return samples;
}

/**
 * 生成优化的颂钵声音 - 保持原有特色但减小文件
 */
function generateOptimizedBowlSound() {
    const sampleRate = 44100;
    const duration = 0.6; // 稍微缩短但保持韵味
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 颂钵的声学特性
        const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 12));
        
        // 颂钵的频率结构
        const f1 = 400;  // 基频
        const f2 = 800;  // 二次谐波
        const f3 = 1200; // 三次谐波
        const f4 = 1600; // 四次谐波
        
        // 拍频效果
        const beatMod = 1 + 0.08 * Math.sin(2 * Math.PI * 2.5 * t);
        
        // 频率微调
        const freqMod = 1 + 0.015 * Math.sin(t * 4) * Math.exp(-t * 1.5);
        
        // 混合频率
        let sample = 0;
        sample += 0.35 * Math.sin(2 * Math.PI * f1 * freqMod * t) * beatMod;
        sample += 0.28 * Math.sin(2 * Math.PI * f2 * freqMod * t);
        sample += 0.22 * Math.sin(2 * Math.PI * f3 * freqMod * t);
        sample += 0.15 * Math.sin(2 * Math.PI * f4 * freqMod * t);
        
        // 金属共鸣
        sample += 0.08 * Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t * 6);
        
        // 混响
        const reverb = 0.03 * Math.sin(2 * Math.PI * f1 * 0.5 * t) * Math.exp(-t * 1.2);
        sample += reverb;
        
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 16000));
    }
    
    return samples;
}

/**
 * 主函数
 */
function main() {
    console.log('开始创建优化的高质量音频文件...');
    
    const audioDir = 'src/assets/audio';
    
    // 确保目录存在
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // 生成木鱼声音
    console.log('生成木鱼声音...');
    const muyuSamples = generateOptimizedMuyuSound();
    const muyuWav = createWavFile(muyuSamples);
    fs.writeFileSync(path.join(audioDir, 'muyu-hq.wav'), muyuWav);
    
    // 生成颂钵声音
    console.log('生成颂钵声音...');
    const bowlSamples = generateOptimizedBowlSound();
    const bowlWav = createWavFile(bowlSamples);
    fs.writeFileSync(path.join(audioDir, 'bowl-hq.wav'), bowlWav);
    
    console.log('优化音频文件创建完成！');
    
    // 显示文件大小
    const files = ['muyu-hq.wav', 'bowl-hq.wav'];
    console.log('文件大小:');
    files.forEach(file => {
        const filePath = path.join(audioDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`  ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
        }
    });
    
    console.log('\n音频特性:');
    console.log('- 保持44.1kHz采样率确保高质量');
    console.log('- 优化时长减少文件大小');
    console.log('- 保留真实木鱼和颂钵的声学特性');
    console.log('- 适合移动端播放的文件大小');
}

main();
