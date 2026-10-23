<!--
    MxEditor 富文本编辑器，封装方式与 TMS 项目保持一致：
    - 图片、视频菜单默认开启，传入 enabled: false 可按业务页面关闭；
    - 文件菜单默认关闭，只有传入 enabled: true 才显示；
    - 图片、视频、文件统一使用 MD5 秒传、小文件直传和大文件分片上传。
-->
<template>
    <div class="mainEditor" :class="{ 'is-app-editor': appEditor }">
        <Toolbar
            :default-config="toolbarConfig"
            :editor="editorRef"
            :mode="props.editorMode"
            :style="{ borderBottom: appEditor ? '1px solid #999' : '1px solid #e0e0e6', paddingTop: '4px' }" />
        <div class="editor-content" :style="{ height: props.minHeight === '100%' ? undefined : props.minHeight }">
            <Editor
                v-model="valueHtml"
                :default-config="editorConfig"
                :style="{ height: props.minHeight }"
                :mode="props.editorMode"
                @onCreated="handleCreated"
                @onChange="handleChange" />
        </div>
        <div v-if="uploadLoading" class="editor-upload-mask">
            <div class="editor-upload-content">
                <span class="editor-upload-spinner"></span>
                <span>{{ uploadLoadingText }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { Boot, IButtonMenu, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import SparkMD5 from 'spark-md5';
import { checkFileExists, mergeFileChunksApi, uploadLargeFileApi, uploadSmallFileApi } from '@/api/upload';
import { isApp } from '@/utils/comm';

type UploadResult = {
    id?: string | number;
    url: string;
    name: string;
    size: number;
    type: string;
};

type UploadItemConfig = {
    enabled?: boolean;
    maxFileSize?: number;
    maxNumberOfFiles?: number;
    allowedFileTypes?: string[];
    accept?: string;
    timeout?: number;
    linkTextPrefix?: string;
};

type EditorUploadConfig = {
    image?: UploadItemConfig;
    video?: UploadItemConfig;
    file?: UploadItemConfig;
};

type EditorMode = 'default' | 'simple';
type ToolbarPreset = 'basic' | 'full';
type ToolbarMenuKey = string | Record<string, any>;

const CUSTOM_FILE_MENU_KEY = 'mxUploadFile';
const FILE_MENU_REGISTER_FLAG = '__MX_EDITOR_UPLOAD_FILE_MENU_REGISTERED__';

const emits = defineEmits(['submit', 'update:modelValue', 'upload-success', 'upload-error']);
const props = withDefaults(
    defineProps<{
        maxLength?: number;
        minHeight?: string;
        modelValue: string;
        uploadConfig?: EditorUploadConfig;
        toolbarPreset?: ToolbarPreset;
        toolbarKeys?: ToolbarMenuKey[];
        editorMode?: EditorMode;
        autoFocus?: boolean;
        placeholder?: string;
    }>(),
    {
        minHeight: '300px',
        modelValue: '',
        uploadConfig: () => ({}),
        toolbarPreset: 'basic',
        toolbarKeys: undefined,
        editorMode: 'default',
        autoFocus: true,
        placeholder: '请输入内容...',
    }
);

// App 端弹窗需要使用 flex 布局承载内部滚动，PC 端保持 wangEditor 原有的块级高度布局。
const appEditor = isApp();

// 官方示例里的“更多样式/对齐/缩进/图片”等下拉组需要显式声明分组和图标，菜单 key 仍全部使用 wangEditor 内置能力。
const moreStyleGroup = {
    key: 'group-more-style',
    title: '更多',
    iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>',
    menuKeys: ['through', 'code', 'sup', 'sub', 'clearStyle'],
};

const justifyGroup = {
    key: 'group-justify',
    title: '对齐',
    iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
    menuKeys: ['justifyLeft', 'justifyRight', 'justifyCenter', 'justifyJustify'],
};

const indentGroup = {
    key: 'group-indent',
    title: '缩进',
    iconSvg:
        '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
    menuKeys: ['indent', 'delIndent'],
};

// 基础工具栏的文字排版部分；图片/视频分组在 buildBasicToolbarKeys 中统一追加。
const basicToolbarKeys: ToolbarMenuKey[] = [
    'bold',
    'underline',
    'italic',
    moreStyleGroup,
    'color',
    'bgColor',
    'fontSize',
    'fontFamily',
    'lineHeight',
    justifyGroup,
    indentGroup,
    'bulletedList',
    'numberedList',
];

const createImageGroup = (): ToolbarMenuKey | null => {
    if (!isImageUploadEnabled.value) return null;
    return {
        key: 'group-image',
        title: '图片',
        iconSvg:
            '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
        menuKeys: ['uploadImage', 'insertImage'],
    };
};

const createVideoGroup = (): ToolbarMenuKey | null => {
    if (!isVideoUploadEnabled.value) return null;
    return {
        key: 'group-video',
        title: '视频',
        iconSvg:
            '<svg viewBox="0 0 1024 1024"><path d="M916.5 274.9c-15.1-17.5-38.5-24-59.5-16.6L640 341.3V288c0-52.9-43.1-96-96-96H160c-52.9 0-96 43.1-96 96v448c0 52.9 43.1 96 96 96h384c52.9 0 96-43.1 96-96v-53.3l217 83c5.8 2.2 11.9 3.3 17.9 3.3 15.2 0 30-6.6 40.1-18.7 11.6-13.9 17.2-32.5 15-51.1V320c0-17.1-2.6-31.9-13.5-45.1zM576 736c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V288c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32v448z m288-54.4L640 596.7V427.3l224-84.9v339.2z"></path></svg>',
        menuKeys: ['uploadVideo', 'insertVideo'],
    };
};

const defaultImageConfig: Required<Pick<UploadItemConfig, 'maxFileSize' | 'maxNumberOfFiles' | 'allowedFileTypes'>> = {
    maxFileSize: 10 * 1024 * 1024,
    maxNumberOfFiles: 10,
    allowedFileTypes: ['image/*'],
};

const defaultFileConfig: Required<Pick<UploadItemConfig, 'maxFileSize' | 'accept' | 'linkTextPrefix'>> = {
    maxFileSize: 100 * 1024 * 1024,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg',
    linkTextPrefix: '附件：',
};

const defaultVideoConfig: Required<Pick<UploadItemConfig, 'maxFileSize' | 'maxNumberOfFiles' | 'allowedFileTypes'>> = {
    maxFileSize: 500 * 1024 * 1024,
    maxNumberOfFiles: 1,
    allowedFileTypes: ['video/*'],
};

// 编辑器字数长度
// 说明：
// - `textLength` 用于在外部传入 `maxLength` 时，实时跟踪剩余可输入字符数。
// - 初始值为 `props.maxLength`，若外部没有传入或传入无效值则在 `watch` 中会被设置为 `undefined`（不限制长度）。
const textLength = ref(props.maxLength);

// 声明编辑器实例
// 说明：使用 `shallowRef` 保存 wangEditor 编辑器实例引用，避免深度响应式开销。
// - `editorRef.value` 在 `handleCreated` 中被赋值为编辑器实例。
// - 在组件卸载时需要手动 `destroy()` 编辑器实例以释放资源。
const editorRef = shallowRef<any | null>(null);

// 编辑器内容
// 说明：`valueHtml` 为编辑器的 HTML 字符串模型，绑定到 Editor 组件的 `v-model`。
// - 通过 `watch` 监听 `props.modelValue`，保证外部 v-model 更新时编辑器内容同步。
// - 编辑器内部变更通过 `handleChange` 触发 `update:modelValue` 向外通知。
const valueHtml = ref(props.modelValue || '');

// 上传状态统一覆盖在编辑区域上方，避免图片/文件上传过程中用户重复点击上传。
// 说明：
// - `uploadLoading`：布尔，是否显示上传遮罩层。
// - `uploadLoadingText`：遮罩层上的文案，如“图片上传中...”
// - `activeUploadCount`：并发上传计数器，确保多文件上传场景下只有全部完成时才关闭遮罩。
const uploadLoading = ref(false);
const uploadLoadingText = ref('上传中...');
const activeUploadCount = ref(0);

const imageUploadConfig = computed(() => ({
    // 合并默认配置与外部传入的 image 配置，优先使用外部配置覆盖默认值。
    ...defaultImageConfig,
    ...(props.uploadConfig?.image || {}),
}));

const fileUploadConfig = computed(() => ({
    // 合并默认文件上传设置（如 accept、最大大小），供自定义文件上传菜单使用。
    ...defaultFileConfig,
    ...(props.uploadConfig?.file || {}),
}));

const videoUploadConfig = computed(() => ({
    // 合并 video 的默认配置，注意视频通常只允许 1 个文件上传（可通过外部覆盖）。
    ...defaultVideoConfig,
    ...(props.uploadConfig?.video || {}),
}));

// 说明：图片/视频上传默认开启（工具栏默认展示对应分组），外部可通过 enabled: false 显式关闭；文件上传仍需显式 enabled: true。
const isImageUploadEnabled = computed(() => props.uploadConfig?.image?.enabled !== false);
const isVideoUploadEnabled = computed(() => props.uploadConfig?.video?.enabled !== false);
const isFileUploadEnabled = computed(() => props.uploadConfig?.file?.enabled === true);

// 默认不限制输入长度；只有外部明确传入大于 0 的 maxLength 时，才启用 wangEditor 的长度限制。
const hasMaxLength = computed(
    () => typeof props.maxLength === 'number' && Number.isFinite(props.maxLength) && props.maxLength > 0
);
// 备注：`hasMaxLength` 在 `editorConfig` 中用于决定是否向 wangEditor 传递 `maxLength` 配置。

// 图片和文件共用 loading 包装；多图上传时 wangEditor 会多次调用 customUpload，因此用计数避免先完成的任务提前关闭 loading。
// 说明：该封装会在任务开始时递增 `activeUploadCount` 并显示遮罩，任务结束时递减并在计数为 0 时隐藏遮罩。
const runWithUploadLoading = async <T,>(text: string, task: () => Promise<T>): Promise<T> => {
    activeUploadCount.value += 1;
    uploadLoadingText.value = text;
    uploadLoading.value = true;

    try {
        // 执行上传任务并返回其结果；若抛出异常会在 finally 中处理计数器与遮罩隐藏。
        return await task();
    } finally {
        activeUploadCount.value = Math.max(activeUploadCount.value - 1, 0);
        if (activeUploadCount.value === 0) {
            // 所有并发上传完成，恢复默认遮罩文案并隐藏遮罩。
            uploadLoading.value = false;
            uploadLoadingText.value = '上传中...';
        }
    }
};

watch(
    () => props.modelValue,
    (newVal) => {
        // 当外部 v-model 更新时，同步到内部 valueHtml；确保编辑器展示最新内容。
        valueHtml.value = newVal || '';
    },
    {
        immediate: true,
        deep: true,
    }
);

watch(
    () => props.maxLength,
    (newVal) => {
        // 根据外部传入的 maxLength 更新剩余可输入字数；无效值则设为 undefined（不显示/不限制）。
        textLength.value = typeof newVal === 'number' && Number.isFinite(newVal) && newVal > 0 ? newVal : undefined;
    },
    {
        immediate: true,
        deep: true,
    }
);

// 自定义文件上传菜单：wangEditor 当前项目未安装附件插件，因此这里注册一个按钮作为文件上传入口。
class MxUploadFileMenu implements IButtonMenu {
    readonly title = '上传文件';
    readonly tag = 'button';
    readonly iconSvg =
        '<svg viewBox="0 0 1024 1024"><path d="M554.7 85.3 789.3 320v576c0 47.1-38.2 85.3-85.3 85.3H320c-47.1 0-85.3-38.2-85.3-85.3V128c0-47.1 38.2-85.3 85.3-85.3h192c16 0 31.3 6.3 42.7 17.6zM512 128H320v768h384V362.7H554.7c-23.6 0-42.7-19.1-42.7-42.7V128zm64 30.2V277.3h119.1L576 158.2zM384 533.3h256v85.4H384v-85.4zm0 170.7h256v85.3H384V704z"></path></svg>';
    getValue() {
        // 按钮菜单无需返回动态值，保持空字符串即可。
        return '';
    }

    isActive() {
        // 文件上传按钮不是切换态按钮，一直返回 false。
        return false;
    }

    isDisabled(editor: any) {
        // 若编辑器处于禁用态（例如表单整体禁用），则按钮也应禁用。
        return editor.isDisabled();
    }

    exec(editor: any) {
        // 执行上传逻辑：从菜单配置中读取 onUpload 回调并调用它（由外部通过 editorConfig 注入）。
        const config = editor.getMenuConfig(CUSTOM_FILE_MENU_KEY);
        config?.onUpload?.(editor);
    }
}

// 文件上传菜单注册
const registerFileMenu = () => {
    const editorGlobal = globalThis as typeof globalThis & Record<string, boolean>;
    if (editorGlobal[FILE_MENU_REGISTER_FLAG]) return;

    try {
        Boot.registerMenu({
            key: CUSTOM_FILE_MENU_KEY,
            factory() {
                return new MxUploadFileMenu();
            },
        });
        editorGlobal[FILE_MENU_REGISTER_FLAG] = true;
    } catch (error: any) {
        const errorMessage = String(error?.message || error || '');
        // wangEditor 的菜单注册表是全局单例，路由复用或热更新后可能已有同名菜单；此时视为已注册即可。
        if (errorMessage.includes('Duplicated key') && errorMessage.includes(CUSTOM_FILE_MENU_KEY)) {
            editorGlobal[FILE_MENU_REGISTER_FLAG] = true;
            return;
        }
        throw error;
    }
};

// 文件上传菜单注册
watch(
    isFileUploadEnabled,
    (enabled) => {
        if (enabled) {
            registerFileMenu();
        }
    },
    { immediate: true }
);

const hasToolbarMenu = (toolbarKeys: ToolbarMenuKey[], menuKey: string) =>
    // 判断给定 toolbarKeys 中是否包含指定的 menuKey，支持字符串、对象和分组对象的检查。
    toolbarKeys.some((item: any) => item === menuKey || item?.key === menuKey || item?.menuKeys?.includes?.(menuKey));

const buildFullToolbarKeys = (): ToolbarMenuKey[] => [
    // 'headerSelect',             // 标题
    // 'blockquote',               // 引用块，
    'bold', // 粗体
    'underline', // 下划线，
    'italic', // 斜体
    moreStyleGroup, // 更多样式分组，包含删除线、清除样式等较少使用但又不想完全隐藏的功能。
    'color', // 颜色选择
    'bgColor', // 背景色
    'fontSize', // 字体大小
    'fontFamily', // 字体
    'lineHeight', // 行距
    'bulletedList', // 无序列表
    'numberedList', // 有序列表
    // 'todo',                     // 任务列表
    justifyGroup, // 左中右和两端对齐。
    indentGroup, // 增加和减少缩进。
    // 'emotion',                  // 表情
    // 'insertLink',               // 链接
    createImageGroup(), // 图片上传和插入
    createVideoGroup(), // 视频上传和插入
    // 'insertTable',              // 表格
    // 'codeBlock',                // 代码块
    // 'divider',                  // 分割线
    // 'undo',                     // 上一步
    // 'redo',                     // 下一步
    // 'fullScreen',               // 全屏
].filter(Boolean) as ToolbarMenuKey[];

const buildBasicToolbarKeys = (): ToolbarMenuKey[] =>
    [...basicToolbarKeys, createImageGroup(), createVideoGroup()].filter(Boolean) as ToolbarMenuKey[];

/**
 * 根据上传配置移除业务页面不允许使用的图片和视频菜单。
 * @param toolbarKeys 工具栏菜单配置
 * @returns 过滤后的工具栏菜单配置
 */
const removeDisabledMediaMenus = (toolbarKeys: ToolbarMenuKey[]): ToolbarMenuKey[] =>
    toolbarKeys.filter((item: any) => {
        const menuKeys = item?.menuKeys || [];
        const isImageMenu = item === 'uploadImage' || item === 'insertImage' || item?.key === 'group-image' || menuKeys.includes('uploadImage') || menuKeys.includes('insertImage');
        const isVideoMenu = item === 'uploadVideo' || item === 'insertVideo' || item?.key === 'group-video' || menuKeys.includes('uploadVideo') || menuKeys.includes('insertVideo');
        return !(isImageMenu && !isImageUploadEnabled.value) && !(isVideoMenu && !isVideoUploadEnabled.value);
    });

const appendEnabledUploadMenus = (toolbarKeys: ToolbarMenuKey[]) => {
    const nextToolbarKeys = removeDisabledMediaMenus(toolbarKeys);
    if (isImageUploadEnabled.value && !hasToolbarMenu(nextToolbarKeys, 'uploadImage')) {
        nextToolbarKeys.push(createImageGroup());
    }
    if (isVideoUploadEnabled.value && !hasToolbarMenu(nextToolbarKeys, 'uploadVideo')) {
        nextToolbarKeys.push(createVideoGroup());
    }
    if (isFileUploadEnabled.value && !hasToolbarMenu(nextToolbarKeys, CUSTOM_FILE_MENU_KEY)) {
        nextToolbarKeys.push(CUSTOM_FILE_MENU_KEY);
    }
    return nextToolbarKeys;
};

// 工具栏配置：basic/full preset 默认包含图片和视频分组；自定义 toolbarKeys 场景下由 appendEnabledUploadMenus 追加已开启的上传菜单。
const toolbarConfig = computed<Partial<IToolbarConfig>>(() => {
    const toolbarKeys = props.toolbarKeys?.length
        ? props.toolbarKeys
        : props.toolbarPreset === 'full'
        ? buildFullToolbarKeys()
        : buildBasicToolbarKeys();
    return { toolbarKeys: appendEnabledUploadMenus(toolbarKeys) as any[] };
});

// 输入框配置：图片/视频优先走 wangEditor 官方 uploadImage/uploadVideo 菜单的 customUpload。
const editorConfig = computed<Partial<IEditorConfig>>(() => {
    const config: Partial<IEditorConfig> = {
        placeholder: props.placeholder,
        scroll: true,
        autoFocus: props.autoFocus,
        ...(hasMaxLength.value
            ? {
                  maxLength: props.maxLength,
              }
            : {}),
    };

    if (isFileUploadEnabled.value) {
        config.MENU_CONF = {
            [CUSTOM_FILE_MENU_KEY]: {
                onUpload: handleFileMenuUpload,
            },
        };
    }

    if (isImageUploadEnabled.value) {
        config.MENU_CONF = {
            ...(config.MENU_CONF || {}),
            uploadImage: {
                fieldName: 'file',
                maxFileSize: imageUploadConfig.value.maxFileSize,
                maxNumberOfFiles: imageUploadConfig.value.maxNumberOfFiles,
                allowedFileTypes: imageUploadConfig.value.allowedFileTypes,
                timeout: props.uploadConfig?.image?.timeout,
                customUpload: async (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => {
                    try {
                        const result = await runWithUploadLoading('图片上传中...', () =>
                            uploadEditorFile(file, imageUploadConfig.value)
                        );
                        insertFn(result.url, result.name, result.url);
                        emits('upload-success', result, 'image');
                    } catch (error: any) {
                        handleUploadError(error, file, 'image');
                        throw error;
                    }
                },
                onError: (file: File, error: any) => {
                    handleUploadError(error, file, 'image');
                },
            },
        };
    }

    if (isVideoUploadEnabled.value) {
        config.MENU_CONF = {
            ...(config.MENU_CONF || {}),
            uploadVideo: {
                fieldName: 'file',
                maxFileSize: videoUploadConfig.value.maxFileSize,
                maxNumberOfFiles: videoUploadConfig.value.maxNumberOfFiles,
                allowedFileTypes: videoUploadConfig.value.allowedFileTypes,
                timeout: props.uploadConfig?.video?.timeout,
                customUpload: async (file: File, insertFn: (url: string, poster?: string) => void) => {
                    try {
                        const result = await runWithUploadLoading('视频上传中...', () =>
                            uploadEditorFile(file, videoUploadConfig.value)
                        );
                        insertFn(result.url, '');
                        emits('upload-success', result, 'video');
                    } catch (error: any) {
                        handleUploadError(error, file, 'video');
                        throw error;
                    }
                },
                onError: (file: File, error: any) => {
                    handleUploadError(error, file, 'video');
                },
            },
        };
    }

    return config;
});

const validateFile = (file: File, config: UploadItemConfig) => {
    if (config.maxFileSize && file.size > config.maxFileSize) {
        throw new Error(`文件大小超出限制，最大 ${formatFileSize(config.maxFileSize)}`);
    }
};

const normalizeUploadedFile = (file: File, data: any): UploadResult => {
    const url = data?.url || data?.oss?.url;
    if (!url) {
        throw new Error('上传成功但未返回文件地址');
    }
    return {
        id: data?.id,
        url,
        name: data?.name || data?.fileName || file.name,
        size: file.size,
        type: file.type,
    };
};

const uploadSmallFile = async (file: File, identifier: string, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identifier', identifier);
    const res = await uploadSmallFileApi(formData, signal);
    if (res?.code !== 200) {
        throw new Error(res?.message || '文件上传失败');
    }
    return normalizeUploadedFile(file, res.data);
};

const uploadLargeFile = async (
    file: File,
    identifier: string,
    uploadedPartNumbers: number[] = [],
    signal?: AbortSignal
) => {
    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadedChunks = [...uploadedPartNumbers];

    for (let index = 1; index <= totalChunks; index++) {
        if (uploadedChunks.includes(index)) continue;
        const start = (index - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const formData = new FormData();
        // 与 MxWebFileUpload 保持一致：分片接口只接收 file 字段，identifier 和序号放在 URL 中。
        formData.append('file', new Blob([chunk], { type: 'application/octet-stream' }));

        const res = await uploadLargeFileApi(formData, identifier, index, signal);
        if (res?.code !== 200) {
            throw new Error(res?.message || '文件分片上传失败');
        }
        uploadedChunks.push(index);
    }

    const mergeRes = await mergeFileChunksApi(
        {
            fileName: file.name,
            identifier,
            totalSize: file.size,
            totalChunks,
            contentType: file.type,
        },
        signal
    );
    if (mergeRes?.code !== 200) {
        throw new Error(mergeRes?.message || '文件合并失败');
    }
    return normalizeUploadedFile(file, mergeRes.data);
};
/**
 * 计算文件的 MD5 值（每个文件都需要执行）
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - 文件的 MD5 值
 */
async function calculateFileMD5(file: File): Promise<string> {
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

        fileReader.onerror = function () {
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
// 与 MxWebFileUpload 保持一致：先 MD5 秒传校验，小文件直传，大文件分片后合并。
const uploadEditorFile = async (file: File, config: UploadItemConfig): Promise<UploadResult> => {
    validateFile(file, config);
    const identifier = await calculateFileMD5(file);
    const controller = new AbortController();
    const checkRes = await checkFileExists(file, identifier, controller.signal);

    if (checkRes?.code !== 200) {
        throw new Error(checkRes?.message || '文件校验失败');
    }

    if (checkRes.data?.uploaded) {
        return normalizeUploadedFile(file, checkRes.data.oss);
    }

    const chunkSize = 5 * 1024 * 1024;
    if (file.size <= chunkSize) {
        return uploadSmallFile(file, identifier, controller.signal);
    }

    return uploadLargeFile(file, identifier, checkRes.data?.uploadedChunks || [], controller.signal);
};

const handleUploadError = (error: any, file: File, type: 'image' | 'video' | 'file') => {
    // 上传错误由父组件统一处理，编辑器只透传原始错误和文件信息。
    emits('upload-error', error, file, type);
};

const insertFileLink = (editor: any, file: UploadResult) => {
    const prefix = fileUploadConfig.value.linkTextPrefix || '';
    const fileName = escapeHtml(file.name);
    const url = escapeHtml(file.url);
    editor.dangerouslyInsertHtml(
        `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${prefix}${fileName}</a></p>`
    );
};

const handleFileMenuUpload = (editor: any) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileUploadConfig.value.accept;
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            const result = await runWithUploadLoading('文件上传中...', () =>
                uploadEditorFile(file, fileUploadConfig.value)
            );
            insertFileLink(editor, result);
            emits('upload-success', result, 'file');
        } catch (error: any) {
            handleUploadError(error, file, 'file');
        } finally {
            input.value = '';
        }
    };
    input.click();
};

const escapeHtml = (value: string) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value = value / 1024;
        unitIndex++;
    }
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
};

// 输入框输入事件
const handleCreated = (editor: any) => {
    editorRef.value = editor;
    bindViewportLock(editor);
};

// app 端 WebView 聚焦 contenteditable 时，系统会强制 scrollIntoView 把光标滚进可视区，
// 弹窗内使用时浏览器会滚动 window 导致整个视口上移、顶部工具栏被顶出屏幕。
// 这里在编辑器聚焦期间锁定 window 滚动，仅保留编辑器内部（w-e-text-container）滚动。
let editableContainer: HTMLElement | null = null;
let scrollContainer: HTMLElement | null = null;
let originHeight = '';
let originMaxHeight = '';

const restoreViewportScroll = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
};

const onWindowScroll = () => {
    if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0) {
        restoreViewportScroll();
    }
};

// 弹窗容器高度基于 100vh（layout viewport），键盘弹出时不会压缩，容器底部会被键盘遮住，
// 导致内部滚动也无法把光标滚到可视区。聚焦期间把编辑容器高度压到键盘上方剩余空间内。
const syncEditableHeight = () => {
    if (!editableContainer) return;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const containerRect = editableContainer.getBoundingClientRect();
    const available = Math.max(160, vh - containerRect.top - 12);
    if (containerRect.height > available) {
        editableContainer.style.height = `${available}px`;
        editableContainer.style.maxHeight = `${available}px`;
    }
};

const restoreEditableHeight = () => {
    if (!editableContainer) return;
    editableContainer.style.height = originHeight;
    editableContainer.style.maxHeight = originMaxHeight;
};

// window 滚动被锁定后，浏览器原生 scrollIntoView 失效，需要手动滚动编辑器内部容器，
// 将光标定位到软键盘上方的可视区域内（visualViewport.height 为键盘弹出后的真实可视高度）。
const scrollCaretIntoView = () => {
    if (!editableContainer) return;
    const scrollTarget = scrollContainer || editableContainer;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    // 空内容或选区不在编辑器内时 rect 为 0，跳过
    if (!rect || (rect.top === 0 && rect.bottom === 0)) return;
    const containerRect = scrollTarget.getBoundingClientRect();
    const visibleBottom = Math.min(containerRect.bottom, window.visualViewport?.height ?? containerRect.bottom);
    const margin = 24;
    if (rect.bottom > visibleBottom - margin) {
        scrollTarget.scrollTop += rect.bottom - (visibleBottom - margin);
    } else if (rect.top < containerRect.top + margin) {
        scrollTarget.scrollTop -= containerRect.top + margin - rect.top;
    }
};

// 输入/点击/输入法上屏后，等待渲染与键盘动画完成再定位光标。
const onEditableInput = () => {
    setTimeout(scrollCaretIntoView, 50);
    setTimeout(scrollCaretIntoView, 300);
};

// 软键盘弹出/收起会触发 visualViewport resize，需要重新锁定视口、压缩高度并定位光标。
const onViewportResize = () => {
    restoreViewportScroll();
    syncEditableHeight();
    onEditableInput();
};

const onEditableFocusIn = () => {
    // 立即恢复一次，并在软键盘弹出动画期间多次恢复（iOS 滚动发生在异步时机）。
    restoreViewportScroll();
    setTimeout(restoreViewportScroll, 50);
    setTimeout(restoreViewportScroll, 150);
    setTimeout(restoreViewportScroll, 350);
    if (editableContainer) {
        originHeight = editableContainer.style.height;
        originMaxHeight = editableContainer.style.maxHeight;
    }
    syncEditableHeight();
    setTimeout(syncEditableHeight, 150);
    setTimeout(syncEditableHeight, 350);
    onEditableInput();
    setTimeout(scrollCaretIntoView, 350);
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.visualViewport?.addEventListener('resize', onViewportResize);
};

const onEditableFocusOut = () => {
    window.removeEventListener('scroll', onWindowScroll);
    window.visualViewport?.removeEventListener('resize', onViewportResize);
    restoreEditableHeight();
};

const bindViewportLock = (editor: any) => {
    if (!isApp()) return;
    editableContainer = editor.getEditableContainer?.() || null;
    if (!editableContainer) return;
    scrollContainer = editableContainer.querySelector('.w-e-scroll');
    editableContainer.addEventListener('focusin', onEditableFocusIn);
    editableContainer.addEventListener('focusout', onEditableFocusOut);
    editableContainer.addEventListener('keyup', onEditableInput);
    editableContainer.addEventListener('click', onEditableInput);
    editableContainer.addEventListener('compositionend', onEditableInput);
};

const unbindViewportLock = () => {
    window.removeEventListener('scroll', onWindowScroll);
    window.visualViewport?.removeEventListener('resize', onViewportResize);
    if (editableContainer) {
        editableContainer.removeEventListener('focusin', onEditableFocusIn);
        editableContainer.removeEventListener('focusout', onEditableFocusOut);
        editableContainer.removeEventListener('keyup', onEditableInput);
        editableContainer.removeEventListener('click', onEditableInput);
        editableContainer.removeEventListener('compositionend', onEditableInput);
    }
    editableContainer = null;
    scrollContainer = null;
};

// 输入
const handleChange = (res: any) => {
    if (hasMaxLength.value) {
        textLength.value = Number(props.maxLength) - res.getText().replace(/\n|\r/gm, '').length;
    }
    emits('update:modelValue', valueHtml.value);
};

onBeforeUnmount(() => {
    unbindViewportLock();
    editorRef.value?.destroy();
});
</script>

<style lang="postcss" scoped>
.mainEditor {
    width: 100%;
    position: relative;
    border: 1px solid #e0e0e6;
    border-radius: 5px;
    margin-bottom: 10px;
    padding-bottom: 4px;

    :deep(.w-e-toolbar) {
        border-radius: 5px;
    }

    .editor-content {
        width: 100%;
        overflow: hidden;
    }

    .editor-content :deep(> div) {
        height: 100% !important;
    }

    &.is-app-editor {
        display: flex;
        flex-direction: column;
        min-height: 0;

        .editor-content {
            display: flex;
            flex: 1 1 0;
            min-height: 0;
        }

        .editor-content :deep(> div) {
            flex: 1 1 0;
            min-height: 0;
        }

        :deep(.w-e-text-container) {
            flex: 1;
            min-height: 0;
        }

        :deep(.w-e-text-container .w-e-scroll) {
            min-height: 0;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
        }
    }
}
div[data-w-e-type='video'] {
    display: inline-block;
    vertical-align: middle;
    margin: 0 4px;
}

.w-e-textarea-video-container {
    width: auto !important;
    height: auto !important;
    background-image: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: inline-block;
}

video {
    max-width: 100%;
    display: inline-block;
    vertical-align: middle;
}
.editor-upload-mask {
    position: absolute;
    inset: 0;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.72);
    color: #2c65f2;
    font-size: 14px;
}

.editor-upload-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.editor-upload-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(44, 101, 242, 0.18);
    border-top-color: #2c65f2;
    border-radius: 50%;
    animation: mx-editor-upload-spin 0.8s linear infinite;
}

@keyframes mx-editor-upload-spin {
    to {
        transform: rotate(360deg);
    }
}

.editorBottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #999;
    padding: 5px;

    .textLengt {
        color: #666;
        font-size: 14px;
    }

    .submit {
        width: 80px;
        height: 30px;
        border-radius: 15px;
        text-align: center;
        line-height: 30px;
        color: #fff;
        background-color: #fc5531;
    }
}
</style>
