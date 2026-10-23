<template>
    <div class="approve-detail">
        <DetailsTitle title="审批信息" :styleOption="{ padding: '0px 0px 16px 0' }" :fontSize="16" />
        <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style approve-info">
            <n-descriptions-item label="申请人">
                <div class="link-value">{{ text(detail.applicantName) }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="申请部门">
                <div class="link-value">{{ text(detail.applyDeptName) }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="所属公司" :span="2">
                <div class="link-value">{{ text(detail.companyName) }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="审批备注" :span="2">
                <div class="link-value">{{ text(detail.approvalRemark) }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="事项说明" :span="2">
                <div class="link-value">{{ text(detail.instruction) }}</div>
            </n-descriptions-item>
            <n-descriptions-item label="附件" :span="2">
                <MxWebFileUpload
                    v-if="detail.attachments?.length"
                    :limit="ATTACHMENT_LIMIT"
                    only-show
                    force-app-size
                    :model-value="detail.attachments"
                    :accept="ATTACHMENT_ACCEPT" />
                <span v-else>--</span>
            </n-descriptions-item>
            <n-descriptions-item label="关联审批" :span="2">
                <MxApprovalSelect :model-value="detail.associatedApprovals" value-format="object" only-show />
            </n-descriptions-item>
        </n-descriptions>

        <div class="comment-section">
            <MxFeishuComment
                :approval-code="detail.approvalDTO?.approvalInstanceId || ''"
                :title-style-option="{ padding: '16px 0' }" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import { ATTACHMENT_ACCEPT, ATTACHMENT_LIMIT } from '../../../commonTs/conmon';

withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const isEmptyValue = (value: any) => value === null || value === undefined || value === '';

const text = (value: any) => (isEmptyValue(value) ? '--' : value);
</script>

<style lang="less" scoped>
.approve-detail {
    min-height: 100%;
}

.approve-info {
    :deep(.n-descriptions-table-content__label) {
        width: 86px;
    }
}

.comment-section {
    margin-top: 2px;
}
</style>
