import SparkMD5 from 'spark-md5';
import pdfIcon from './img/pdf.png';
import crdIcon from './img/crd.png';
import dwgIcon from './img/dwg.png';
import audioIcon from './img/audio.png';
import videoIcon from './img/video.png';
import pptIcon from './img/ppt.png';
import wordIcon from './img/word.png';
import xlsIcon from './img/xls.png';
import otherIcon from './img/other.png';

export const fileType = {
    图片: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    文档: ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.ppt', '.pptx', '.dwg'],
    文件: ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.ppt', '.pptx', '.dwg'],
    音频: ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.wma', '.ape', '.midi', '.ra'],
    视频: ['.mp4', '.avi', '.wmv', '.mov', '.mkv', '.mpeg', '.webm', 'video/*'],
};
/**
 * 识别文件格式，根据文件名称后缀返回对应的图标类名，除图片外
 * pdf、crd、dwg、audio、video、ppt、word、xls、其他、
 * @param {string} name - 文件名
 * @returns {string} - 图标类名（例如："pdf-icon"）
 */
export function getFileIconClass(name: string): string {
    console.log('name', name);
    // 获取文件名称后缀，并转换为小写
    const fileName = name?.split('.').pop()?.toLowerCase();
    console.log('fileName', fileName);

    // word格式包含，
    if (fileName === 'docx' || fileName === 'doc') {
        return 'word-icon';
    } else if (fileName === 'xls' || fileName === 'xlsx') {
        return 'excel-icon';
    } else if (fileName === 'ppt' || fileName === 'pptx') {
        return 'ppt-icon';
    } else if (fileName === 'pdf') {
        return 'pdf-icon';
    } else if (fileName === 'dwg') {
        return 'dwg-icon';
    } else if (fileName === 'crd') {
        return 'crd-icon';
    } else if (
        fileName === 'mp3' ||
        fileName === 'wav' ||
        fileName === 'aac' ||
        fileName === 'flac' ||
        fileName === 'm4a' ||
        fileName === 'wma' ||
        fileName === 'ape' ||
        fileName === 'midi' ||
        fileName === 'ra'
    ) {
        return 'audio-icon';
    } else if (
        fileName === 'mp4' ||
        fileName === 'avi' ||
        fileName === 'wmv' ||
        fileName === 'mov' ||
        fileName === 'mkv' ||
        fileName === 'mpeg'
    ) {
        return 'video-icon';
    } else {
        return 'other-icon';
    }
}
/**
 * 识别文件格式，根据文件名称后缀返回对应的图标类名，除图片外
 * pdf、crd、dwg、audio、video、ppt、word、xls、其他、
 * @param {string} name - 文件名
 * @param {string} url - 文件url
 * @returns {string} - 图标类名（例如："pdf-icon"）
 */
export function getFileIconName(name: string, url: string): string {
    // 获取文件名称后缀，并转换为小写
    if (!name) return otherIcon;
    const fileName = name.split('.').pop()?.toLowerCase();
    if (!fileName) return otherIcon;
    // word格式包含，
    if (fileName === 'docx' || fileName === 'doc') {
        return wordIcon;
    } else if (fileName === 'xls' || fileName === 'xlsx') {
        return xlsIcon;
    } else if (fileName === 'ppt' || fileName === 'pptx') {
        return pptIcon;
    } else if (fileName === 'pdf') {
        return pdfIcon;
    } else if (fileName === 'dwg') {
        return dwgIcon;
    } else if (fileName === 'crd') {
        return crdIcon;
    } else if (
        fileName === 'mp3' ||
        fileName === 'wav' ||
        fileName === 'aac' ||
        fileName === 'flac' ||
        fileName === 'm4a' ||
        fileName === 'wma' ||
        fileName === 'ape' ||
        fileName === 'midi' ||
        fileName === 'ra'
    ) {
        return audioIcon;
    } else if (
        fileName === 'mp4' ||
        fileName === 'avi' ||
        fileName === 'wmv' ||
        fileName === 'mov' ||
        fileName === 'mkv' ||
        fileName === 'mpeg'
    ) {
        return videoIcon;
    } else {
        return otherIcon;
    }
}
/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} - 格式化后的文件大小（例如：123.45 KB）
 */
export function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化时间
 * @param {string} dateTimeStr - 时间字符串（例如：2023-08-15T12:34:56）
 * @returns {string} - 格式化后的时间字符串（例如：2023-08-15 12:34:56）
 */
export function formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
}

/**
 * 计算文件的 MD5 值（每个文件都需要执行）
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - 文件的 MD5 值
 */
export async function calculateFileMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunkSize = 2097152; // 每次读取 2MB
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();
        let currentChunk = 0;
        const chunks = Math.ceil(file.size / chunkSize);

        fileReader.onload = function (e) {
            spark.append(e.target?.result as ArrayBuffer); // 将读取的数据添加到 spark
            currentChunk++;

            if (currentChunk < chunks) {
                // 继续读取下一块
                loadNext();
            } else {
                // 完成所有块的读取，生成最终的 MD5
                const md5 = spark.end();
                resolve(md5);
            }
        };

        fileReader.onerror = function (e) {
            reject(new Error('文件读取失败'));
        };

        function loadNext() {
            const start = currentChunk * chunkSize;
            const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
            const chunk = file.slice(start, end);
            fileReader.readAsArrayBuffer(chunk);
        }

        loadNext(); // 开始读取第一块
    });
}

/**
 * 通过视频地址，获取视频的第一帧作为封面
 * @param {string} videoUrl - 视频地址
 * @returns {Promise<string>} - 视频的第一帧 Base64 编码
 */
export async function getVideoCover(videoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const coverBase64 = canvas.toDataURL('image/jpeg');
                resolve(coverBase64);
            } else {
                reject(new Error('无法创建画布上下文'));
            }
        });
        video.addEventListener('error', (e) => {
            reject(new Error('视频封面获取失败'));
        });
    });
}
/**
 * 下载大文件
 * @param {string} url - 文件下载地址
 * @param {string} filename - 下载后的文件名
 * @param {function} onProgress - 下载进度回调函数
 */
export function downloadLargeFile(url: string, filename: string, onProgress?: (percent: number) => void): void {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`下载进度: ${percent}%`);
            if (typeof onProgress === 'function') onProgress(percent);
        }
    });
    xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response instanceof Blob ? xhr.response : new Blob([xhr.response]);
            const a = document.createElement('a');
            const href = URL.createObjectURL(blob);
            a.href = href;
            a.download = filename || '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(href); // 释放内存
        } else {
            console.error('下载失败', xhr.status, xhr.statusText);
        }
    });

    xhr.addEventListener('error', () => {
        console.error('下载发生错误');
    });

    // 发送请求
    xhr.send();
}
