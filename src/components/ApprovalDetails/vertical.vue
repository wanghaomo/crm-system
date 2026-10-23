<!-- 审批弹窗 -->
<template>
    <div class="approval_details" :style="{ ...styleOption }">
        <div class="approval_details_conten">
            <template v-if="nodeList.length>0">
                <div
                    class="approval_details_item"
                    :class="{ 'is-reject': !v.isPass || !nodeList[Number(i) + 1]?.isPass }"
                    v-for="(v, i) in nodeList"
                    :key="i">
                    <div class="item_left">
                        <img v-if="isCanceled(v)" src="@/assets/images/comm/icon_com_withdraw.png" alt="" srcset="">
                        <img v-else-if="v.operationType=='审批中'" src="@/assets/images/comm/icon⎽com⎽complete1.png" alt="" srcset="">
                        <img v-else-if="v.isPass || !v.hasOwnProperty('isPass')" src="@/assets/images/comm/icon⎽com⎽complete.png" alt="" srcset="" />
                        <img v-else src="@/assets/images/comm/icon⎽com⎽error.png" alt="" srcset="" />
                    </div>
                    <div class="item_right">
                        <div class="title">
                            <div v-if="v.operationName" class="title_name">
                                {{ v.operationName }}
                            </div>
                            <div v-else class="title_name">
                                {{ v.isPass ? '会签审批通过' : '会签审批不通过' }}
                            </div>
                            <template v-if="v.nodeList && v.nodeList.length > 0">
                                <n-icon
                                    @click="openItem(v, false)"
                                    v-if="v.hasOwnProperty('open') ? v.open : true"
                                    size="16">
                                    <ChevronUp />
                                </n-icon>
                                <n-icon @click="openItem(v, true)" v-else size="16">
                                    <ChevronDown />
                                </n-icon>
                            </template>
                        </div>
                        <div v-if="v.nodeList && v.nodeList.length > 0" class="child-node">
                            <div class="child-item" v-for="(m, n) in v.nodeList" :key="n">
                                <!-- <div class="child-item-name">{{ m.occupation }}-{{ m.operatorName }}</div> -->
                                <div class="child-item-name">{{ m.operationName }}</div>
                                <div
                                    v-if="v.hasOwnProperty('open') ? v.open : true"
                                    class="child-item-isPass"
                                    :class="{ 'is-child-item-isPass': !m.isPass }">
                                    <div class="child-item-state">
                                        <div class="child-state-name">{{ m.operatorName }}</div>
                                        <template v-if="m.remarks">
                                            <n-icon
                                                @click="openItem(m, false)"
                                                v-if="m.hasOwnProperty('open') ? m.open : true"
                                                size="16">
                                                <ChevronUp />
                                            </n-icon>
                                            <n-icon @click="openItem(m, true)" v-else size="16">
                                                <ChevronDown />
                                            </n-icon>
                                        </template>
                                    </div>
                                    <div v-if="m.remarks" class="child-item-remarks">
                                        <span v-if="m.hasOwnProperty('open') ? m.open : true">{{ m.remarks }}</span>
                                    </div>
                                    <template v-if="m.hasOwnProperty('open') ? m.open : true">
                                        <div class="file-box" v-if="getImageAttachments(m.attachments).length || getFileAttachments(m.attachments).length">
                                            <div v-if="getImageAttachments(m.attachments).length" class="approval-attachment-images">
                                            <n-image
                                                v-for="file in getImageAttachments(m.attachments)"
                                                :key="file.url"
                                                class="approval-image"
                                                :src="file.url"
                                                object-fit="cover" />
                                        </div>
                                        <div v-if="getFileAttachments(m.attachments).length" class="approval-file-list">
                                            <div
                                                v-for="file in getFileAttachments(m.attachments)"
                                                :key="file.url"
                                                class="approval-file-card"
                                                :title="file.fileName"
                                                @click="downloadApprovalFile(file)">
                                                <img class="approval-file-icon" :src="getApprovalFileIcon(file)" alt="" />
                                                <span class="approval-file-name">{{ file.originalName }}</span>
                                            </div>
                                        </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                            <!-- 时间需具体字段使用计算属性计算 -->
                            <div class="child-time">{{ v.nodeList[v.nodeList.length - 1].operationTime }}</div>
                        </div>
                        <div v-else>
                            <div class="name">{{ v.operatorName }}</div>
                            <div class="name remarks">{{v.remarks}}</div>
                            <div class="file-box" v-if="getImageAttachments(v.attachments).length || getFileAttachments(v.attachments).length">
                                <div v-if="getImageAttachments(v.attachments).length" class="approval-attachment-images">
                                <n-image
                                    v-for="file in getImageAttachments(v.attachments)"
                                    :key="file.url"
                                    class="approval-image"
                                    :src="file.url"
                                    object-fit="cover" />
                            </div>
                            <div v-if="getFileAttachments(v.attachments).length" class="approval-file-list">
                                <div
                                    v-for="file in getFileAttachments(v.attachments)"
                                    :key="file.url"
                                    class="approval-file-card"
                                    :title="file.fileName"
                                    @click="downloadApprovalFile(file)">
                                    <img class="approval-file-icon" :src="getApprovalFileIcon(file)" alt="" />
                                    <span class="approval-file-name">{{ file.originalName }}</span>
                                </div>
                            </div>
                            </div>
                            <div class="time">{{ v.operationTime }}</div>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="no">暂无审批信息</div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { NIcon, NImage } from 'naive-ui';
import { ChevronDown, ChevronUp } from '@vicons/ionicons5';
import { downloadLargeFile, fileType, getFileIconName } from '@/components/FileUpload/index';
const props = withDefaults(
    defineProps<{
        title: string;
        styleOption?: any;
    }>(),
    {
        title: '标题内容',
        styleOption: {
            padding: '0px',
        },
    }
);
const nodeList: any = defineModel();
const openItem = (v: any, falg: boolean) => {
    v.open = falg;
};

const isCanceled = (item: any) => String(item?.action || '').toUpperCase() === 'CANCELED';

const getFileExtension = (file: any) => {
    const name = String(file?.fileName || '');
    return name.split('.').pop()?.toLowerCase() || '';
};

const isImageFile = (file: any) => {
    const extension = getFileExtension(file);
    return !!extension && fileType['图片'].includes(`.${extension}`);
};

const getImageAttachments = (attachments: any[] = []) => {
    return (attachments || []).filter(isImageFile);
};

const getFileAttachments = (attachments: any[] = []) => {
    return (attachments || []).filter((file) => !isImageFile(file));
};

const getApprovalFileIcon = (file: any) => {
    return getFileIconName(file.fileName || '', file.url || '');
};

const getApprovalFileTypeText = (file: any) => {
    const extension = getFileExtension(file);
    if (['mp4', 'avi', 'wmv', 'mov', 'mkv', 'mpeg', 'webm'].includes(extension)) return '视频';
    if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'wma', 'ape', 'midi', 'ra'].includes(extension)) return '音频';
    if (extension === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'Word';
    if (['xls', 'xlsx'].includes(extension)) return 'Excel';
    if (['ppt', 'pptx'].includes(extension)) return 'PPT';
    if (extension === 'dwg') return 'DWG';
    return '附件';
};

const downloadApprovalFile = (file: any) => {
    if (!file?.url) return;
    downloadLargeFile(file.url, file.originalName || '附件');
};
onMounted(() => {});
</script>
<style lang="postcss" scoped>
.approval_details {
    .approval_details_item {
        display: flex;
        position: relative;

        .item_left {
            margin-right: 8px;

            img {
                width: 22px;
                height: 22px;
                position: relative;
            }
        }

        .item_right {
            flex: 1;
            overflow: hidden;
            .title {
                font-weight: 600;
                font-size: 16px;
                color: var(--base-black);
                margin-bottom: 8px;
                display: flex;
                align-items: center;

                .title_name {
                    margin-right: 4px;
                }
            }

            .name {
                font-size: 14px;
                color: var(--base-grey2);
                margin-bottom: 4px;
            }
.remarks{
    font-size: 12px;
}
            .time {
                font-size: 12px;
                color: var(--base-grey);
                margin-bottom: 40px;
            }

            .approval-attachment-images {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .approval-image {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                overflow: hidden;
            }

            .approval-file-list {
                display: flex;
                padding: 8rpx 0;
                gap: 8rpx 8rpx;
            }

            .approval-file-card {
                width: 100%;
                min-width: 0;
                height: 42px;
                padding: 0 8px;
                display: flex;
                align-items: center;
                gap: 8px;
                background: #fff;
                border: 1px solid #edf0f5;
                border-radius: 4px;
                cursor: pointer;
                box-sizing: border-box;
            }

            .approval-file-card:hover {
                border-color: #2c65f2;
            }

            .approval-file-icon {
                width: 32px;
                height: 32px;
                flex-shrink: 0;
                object-fit: contain;
            }

            .approval-file-name {
                min-width: 0;
                font-weight: 400;
font-size: 14px;
color: #333333;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .child-node {
                margin-bottom: 40px;

                .child-item-name {
                    color: var(--base-grey2);
                    font-size: 14px;
                }

                .child-item-isPass {
                    color: var(--base-grey2);
                    font-size: 14px;
                    color: #0192ff;

                    .child-item-state {
                        display: flex;
                        align-items: center;

                        .child-state-name {
                            margin-right: 4px;
                        }
                    }
                }

                .is-child-item-isPass {
                    color: #e34242;
                }

                .child-item:not(:nth-last-child(1)) {
                    margin-bottom: 12px;
                }

                .child-item-remarks {
                    font-size: 12px;
                }

                .child-time {
                    font-size: 12px;
                    margin-top: 4px;
                    color: var(--base-grey);
                }
            }
        }
    }

    .approval_details_item:not(:last-child)::before {
        content: '';
        width: 0;
        height: calc(100% - 20px);
        border: 1px solid #2c65f2;
        position: absolute;
        left: 10px;
        top: 20px;
        z-index: 1;
    }

    .approval_details_item.is-reject:not(:last-child)::before {
        border-color: #e2e2e5 !important;
    }
}
.no{
    font-size: 14px;
    text-align: center;
    margin-top: 20px;
    color:#c2c2c2;
}

.file-box {
    background-color: #F4F4F4;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
