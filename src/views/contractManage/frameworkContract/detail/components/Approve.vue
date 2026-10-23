<template>
    <div class="approve-con">
        <div class="approve-left">
            <DetailsTitle title="流程信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
            <ApprovalDetails :model-value="detail.approvalLogs || []" type="vertical" />
        </div>
        <div class="approve-right">
            <div class="approve-right-content">
                <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />

                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                <n-descriptions-item label="合同名称">
                    {{ detail?.contractName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同金额(万元)">
                    {{ detail?.contractAmount || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="计价方式">
                    {{ pricingMethodName }}
                </n-descriptions-item>
                <n-descriptions-item label="开始时间">
                    {{ detail?.startDate || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="结束时间">
                    {{ detail?.endDate || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="时长(天)">
                    {{ detail?.duration || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="供方单位">
                    {{ supplierUnitName }}
                </n-descriptions-item>
                <n-descriptions-item label="我方负责人">
                    {{ detail?.directorName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同发起人">
                    {{ detail?.contractInitiatorName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="所属部门">
                    {{ detail?.deptName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同发起部门">
                    {{ detail?.contractDeptName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="对方负责人">
                    {{ detail?.oppositeDuration || '--' }}
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="对方联系方式">
                    {{ detail?.oppositeTel || '--' }}
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="合同初稿">
                    <MxWebFileUpload
                        v-if="detail.contractFileUrlObject?.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="detail.contractFileUrlObject"
                        :accept="FRAMEWORK_FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="合同终稿">
                    <MxWebFileUpload
                        v-if="detail.contractFinalFileUrlObject?.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="detail.contractFinalFileUrlObject"
                        :accept="FRAMEWORK_FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="多方盖章扫描件">
                    <MxWebFileUpload
                        v-if="detail.scannedCopyFileUrlList?.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="detail.scannedCopyFileUrlList"
                        :accept="FRAMEWORK_FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="附件">
                    <MxWebFileUpload
                        v-if="detail.fileUrlList?.length"
                        :limit="9"
                        only-show
                        force-app-size
                        :model-value="detail.fileUrlList"
                        :accept="FRAMEWORK_FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item :span="2" label="关联审批">
                    <MxApprovalSelect :model-value="detail.associatedApprovalObjects" value-format="object" only-show />
                </n-descriptions-item>
                </n-descriptions>

                <MxFeishuComment :approval-code="detail.approvalInstanceId || ''" :title-style-option="{ padding: '16px 0px' }" />
            </div>
            <MxApprovalCancel
                :approval-id="detail.approvalId"
                :initiator-lark-id="detail.contractInitiatorLarkId"
                :reviewing="detail.status === 'AUDITING'"
                @success="emit('cancelSuccess')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import MxFeishuComment from '@/components/MxFeishuComment/index.vue';
import { useDictStore } from '@/store/commStore';
import { NDescriptionsItem, NDescriptions } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { FRAMEWORK_FILE_ACCEPT } from '../../commonTs/common';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';

const emit = defineEmits<{
    (event: 'cancelSuccess'): void;
}>();

const { dictMap } = storeToRefs(useDictStore());

const getDictEnum = computed(() => {
    return (name: string) => {
        if (dictMap.value) {
            return dictMap.value[name] || [];
        }
        return [];
    };
});

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const pricingMethodName = computed(() => {
    return getDictEnum.value('计价方式')?.find((item: any) => item.value === props.detail.pricingMethod)?.label || props.detail.pricingMethod || '--';
});
const supplierUnitName = computed(() => {
    return getDictEnum.value('供方单位')?.find((item: any) => item.value === props.detail.supplierUnit)?.label || props.detail.supplierUnit || '--';
});
</script>

<style lang="less" scoped>
.approve-con {
    display: flex;
    overflow: hidden;
    flex: 1;
    min-height: 0;
}
.approve-left {
    width: 260px;
    flex-shrink: 0;
    padding: 16px;
    border-right: 1px solid var(--draw-border);
    box-sizing: border-box;
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
</style>
