<template>
    <div class="approval_details">
        <div class="approval_details_conten">
            <div class="approval_details_conten_list" v-if="safeNodeList.length > 0">
                <div class="approval_details_item" :class="{ 'is-reject': !v.isPass || !getNextNode(i)?.isPass }"
                    v-for="(v, i) in safeNodeList" :key="i">
                    <div class="item_left">
                        <img v-if="isCanceled(v)" src="@/assets/images/comm/icon_com_withdraw.png" alt="" srcset="">
                        <img v-else-if="v.operationType == '审批中'" src="@/assets/images/comm/icon⎽com⎽complete1.png" alt=""
                            srcset="">
                        <img v-else-if="v.isPass || !v.hasOwnProperty('isPass')" src="@/assets/images/comm/icon⎽com⎽complete.png" alt="" srcset="" />
                        <img v-else src="@/assets/images/comm/icon⎽com⎽error.png" alt="" srcset="" />
                    </div>
                    <div class="item_right">
                        <div class="item_right_com">
                            <div class="title">
                                <div class="title_box">
                                    <div v-if="v.operationName" class="title_name">
                                        {{ v.operationName }}
                                    </div>
                                    <div v-else class="title_name">
                                        {{ v.isPass ? '会签审批通过' : '会签审批不通过' }}
                                        <template v-if="v.nodeList && v.nodeList.length > 0">
                                            <n-icon @click="openItem(v, false)"
                                                v-if="v.hasOwnProperty('open') ? v.open : true" size="16">
                                                <ChevronUp />
                                            </n-icon>
                                            <n-icon @click="openItem(v, true)" v-else size="16">
                                                <ChevronDown />
                                            </n-icon>
                                        </template>
                                    </div>
                                </div>
                                <!-- 连接线 -->
                                <div class="line" v-if="isNotLastNode(i)"></div>
                            </div>

                            <div v-if="v.nodeList && v.nodeList.length > 0" class="child-node">
                                <div class="child-item" v-for="(m, n) in v.nodeList" :key="n">
                                    <div class="child-item-name">{{ m.operationName }}</div>
                                    <div v-if="v.hasOwnProperty('open') ? v.open : true" class="child-item-isPass"
                                        :class="{ 'is-child-item-isPass': !m.isPass }">
                                        <div class="child-item-state">
                                            <div class="child-state-name">{{ m.operatorName }}</div>
                                            <template v-if="m.remarks">
                                                <n-icon @click="openItem(m, false)"
                                                    v-if="m.hasOwnProperty('open') ? m.open : true" size="16">
                                                    <ChevronUp />
                                                </n-icon>
                                                <n-icon @click="openItem(m, true)" v-else size="16">
                                                    <ChevronDown />
                                                </n-icon>
                                            </template>
                                        </div>
                                        <div v-if="m.remarks" class="child-item-remarks">
                                            <span v-if="m.hasOwnProperty('open') ? m.open : true">{{
                                                m.remarks
                                            }}</span>
                                        </div>
                                        <template v-if="m.hasOwnProperty('open') ? m.open : true">
                                            <div
                                                class="file-box"
                                                v-if="getImageAttachments(getApprovalAttachments(m)).length || getFileAttachments(getApprovalAttachments(m)).length">
                                                <div
                                                    v-if="getImageAttachments(getApprovalAttachments(m)).length"
                                                    class="approval-attachment-images">
                                                    <n-image
                                                        v-for="file in getImageAttachments(getApprovalAttachments(m))"
                                                        :key="file.url"
                                                        class="approval-image"
                                                        :src="file.url"
                                                        object-fit="cover" />
                                                </div>
                                                <div v-if="getFileAttachments(getApprovalAttachments(m)).length" class="approval-file-list">
                                                    <div
                                                        v-for="file in getFileAttachments(getApprovalAttachments(m))"
                                                        :key="file.url"
                                                        class="approval-file-card"
                                                        :title="getDisplayFileName(file)"
                                                        @click="downloadApprovalFile(file)">
                                                        <img class="approval-file-icon" :src="getApprovalFileIcon(file)" alt="" />
                                                        <span class="approval-file-name">{{ getDisplayFileName(file) }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                                <div class="child-time">{{
                                    v.nodeList[v.nodeList.length - 1].operationTime
                                }}</div>
                            </div>

                            <div v-else>
                                <div class="name">{{ v.operatorName }}</div>
                                <div class="name remarks">{{ v.remarks }}</div>
                                <div
                                    class="file-box"
                                    v-if="getImageAttachments(getApprovalAttachments(v)).length || getFileAttachments(getApprovalAttachments(v)).length">
                                    <div v-if="getImageAttachments(getApprovalAttachments(v)).length" class="approval-attachment-images">
                                        <n-image
                                            v-for="file in getImageAttachments(getApprovalAttachments(v))"
                                            :key="file.url"
                                            class="approval-image"
                                            :src="file.url"
                                            object-fit="cover" />
                                    </div>
                                    <div v-if="getFileAttachments(getApprovalAttachments(v)).length" class="approval-file-list">
                                        <div
                                            v-for="file in getFileAttachments(getApprovalAttachments(v))"
                                            :key="file.url"
                                            class="approval-file-card"
                                            :title="getDisplayFileName(file)"
                                            @click="downloadApprovalFile(file)">
                                            <img class="approval-file-icon" :src="getApprovalFileIcon(file)" alt="" />
                                            <span class="approval-file-name">{{ getDisplayFileName(file) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="time">{{ v.operationTime }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="no">暂无审批信息</div>
            </div>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { NIcon, NImage } from 'naive-ui';
import { ChevronDown, ChevronUp } from '@vicons/ionicons5';
import { downloadLargeFile, fileType, getFileIconName } from '@/components/FileUpload/index';

type ApprovalNode = Record<string, any>;

const nodeList = defineModel<ApprovalNode[] | null | undefined>();
const safeNodeList = computed<ApprovalNode[]>(() => (Array.isArray(nodeList.value) ? nodeList.value : []));
const getNodeIndex = (index: string | number) => Number(index);
const getNextNode = (index: string | number) => safeNodeList.value[getNodeIndex(index) + 1];
const isNotLastNode = (index: string | number) => getNodeIndex(index) < safeNodeList.value.length - 1;
const openItem = (v: any, falg: boolean) => {
    v.open = falg;
};
const isCanceled = (item: any) => String(item?.action || '').toUpperCase() === 'CANCELED';

const getDisplayFileName = (file: any) => file?.fileName || file?.originalName || file?.title || '附件';

const getApprovalAttachments = (item: any) => {
    if (Array.isArray(item?.attachments)) return item.attachments;
    if (Array.isArray(item?.fileUrl)) return item.fileUrl;
    return [];
};

const getFileExtension = (file: any) => {
    const name = String(getDisplayFileName(file));
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
    return getFileIconName(getDisplayFileName(file), file.url || '');
};

const downloadApprovalFile = (file: any) => {
    if (!file?.url) return;
    downloadLargeFile(file.url, getDisplayFileName(file));
};
onMounted(() => { });
</script>
  
<style lang="postcss" scoped>
.approval_details {
    overflow: auto;
    background: #F2F3F5;
    padding: 16px 20px;
    border-radius: 4px;
    .approval_details_conten_list {
        display: flex;
        align-items: flex-start;
    }

    .approval_details_item {
        display: flex;
        position: relative;
        align-items: flex-start;

        .item_left {
            margin-right: 8px;

            img {
                width: 22px;
                height: 22px;
            }
        }

        .item_right {
            min-width: 280px;

            .title {
                display: flex;
                align-items: center;
                font-weight: 600;
                font-size: 16px;
                color: var(--base-black, #333);
                margin-bottom: 8px;

                .title_name {
                    margin-right: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .line {
                    flex: 1;
                    height: 1px;
                    background: #0192ff;
                    margin: 0 8px;
                }
            }

    

            .name {
                font-size: 14px;
                color: var(--base-grey2, #666);
                margin-bottom: 4px;
            }

            .remarks {
                font-size: 12px;
                padding-right: 20px;
            }

            .time {
                font-size: 12px;
                color: var(--base-grey, #999);
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
                max-width: 160px;
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
               

                .child-item-name {
                    color: var(--base-grey2, #666);
                    font-size: 14px;
                }

                .child-item-isPass {
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
                    padding-right: 20px;
                }

                .child-time {
                    font-size: 12px;
                    margin-top: 4px;
                    color: var(--base-grey, #999);
                }
            }
        }
    }
}
.is-reject {
    .title .line {
        background: #e2e2e5 !important;
    }
}
.no {
    font-size: 14px;
    text-align: center;
    margin-top: 20px;
    color: #c2c2c2;
}

.file-box {
    background-color: #F4F4F4;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
