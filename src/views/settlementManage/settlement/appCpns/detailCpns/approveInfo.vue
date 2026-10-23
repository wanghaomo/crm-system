<template>
    <card title="流程信息">
        <ApprovalDetails :model-value="detailData.approvalLogs || []" type="vertical" />
    </card>
    <card title="审批信息">
        <div class="row">
            <div class="item">
                <div class="label">申请人</div>
                <div class="value">{{ getCellText(detailData.initiatorName) }}</div>
            </div>
            <div class="item">
                <div class="label">申请部门</div>
                <div class="value">{{ getCellText(detailData.deptName) }}</div>
            </div>
            <div class="item wrap" style="padding-top: 2px;">
                <div class="label">申请事由</div>
                <div class="value">{{ getCellText(detailData.reason) }}</div>
            </div>
            <div class="item wrap">
                <div class="label">结算附件</div>
                <div class="value">
                    <MxWebFileUpload
                        v-if="attachmentList.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="attachmentList"
                        :accept="ATTACHMENT_ACCEPT" />
                    <template v-else>--</template>
                </div>
            </div>
            <div class="item wrap">
                <div class="label">关联审批</div>
                <div class="value">
                    <MxApprovalSelect
                        v-if="approvalList.length"
                        class="associated-approval-select"
                        :model-value="approvalList"
                        value-format="object"
                        :multiple="true"
                        hide-trigger />
                    <template v-else>--</template>
                </div>
            </div>
            <div class="item wrap">
                <div class="label">结算备注</div>
                <div class="value">{{ getCellText(detailData.remark) }}</div>
            </div>
        </div>
    </card>
    <MxFeishuComment :approval-code="approvalInstanceId" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import card from '../card.vue';
import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import { normalizeSettlementAssociatedApprovals, normalizeSettlementAttachments } from '../../utils';

const ATTACHMENT_ACCEPT = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx'];

const props = defineProps({
    detailData: {
        type: Object,
        default: () => ({}),
    },
});

/**
 * 获取字段展示值，空值统一展示占位符。
 * @param value 原始字段值
 * @returns 展示文案
 */
const getCellText = (value: any) => {
    return value === null || value === undefined || value === '' ? '--' : value;
};

const attachmentList = computed(() => {
    return props.detailData.attachmentsInfoObject?.length
        ? props.detailData.attachmentsInfoObject
        : normalizeSettlementAttachments(props.detailData.attachmentsInfo);
});

const approvalList = computed(() => {
    return props.detailData.associatedApprovalObjects?.length
        ? props.detailData.associatedApprovalObjects
        : normalizeSettlementAssociatedApprovals(props.detailData.associatedApproval);
});

const approvalInstanceId = computed(() => props.detailData.approvalInstanceId || props.detailData.approvalDTO?.approvalInstanceId || '');
</script>

<style scoped lang="less">
.row {
    .item {
        display: flex;
        padding: 14px 0px;
        border-bottom: 1px solid #ededed;
        .label {
            font-size: 16px;
            color: #999999;
            width: 100px;
        }
        .value {
            font-size: 16px;
            color: #333333;
            flex: 1;
        }
    }
    .wrap {
        flex-wrap: wrap;
        .label {
            width: 100%;
        }
        .value {
            width: 100%;
            margin-top: 8px;
        }
    }
}

:deep(.associated-approval-select .approval-app-selected-remove) {
    display: none;
}
</style>
