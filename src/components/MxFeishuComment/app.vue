<template>
    <section class="mx-feishu-comment-app">
        <h3 class="comment-title">评论列表</h3>

        <div v-if="loading" class="comment-loading">
            <Loading size="24px" color="#2c65f2">加载中...</Loading>
        </div>
        <template v-else-if="comments.length">
            <div class="comment-list">
                <article
                    v-for="(comment, commentIndex) in visibleComments"
                    :key="getCommentKey(comment, commentIndex)"
                    class="comment-item">
                    <img class="comment-avatar" :src="getAvatar(comment)" alt="" />
                    <div class="comment-main">
                        <div class="comment-header">
                            <span class="comment-user-name">{{ comment.userName || '--' }}</span>
                            <span class="comment-time">{{ comment.createdAt || '--' }}</span>
                        </div>

                        <CommentContent
                            :comment="comment"
                            :comment-key="getCommentKey(comment, commentIndex)"
                            :expanded="isContentExpanded(getCommentKey(comment, commentIndex))"
                            @toggle="toggleContent"
                            @preview="previewImages"
                            @open-file="openAttachment" />

                        <div v-if="comment.childrenComments?.length" class="reply-list">
                            <article
                                v-for="(reply, replyIndex) in getVisibleReplies(
                                    comment,
                                    getCommentKey(comment, commentIndex)
                                )"
                                :key="getCommentKey(reply, replyIndex, getCommentKey(comment, commentIndex))"
                                class="reply-item">
                                <img class="reply-avatar" :src="getAvatar(reply)" alt="" />
                                <div class="reply-main">
                                    <div class="comment-header">
                                        <span class="comment-user-name">{{ reply.userName || '--' }}</span>
                                        <template v-if="reply.replyToName">
                                            <span class="reply-label">回复</span>
                                            <span class="comment-user-name">{{ reply.replyToName }}</span>
                                        </template>
                                        <span class="comment-time">{{ reply.createdAt || '--' }}</span>
                                    </div>
                                    <CommentContent
                                        :comment="reply"
                                        :comment-key="
                                            getCommentKey(
                                                reply,
                                                replyIndex,
                                                getCommentKey(comment, commentIndex)
                                            )
                                        "
                                        :expanded="
                                            isContentExpanded(
                                                getCommentKey(
                                                    reply,
                                                    replyIndex,
                                                    getCommentKey(comment, commentIndex)
                                                )
                                            )
                                        "
                                        @toggle="toggleContent"
                                        @preview="previewImages"
                                        @open-file="openAttachment" />
                                </div>
                            </article>

                            <button
                                v-if="(comment.childrenComments?.length || 0) > DEFAULT_REPLY_COUNT"
                                type="button"
                                class="reply-toggle"
                                @click="toggleReplies(getCommentKey(comment, commentIndex))">
                                {{
                                    isRepliesExpanded(getCommentKey(comment, commentIndex))
                                        ? '收起'
                                        : `展开${comment.childrenComments?.length || 0}条回复`
                                }}
                                <Icon
                                    :name="
                                        isRepliesExpanded(getCommentKey(comment, commentIndex))
                                            ? 'arrow-up'
                                            : 'arrow-down'
                                    " />
                            </button>
                        </div>
                    </div>
                </article>
            </div>

            <button
                v-if="visibleCommentCount < comments.length"
                type="button"
                class="more-comments"
                @click="showMoreComments">
                查看更多评论
            </button>
        </template>
        <Empty v-else class="comment-empty" image-size="72" description="暂无评论" />
    </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, PropType, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { Empty, Icon, Image, Loading, showImagePreview } from 'vant';
import { generateTextAvatar } from '@mx/mx-ui/utils';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { getFeishuApprovalComments } from '@/api/approval';
import { getApprovalUserMap } from '@/utils/approval';
import { downloadLargeFile, getFileIconName } from '@/components/FileUpload/index';
import videoIcon from '@/components/FileUpload/img/video.png';
import {
    FeishuCommentAttachment,
    FeishuCommentImage,
    FeishuCommentItem,
    FeishuCommentType,
    FeishuCommentVideo,
} from './index.type';

const DEFAULT_COMMENT_COUNT = 3;
const DEFAULT_REPLY_COUNT = 2;
const COLLAPSED_CONTENT_LENGTH = 44;

const props = defineProps<FeishuCommentType>();
const { userInfo } = storeToRefs(useUserStore());
const comments = ref<FeishuCommentItem[]>([]);
const loading = ref(false);
const approvalUserMap = ref<Map<string, any>>(new Map());
const visibleCommentCount = ref(DEFAULT_COMMENT_COUNT);
const expandedContentKeys = ref<Set<string>>(new Set());
const expandedReplyKeys = ref<Set<string>>(new Set());

const visibleComments = computed(() => comments.value.slice(0, visibleCommentCount.value));
const larkUserId = computed(() => {
    if (import.meta.env.VITE_NODE === 'development') return '5f3d9da8';
    return userInfo.value?.larkUserId;
});

/**
 * 获取对象中第一个有效字段值。
 * @param source 数据源
 * @param keys 候选字段名
 * @returns 首个有效字段值
 */
const pickFirst = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
};

/**
 * 解析评论接口中可能为 JSON 字符串的内容。
 * @param value 原始评论内容
 * @returns 解析后的评论内容
 */
const parseCommentContent = (value: any) => {
    if (!value && value !== 0) return '';
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

/**
 * 递归读取评论文本。
 * @param value 原始文本数据
 * @returns 拼接后的评论文本
 */
const collectText = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(collectText).filter(Boolean).join('');
    if (typeof value === 'object') {
        const directText = pickFirst(value, ['text', 'content', 'comment', 'remark']);
        if (directText) return collectText(directText);
    }
    return '';
};

/**
 * 标准化评论正文。
 * @param value 原始评论内容
 * @returns 评论正文
 */
const normalizeContent = (value: any): string => {
    const parsed = parseCommentContent(value);
    if (!parsed && parsed !== 0) return '';
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return collectText(pickFirst(parsed, ['text', 'content', 'comment', 'remark']));
    }
    return collectText(parsed);
};

/**
 * 获取附件名称。
 * @param file 附件对象
 * @returns 附件名称
 */
const getFileName = (file: any): string =>
    String(pickFirst(file, ['name', 'fileName', 'filename', 'file_name', 'title']) || '').trim();

/**
 * 获取附件原始地址。
 * @param file 附件对象
 * @returns 附件地址
 */
const getFileUrl = (file: any): string =>
    String(
        pickFirst(file, [
            'url',
            'imageUrl',
            'image_url',
            'videoUrl',
            'video_url',
            'fileUrl',
            'file_url',
            'downloadUrl',
            'download_url',
            'previewUrl',
            'preview_url',
            'thumbnailUrl',
            'thumbnail_url',
        ]) || ''
    ).trim();

/**
 * 获取图片缩略图地址。
 * @param file 图片附件对象
 * @returns 图片缩略图地址
 */
const getImageUrl = (file: any): string =>
    String(
        pickFirst(file, [
            'thumbnailURL',
            'thumbnailUrl',
            'thumbnail_url',
            'previewURL',
            'previewUrl',
            'preview_url',
            'url',
            'imageURL',
            'imageUrl',
            'image_url',
        ]) || ''
    ).trim();

/**
 * 判断附件是否为图片。
 * @param file 附件对象
 * @returns 是否为图片
 */
const isImageFile = (file: any): boolean => {
    const type = String(pickFirst(file, ['type', 'fileType', 'mimeType', 'contentType', 'file_type']) || '')
        .toLowerCase();
    if (type.includes('image') || type === 'img' || type === '图片') return true;
    return /\.(jpg|jpeg|png|gif|bmp|webp|heic)(?:[?#]|$)/i.test(`${getFileName(file)} ${getFileUrl(file)}`);
};

/**
 * 判断附件是否为视频。
 * @param file 附件对象
 * @returns 是否为视频
 */
const isVideoFile = (file: any): boolean => {
    const type = String(pickFirst(file, ['type', 'fileType', 'mimeType', 'contentType', 'file_type']) || '')
        .toLowerCase();
    if (type.includes('video') || type === '视频') return true;
    return /\.(mp4|avi|wmv|mov|mkv|mpeg|webm)(?:[?#]|$)/i.test(`${getFileName(file)} ${getFileUrl(file)}`);
};

/**
 * 遍历评论对象中的全部媒体附件。
 * @param value 评论内容或评论对象
 * @param handler 附件处理函数
 */
const collectCommentMedia = (value: any, handler: (file: any) => void): void => {
    const visited = new Set<any>();
    const mediaKeys = new Set([
        'files',
        'images',
        'videos',
        'attachments',
        'imageList',
        'videoList',
        'fileList',
        'media',
        'pictures',
        'pictureList',
    ]);
    const collect = (source: any, depth = 0): void => {
        if (source === null || source === undefined || depth > 5) return;
        if (typeof source === 'string') {
            const parsed = parseCommentContent(source);
            if (parsed !== source) collect(parsed, depth + 1);
            return;
        }
        if (typeof source !== 'object' || visited.has(source)) return;
        visited.add(source);
        if (Array.isArray(source)) {
            source.forEach((item) => collect(item, depth + 1));
            return;
        }
        if (getFileUrl(source)) handler(source);
        Object.entries(source).forEach(([key, child]) => {
            if (mediaKeys.has(key) || key === 'content' || key === 'data' || key === 'comment') {
                collect(child, depth + 1);
            }
        });
    };
    collect(value);
};

/**
 * 提取评论图片。
 * @param value 评论内容或评论对象
 * @returns 图片列表
 */
const normalizeCommentImages = (value: any): FeishuCommentImage[] => {
    const images: FeishuCommentImage[] = [];
    collectCommentMedia(value, (file) => {
        if (!isImageFile(file)) return;
        const url = getFileUrl(file);
        images.push({ url: getImageUrl(file) || url, previewUrl: url, name: getFileName(file) || undefined });
    });
    return images.filter((image, index, list) => list.findIndex((item) => item.url === image.url) === index);
};

/**
 * 提取评论视频。
 * @param value 评论内容或评论对象
 * @returns 视频列表
 */
const normalizeCommentVideos = (value: any): FeishuCommentVideo[] => {
    const videos: FeishuCommentVideo[] = [];
    collectCommentMedia(value, (file) => {
        if (!isVideoFile(file)) return;
        videos.push({ url: getFileUrl(file), name: getFileName(file) || '视频' });
    });
    return videos.filter((video, index, list) => list.findIndex((item) => item.url === video.url) === index);
};

/**
 * 提取评论普通附件。
 * @param value 评论内容或评论对象
 * @returns 普通附件列表
 */
const normalizeCommentAttachments = (value: any): FeishuCommentAttachment[] => {
    const attachments: FeishuCommentAttachment[] = [];
    collectCommentMedia(value, (file) => {
        if (isImageFile(file) || isVideoFile(file)) return;
        const url = getFileUrl(file);
        attachments.push({
            url,
            name: getFileName(file) || '附件',
            fileSize: Number(pickFirst(file, ['fileSize', 'file_size', 'size'])) || undefined,
        });
    });
    return attachments.filter(
        (attachment, index, list) => list.findIndex((item) => item.url === attachment.url) === index
    );
};

/**
 * 将两位以内的时间数量转换为中文数字。
 * @param value 时间数量
 * @returns 中文数字
 */
const formatChineseNumber = (value: number): string => {
    const numberText = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (value < 10) return numberText[value];
    if (value < 20) return `十${value === 10 ? '' : numberText[value % 10]}`;
    if (value < 100) return `${numberText[Math.floor(value / 10)]}十${value % 10 ? numberText[value % 10] : ''}`;
    return String(value);
};

/**
 * 转换评论时间为中文相对时间。
 * @param value 评论时间
 * @returns 相对时间
 */
const formatTime = (value: any): string => {
    if (!value && value !== 0) return '';
    const parsedValue = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    const rawValue = typeof parsedValue === 'number' && parsedValue < 1_000_000_000_000
        ? parsedValue * 1000
        : parsedValue;
    const date = dayjs(rawValue);
    if (!date.isValid()) return String(value);
    const seconds = dayjs().diff(date, 'second');
    if (seconds < 0) return date.format('YYYY-MM-DD HH:mm:ss');
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${formatChineseNumber(Math.floor(seconds / 60))}分钟前`;
    if (seconds < 86400) return `${formatChineseNumber(Math.floor(seconds / 3600))}小时前`;
    if (seconds < 2592000) return `${formatChineseNumber(Math.floor(seconds / 86400))}天前`;
    if (seconds < 31536000) return `${formatChineseNumber(Math.floor(seconds / 2592000))}个月前`;
    return `${formatChineseNumber(Math.floor(seconds / 31536000))}年前`;
};

/**
 * 获取飞书用户信息。
 * @param userId 飞书用户 ID
 * @returns 用户信息
 */
const getUserByLarkId = (userId: any) => {
    if (!userId) return null;
    return approvalUserMap.value.get(String(userId));
};

/**
 * 将接口评论转换为组件数据。
 * @param item 接口评论数据
 * @returns 标准化评论
 */
const normalizeComment = (item: any): FeishuCommentItem => {
    const userId = pickFirst(item, ['userId', 'user_id']);
    const user = getUserByLarkId(userId);
    const rawContent = pickFirst(item, ['content', 'comment', 'text', 'remark']);
    const mediaSource = [rawContent, item];
    const images = normalizeCommentImages(mediaSource);
    const videos = normalizeCommentVideos(mediaSource);
    const attachments = normalizeCommentAttachments(mediaSource);
    const replyTo = pickFirst(item, ['replyTo', 'replyUser', 'parentUser']);
    return {
        id: pickFirst(item, ['id', 'commentId']),
        userId,
        userName: user?.username || pickFirst(item, ['userName', 'username', 'operatorName']) || '--',
        replyToName:
            pickFirst(item, ['replyToName', 'replyUserName', 'parentUserName']) ||
            pickFirst(replyTo, ['userName', 'username', 'name']),
        avatar: user?.avatar || pickFirst(item, ['avatar', 'avatarUrl']),
        createdAt: formatTime(pickFirst(item, ['createdAt', 'createTime', 'updateTime', 'time'])),
        content: normalizeContent(rawContent),
        hasAttachment: images.length > 0 || videos.length > 0 || attachments.length > 0,
        images,
        videos,
        attachments,
        childrenComments: (pickFirst(item, ['childrenComments', 'children', 'replies']) || []).map((child: any) =>
            normalizeComment(child)
        ),
    };
};

/**
 * 获取评论头像。
 * @param comment 评论数据
 * @returns 头像地址
 */
const getAvatar = (comment: FeishuCommentItem): string => {
    if (comment.avatar) return comment.avatar;
    return generateTextAvatar(comment.userName || '未知用户', false, {
        baseFontSize: 44,
        size: 192,
        isCircle: false,
    });
};

/**
 * 生成稳定的评论渲染键。
 * @param comment 评论数据
 * @param index 当前索引
 * @param parentKey 父评论键
 * @returns 评论渲染键
 */
const getCommentKey = (comment: FeishuCommentItem, index: number, parentKey = 'root'): string =>
    String(comment.id || `${parentKey}-${comment.userId || comment.userName}-${comment.createdAt}-${index}`);

/**
 * 判断评论正文是否需要折叠。
 * @param comment 评论数据
 * @returns 是否需要折叠
 */
const isLongContent = (comment: FeishuCommentItem): boolean =>
    String(comment.content || '').length > COLLAPSED_CONTENT_LENGTH;

/**
 * 判断正文是否已展开。
 * @param key 评论键
 * @returns 是否展开
 */
const isContentExpanded = (key: string): boolean => expandedContentKeys.value.has(key);

/**
 * 切换正文展开状态。
 * @param key 评论键
 */
const toggleContent = (key: string): void => {
    const nextKeys = new Set(expandedContentKeys.value);
    if (nextKeys.has(key)) nextKeys.delete(key);
    else nextKeys.add(key);
    expandedContentKeys.value = nextKeys;
};

/**
 * 判断回复列表是否已展开。
 * @param key 主评论键
 * @returns 是否展开
 */
const isRepliesExpanded = (key: string): boolean => expandedReplyKeys.value.has(key);

/**
 * 获取当前需要展示的回复。
 * @param comment 主评论
 * @param key 主评论键
 * @returns 回复列表
 */
const getVisibleReplies = (comment: FeishuCommentItem, key: string): FeishuCommentItem[] => {
    const replies = comment.childrenComments || [];
    return isRepliesExpanded(key) ? replies : replies.slice(0, DEFAULT_REPLY_COUNT);
};

/**
 * 切换回复列表展开状态。
 * @param key 主评论键
 */
const toggleReplies = (key: string): void => {
    const nextKeys = new Set(expandedReplyKeys.value);
    if (nextKeys.has(key)) nextKeys.delete(key);
    else nextKeys.add(key);
    expandedReplyKeys.value = nextKeys;
};

/** 展示下一批主评论。 */
const showMoreComments = (): void => {
    visibleCommentCount.value += DEFAULT_COMMENT_COUNT;
};

/**
 * 打开图片预览。
 * @param images 当前评论图片列表
 * @param index 点击的图片索引
 */
const previewImages = (images: FeishuCommentImage[], index: number): void => {
    showImagePreview({
        images: images.map((image) => image.previewUrl || image.url),
        startPosition: index,
        closeable: true,
    });
};

/**
 * 下载或打开评论附件。
 * @param file 评论附件
 */
const openAttachment = (file: FeishuCommentAttachment | FeishuCommentVideo): void => {
    if (!file.url) return;
    downloadLargeFile(file.url, file.name || '附件');
};

/** 加载评论列表和评论用户信息。 */
const loadComments = async (): Promise<void> => {
    if (!props.approvalCode) {
        comments.value = [];
        return;
    }
    loading.value = true;
    try {
        const [response, userMap] = await Promise.all([
            getFeishuApprovalComments({
                approvalInstanceId: props.approvalCode,
                userId: larkUserId.value,
            }),
            getApprovalUserMap(),
        ]);
        approvalUserMap.value = userMap;
        const list = Array.isArray(response.data) ? response.data : response.data?.comments || [];
        comments.value = list.map((item: any) => normalizeComment(item));
        visibleCommentCount.value = DEFAULT_COMMENT_COUNT;
        expandedContentKeys.value = new Set();
        expandedReplyKeys.value = new Set();
    } catch (error) {
        console.error('加载审批评论失败:', error);
        comments.value = [];
    } finally {
        loading.value = false;
    }
};

const CommentContent = defineComponent({
    name: 'MxFeishuCommentContent',
    props: {
        comment: {
            type: Object as PropType<FeishuCommentItem>,
            required: true,
        },
        commentKey: {
            type: String,
            required: true,
        },
        expanded: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['toggle', 'preview', 'open-file'],
    setup(contentProps, { emit }) {
        return () => {
            const comment = contentProps.comment;
            const contentNodes = [];
            if (comment.content) {
                const textNodes = [
                    h(
                        'div',
                        {
                            class: ['comment-text', { collapsed: isLongContent(comment) && !contentProps.expanded }],
                        },
                        comment.content
                    ),
                ];
                if (isLongContent(comment)) {
                    textNodes.push(
                        h(
                            'button',
                            {
                                type: 'button',
                                class: ['comment-text-toggle', { expanded: contentProps.expanded }],
                                onClick: () => emit('toggle', contentProps.commentKey),
                            },
                            contentProps.expanded ? '收起' : '更多'
                        )
                    );
                }
                contentNodes.push(h('div', { class: 'comment-text-wrapper' }, textNodes));
            }
            if (comment.images?.length) {
                contentNodes.push(
                    h(
                        'div',
                        { class: 'comment-image-list' },
                        comment.images.map((image, index) =>
                            h(Image, {
                                key: image.url,
                                class: 'comment-image',
                                width: 56,
                                height: 56,
                                fit: 'cover',
                                src: image.url,
                                onClick: () => emit('preview', comment.images || [], index),
                            })
                        )
                    )
                );
            }
            if (comment.videos?.length) {
                contentNodes.push(
                    h(
                        'div',
                        { class: 'comment-file-list' },
                        comment.videos.map((video) =>
                            h(
                                'button',
                                {
                                    key: video.url,
                                    type: 'button',
                                    class: 'comment-file-card',
                                    onClick: () => emit('open-file', video),
                                },
                                [
                                    h('img', { class: 'comment-file-icon', src: videoIcon, alt: '' }),
                                    h('span', { class: 'comment-file-name' }, video.name),
                                ]
                            )
                        )
                    )
                );
            }
            if (comment.attachments?.length) {
                contentNodes.push(
                    h(
                        'div',
                        { class: 'comment-file-list' },
                        comment.attachments.map((file) =>
                            h(
                                'button',
                                {
                                    key: file.url,
                                    type: 'button',
                                    class: 'comment-file-card',
                                    onClick: () => emit('open-file', file),
                                },
                                [
                                    h('img', {
                                        class: 'comment-file-icon',
                                        src: getFileIconName(file.name, file.url),
                                        alt: '',
                                    }),
                                    h('span', { class: 'comment-file-name' }, file.name),
                                ]
                            )
                        )
                    )
                );
            }
            return h('div', { class: 'comment-content' }, contentNodes);
        };
    },
});

watch(
    () => [props.approvalCode, larkUserId.value],
    () => {
        loadComments();
    },
    { immediate: true }
);
</script>

<style scoped lang="less">
.mx-feishu-comment-app {
    width: 100%;
    padding: 16px 12px;
    margin-bottom: 12px;
    box-sizing: border-box;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 3px 20px 1px rgba(132, 132, 132, 0.16);
}

.comment-title {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    color: #333333;
}

.comment-loading {
    display: flex;
    justify-content: center;
    padding: 24px 0;
}

.comment-item {
    display: flex;
    margin-bottom: 16px;

    &:last-child {
        margin-bottom: 0;
    }
}

.comment-avatar {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    margin-right: 12px;
    border-radius: 50%;
    object-fit: cover;
}

.comment-main,
.reply-main {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    min-height: 20px;
    margin-bottom: 2px;
    white-space: nowrap;
}

.comment-user-name,
.reply-label {
    margin-right: 6px;
    font-size: 14px;
    line-height: 20px;
    color: #666666;
}

.reply-label {
    color: #999999;
}

.comment-time {
    margin-left: auto;
    padding-left: 8px;
    font-size: 12px;
    line-height: 20px;
    color: #999999;
}

:deep(.comment-text-wrapper) {
    position: relative;
}

:deep(.comment-text) {
    font-size: 14px;
    line-height: 20px;
    color: #333333;
    word-break: break-word;
}

:deep(.comment-text.collapsed) {
    display: -webkit-box;
    overflow: hidden;
    padding-right: 32px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

:deep(.comment-text-toggle) {
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 0 0 0 4px;
    border: 0;
    font-size: 14px;
    line-height: 20px;
    color: #2c65f2;
    background: #ffffff;
}

:deep(.comment-text-toggle.expanded) {
    position: static;
    display: block;
    margin-top: 2px;
    padding-left: 0;
}

:deep(.comment-image-list) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

:deep(.comment-image) {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    overflow: hidden;
    border-radius: 4px;
}

:deep(.comment-file-list) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
}

:deep(.comment-file-card) {
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    box-sizing: border-box;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #333333;
    background: #ffffff;
}

:deep(.comment-file-icon) {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    margin-right: 8px;
}

:deep(.comment-file-name) {
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    line-height: 20px;
    text-align: left;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.reply-list {
    margin-top: 12px;
}

.reply-item {
    display: flex;
    margin-bottom: 12px;

    &:last-of-type {
        margin-bottom: 0;
    }
}

.reply-avatar {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    margin-right: 8px;
    border-radius: 50%;
    object-fit: cover;
}

.reply-toggle {
    display: flex;
    align-items: center;
    margin: 8px 0 0 32px;
    padding: 0;
    border: 0;
    font-size: 14px;
    line-height: 20px;
    color: #666666;
    background: transparent;

    :deep(.van-icon) {
        margin-left: 4px;
        font-size: 12px;
    }
}

.more-comments {
    display: block;
    margin: 16px auto 0;
    padding: 0;
    border: 0;
    font-size: 14px;
    line-height: 20px;
    color: #2c65f2;
    background: transparent;
}

.comment-empty {
    padding: 16px 0 8px;
}
</style>
