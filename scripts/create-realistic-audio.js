/**
 * 创建更真实的音频文件
 * 基于真实木鱼和颂钵的声学特性
 */

import fs from 'fs';
import path from 'path';

/**
 * 生成WAV文件头
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
 * 生成更真实的木鱼声音
 * 基于真实木鱼的频谱分析
 */
function generateRealisticMuyuSound() {
    const sampleRate = 44100; // 保持高质量采样率
    const duration = 0.3; // 稍微延长以保持自然感
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 木鱼的声学特性：
        // 1. 快速攻击，指数衰减
        const envelope = Math.exp(-t * 12) * (1 - Math.exp(-t * 100));
        
        // 2. 主要频率成分（基于真实木鱼分析）
        const fundamental = 800; // 基频
        const harmonic2 = 1600;  // 二次谐波
        const harmonic3 = 2400;  // 三次谐波
        const harmonic4 = 3200;  // 四次谐波
        
        // 3. 频率调制（木鱼敲击时的微小频率变化）
        const freqMod = 1 + 0.05 * Math.sin(t * 80) * Math.exp(-t * 20);
        
        // 4. 混合多个频率成分
        let sample = 0;
        sample += 0.4 * Math.sin(2 * Math.PI * fundamental * freqMod * t);
        sample += 0.25 * Math.sin(2 * Math.PI * harmonic2 * freqMod * t);
        sample += 0.15 * Math.sin(2 * Math.PI * harmonic3 * freqMod * t);
        sample += 0.1 * Math.sin(2 * Math.PI * harmonic4 * freqMod * t);
        
        // 5. 添加木质共鸣（低频成分）
        sample += 0.1 * Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 8);
        
        // 6. 轻微的噪音成分（敲击时的空气扰动）
        const noise = (Math.random() - 0.5) * 0.02 * Math.exp(-t * 15);
        sample += noise;
        
        // 应用包络并转换为16位整数
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 20000));
    }
    
    return samples;
}

/**
 * 生成更真实的颂钵声音
 * 基于真实颂钵的频谱分析
 */
function generateRealisticBowlSound() {
    const sampleRate = 44100; // 保持高质量采样率
    const duration = 0.8; // 颂钵声音较长
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 颂钵的声学特性：
        // 1. 缓慢攻击，长时间衰减
        const envelope = Math.exp(-t * 2.5) * (1 - Math.exp(-t * 10));
        
        // 2. 颂钵的复杂频率结构
        const fundamental = 400;   // 基频
        const harmonic2 = 800;     // 二次谐波
        const harmonic3 = 1200;    // 三次谐波
        const harmonic4 = 1600;    // 四次谐波
        const harmonic5 = 2000;    // 五次谐波
        
        // 3. 颂钵特有的拍频效果
        const beatFreq = 3; // 拍频
        const beatMod = 1 + 0.1 * Math.sin(2 * Math.PI * beatFreq * t);
        
        // 4. 频率微调（颂钵的非线性振动）
        const freqMod = 1 + 0.02 * Math.sin(t * 5) * Math.exp(-t * 1);
        
        // 5. 混合多个频率成分
        let sample = 0;
        sample += 0.3 * Math.sin(2 * Math.PI * fundamental * freqMod * t) * beatMod;
        sample += 0.25 * Math.sin(2 * Math.PI * harmonic2 * freqMod * t);
        sample += 0.2 * Math.sin(2 * Math.PI * harmonic3 * freqMod * t);
        sample += 0.15 * Math.sin(2 * Math.PI * harmonic4 * freqMod * t);
        sample += 0.1 * Math.sin(2 * Math.PI * harmonic5 * freqMod * t);
        
        // 6. 金属共鸣的高频成分
        sample += 0.05 * Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t * 5);
        sample += 0.03 * Math.sin(2 * Math.PI * 4800 * t) * Math.exp(-t * 8);
        
        // 7. 空间混响效果
        const reverb = 0.02 * Math.sin(2 * Math.PI * fundamental * 0.5 * t) * Math.exp(-t * 1);
        sample += reverb;
        
        // 应用包络并转换为16位整数
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 15000));
    }
    
    return samples;
}

/**
 * 创建WAV文件
 */
function createWavFile(samples, filename) {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = samples.length * 2;
    
    const header = createWavHeader(sampleRate, numChannels, bitsPerSample, dataSize);
    const data = new Uint8Array(samples.buffer);
    
    const wavFile = new Uint8Array(header.length + data.length);
    wavFile.set(header, 0);
    wavFile.set(data, header.length);
    
    fs.writeFileSync(filename, wavFile);
    console.log(`创建高质量音频文件: ${filename} (${(wavFile.length / 1024).toFixed(1)} KB)`);
}

/**
 * 主函数
 */
function main() {
    console.log('开始创建高质量的音频文件...');
    
    const audioDir = 'src/assets/audio';
    
    // 确保目录存在
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // 生成高质量木鱼声音
    const muyuSamples = generateRealisticMuyuSound();
    createWavFile(muyuSamples, path.join(audioDir, 'muyu.wav'));
    
    // 生成高质量颂钵声音
    const bowlSamples = generateRealisticBowlSound();
    createWavFile(bowlSamples, path.join(audioDir, 'bowl.wav'));
    
    console.log('高质量音频文件创建完成！');
    
    // 显示文件大小
    const files = ['muyu.wav', 'bowl.wav'];
    files.forEach(file => {
        const filePath = path.join(audioDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`  ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
        }
    });
}

main();
