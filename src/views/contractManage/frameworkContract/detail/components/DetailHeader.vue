<template>
    <div class="detail-item">
        <div class="detail-header">
            <div class="company-name">{{ detail.customerName || '--' }}</div>
            <StatusTag :text="statusName" :color="statusTagStyle.color" :bgColor="statusTagStyle.backgroudColor" :borderColor="statusTagStyle.bdColor" />
        </div>
        <div style="width: 40%;">
            <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style aline-left">
                <n-descriptions-item label="合同编号">
                    {{ detail?.contractCode || '--' }}
                </n-descriptions-item>
                <n-descriptions-item label="签订时间">
                    {{ detail?.signDate || '--' }}
                </n-descriptions-item>
            </n-descriptions>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { statusConfig } from '../../commonTs/common';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
    }>(),
    {
        detail: () => ({}),
    }
);

type StatusConfigItem = typeof statusConfig[number];

const statusInfo = computed<StatusConfigItem | undefined>(() => {
    return statusConfig.find((item) => item.value === props.detail.status);
});

const statusName = computed(() => statusInfo.value?.label || '--');

const statusTagStyle = computed<StatusConfigItem>(() => {
    return statusInfo.value || {} as StatusConfigItem;
});
</script>

<style lang="less" scoped>
.detail-item {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px;
    overflow: hidden;
    padding: 16px;
    flex-shrink: 0;
    margin-bottom: 12px;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.company-name {
    font-weight: 600;
    font-size: 16px;
    color: #333333;
}



.aline-left {
    :deep(.n-descriptions-table-content__label) {
        text-align: left;
        width: fit-content !important;
    }

    :deep(.n-descriptions-table-content) {
        width: 300px;
        flex-basis: 1;
    }
}
</style>
