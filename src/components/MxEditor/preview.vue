<template>
    <div class="mx-editor-preview" :class="{ 'is-scrollable': props.maxHeight !== 'none' }">
        <div
            class="preview-editor-content"
            :style="{
                minHeight: props.minHeight,
                maxHeight: props.maxHeight,
                overflowY: props.maxHeight !== 'none' ? 'auto' : 'visible',
            }">
            <Editor
                v-model="valueHtml"
                :default-config="editorConfig"
                :style="{ height: '100%', width: '100%' }"
                mode="default"
                @onCreated="handleCreated" />
        </div>
    </div>
</template>
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { Editor } from '@wangeditor/editor-for-vue';
import { IDomEditor } from '@wangeditor/editor';
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';

const props = withDefaults(
    defineProps<{
        modelValue: string;
        minHeight?: string;
        maxHeight?: string;
    }>(),
    {
        modelValue: '',
        minHeight: '100px',
        maxHeight: 'none',
    }
);

const valueHtml = ref(props.modelValue || '');
const editorRef = shallowRef<IDomEditor | null>(null);

watch(
    () => props.modelValue,
    (newVal) => {
        valueHtml.value = newVal || '';
    },
    { immediate: true }
);

// 预览模式编辑器配置：只读、禁用自动聚焦、无 placeholder
const editorConfig = {
    readOnly: true,
    scroll: true,
    autoFocus: false,
    placeholder: '',
};

const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor;
};

onBeforeUnmount(() => {
    editorRef.value?.destroy();
});
</script>

<style lang="less" scoped>
.mx-editor-preview {
    width: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
    min-height: 0;
    // padding: 12px;

    .preview-editor-content {
        display: flex;
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        overflow-x: hidden;
    }

    .preview-editor-content :deep(> div) {
        flex: 1 1 0;
        min-height: 0;
        height: 100% !important;
    }

    :deep(.w-e-text-container) {
        background-color: transparent !important;
    }

    :deep(.w-e-text-container .w-e-scroll) {
        overflow: visible !important;
    }

    &.is-scrollable :deep(.w-e-text-container .w-e-scroll) {
        overflow-x: hidden !important;
        overflow-y: auto !important;
    }

    // 确保富文本内容样式正常渲染
    :deep([data-slate-editor]) {
        // padding: 0 !important;

        p,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        ul,
        ol,
        blockquote,
        pre,
        table {
            margin: 0;
            line-height: 1.75;
        }

        img {
            max-width: 100% !important;
            height: auto;
        }

        // 视频节点：保持内容原始比例，同时限制在容器宽度内。
        video,
        [data-w-e-type='video'] {
            max-width: 100% !important;
        }

        a {
            color: #1890ff;
            text-decoration: underline;
        }

        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 10px;
            color: #666;
        }

        table {
            border-collapse: collapse;
            width: 100%;

            td,
            th {
                border: 1px solid #ccc;
                padding: 4px 8px;
                min-width: 50px;
            }
        }

        ul,
        ol {
            padding-left: 20px;
        }
    }
}
</style>
