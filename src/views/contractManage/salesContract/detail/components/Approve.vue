<template>
    <div class="approve">
        <div class="approve-left">
            <DetailsTitle title="流程信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
            <ApprovalDetails :model-value="detail.approvalLogs || []" type="vertical" />
        </div>
        <div class="approve-right">
            <div class="approve-right-content">
                <DetailsTitle title="审批信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
                <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                <n-descriptions-item label="合同名称">
                    {{ detail.contractName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="含税总金额(万元)">
                    {{ formatNumber(detail.totalAmount) }}
                </n-descriptions-item>
                <n-descriptions-item label="计价方式">
                    {{ formatDict(DICT.PRICING_METHOD, detail.pricingMethod) }}
                </n-descriptions-item>
                <n-descriptions-item label="签订时间">
                    {{ detail.signDate || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="开始时间">
                    {{ detail.startDate || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="结束时间">
                    {{ detail.endDate || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="时长(天)">
                    {{ detail.duration || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="供方单位">
                    {{ formatDict(DICT.SUPPLIER_UNIT, detail.supplierUnit) }}
                </n-descriptions-item>
                <n-descriptions-item label="我方负责人">
                    {{ detail.directorName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同发起人">
                    {{ detail.contractInitiatorName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="所属部门">
                    {{ detail.deptName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同发起部门">
                    {{ detail.contractDeptName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="需方单位">
                    {{ detail.customerName || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="对方负责人">
                    {{ detail.oppositeDuration || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="对方联系方式" :span="2">
                    {{ detail.oppositeTel || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="合同初稿" :span="2">
                    <MxWebFileUpload
                        v-if="detail.contractFileUrlObject?.length"
                        :limit="FILE_UPLOAD_LIMIT"
                        only-show
                        force-app-size
                        :model-value="detail.contractFileUrlObject"
                        :accept="FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="合同终稿" :span="2">
                    <MxWebFileUpload
                        v-if="detail.contractFinalFileUrlObject?.length"
                        :limit="FILE_UPLOAD_LIMIT"
                        only-show
                        force-app-size
                        :model-value="detail.contractFinalFileUrlObject"
                        :accept="FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="多方盖章扫描件" :span="2">
                    <MxWebFileUpload
                        v-if="detail.scannedCopyFileUrlList?.length"
                        :limit="FILE_UPLOAD_LIMIT"
                        only-show
                        force-app-size
                        :model-value="detail.scannedCopyFileUrlList"
                        :accept="FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="附件" :span="2">
                    <MxWebFileUpload
                        v-if="detail.fileUrlList?.length"
                        :limit="FILE_UPLOAD_LIMIT"
                        only-show
                        force-app-size
                        :model-value="detail.fileUrlList"
                        :accept="FILE_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
                <n-descriptions-item label="关联审批" :span="2">
                    <MxApprovalSelect :model-value="detail.associatedApprovalObjects" value-format="object" only-show />
                </n-descriptions-item>
                <n-descriptions-item label="备注" :span="2">
                    {{ detail.remark || '--' }}
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
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { SALES_CONTRACT_DICT, SALES_CONTRACT_FILE_ACCEPT, SALES_CONTRACT_FILE_UPLOAD_LIMIT } from '../../commonTs/conmon';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';

const emit = defineEmits<{
    (event: 'cancelSuccess'): void;
}>();

withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

const FILE_ACCEPT = SALES_CONTRACT_FILE_ACCEPT;
const FILE_UPLOAD_LIMIT = SALES_CONTRACT_FILE_UPLOAD_LIMIT;
const DICT = SALES_CONTRACT_DICT;
const { dictMap } = storeToRefs(useDictStore());

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const formatNumber = (value: any) => {
    if (isEmptyValue(value)) return '--';
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString('zh-CN') : value;
};

const getDictEnum = computed(() => {
    return (name: string) => dictMap.value?.[name] || [];
});

const formatDict = (dictName: string, value: any) => {
    if (isEmptyValue(value)) return '--';
    const matched = getDictEnum.value(dictName).find((item: any) =>
        [item.value, item.label, item.code, item.name, item.text].some(
            (optionValue) => !isEmptyValue(optionValue) && String(optionValue) === String(value)
        )
    );
    return matched?.label || matched?.name || value;
};
</script>

<style lang="less" scoped>
.approve {
    display: flex;
    overflow: hidden;
    flex: 1;
    min-height: 0;
}
.approve-left {
    flex-shrink: 0;
    width: 240px;
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
.mx_crm_descriptions_style {
    :deep(.n-descriptions-table-content__label) {
        display: inline-block;
        width: 112px !important;
        text-align: right;
        flex-shrink: 0;
        color: var(--base-grey);
        margin-right: 12px;
    }
}
</style>
