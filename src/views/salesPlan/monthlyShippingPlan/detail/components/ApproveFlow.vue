<template>
    <div class="approve-flow">
        <div class="approve-left">
            <DetailsTitle title="流程信息" :styleOption="{ padding: '0 0 18px' }" :fontSize="16" />
            <ApprovalDetails :model-value="detail.approvalLogs || []" type="vertical" />
        </div>

        <div class="approve-right">
            <div class="approve-right-content">
                <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style approve-info">
                <n-descriptions-item label="申请人">
                    {{ detail.applicantName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="审批备注" :span="2">
                    {{ detail.approvalRemark || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="事项说明" :span="2">
                    {{ detail.instruction || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="附件" :span="2">
                    <MxWebFileUpload
                        v-if="detail.attachments?.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="detail.attachments || []"
                        :accept="attachmentAccept" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="关联审批" :span="2">
                    <MxApprovalSelect :model-value="detail.associatedApprovals" value-format="object" only-show />
                </n-descriptions-item>
                </n-descriptions>

                <MxFeishuComment
                    :approval-code="detail.approvalInstanceId || ''"
                    :title-style-option="{ padding: '16px 0px' }" />
            </div>
            <MxApprovalCancel
                :approval-id="detail.approvalDTO?.id"
                :initiator-lark-id="detail.approvalDTO?.larkUserId"
                :reviewing="detail.status === 'REVIEWING'"
                @success="emit('cancelSuccess')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';

const emit = defineEmits<{
    (event: 'cancelSuccess'): void;
}>();

const attachmentAccept = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);
</script>

<style lang="less" scoped>
.approve-flow {
    flex: 1;
    height: 100%;
    min-height: 0;
    display: flex;
    overflow: hidden;
}

.approve-left {
    width: 240px;
    flex-shrink: 0;
    padding: 16px 16px;
    border-right: 1px solid #e8e8e8;
    box-sizing: border-box;
    min-height: 0;
    overflow-y: auto;
}

.approve-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.approve-right-content {
    flex: 1;
    min-height: 0;
    padding: 16px;
    overflow-y: auto;
}

.approve-info {
    :deep(.n-descriptions-table-content__label) {
        width: 56px;
    }

    :deep(.n-descriptions-table-content) {
        padding-bottom: 20px;
    }
}

.attachment-list {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
}

.attachment-thumb {
    width: 112px;
    height: 112px;
    border-radius: 4px;
    background:
        linear-gradient(135deg, rgba(11, 21, 36, 0.2), rgba(11, 21, 36, 0.8)),
        url('@/assets/images/imgNavBg.png') center/cover no-repeat;
}

:deep(.timeline-wrapper) {
    padding-left: 4px;
}
</style>
