<template>
    <div :key="flag" :class="{
        'custom-file-upload': true,
        'app-custom-file-upload': isapp,
        'app-size-custom-file-upload': isAppSize,
    }">
        <!-- 缩略图网格布局 -->
        <div class="thumbnail-list">
            <div :class="{
                'file-item': true,
                'fail-item': file.status === 'fail',
                'app-file-item': isAppSize,
                no_border: isVideo(file),
            }" v-for="file in fileList" :key="file.identifier || file.fileId">
                <template v-if="(file.status === 'success' || !file.status || onlyShow) && isImage(file)">
                    <n-image class="file-image" :object-fit="objectFit" :src="file[fileUrl]"> </n-image>
                </template>
                <!-- 其他文件格式 -->
                <div class="other-file" v-if="(file.status === 'success' || !file.status || onlyShow) && !isImage(file)"
                    @click="isapp ? handleFileDownload(file) : () => { }">
                    <i v-if="!printMode" :class="['icon', getClassName(file)]"></i>
                    <img class="icon" v-else :src="getFileIcon(file)" alt="" />
                    <div class="text text-ellipsis-2" :title="file[fileName]">{{ file[fileName] }}</div>
                </div>
                <!-- 上传失败 -->
                <div class="other-file" v-if="file.status === 'fail'">
                    <i class="icon fail-icon"></i>
                </div>
                <!-- 校验服务器是否存在当前文件 -->
                <div class="flex loading-flex" v-if="file.status === 'loading'">
                    <n-icon size="14">
                        <ReloadSharpIcon />
                    </n-icon>
                    <span class="text">校验中...</span>
                </div>
                <div class="upload-loading" v-if="file.status === 'uploading'">
                    <div class="close-box">
                        <n-icon size="14" @click.stop="handleFileDelete(file)">
                            <CloseSharpIcon />
                        </n-icon>
                    </div>
                    <n-progress type="circle" :style="{
                        width: `${!isAppSize ? 96 : 68}px`,
                    }" :percentage="uploadProgress[file.identifier]?.progress" :color="'var(--c6)'"
                        :stroke-width="!isAppSize ? 6 : 3" :show-text="true"></n-progress>
                </div>
                <template v-if="!isapp && !onlyShow">
                    <!-- 文件操作按钮 -->
                    <div v-if="file.status === 'success' || !file.status || onlyShow" class="file-actions">
                        <template v-if="isImage(file)">
                            <n-tooltip trigger="hover" placement="top-start">
                                <template #trigger>
                                    <n-icon size="16" @click.stop="handleFileView(file)">
                                        <EyeSharpIcon />
                                    </n-icon>
                                </template>
                                <span>查看</span>
                            </n-tooltip>
                        </template>
                        <template v-if="isVideo(file)">
                            <n-tooltip trigger="hover" placement="top-start">
                                <template #trigger>
                                    <n-icon size="16" @click.stop="handleVideoPlay(file)">
                                        <CaretForwardCircleOutlineIcon />
                                    </n-icon>
                                </template>
                                <span>播放</span>
                            </n-tooltip>
                        </template>
                        <n-tooltip trigger="hover" placement="top-start">
                            <template #trigger>
                                <n-icon size="16" @click.stop="downloadFile(file)">
                                    <DownloadOutlineIcon />
                                </n-icon>
                            </template>
                            <span>下载</span>
                        </n-tooltip>
                        <n-tooltip trigger="hover" placement="top-start">
                            <template #trigger>
                                <n-icon size="16" @click.stop="handleFileDelete(file)">
                                    <CloseCircleOutlineIcon />
                                </n-icon>
                            </template>
                            <span>删除</span>
                        </n-tooltip>
                    </div>
                    <div v-if="file.status === 'fail'" class="file-actions">
                        <n-tooltip trigger="hover" placement="top-start">
                            <template #trigger>
                                <n-icon size="16" @click.stop="handleFileUpload(file.file)">
                                    <CloudUploadOutlineIcon />
                                </n-icon>
                            </template>
                            <span>重新上传</span>
                        </n-tooltip>
                        <n-tooltip trigger="hover" placement="top-start">
                            <template #trigger>
                                <n-icon size="16" @click.stop="handleFileDelete(file)">
                                    <CloseCircleOutlineIcon />
                                </n-icon>
                            </template>
                            <span>删除</span>
                        </n-tooltip>
                    </div>
                </template>
                <!-- 纯展示 -->
                <template v-if="!isapp && onlyShow">
                    <!-- 文件操作按钮 -->
                    <div class="file-actions">
                        <template v-if="isImage(file)">
                            <n-tooltip trigger="hover" placement="top-start">
                                <template #trigger>
                                    <n-icon size="16" @click.stop="handleFileView(file)">
                                        <EyeSharpIcon />
                                    </n-icon>
                                </template>
                                <span>查看</span>
                            </n-tooltip>
                        </template>
                        <template v-if="isVideo(file)">
                            <n-tooltip trigger="hover" placement="top-start">
                                <template #trigger>
                                    <n-icon size="16" @click.stop="handleVideoPlay(file)">
                                        <CaretForwardCircleOutlineIcon />
                                    </n-icon>
                                </template>
                                <span>播放</span>
                            </n-tooltip>
                        </template>
                        <n-tooltip trigger="hover" placement="top-start">
                            <template #trigger>
                                <n-icon size="16" @click.stop="downloadFile(file)">
                                    <DownloadOutlineIcon />
                                </n-icon>
                            </template>
                            <span>下载</span>
                        </n-tooltip>
                    </div>
                </template>
                <template v-if="isapp && !onlyShow">
                    <div class="close-box" v-if="file.status !== 'loading' && file.status !== 'uploading'">
                        <n-icon size="16" @click.stop="handleFileDelete(file)">
                            <CloseCircleOutlineIcon />
                        </n-icon>
                    </div>
                    <div v-if="file.status === 'fail'" class="file-actions app-file-actions app-fail-actions">
                        <n-icon size="16" @click.stop="handleFileUpload(file.file)">
                            <CloudUploadOutlineIcon />
                        </n-icon>
                        <div class="text">上传失败</div>
                    </div>
                </template>
            </div>
            <!-- 上传按钮缩略图 -->
            <div class="upload-thumbnail" @click="triggerFileInput" v-if="fileList.length < limit && !onlyShow">
            </div>
            <!-- forceAppSize 模式下显示限制条件提示图标，由 showRestrictionTip 控制是否显示 -->
            <n-tooltip v-if="props.forceAppSize && props.showRestrictionTip && !onlyShow && fileList.length < limit" trigger="hover"
                placement="top">
                <template #trigger>
                    <div class="upload-tip-icon">
                        <n-icon size="16" color="#999999">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        </n-icon>
                    </div>
                </template>
                <div class="tip-content">
                    <div>支持上传{{ displayFileTypeText }}</div>
                    <div v-if="props.fileSize">单文件最大不超过{{ fileLimitText }}</div>
                    <div v-if="props.limit && props.limit != Infinity">最多可上传{{ props.limit }}个文件</div>
                </div>
            </n-tooltip>
        </div>

        <input v-if="onlyCamera" ref="fileInput" type="file" :id="flag + '_environment'" style="display: none"
            capture="environment" :accept="getUploadType" :multiple="multiple && !onlyCamera" @change="handleFileSelect" />
        <input v-else :id="flag" ref="fileInput" type="file" style="display: none" :accept="getUploadType"
            :multiple="multiple && !onlyCamera" @change="handleFileSelect" />
        <p v-if="showTips && !onlyShow && !props.forceAppSize" class="tips">
            <span v-if="displayFileTypeText">支持上传{{ displayFileTypeText }},</span>
            <span v-if="props.fileSize">单文件最大不超过{{ fileSize }}</span>
            <span v-if="props.limit && props.limit != Infinity">，最多可上传{{ limit }}个文件</span>
        </p>
        <!-- 移动端点击附件展示的选项 -->
        <ActionSheet v-model:show="appFileshow" :actions="actions(selectedFile)" @select="onSelect" :cancel-text="'取消'"
            @close="closeActionSheet" :close-on-click-action="true">
        </ActionSheet>
        <videoPlay :url="videoUrl" v-model:show="showVideo"></videoPlay>
        <n-image-group v-model:show="showRef" v-model:current="currentImageIndex" :src-list="imageList || []" />
    </div>
</template>

<script setup lang="ts">
import { isApp } from '@/utils';
import { calculateFileMD5, getFileIconClass, fileType, downloadLargeFile, getFileIconName } from './index';
import { checkFileExists, uploadSmallFileApi, uploadLargeFileApi, mergeFileChunksApi, deleteFileApi } from '@/api/upload';
import {
    Add as AddIcon,
    CloseCircleOutline as CloseCircleOutlineIcon,
    EyeSharp as EyeSharpIcon,
    DownloadOutline as DownloadOutlineIcon,
    CloudUploadOutline as CloudUploadOutlineIcon,
    CloseSharp as CloseSharpIcon,
    ReloadSharp as ReloadSharpIcon,
    CaretForwardCircleOutline as CaretForwardCircleOutlineIcon,
    AlertCircleOutline as AlertCircleOutlineIcon,
} from '@vicons/ionicons5';
import { ActionSheet } from 'vant';
import videoPlay from './videoPlay.vue';
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { NImage, NProgress, NTooltip, NIcon, useDialog, NImageGroup } from 'naive-ui';
const NDialog = useDialog();
// 定义组件属性
interface Props {
    // 支持的文件类型，如果传入了fileType，则不生效
    accept?: string | string[];
    // 绑定值
    modelValue: any[];
    // 私有文件类型
    fileType?: string | string[];
    // 最大文件数量
    limit?: number;
    // 强行按app尺寸上传
    forceAppSize?: boolean;
    // 纯展示
    onlyShow?: boolean;
    // 文件名称参数名称
    fileName?: string;
    // 文件地址参数名称
    fileUrl?: string;
    // 打印模式
    printMode?: boolean;
    // 是否仅支持拍照
    onlyCamera?: boolean;
    // 是否允许一次选择多个文件
    multiple?: boolean;
    // 标志
    flag?: any;
    // 是否显示提示
    showTips?: boolean;
    // 最大文件大小
    fileSize?: number | string;
    //图片在容器内的的适应类型
    objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    //下载方式
    downloadType?: 'default' | 'browser';
    //自定义下载方式
    comstomDownload?: (file: any) => void;
    //是否显示限制条件提示图标（forceAppSize 模式下生效）
    showRestrictionTip?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    accept: undefined,
    modelValue: () => [],
    fileType: undefined,
    limit: Infinity,
    forceAppSize: false,
    onlyShow: false,
    fileName: 'fileName',
    fileUrl: 'url',
    printMode: false,
    onlyCamera: false,
    multiple: false,
    showTips: true,
    objectFit: 'cover',
    downloadType: 'default',
    showRestrictionTip: false,
});

// 定义组件事件
const emit = defineEmits(['update:modelValue', 'remove']);

// 响应式数据
const isapp = ref(isApp());
// 抽屉控制器
const appFileshow = ref(false);
// 视频播放控制器
const showVideo = ref(false);
const videoUrl = ref('');

// 附件上传的文件进度
const uploadProgress = ref<Record<string, { progress: number; timer: number | null; chunkTimer?: number | null }>>({});
// 记录某个文件是否已被取消（用于在组件销毁或用户取消时停止后续处理）
const uploadCanceled = ref<Record<string, boolean>>({});
// 存储每个上传的 AbortController，便于中断 HTTP 请求
const uploadAbortControllers = ref<Record<string, AbortController>>({});
const imageList = ref<string[]>([]);
// 打开动作面板是选择的附件对象
const selectedFile = ref<any>(null);
// 图片预览控制器
const showRef = ref(false);
// 当前图片索引
const currentImageIndex = ref(0);

// 引用
const fileInput = ref<HTMLInputElement | null>(null);

// 监听value变化
watch(
    () => props.modelValue,
    (newVal, oldVal) => {
        // 当外部传入的 value 变化时，清空 file input，以便用户可以重新选择相同的文件
        nextTick(() => {
            try {
                if (fileInput.value) fileInput.value.value = '';
            } catch (e) { }
        });
    },
    { deep: true, immediate: true }
);

// 计算属性
// 判断是否是视频，如果是视频则不展示下载按钮
// 移动端点击附件展示的选项
const actions = (file: any) => {
    if (file && isVideo(file)) {
        return [{ name: '下载' }, { name: '播放' }, { name: '删除' }];
    } else {
        return [{ name: '下载' }, { name: '删除' }];
    }
};

// 文件列表
const fileList = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});
// const fileList = ref([...props.modelValue]);
// 获取文件图标类名
const getClassName = (file: any) => {
    console.log(file, '999')
    return getFileIconClass(file[props.fileName]);
};

// 获取文件图标
const getFileIcon = (file: any) => {
    return getFileIconName(file[props.fileName], file[props.fileUrl]);
};

// 获取文件要限制的格式
const displayFileTypeText = computed(() => {
    if (props.onlyCamera) return '图片';

    const toArray = (val?: string | string[]) => {
        if (!val) return [] as string[];
        return Array.isArray(val) ? val : [val];
    };

    const types = toArray(props.fileType);
    if (types.length) return types.join('、');

    const accepts = toArray(props.accept);
    if (accepts.length) return accepts.join('、');

    return '';
});

// 格式化文件大小限制显示文本
const fileLimitText = computed(() => {
    const val = props.fileSize;
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') {
        if (!Number.isFinite(val)) return '';
        if (val < 1024) return `${val}B`;
        if (val < 1024 * 1024) return `${(val / 1024).toFixed(0)}KB`;
        if (val < 1024 * 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(0)}MB`;
        return `${(val / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    }
    return String(val).trim();
});

const getUploadType = computed(() => {
    // 当 onlyCamera 为 true 时，仅允许使用相机拍照（仅图片）
    if (props.onlyCamera) {
        return 'image/*';
    }
    if (props.fileType) {
        if (Array.isArray(props.fileType)) {
            return props.fileType.map((type) => fileType[type as keyof typeof fileType]).join(',');
        }
        return fileType[props.fileType as keyof typeof fileType].join(',');
    } else {
        if (props.accept) {
            if (Array.isArray(props.accept)) {
                return props.accept.join(',');
            }
            return props.accept;
        }
    }
    return '';
});

// 当前是否是app尺寸环境
const isAppSize = computed(() => {
    return isApp() || props.forceAppSize;
});

const parseFileSizeToBytes = (val?: number | string) => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') {
        if (!Number.isFinite(val) || val <= 0) return null;
        return Math.floor(val);
    }
    const raw = String(val).trim();
    if (!raw) return null;

    const match = raw.match(/^(\d+(?:\.\d+)?)\s*([kKmMgG])?[bB]?$/);
    if (!match) return null;

    const num = Number(match[1]);
    if (!Number.isFinite(num) || num <= 0) return null;

    const unit = (match[2] || '').toUpperCase();
    const base = 1024;
    if (unit === 'K') return Math.floor(num * base);
    if (unit === 'M') return Math.floor(num * base * base);
    if (unit === 'G') return Math.floor(num * base * base * base);
    return Math.floor(num);
};

const getFileSizeLimitText = (val?: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'string') return val.trim();
    if (!Number.isFinite(val)) return '';
    return `${val}B`;
};

const validateFileSize = (file: File) => {
    const maxBytes = parseFileSizeToBytes(props.fileSize);
    if (!maxBytes) return true;
    return file.size <= maxBytes;
};

// 方法
// H5打开抽屉弹窗选择下载
const handleFileDownload = (file: any) => {
    selectedFile.value = file;
    appFileshow.value = true;
};

const onSelect = (item: { name: string }) => {
    if (selectedFile.value && item.name === '下载') {
        downloadFile(selectedFile.value);
    } else if (selectedFile.value && item.name === '播放') {
        handleVideoPlay(selectedFile.value);
    } else if (selectedFile.value && item.name === '删除') {
        handleFileDelete(selectedFile.value);
    }
};

// 关闭动作面板
const closeActionSheet = () => {
    //
    console.log('=====关闭动作面板');
};

// 文件下载
const downloadFile = (file: any) => {
    if (props.comstomDownload) {
        props.comstomDownload(file);
        return;
    }
    if (props.downloadType == 'browser') {
        browserDownload(file);
        return;
    }
    // 判断文件是否是图片
    if (isImage(file)) {
        const url = file[props.fileUrl];
        const filename = file[props.fileName] || url.split('/').pop();
        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename || url.split('/').pop() || '';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            })
            .catch((error) => console.error('下载失败:', error));
    } else {
        downloadLargeFile(file[props.fileUrl], file[props.fileName]);
    }
};
const browserDownload = (file) => {
    const url = file[props.fileUrl];
    const filename = file[props.fileName] || url.split('/').pop();
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || url.split('/').pop() || '';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
// 准备图片列表
const prepareImageList = () => {
    imageList.value = (fileList.value || [])
        .filter((file) => (file.status === 'success' || file.status === undefined || props.onlyShow) && isImage(file))
        .map((file) => file[props.fileUrl]);
};

// 文件查看
const handleFileView = async (file: any) => {
    console.log('当前预览文件', file);

    // 如果当前文件是图片
    if (isImage(file)) {
        // 准备图片列表用于 n-image 预览
        await prepareImageList();
        console.log('当前预览文件-imageList.value', fileList.value);

        const index = imageList.value.findIndex((img) => img === file[props.fileUrl]);
        currentImageIndex.value = index !== -1 ? index : 0;
        showRef.value = true;
    }
};

// 播放视频
const handleVideoPlay = (file: any) => {
    try {
        if (file[props.fileUrl] && props.fileUrl) {
            videoUrl.value = file[props.fileUrl];
            showVideo.value = true;
        }
    } catch (error) { }
};

// 判断是否为图片文件
const isImage = (file: any) => {
    if (!file || !file[props.fileName]) return false;
    const fileExtension = file[props.fileName].split('.').pop()?.toLowerCase();
    if (!fileExtension) return false;
    const imageTypes = fileType['图片'];
    console.log('当前文件是否是文件', imageTypes, fileExtension, imageTypes.includes(`.${fileExtension}`));

    return imageTypes.includes(`.${fileExtension}`);
};

/**
 * 判断文件是否为视频类型
 * @param {File} file - 文件对象
 * @returns {boolean} - 是否为视频类型
 */
const isVideo = (file: any) => {
    if (!file || !file[props.fileName]) {
        return false;
    }
    const fileExtension = file[props.fileName].split('.').pop()?.toLowerCase();
    if (!fileExtension) return false;
    const videoTypes = ['.mp4'];
    return videoTypes.includes(`.${fileExtension}`);
};

// 判断选中的文件是否与传入的fileType、accept匹配
const isFileTypeMatch = (fileName: string) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (!fileExtension) return false;
    let fileTypes: string[] = [];

    if (props.accept) {
        if (Array.isArray(props.accept)) {
            return props.accept.includes(`.${fileExtension}`);
        }
        return props.accept === `.${fileExtension}`;
    } else {
        if (props.fileType) {
            if (Array.isArray(props.fileType)) {
                fileTypes = props.fileType.map((type) => fileType[type as keyof typeof fileType]).flat();
            } else {
                fileTypes = fileType[props.fileType as keyof typeof fileType];
            }
            return fileTypes.includes(`.${fileExtension}`);
        } else {
            return true;
        }
    }
};

// 触发文件选择
const triggerFileInput = () => {
    console.log('fileInput', fileInput.value);
    // 将fileInput.value中的value清空
    fileInput.value?.setAttribute('value', '');
    fileInput.value?.click();
    // flag
    // if (props.flag) {
    //     let inputDom = document.getElementById(props.flag);
    //     // 仅相机
    //     if (props.onlyCamera) {
    //         inputDom = document.getElementById(props.flag + '_environment');
    //     }
    //     inputDom?.click();
    // } else {
    //     // 获取所有 fileInput 元素
    //     const inputs = document.querySelectorAll('input[type="file"][style*="display: none"]');

    //     console.log('inputs', inputs);

    //     if (props.onlyCamera && inputs[0]) {
    //         // 仅相机模式使用第一个 input（带 capture 属性）
    //         (inputs[0] as HTMLInputElement).click();
    //     } else if (inputs[1]) {
    //         // 普通模式使用第二个 input
    //         (inputs[1] as HTMLInputElement).click();
    //     } else if (inputs[0]) {
    //         // 兜底方案
    //         (inputs[0] as HTMLInputElement).click();
    //     }
    // }
};

// 附件失败后重新上传
const handleFileUpload = async (file: File) => {
    if (!file) {
        window.$message.error('文件不存在，无法上传！请直接删除该文件');
        return;
    }
    if (!validateFileSize(file)) {
        const limitText = getFileSizeLimitText(props.fileSize);
        window.$message.error(`文件大小超出限制${limitText ? `（最大${limitText}）` : ''}`);
        return;
    }

    // 文件实际大小
    const fileSize = file.size;
    // 分块大小
    const chunkSize = 5 * 1024 * 1024;
    // 获取文件md5
    const identifier = await calculateFileMD5(file);
    // 为该文件创建一个 AbortController 用于中断 HTTP 请求
    try {
        const controller = new AbortController();
        uploadAbortControllers.value[identifier] = controller;
    } catch (e) {
        // ignore
    }
    // 判断文件是否已经存在
    const _index = fileList.value.findIndex((f: any) => f.identifier === identifier);
    if (_index !== -1) {
        fileList.value[_index] = {
            fileId: '',
            file: file,
            identifier,
            [props.fileName]: file.name,
            status: 'loading',
            [props.fileUrl]: null,
            type: file.type,
            size: file.size,
        };
    }

    const controller = uploadAbortControllers.value[identifier];
    const signal = controller ? controller.signal : undefined;

    const fileExists = await checkFileExistsFun(file, identifier, signal);
    if (fileExists && !fileExists.uploaded) {
        // 接口调用成功,并且服务器上不存在当前文件
        // 判断文件大小，决定是直接上传还是切片上传
        if (fileSize <= chunkSize) {
            uploadCanceled.value[identifier] = false;
            const controller = uploadAbortControllers.value[identifier];
            const signal = controller ? controller.signal : undefined;
            uploadSmallFile(file, identifier, signal);
            changeFileStatus(identifier, 'uploading');
        } else {
            uploadCanceled.value[identifier] = false;
            changeFileStatus(identifier, 'uploading');
            // 大文件上传
            uploadLargeFile(file, identifier, chunkSize, fileExists.uploadedChunks, signal);
        }
    } else {
        changeFileStatus(identifier, 'fail');
    }
};

/**
 * 处理单个选中的文件。
 * @param file 当前选中的文件
 * @returns 文件校验及上传流程完成后的 Promise
 */
const handleSelectedFile = async (file: File) => {
    if (props.onlyCamera && !(file.type && file.type.startsWith('image/'))) {
        window.$message.error('仅允许使用相机拍照，请拍摄图片后再上传');
        return;
    }
    if (!isFileTypeMatch(file.name)) {
        window.$message.error(`文件 ${file.name} 类型错误，无法上传！`);
        return;
    }
    if (!validateFileSize(file)) {
        const limitText = getFileSizeLimitText(props.fileSize);
        window.$message.error(`文件 ${file.name} 大小超出限制${limitText ? `（最大${limitText}）` : ''}`);
        return;
    }

    try {
        const fileSize = file.size;
        const chunkSize = 5 * 1024 * 1024;
        const identifier = await calculateFileMD5(file);
        const controller = new AbortController();
        uploadAbortControllers.value[identifier] = controller;
        const existingIndex = fileList.value.findIndex((item: any) => item.identifier === identifier);
        if (existingIndex !== -1) {
            window.$message.error(`文件 ${file.name} 已存在，请勿重复上传！`);
            return;
        }

        fileList.value.push({
            fileId: '',
            file,
            identifier,
            [props.fileName]: file.name,
            status: 'loading',
            [props.fileUrl]: null,
            type: file.type,
            size: file.size,
        });

        const fileExists = await checkFileExistsFun(file, identifier, controller.signal);
        if (!fileExists) {
            changeFileStatus(identifier, 'fail');
            return;
        }
        if (fileExists.uploaded) return;

        uploadCanceled.value[identifier] = false;
        if (fileSize <= chunkSize) {
            uploadSmallFile(file, identifier, controller.signal);
        } else {
            uploadLargeFile(file, identifier, chunkSize, fileExists.uploadedChunks, controller.signal);
        }
    } catch (error) {
        window.$message.error(`文件 ${file.name} 上传校验失败，请重试`);
        console.error('处理附件上传失败:', error);
    }
};

// 处理文件选择
const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (!files.length) return;

    const remainingCount = props.limit === Infinity ? files.length : Math.max(props.limit - fileList.value.length, 0);
    if (files.length > remainingCount) {
        window.$message.error(`最多可上传${props.limit}个文件`);
    }

    for (const file of files.slice(0, remainingCount)) {
        await handleSelectedFile(file);
    }

    nextTick(() => {
        try {
            if (fileInput.value) fileInput.value.value = '';
        } catch (error) {
            console.error('重置附件选择框失败:', error);
        }
    });
};

// 校验文件是否在服务器上已存在
const checkFileExistsFun = async (file: File, identifier: string, signal?: AbortSignal) => {
    const _index = fileList.value.findIndex((f: any) => f.identifier === identifier);
    try {
        const checkResponse = await checkFileExists(file, identifier, signal);
        if (checkResponse.code === 200) {
            // 文件在服务器存在
            if (checkResponse.data.uploaded) {
                if (_index !== -1) {
                    fileList.value[_index].status = 'success';
                    fileList.value[_index][props.fileUrl] = checkResponse.data.oss.url;
                    fileList.value[_index].fileId = checkResponse.data.oss.id;
                    fileList.value[_index].size = file.size;
                } else {
                    fileList.value.push({
                        fileId: checkResponse.data.oss.id,
                        file: file,
                        identifier,
                        name: file[props.fileName as keyof File],
                        status: 'success',
                        [props.fileUrl]: checkResponse.data.oss.url,
                        type: file.type,
                        size: file.size,
                    });
                }
                console.log('fileList.value', fileList.value);

                return {
                    url: checkResponse.data.oss.url, // 模拟一个URL，实际应从后端返回
                    identifier: identifier,
                    uploadTime: new Date().toLocaleString(),
                    uploaded: true,
                };
            } else {
                return {
                    uploadedChunks: checkResponse.data.uploadedChunks,
                    uploaded: false,
                };
            }
        } else {
            window.$message.error('文件校验异常！');
            changeFileStatus(identifier, 'fail');
            setTimeout(() => {
                // this.removeFile(identifier)
            }, 1000);
            // 文件上传异常
            return null;
        }
    } catch (error) {
        window.$message.error('文件校验异常！');
        setTimeout(() => {
            // this.removeFile(identifier)
        }, 1000);
        return null;
    }
};

// 删除文件
const removeFile = (identifier: string) => {
    deleteFileApi(identifier).then((res: any) => {
        const _index = fileList.value.findIndex((f: any) => f.identifier === identifier);
        try {
            if (uploadProgress.value && uploadProgress.value[identifier]) {
                const progressItem = uploadProgress.value[identifier];
                if (progressItem && progressItem.timer) {
                    clearInterval(progressItem.timer);
                    progressItem.timer = null;
                }
                if (progressItem && progressItem.chunkTimer) {
                    clearTimeout(progressItem.chunkTimer);
                    progressItem.chunkTimer = null;
                }
            }
        } catch (error) {
            console.log('清除定时器异常');
        }

        try {
            if (uploadAbortControllers.value && uploadAbortControllers.value[identifier]) {
                const ctrl = uploadAbortControllers.value[identifier];
                try {
                    if (ctrl && typeof ctrl.abort === 'function') ctrl.abort();
                } catch (e) { }
            }
        } catch (error) {
            console.log('终止HTTP异常');
        }
        if (_index >= 0) {
            emit('remove', _index, fileList.value[_index]);
            fileList.value.splice(_index, 1);
            // 删除后重置文件输入，防止无法重新选择同一文件
            nextTick(() => {
                try {
                    if (fileInput.value) fileInput.value.value = '';
                } catch (e) { }
            });
        } else {
            window.$message.error('删除错误！');
        }
    }).catch(() => {
        window.$message.error('删除错误！');
    });

};

// 文件删除
const handleFileDelete = (file: any) => {
    NDialog.warning({
        title: '提示',
        content: `确定要删除该文件吗？`,
        positiveText: '确定',
        negativeText: '取消',
        closable: false,
        onPositiveClick: () => {
            removeFile(file.identifier);
        },
    });
};

// 上传中文件取消上传并删除
const handleFileCancel = (file: any) => {
    NDialog.warning({
        title: '提示',
        content: `确定要取消上传该文件吗？`,
        positiveText: '确定',
        negativeText: '取消',
        closable: false,
        onPositiveClick: () => {
            // 取消上传
            removeFile(file.identifier);
        },
    });
};

// 更改指定的文件的状态
const changeFileStatus = (identifier: string, status: string, other: any = null) => {
    const _index = fileList.value.findIndex((f: any) => f.identifier === identifier);
    if (_index >= 0) {
        fileList.value[_index].status = status;
        if (other) {
            fileList.value[_index] = { ...fileList.value[_index], ...other };
        }
    } else {
        // window.$message.error("更改状态错误！")
    }
};

// 小文件上传
const uploadSmallFile = async (file: File, identifier: string, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identifier', identifier);
    changeFileStatus(identifier, 'uploading');
    // 小文件上传
    try {
        if (!uploadProgress.value[identifier]) {
            uploadProgress.value[identifier] = {
                progress: 0,
                timer: null,
            };
            const timer = setInterval(() => {
                if (uploadProgress.value[identifier].progress < 90) {
                    setUploadProgress(identifier, uploadProgress.value[identifier].progress + 1);
                } else {
                    if (uploadProgress.value[identifier].progress < 99) {
                        setUploadProgress(identifier, uploadProgress.value[identifier].progress + 1);
                    } else {
                        clearInterval(uploadProgress.value[identifier].timer!);
                        uploadProgress.value[identifier].timer = null;
                    }
                }
            }, 1000);
            if (uploadProgress.value[identifier].timer) {
                clearInterval(uploadProgress.value[identifier].timer);
            }
            uploadProgress.value[identifier].timer = timer;
        }

        const minFile = await uploadSmallFileApi(formData, signal);
        if (minFile.code === 200) {
            changeFileStatus(identifier, 'success', { [props.fileUrl]: minFile.data.url, fileId: minFile.data.id });
            if (uploadProgress.value[identifier].timer) {
                clearInterval(uploadProgress.value[identifier].timer);
            }
            uploadProgress.value[identifier].timer = null;
            uploadProgress.value[identifier].progress = 100;
        } else {
            changeFileStatus(identifier, 'fail');
            if (uploadProgress.value[identifier].timer) {
                clearInterval(uploadProgress.value[identifier].timer);
            }
            uploadProgress.value[identifier].timer = null;
            uploadProgress.value[identifier].progress = 0;
        }
    } catch (error) {
        changeFileStatus(identifier, 'fail');
        if (uploadProgress.value[identifier].timer) {
            clearInterval(uploadProgress.value[identifier].timer);
        }
        uploadProgress.value[identifier].timer = null;
        uploadProgress.value[identifier].progress = 0;
    }
};

/**
 * 大文件上传
 * @param {file} file 上传的文件
 * @param {string} identifier 上传文件的标识符
 * @param {number} chunkSize 分块大小
 * @param {Array} uploadedPartNumbers 已上传的分块列表
 */
const uploadLargeFile = async (
    file: File,
    identifier: string,
    chunkSize: number,
    uploadedPartNumbers: number[] = [],
    signal?: AbortSignal
) => {
    try {
        if (!uploadProgress.value[identifier]) {
            uploadProgress.value[identifier] = {
                progress: 0,
                timer: null,
            };
        }
        changeFileStatus(identifier, 'uploading');

        // 记录开始上传的时间
        const currTime = Date.now();
        // 计算分片总数
        const totalChunks = Math.ceil(file.size / chunkSize);
        // 如果uploadedPartNumbers长度大于1，则证明之前上传过部分分块，进行提示
        if (uploadedPartNumbers.length > 0) {
            window.$message.warning(`发现未完成的上传任务，已完成 ${uploadedPartNumbers.length}/${totalChunks} 个分片`);
            uploadProgress.value[identifier].progress = Math.round((uploadedPartNumbers.length / totalChunks) * 100);
        } else {
            uploadProgress.value[identifier].progress = 0;
        }
        // 3. 逐个上传未完成的分片（使用定时器驱动，避免阻塞并可在销毁时清除）
        const uploadedChunks = [...uploadedPartNumbers]; // 复制已上传的分片编号

        // 使用 Promise 封装递归 setTimeout 逻辑，便于在当前 async 函数中 await
        await new Promise((resolve) => {
            let index = 1;

            const processChunk = async () => {
                // 如果超出范围则结束
                if (index > totalChunks) {
                    resolve(undefined);
                    return;
                }

                // 如果在循环过程中被取消，停止后续分片上传
                if (uploadCanceled.value && uploadCanceled.value[identifier]) {
                    resolve(undefined);
                    return;
                }

                // 如果分片已上传，跳过
                if (uploadedChunks.indexOf(index) !== -1) {
                    index++;
                    // 递归下一次（使用微任务定时器）
                    const tid = setTimeout(processChunk, 0);
                    if (uploadProgress.value[identifier]) uploadProgress.value[identifier].chunkTimer = tid;
                    return;
                }

                try {
                    // 准备分片数据
                    const start = (index - 1) * chunkSize;
                    const end = Math.min(file.size, start + chunkSize);
                    const chunk = file.slice(start, end);

                    // 直接上传分片到后端API
                    const formData = new FormData();
                    formData.append('file', new Blob([chunk], { type: 'application/octet-stream' }));
                    const _res = await uploadLargeFileApi(formData, identifier, index, signal);

                    // 如果上传期间已取消，则停止处理后续逻辑
                    if (uploadCanceled.value && uploadCanceled.value[identifier]) {
                        resolve(undefined);
                        return;
                    }

                    if (_res && _res.code === 200) {
                        // 分片上传成功
                        uploadedChunks.push(index);
                        if (uploadProgress.value[identifier]) {
                            uploadProgress.value[identifier].progress = Math.round(
                                (uploadedChunks.length / totalChunks) * 100
                            );
                        }
                    } else {
                        // 分片上传失败，结束并标记失败
                        changeFileStatus(identifier, 'fail');
                        // this.$message.error('分片上传异常，已取消上传');
                        uploadCanceled.value[identifier] = true;
                        resolve(undefined);
                        return;
                    }
                } catch (error) {
                    // 出现异常则结束并标记失败
                    changeFileStatus(identifier, 'fail');
                    window.$message.error('分片上传异常，已取消上传');
                    uploadCanceled.value[identifier] = true;
                    resolve(undefined);
                    return;
                }

                // 继续下一个分片
                index++;
                const tid = setTimeout(processChunk, 0);
                if (uploadProgress.value[identifier]) uploadProgress.value[identifier].chunkTimer = tid;
            };

            // 启动处理
            processChunk();
        });

        // 清理可能残留的 chunk timer
        if (uploadProgress.value[identifier] && uploadProgress.value[identifier].chunkTimer) {
            clearTimeout(uploadProgress.value[identifier].chunkTimer);
            uploadProgress.value[identifier].chunkTimer = null;
        }

        // 上传完成,开始合并（仅当未被取消）
        if (!(uploadCanceled.value && uploadCanceled.value[identifier]) && uploadedChunks.length >= totalChunks) {
            mergeFileChunks(file, identifier, totalChunks, signal);
        }
    } catch (error) {
        // 出现异常直接错误
        changeFileStatus(identifier, 'fail');
    }
};

// 修改某个文件的上传进度
const setUploadProgress = (identifier: string, progress: number) => {
    if (uploadProgress.value[identifier]) {
        uploadProgress.value[identifier].progress = progress;
    }
};

// 大文件合并请求
const mergeFileChunks = async (file: File, identifier: string, totalChunks: number, signal?: AbortSignal) => {
    // 如果合并时已经被取消，直接返回
    if (uploadCanceled.value && uploadCanceled.value[identifier]) {
        return;
    }
    const params = {
        fileName: file[props.fileName as keyof File],
        identifier: identifier,
        totalSize: file.size,
        totalChunks: totalChunks,
        contentType: file.type,
    };
    const _res = await mergeFileChunksApi(params, signal);
    if (_res.code === 200) {
        // 上传完成
        changeFileStatus(identifier, 'success', { [props.fileUrl]: _res.data.url, fileId: _res.data.id });
    } else {
        window.$message.error('文件合并失败');
        changeFileStatus(identifier, 'fail');
    }
};

// 组件销毁时清理
onUnmounted(() => {
    // 清理所有上传的定时器（progress timer 与 chunk timer）
    try {
        Object.keys(uploadProgress.value || {}).forEach((identifier) => {
            const progressItem = uploadProgress.value[identifier];
            if (progressItem && progressItem.timer) {
                clearInterval(progressItem.timer);
                progressItem.timer = null;
            }
            if (progressItem && progressItem.chunkTimer) {
                clearTimeout(progressItem.chunkTimer);
                progressItem.chunkTimer = null;
            }
        });
    } catch (e) {
        // ignore
    }

    // 中止所有还在进行的 HTTP 请求并清空上传控制器
    try {
        Object.keys(uploadAbortControllers.value || {}).forEach((id) => {
            const ctrl = uploadAbortControllers.value[id];
            try {
                if (ctrl && typeof ctrl.abort === 'function') ctrl.abort();
            } catch (e) { }
        });
    } catch (e) {
        // ignore
    }

    // 清空上传相关数据
    uploadProgress.value = {};
    uploadCanceled.value = {};
    uploadAbortControllers.value = {};

    // 清空 fileList（用户要求）
    // try {
    //     fileList.value = [];
    // } catch (e) {
    //     emit('update:modelValue', []);
    // }
});
</script>

<style lang="less" scoped>
@w: 104px;

/* pdf */
.pdf-icon {
    background-image: url('./img/pdf.png');
}

/* crd */
.crd-icon {
    background-image: url('./img/crd.png');
}

/* dwg */
.dwg-icon {
    background-image: url('./img/dwg.png');
}

/* 音频 */
.audio-icon {
    background-image: url('./img/audio.png');
}

/* 视频 */
.video-icon {
    background-image: url('./img/video.png');
}

/* ppt */
.ppt-icon {
    background-image: url('./img/ppt.png');
}

/* word */
.word-icon {
    background-image: url('./img/word.png');
}

/* xls */
.excel-icon {
    background-image: url('./img/xls.png');
}

/* 其他 */
.other-icon {
    background-image: url('./img/other.png');
}

/* 失败 */
.fail-icon {
    background-image: url('./img/fail.png');
}

.flex {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.loading-flex {
    flex-direction: column;

    .text {
        font-size: 12px;
        color: var(--base-color);
    }
}

.custom-file-upload {
    width: 100%;
    // margin: 10px 0;
}

.thumbnail-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.upload-thumbnail {
    width: @w;
    height: @w;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: center url('@/assets/images/comm/upload_bg.png') no-repeat;
    background-size: 100% 100%;
}

.file-item {
    position: relative;
    width: @w;
    height: @w;
    border: 1px solid var(--base-border-grey);
    padding: 5px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    align-items: center;

    &:hover {
        .file-actions {
            display: flex;
            /* 添加背景模糊 */
            backdrop-filter: blur(3px);
        }
    }

    .file-image {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100%;
        height: auto;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;

        &::v-deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        &::v-deep(.err-img-icon) {
            width: 80px;
            height: 80px;
            background-size: 100%;
            background-image: url('./img/fail.png');
            background-position: center;
        }

        :deep(.err-img-icon) {
            width: 80px;
            height: 80px;
            background-size: 100%;
            background-image: url('./img/fail.png');
            background-position: center;
        }
    }

    .file_video {
        width: 100%;
        height: 50%;
    }
}

.no_border {
    padding: 0 !important;
    /* border: none; */
}

.fail-item {
    border-color: var(--danger);

    &:hover {
        .file-actions {
            background-color: var(--danger-op);
        }
    }
}

.upload-thumbnail i {
    font-size: 24px;
    color: #8c939d;
}

.upload-tip-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #faad14;
    flex-shrink: 0;

    &:hover {
        color: #ffc53d;
    }
}

.thumbnail-item {
    width: @w;
    text-align: center;
}

.thumbnail-wrapper {
    position: relative;
    width: @w;
    height: @w;
    border: 1px solid var(--base-border-grey);
    border-radius: 6px;
    overflow: hidden;
    background-color: var(--base-grey3);
    margin-bottom: 8px;
}

.image-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.thumbnail-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s;
}

.thumbnail-wrapper:hover .thumbnail-actions {
    opacity: 1;
}

.thumbnail-actions i {
    color: var(--g01);
    font-size: 12px;
}

.uploading-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.thumbnail-info {
    text-align: center;
}

.file-size {
    font-size: 12px;
    color: #909399;
}

.other-file {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .icon {
        display: block;
        width: 50px;
        height: 50px;
        background-size: 100%;
        background-position: center;
        background-repeat: no-repeat;
    }

    .text {
        width: 100px;

        /* 超出两行文本省略 */
        line-height: 1.1;
        word-break: break-all;
        text-align: center;
        font-size: 14px;
        color: var(--g08);
    }
}

.file-actions {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    /* display: flex; */
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 4px;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px;
    border-radius: 4px;
    gap: 10px;

    i {
        color: var(--g01);
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            transform: scale(1.2);
        }
    }
}

.fail-item .file-actions {
    i {
        color: var(--danger);
    }
}

.upload-loading {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 12px;
    padding: 5px;
    /*color: var(--c7);*/

    i {
        font-size: 24px;
        margin-bottom: 8px;
    }

    .close-box {
        position: absolute;
        width: 16px;
        height: 16px;
        right: 5px;
        top: -3px;
        display: flex;
        align-items: start;
        justify-content: end;
        border-end-start-radius: 12px;
        border-start-end-radius: 6px;
        background-color: var(--g13);
        z-index: 2;
        cursor: pointer;

        i {
            color: var(--c1);
            font-size: 12px;
        }
    }
}

.el-icon-loading {
    font-size: 36px;
    color: var(--c7);
}

.app-custom-file-upload {
    @w: 80px;

    .thumbnail-list {
        gap: 8px;
    }

    .upload-thumbnail {
        width: @w;
        height: @w;

        &:hover {
            border: 1px solid var(--base-border-grey);
            background-color: var(--base-grey3);
        }
    }

    .app-file-item {
        width: @w;
        height: @w;
        position: relative;
        overflow: hidden;

        &:hover {
            .file-actions {
                /* 添加背景模糊 */
                backdrop-filter: blur(0px);
            }
        }

        .loading-flex {
            i {
                font-size: 20px;
            }

            .text {
                font-size: 12px;
            }
        }

        .app-file-actions {
            display: flex;
            border-end-end-radius: 0px;
            border-end-start-radius: 0px;

            &:hover {
                i {
                    transform: scale(1);
                }
            }
        }

        .app-fail-actions {
            background-color: var(--danger-op);
            flex-direction: column;
            gap: 5px;

            .text {
                font-size: 12px;
                line-height: 1.1;
                color: var(--danger);
            }
        }

        .close-box {
            position: absolute;
            width: 16px;
            height: 16px;
            right: 0px;
            top: 0px;
            display: flex;
            align-items: start;
            justify-content: end;
            border-end-start-radius: 12px;
            background-color: var(--g13);
            z-index: 2;

            i {
                color: var(--c1);
                font-size: 12px;
            }
        }
    }

    .other-file {
        .icon {
            width: 32px;
            height: 32px;
        }

        .text {
            width: 60px;
            /* 超出两行文本省略 */
            line-height: 1.1;
            word-break: break-all;
            font-size: 12px;
            color: var(--g08);
        }
    }
}

.app-size-custom-file-upload {
    @w: 80px;

    .thumbnail-list {
        gap: 8px;
    }

    .upload-thumbnail {
        width: @w;
        height: @w;
    }

    .file-item {
        width: @w;
        height: @w;
        position: relative;
        overflow: hidden;

        .loading-flex {
            i {
                font-size: 20px;
            }

            .text {
                font-size: 12px;
            }
        }

        .file-actions {
            gap: 5px;

            i {
                font-size: 14px;
            }
        }

        .fail-actions {
            background-color: var(--danger-op);
            flex-direction: column;
            gap: 5px;

            .text {
                font-size: 12px;
                line-height: 1.1;
                color: var(--danger);
            }
        }

        .file-image {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100%;
            height: auto;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;

            :deep(.err-img-icon) {
                width: 60px;
                height: 60px;
                background-size: 100%;
                background-image: url('./img/fail.png');
                background-position: center;
            }
        }
    }

    .other-file {
        .icon {
            width: 32px;
            height: 32px;
        }

        .text {
            width: 60px;
            /* 超出两行文本省略 */
            line-height: 1.1;
            word-break: break-all;
            font-size: 12px;
            color: var(--g08);
        }
    }
}

.tips {
    color: var(--base-grey);
    font-size: 12px;
    margin-top: 8px;
}

.file_prompt {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 400;
    color: var(--base-grey);
}

.text-ellipsis-2 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-all;
}
</style>
