<template>
    <div class="info-con">
        <DetailsTitle title="基础信息" :styleOption="{ padding: '16px 0px' }" :fontSize="16" />
        <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
            <n-descriptions-item label="矿石种类">
                {{ mineralTypeName }}
            </n-descriptions-item>
            <n-descriptions-item label="矿石品位(%)">
                {{ detail?.grade || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="年度约定总量(万吨)">
                {{ detail?.annualQuantity || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="已执行量(万吨)">
                {{ detail?.executedQuantity || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="剩余量(万吨)">
                {{ detail?.remainingQuantity || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="价格机制">
                {{ priceMechanismName }}
            </n-descriptions-item>
            <n-descriptions-item label="具体价格">
                {{ detail?.specificPrice || '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="合同期限">
                {{ detail?.startDate ? detail?.startDate + '至' + detail?.endDate : '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="结算方式">
                {{ paymentMethodName }}
            </n-descriptions-item>
            <n-descriptions-item label="关联AI分析报告编号">
                {{ detail?.aiReportCode || '--' }}
            </n-descriptions-item>
            <n-descriptions-item :span="2" label="AI建议">
                {{ detail?.suggestion || '--' }}
            </n-descriptions-item>
            <n-descriptions-item :span="2" label="合同备注">
                {{ detail?.remark || '--' }}
            </n-descriptions-item>
        </n-descriptions>
    </div>
</template>

<script setup lang="ts">
import { useDictStore } from '@/store/commStore';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const { dictMap } = storeToRefs(useDictStore());
// 字典枚举获取
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

const mineralTypeName = computed(() => {
    return getDictEnum.value('矿种').find((item: any) => item.value === props.detail.mineralType)?.label || props.detail.mineralType || '--';
});
const priceMechanismName = computed(() => {
    return getDictEnum.value('价格机制').find((item: any) => item.value === props.detail.priceMechanism)?.label || props.detail.priceMechanism || '--';
});
const paymentMethodName = computed(() => {
    return getDictEnum.value('结算方式').find((item: any) => item.value === props.detail.paymentMethod)?.label || props.detail.paymentMethod || '--';
});
</script>

<style lang="less" scoped>
.info-con {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
}

.mx_crm_descriptions_style {
   :deep( .n-descriptions-table-content__label) {
        display: inline-block;
        width: 130px !important;
        text-align: right;
        flex-shrink: 0;
        color: var(--base-grey);
        margin-right: 12px;
    }
}
</style>
