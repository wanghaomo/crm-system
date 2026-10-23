export interface FeishuCommentItem {
    id?: string;
    userId?: string;
    userName: string;
    replyToName?: string;
    avatar?: string;
    content: string;
    createdAt: string;
    hasAttachment?: boolean;
    images?: FeishuCommentImage[];
    videos?: FeishuCommentVideo[];
    attachments?: FeishuCommentAttachment[];
    childrenComments?: FeishuCommentItem[];
}

export interface FeishuCommentImage {
    url: string;
    previewUrl?: string;
    name?: string;
}

export interface FeishuCommentVideo {
    url: string;
    name: string;
}

export interface FeishuCommentAttachment {
    url: string;
    name: string;
    fileSize?: number;
}

export type FeishuCommentType = {
    approvalCode: string;
    titleStyleOption?: Record<string, any>;
    titleFontSize?: number;
};
