<template>
    <div class="approve-process">
        <div class="process-info">
            <DetailsTitle title="流程信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
            <ApprovalDetails :model-value="detailData.approvalLogs || []" type="vertical" />
        </div>
        <div class="approve-info">
            <div class="approve-info-content">
                <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style approve-descriptions">
                <n-descriptions-item label="申请人">
                    {{ getCellText(detailData.initiatorName) }}
                </n-descriptions-item>
                <n-descriptions-item label="申请部门">
                    {{ getCellText(detailData.deptName) }}
                </n-descriptions-item>
                <n-descriptions-item label="申请事由" :span="2">
                    {{ getCellText(detailData.reason) }}
                </n-descriptions-item>
                <n-descriptions-item label="结算附件" :span="2">
                    <MxWebFileUpload
                        v-if="attachmentList.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="attachmentList"
                        :accept="ATTACHMENT_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="关联审批" :span="2">
                    <MxApprovalSelect :model-value="approvalList" value-format="object" only-show />
                </n-descriptions-item>
                <n-descriptions-item label="结算备注" :span="2">
                    {{ getCellText(detailData.remark) }}
                </n-descriptions-item>
                </n-descriptions>

                <MxFeishuComment :approval-code="approvalInstanceId" :title-style-option="{ padding: '16px 0px' }" />
            </div>
            <MxApprovalCancel
                :approval-id="detailData.approvalId"
                :initiator-lark-id="detailData.initiatorLarkId"
                :reviewing="detailData.status === 'REVIEWING'"
                @success="emit('cancelSuccess')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';
import { normalizeSettlementAssociatedApprovals, normalizeSettlementAttachments } from '../../utils';

const emit = defineEmits<{
    (event: 'cancelSuccess'): void;
}>();

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
.approve-process {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    .process-info {
        width: 240px;
        flex-shrink: 0;
        padding: 16px 16px 16px 0;
        border-right: 1px solid #e2e2e2;
        box-sizing: border-box;
        overflow-y: auto;
    }
    .approve-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }
    .approve-info-content {
        flex: 1;
        min-height: 0;
        padding: 16px 0 16px 16px;
        overflow-y: auto;
    }
}

.approve-descriptions {
    :deep(.n-descriptions-table-content__label) {
        display: inline-block;
        width: 80px !important;
        text-align: right;
        flex-shrink: 0;
        color: var(--base-grey);
        margin-right: 12px;
    }
}
</style>
