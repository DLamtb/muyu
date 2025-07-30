/**
 * 压缩音频文件大小但保持时长和音质
 * 使用更高效的编码方式
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
 * 生成木鱼声音 - 保持原有时长但优化文件大小
 */
function generateMuyuSound() {
    // 使用较低的采样率但保持音质
    const sampleRate = 22050; // 降低采样率到22.05kHz（仍然高于人耳需要的频率）
    const duration = 0.5; // 保持原有的较长时长
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 木鱼的真实声学特性 - 完全保持
        const envelope = Math.exp(-t * 12) * (1 - Math.exp(-t * 100));
        
        // 主要频率成分
        const fundamental = 800; // 基频
        const harmonic2 = 1600;  // 二次谐波
        const harmonic3 = 2400;  // 三次谐波
        const harmonic4 = 3200;  // 四次谐波
        
        // 频率调制（木鱼敲击时的微小频率变化）
        const freqMod = 1 + 0.05 * Math.sin(t * 80) * Math.exp(-t * 20);
        
        // 混合多个频率成分
        let sample = 0;
        sample += 0.4 * Math.sin(2 * Math.PI * fundamental * freqMod * t);
        sample += 0.25 * Math.sin(2 * Math.PI * harmonic2 * freqMod * t);
        sample += 0.15 * Math.sin(2 * Math.PI * harmonic3 * freqMod * t);
        sample += 0.1 * Math.sin(2 * Math.PI * harmonic4 * freqMod * t);
        
        // 木质共鸣（低频成分）
        sample += 0.1 * Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 8);
        
        // 轻微的噪音成分（敲击时的空气扰动）
        const noise = (Math.random() - 0.5) * 0.02 * Math.exp(-t * 15);
        sample += noise;
        
        // 应用包络并转换为16位整数
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 20000));
    }
    
    return { samples, sampleRate };
}

/**
 * 生成颂钵声音 - 保持原有时长但优化文件大小
 */
function generateBowlSound() {
    // 使用较低的采样率但保持音质
    const sampleRate = 22050; // 降低采样率
    const duration = 1.2; // 保持原有的较长时长，让余韵充分展现
    const numSamples = Math.floor(sampleRate * duration);
    
    const samples = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        
        // 颂钵的声学特性 - 完全保持
        const envelope = Math.exp(-t * 2.5) * (1 - Math.exp(-t * 10));
        
        // 颂钵的复杂频率结构
        const fundamental = 400;   // 基频
        const harmonic2 = 800;     // 二次谐波
        const harmonic3 = 1200;    // 三次谐波
        const harmonic4 = 1600;    // 四次谐波
        const harmonic5 = 2000;    // 五次谐波
        
        // 颂钵特有的拍频效果
        const beatFreq = 3; // 拍频
        const beatMod = 1 + 0.1 * Math.sin(2 * Math.PI * beatFreq * t);
        
        // 频率微调（颂钵的非线性振动）
        const freqMod = 1 + 0.02 * Math.sin(t * 5) * Math.exp(-t * 1);
        
        // 混合多个频率成分
        let sample = 0;
        sample += 0.3 * Math.sin(2 * Math.PI * fundamental * freqMod * t) * beatMod;
        sample += 0.25 * Math.sin(2 * Math.PI * harmonic2 * freqMod * t);
        sample += 0.2 * Math.sin(2 * Math.PI * harmonic3 * freqMod * t);
        sample += 0.15 * Math.sin(2 * Math.PI * harmonic4 * freqMod * t);
        sample += 0.1 * Math.sin(2 * Math.PI * harmonic5 * freqMod * t);
        
        // 金属共鸣的高频成分
        sample += 0.05 * Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t * 5);
        sample += 0.03 * Math.sin(2 * Math.PI * 4800 * t) * Math.exp(-t * 8);
        
        // 空间混响效果
        const reverb = 0.02 * Math.sin(2 * Math.PI * fundamental * 0.5 * t) * Math.exp(-t * 1);
        sample += reverb;
        
        // 应用包络并转换为16位整数
        samples[i] = Math.max(-32767, Math.min(32767, sample * envelope * 15000));
    }
    
    return { samples, sampleRate };
}

/**
 * 创建WAV文件
 */
function createWavFile(samples, sampleRate, filename) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = samples.length * 2;
    
    const header = createWavHeader(sampleRate, numChannels, bitsPerSample, dataSize);
    const data = new Uint8Array(samples.buffer);
    
    const wavFile = new Uint8Array(header.length + data.length);
    wavFile.set(header, 0);
    wavFile.set(data, header.length);
    
    fs.writeFileSync(filename, wavFile);
    console.log(`创建压缩音频文件: ${filename} (${(wavFile.length / 1024).toFixed(1)} KB)`);
    
    return wavFile.length;
}

/**
 * 主函数
 */
function main() {
    console.log('开始创建文件大小优化的音频文件...');
    console.log('优化策略:');
    console.log('- 保持原有时长和音质特性');
    console.log('- 降低采样率到22.05kHz（仍然高质量）');
    console.log('- 保持16bit深度');
    console.log('- 单声道减少文件大小');
    console.log('');
    
    const audioDir = 'src/assets/audio';
    
    // 确保目录存在
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // 生成木鱼声音
    console.log('生成木鱼声音（保持0.5秒时长）...');
    const { samples: muyuSamples, sampleRate: muyuSampleRate } = generateMuyuSound();
    const muyuSize = createWavFile(muyuSamples, muyuSampleRate, path.join(audioDir, 'muyu-compressed.wav'));
    
    // 生成颂钵声音
    console.log('生成颂钵声音（保持1.2秒时长）...');
    const { samples: bowlSamples, sampleRate: bowlSampleRate } = generateBowlSound();
    const bowlSize = createWavFile(bowlSamples, bowlSampleRate, path.join(audioDir, 'bowl-compressed.wav'));
    
    console.log('\n文件大小优化完成！');
    console.log('');
    console.log('音频特性:');
    console.log('- 木鱼: 0.5秒时长，保持完整敲击感和余韵');
    console.log('- 颂钵: 1.2秒时长，保持完整的钟声和混响');
    console.log('- 采样率: 22.05kHz（CD质量的一半，但对人耳足够）');
    console.log('- 位深度: 16bit（CD标准）');
    console.log('- 声道: 单声道（减少50%文件大小）');
    console.log('');
    console.log('文件大小:');
    console.log(`- 木鱼: ${(muyuSize / 1024).toFixed(1)} KB`);
    console.log(`- 颂钵: ${(bowlSize / 1024).toFixed(1)} KB`);
    console.log(`- 总计: ${((muyuSize + bowlSize) / 1024).toFixed(1)} KB`);
    
    // 计算压缩比（假设原文件大小）
    const originalMuyuSize = 203.5; // KB
    const originalBowlSize = 1636.6; // KB
    const newMuyuSize = muyuSize / 1024;
    const newBowlSize = bowlSize / 1024;
    
    console.log('');
    console.log('压缩效果:');
    console.log(`- 木鱼: ${originalMuyuSize} KB → ${newMuyuSize.toFixed(1)} KB (减少 ${(100 - (newMuyuSize / originalMuyuSize * 100)).toFixed(1)}%)`);
    console.log(`- 颂钵: ${originalBowlSize} KB → ${newBowlSize.toFixed(1)} KB (减少 ${(100 - (newBowlSize / originalBowlSize * 100)).toFixed(1)}%)`);
}

main();
