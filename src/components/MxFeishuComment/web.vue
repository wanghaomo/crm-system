<template>
    <div class="mx-comment-container">
        <DetailsTitle title="评论列表" :styleOption="resolvedTitleStyleOption" :fontSize="resolvedTitleFontSize" />
        <n-spin :show="loading">
            <div class="comment-list" v-if="comments.length">
                <div v-for="comment in comments" :key="comment.id || comment.createdAt" class="comment-item">
                    <n-avatar class="user-avatar" :src="getAvatar(comment)" size="medium" :round="true" />
                    <div class="comment-content-wrapper">
                        <div class="comment-header">
                            <span class="user-name">{{ comment.userName || '--' }}</span>
                            <span class="comment-time">{{ comment.createdAt || '--' }}</span>
                        </div>
                        <div class="comment-content">
                            <CommentText v-if="comment.content" :content="comment.content" />
                            <span
                                v-else-if="
                                    !comment.images?.length &&
                                    !comment.videos?.length &&
                                    !comment.attachments?.length
                                ">
                                --
                            </span>
                            <div v-if="comment.images?.length" class="comment-image-list">
                                <n-image
                                    v-for="image in comment.images"
                                    :key="image.url"
                                    class="comment-image"
                                    :src="image.url"
                                    :preview-src="image.previewUrl || image.url"
                                    :alt="image.name || '评论图片'"
                                    object-fit="cover" />
                            </div>
                            <div v-if="comment.videos?.length" class="comment-attachment-list">
                                <a
                                    v-for="video in comment.videos"
                                    :key="video.url"
                                    class="comment-attachment"
                                    :href="video.url"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img class="comment-attachment-icon" :src="videoIcon" alt="" />
                                    <span class="comment-attachment-name">{{ video.name }}</span>
                                </a>
                            </div>
                            <div v-if="comment.attachments?.length" class="comment-attachment-list">
                                <a
                                    v-for="file in comment.attachments"
                                    :key="file.url"
                                    class="comment-attachment"
                                    :href="file.url"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <img class="comment-attachment-icon" :src="getFileIconName(file.name, file.url)" alt="" />
                                    <span class="comment-attachment-name">{{ file.name }}</span>
                                </a>
                            </div>
                        </div>

                        <div v-if="comment.childrenComments?.length" class="sub-comment-list">
                            <div v-for="subComment in comment.childrenComments"
                                :key="subComment.id || subComment.createdAt" class="sub-comment-item">
                                <n-avatar class="user-avatar" :src="getAvatar(subComment)" size="medium"
                                    :round="true" />
                                <div class="comment-content-wrapper">
                                    <div class="comment-header">
                                        <span class="user-name">{{ subComment.userName || '--' }}</span>
                                        <span class="comment-time">{{ subComment.createdAt || '--' }}</span>
                                    </div>
                                    <div class="comment-content">
                                        <CommentText v-if="subComment.content" :content="subComment.content" />
                                        <span
                                            v-else-if="
                                                !subComment.images?.length &&
                                                !subComment.videos?.length &&
                                                !subComment.attachments?.length
                                            ">
                                            --
                                        </span>
                                        <div v-if="subComment.images?.length" class="comment-image-list">
                                            <n-image
                                                v-for="image in subComment.images"
                                                :key="image.url"
                                                class="comment-image"
                                                :src="image.url"
                                                :preview-src="image.previewUrl || image.url"
                                                :alt="image.name || '评论图片'"
                                                object-fit="cover" />
                                        </div>
                                        <div v-if="subComment.videos?.length" class="comment-attachment-list">
                                            <a
                                                v-for="video in subComment.videos"
                                                :key="video.url"
                                                class="comment-attachment"
                                                :href="video.url"
                                                target="_blank"
                                                rel="noopener noreferrer">
                                                <img class="comment-attachment-icon" :src="videoIcon" alt="" />
                                                <span class="comment-attachment-name">{{ video.name }}</span>
                                            </a>
                                        </div>
                                        <div v-if="subComment.attachments?.length" class="comment-attachment-list">
                                            <a
                                                v-for="file in subComment.attachments"
                                                :key="file.url"
                                                class="comment-attachment"
                                                :href="file.url"
                                                target="_blank"
                                                rel="noopener noreferrer">
                                                <img class="comment-attachment-icon" :src="getFileIconName(file.name, file.url)" alt="" />
                                                <span class="comment-attachment-name">{{ file.name }}</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <n-empty v-else description="暂无评论" />
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { NAvatar, NEmpty, NImage, NSpin } from 'naive-ui';
import { generateTextAvatar } from '@mx/mx-ui/utils';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userStore';
import { getFeishuApprovalComments } from '@/api/approval';
import { getApprovalUserMap } from '@/utils/approval';
import CommentText from './CommentText.vue';
import { FeishuCommentAttachment, FeishuCommentImage, FeishuCommentItem, FeishuCommentVideo } from './index.type';
import { getFileIconName } from '@/components/FileUpload/index';
import videoIcon from '@/components/FileUpload/img/video.png';
import DetailsTitle from '@/components/DetailsTitle/index.vue';

const props = defineProps<{
    approvalCode: string;
    titleStyleOption?: Record<string, any>;
    titleFontSize?: number;
}>();

const { userInfo } = storeToRefs(useUserStore());
const comments = ref<FeishuCommentItem[]>([]);
const loading = ref(false);
const approvalUserMap = ref<Map<string, any>>(new Map());

const resolvedTitleStyleOption = computed(() => props.titleStyleOption || { padding: '16px' });
const resolvedTitleFontSize = computed(() => props.titleFontSize || 16);

const larkUserId = computed(() => {
    if (import.meta.env.VITE_NODE === 'development') {
        return '5f3d9da8';
    } else {
        return userInfo.value?.larkUserId
    }
});

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
 * 将评论创建时间转换为设计图使用的相对时间。
 * @param value 评论创建时间
 * @returns 相对时间，无法解析时返回原值
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
    if (seconds < 60 * 60) return `${formatChineseNumber(Math.floor(seconds / 60))}分钟前`;
    if (seconds < 60 * 60 * 24) return `${formatChineseNumber(Math.floor(seconds / (60 * 60)))}小时前`;
    if (seconds < 60 * 60 * 24 * 30) return `${formatChineseNumber(Math.floor(seconds / (60 * 60 * 24)))}天前`;
    if (seconds < 60 * 60 * 24 * 365) return `${formatChineseNumber(Math.floor(seconds / (60 * 60 * 24 * 30)))}个月前`;
    return `${formatChineseNumber(Math.floor(seconds / (60 * 60 * 24 * 365)))}年前`;
};

const pickFirst = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
};

const collectText = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(collectText).filter(Boolean).join('');
    if (typeof value === 'object') {
        const directText = pickFirst(value, ['text', 'content', 'comment', 'name']);
        if (directText) return collectText(directText);
        return Object.values(value).map(collectText).filter(Boolean).join('');
    }
    return '';
};

const parseCommentContent = (value: any) => {
    if (!value && value !== 0) return '';
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const normalizeContent = (value: any) => {
    const parsed = parseCommentContent(value);
    if (!parsed && parsed !== 0) return '';
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return collectText(pickFirst(parsed, ['text', 'content', 'comment', 'remark'])) || '';
    }
    return collectText(parsed);
};

/**
 * 从附件对象中读取文件名称。
 * @param file 飞书评论附件对象
 * @returns 文件名称
 */
const getFileName = (file: any): string =>
    String(pickFirst(file, ['name', 'fileName', 'filename', 'file_name', 'title']) || '').trim();

/**
 * 从附件对象中读取文件地址。
 * @param file 飞书评论附件对象
 * @returns 文件地址
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
 * 获取评论图片的展示地址。
 * @param file 飞书评论附件对象
 * @returns 图片展示地址
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
 * 判断评论附件是否为图片。
 * @param file 飞书评论附件对象
 * @returns 是否为图片
 */
const isImageFile = (file: any): boolean => {
    const fileType = String(pickFirst(file, ['type', 'fileType', 'mimeType', 'contentType', 'file_type']) || '')
        .toLowerCase();
    if (fileType.includes('image') || fileType === 'img' || fileType === '图片') return true;
    return /\.(jpg|jpeg|png|gif|bmp|webp|heic)(?:[?#]|$)/i.test(`${getFileName(file)} ${getFileUrl(file)}`);
};

/**
 * 判断评论附件是否为视频。
 * @param file 飞书评论附件对象
 * @returns 是否为视频
 */
const isVideoFile = (file: any): boolean => {
    const fileType = String(pickFirst(file, ['type', 'fileType', 'mimeType', 'contentType', 'file_type']) || '')
        .toLowerCase();
    if (fileType.includes('video') || fileType === '视频') return true;
    return /\.(mp4|avi|wmv|mov|mkv|mpeg|webm)(?:[?#]|$)/i.test(`${getFileName(file)} ${getFileUrl(file)}`);
};

/**
 * 递归遍历飞书评论内容中的媒体附件。
 * @param value 评论内容或评论对象
 * @param handler 发现媒体附件时的处理函数
 */
const collectCommentMedia = (value: any, handler: (file: any) => void): void => {
    const visited = new Set<any>();
    const mediaKeys = new Set(['files', 'images', 'videos', 'attachments', 'imageList', 'videoList', 'fileList', 'media', 'pictures', 'pictureList']);
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
 * 提取图片附件。
 * @param value 评论内容或评论对象
 * @returns 去重后的图片列表
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
 * 提取视频附件。
 * @param value 评论内容或评论对象
 * @returns 去重后的视频列表
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
 * 提取图片、视频之外的普通附件。
 * @param value 评论内容或评论对象
 * @returns 去重后的普通附件列表
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

const getUserByLarkId = (userId: any) => {
    if (!userId) return null;
    return approvalUserMap.value.get(String(userId));
};

const normalizeComment = (item: any): FeishuCommentItem => {
    const userId = item?.userId;
    const user = getUserByLarkId(userId);
    const rawContent = pickFirst(item, ['content', 'comment', 'text', 'remark']);
    const mediaSource = [rawContent, item];
    const images = normalizeCommentImages(mediaSource);
    const videos = normalizeCommentVideos(mediaSource);
    const attachments = normalizeCommentAttachments(mediaSource);
    return {
        id: pickFirst(item, ['id', 'commentId']),
        userId,
        userName: user?.username || item?.userName || '--',
        avatar: user?.avatar || '',
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

const getAvatar = (comment: FeishuCommentItem) => {
    if (comment.avatar) return comment.avatar;
    return generateTextAvatar(comment.userName || '未知用户', false, {
        baseFontSize: 20 * 2.2,
        size: 192,
        isCircle: false,
    });
};

const loadComments = async () => {
    if (!props.approvalCode) {
        comments.value = [];
        return;
    }
    loading.value = true;
    try {
        const [res, userMap] = await Promise.all([
            getFeishuApprovalComments({
                approvalInstanceId: props.approvalCode,
                userId: larkUserId.value,
            }),
            getApprovalUserMap(),
        ]);
        approvalUserMap.value = userMap;
        const list = Array.isArray(res.data) ? res.data : res.data?.comments || [];
        comments.value = list.map((item: any) => normalizeComment(item));
    } catch {
        comments.value = [];
    } finally {
        loading.value = false;
    }
};

watch(
    () => [props.approvalCode, larkUserId.value],
    () => {
        loadComments();
    },
    { immediate: true }
);
</script>

<style lang="postcss" scoped>
.mx-comment-container {
    width: 100%;
    padding: 0 0 16px;
    background-color: #fff;
    border-radius: 8px;
}

.comment-list {
    margin-bottom: 0;
    padding-left: 8px;
}

.comment-item {
    display: flex;
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
}

.user-avatar {
    margin-right: 8px;
    width: 32px;
    height: 32px;
}

.comment-content-wrapper {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    min-height: 20px;
    margin-bottom: 2px;
}

.user-name {
    font-weight: 400;
    margin-right: 8px;
    color: #333333;
    line-height: 20px;
}

.comment-time {
    font-size: 12px;
    line-height: 20px;
    color: #999999;
    margin-right: auto;
}

.comment-content {
    position: relative;
    display: block;
    overflow: hidden;
    margin-bottom: 0;
}

.comment-image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.comment-image {
    flex: 0 0 56px;
    width: 56px;
    min-width: 56px;
    max-width: 56px;
    height: 56px;
    min-height: 56px;
    max-height: 56px;
    overflow: hidden;
    border-radius: 4px;
}

:deep(.comment-image img) {
    width: 56px;
    min-width: 56px;
    max-width: 56px;
    height: 56px;
    min-height: 56px;
    max-height: 56px;
    object-fit: cover;
}

.comment-attachment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.comment-attachment {
    display: flex;
    align-items: center;
    width: 292px;
    height: 44px;
    padding: 8px 12px;
    box-sizing: border-box;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #333333;
    text-decoration: none;
    background: #ffffff;
}

.comment-attachment-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-right: 8px;
}

.comment-attachment-name {
    overflow: hidden;
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.mx-comment-container .comment-item .comment-content-wrapper .comment-content .content-text {
    font-size: 14px !important;
    color: #333 !important;
    line-height: 24px !important;
    word-break: break-word !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    display: block !important;
    overflow: visible !important;
    text-overflow: unset !important;
    max-height: none !important;
}

.sub-comment-list {
    margin-top: 24px;
    padding-left: 8px;
}

.sub-comment-item {
    display: flex;
    margin-bottom: 24px;

    &:last-child {
        margin-bottom: 0;
    }
}
</style>
