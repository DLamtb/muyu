// 经书数据资源导入
// 这个文件确保经书数据被Vite正确处理和打包

import indexData from './index.json';
import amitabhaText from './amitabha.txt?raw';

// 调试信息
console.log('经书数据导入调试:');
console.log('indexData:', indexData);
console.log('amitabhaText 长度:', amitabhaText ? amitabhaText.length : 'null');
console.log('amitabhaText 前100字符:', amitabhaText ? amitabhaText.substring(0, 100) : 'null');

export const sutrasIndex = indexData;

export const sutrasContent = {
    'amitabha': amitabhaText
};

export default {
    index: sutrasIndex,
    content: sutrasContent
};
