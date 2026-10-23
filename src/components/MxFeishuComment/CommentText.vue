<template>
    <div class="comment-container">
        <div
            ref="commentContent"
            class="comment-content"
            :class="{ collapsed: isCollapsed, no_ellipsis: !needEllipsis }">
            {{ content }}
            <span class="ellipsis" v-if="needExpand && needEllipsis && isCollapsed">...</span>
        </div>
        <button v-if="needExpand" @click="toggleExpand" class="expand-btn">
            {{ isCollapsed ? '展开' : '收起' }}
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
    content: {
        type: String,
        required: true,
    },
    maxLines: {
        type: Number,
        default: 2, // 最多显示3行
    },
});

const commentContent = ref(null);
const needExpand = ref(false);
const isCollapsed = ref(true);

// 是否显示省略
const needEllipsis = ref(true);
// 计算实际行数
const calculateLines = () => {
    if (!commentContent.value) return;

    const element = commentContent.value;
    const styles = window.getComputedStyle(element);

    // 获取行高
    let lineHeight = parseFloat(styles.lineHeight);
    if (styles.lineHeight === 'normal') {
        const fontSize = parseFloat(styles.fontSize);
        lineHeight = fontSize * 1.2;
    }

    // 计算总行数
    const totalLines = Math.ceil(element.scrollHeight / lineHeight);

    // 判断是否需要展开按钮
    needExpand.value = totalLines > props.maxLines;

    // 如果需要收起，限制高度
    if (needExpand.value && isCollapsed.value) {
        element.style.maxHeight = `${props.maxLines * lineHeight}px`;
        needEllipsis.value = true;
    } else {
        element.style.maxHeight = 'none';
        needEllipsis.value = false;
    }
};

// 切换展开/收起
const toggleExpand = () => {
    isCollapsed.value = !isCollapsed.value;

    nextTick(() => {
        if (commentContent.value) {
            if (isCollapsed.value) {
                const styles = window.getComputedStyle(commentContent.value);
                let lineHeight = parseFloat(styles.lineHeight);
                if (styles.lineHeight === 'normal') {
                    const fontSize = parseFloat(styles.fontSize);
                    lineHeight = fontSize * 1.2;
                }
                commentContent.value.style.maxHeight = `${props.maxLines * lineHeight}px`;
            } else {
                commentContent.value.style.maxHeight = `${commentContent.value.scrollHeight}px`;
            }
        }
    });
};

onMounted(() => {
    calculateLines();

    // 监听窗口大小变化
    window.addEventListener('resize', calculateLines);
});

onUnmounted(() => {
    // 移除监听器
    window.removeEventListener('resize', calculateLines);
});
</script>

<style lang="postcss" scoped>
.comment-container {
    position: relative;
}

.comment-content {
    position: relative;
    overflow: hidden;
    transition: max-height 0.3s ease;
    word-break: break-word;
    line-height: 1.5;
    .ellipsis {
        display: inline-block;
        position: absolute;
        bottom: 0;
        right: 0;
        padding-left: 8px;
        line-height: 1.5;
        background-color: #fff;
    }
}
.no_ellipsis {
    .ellipsis {
        display: none;
    }
}

.expand-btn {
    margin-top: 8px;
    color: #2C65F2;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
}

.expand-btn:hover {
    color: #2C85F2;
}
</style>
