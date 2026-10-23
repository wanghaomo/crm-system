<template>
    <div class="basic-info">
        <div class="section">
            <DetailsTitle title="基础信息" :styleOption="{ padding: '0 0 16px' }" :fontSize="16" />
            <div class="info-list">
                <InfoLine label="计划发货月份" :value="detail.monthlyMonth" />
                <InfoLine label="定价月份" :value="detail.pricingMonth" />
                <InfoLine label="关联AI分析报告编码">
                    <span
                        v-if="detail.aiReportCode"
                        class="link-text"
                        :class="{ disabled: reportDetailLoading || !detail.aiReportId }"
                        @click="openReportDetail">
                        {{ reportDetailLoading ? '加载中...' : detail.aiReportCode }}
                    </span>
                    <span v-else>--</span>
                </InfoLine>
                <InfoLine label="关联基准定价单">
                    <span v-if="detail.basePricingLoading">加载中...</span>
                    <span v-else-if="detail.basePricingDisplayList?.length" class="link-list">
                        <span
                            v-for="(item, index) in detail.basePricingDisplayList"
                            :key="item.id || `${item.label}-${index}`"
                            class="link-text"
                            @click="openBasePricingDetail(item)">
                            {{ item.label }}{{ index === detail.basePricingDisplayList.length - 1 ? '' : '、' }}
                        </span>
                    </span>
                    <span v-else>--</span>
                </InfoLine>
                <InfoLine label="计划备注" :value="detail.remark" />
            </div>
        </div>

        <div class="section">
            <DetailsTitle title="历史合同剩余明细" :styleOption="{ padding: '18px 0px' }" :fontSize="16" />
            <MxWebDataTable v-bind="historyTableConfig" />
        </div>

        <div class="section">
            <DetailsTitle title="本月新增计划明细" :styleOption="{ padding: '18px 0px 0' }" :fontSize="16" />
            <MxTab v-model="companyType" :tabs="companyTabs" class="company-tabs" />
            <MonthlyAddPlanTable :columns="currentAddPlanColumns" :data="monthlyAddDetailList" />
        </div>

        <div class="section section-last">
            <DetailsTitle title="按品位汇总" :styleOption="{ padding: '18px 0px' }" :fontSize="16" />
            <MxWebDataTable v-bind="summaryTableConfig" />
        </div>
        <FirmPriceDetail ref="firmPriceDetailRef" />
        <TraffickerPriceDetail ref="traffickerPriceDetailRef" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InfoLine from './InfoLine.vue';
import MonthlyAddPlanTable from './MonthlyAddPlanTable.vue';
import FirmPriceDetail from '../../../firmPrice/detail/index.vue';
import TraffickerPriceDetail from '../../../traffickerPrice/components/Detail/index.vue';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
        chemicalAddPlanColumns: any[];
        traderAddPlanColumns: any[];
        historyTableConfig: Record<string, any>;
        summaryTableConfig: Record<string, any>;
        reportDetailLoading: boolean;
    }>(),
    {
        detail: () => ({}),
        chemicalAddPlanColumns: () => [],
        traderAddPlanColumns: () => [],
        historyTableConfig: () => ({}),
        summaryTableConfig: () => ({}),
        reportDetailLoading: false,
    }
);
const emit = defineEmits(['open-report-detail']);

const companyType = ref('chemical');
const companyTabs = [
    { name: '化工企业', key: 'chemical' },
    { name: '贸易商', key: 'trader' },
];
const firmPriceDetailRef = ref<any>(null);
const traffickerPriceDetailRef = ref<any>(null);

const normalizeCustomerType = (value: any) => {
    const type = String(value || '').toUpperCase();
    if (type === 'TRADER' || value === '贸易商') return 'TRADER';
    if (type === 'CHEMICAL' || value === '化工企业' || value === '化工厂') return 'CHEMICAL';
    return 'CHEMICAL';
};

const monthlyAddDetailList = computed(() => {
    const list = props.detail.monthlyAddDetailList || [];
    const targetType = companyType.value === 'chemical' ? 'CHEMICAL' : 'TRADER';
    const filtered = list.filter((item: any) => normalizeCustomerType(item.customerType) === targetType);
    return filtered.length ? filtered : list.filter((item: any) => !item.customerType && companyType.value === 'chemical');
});

const currentAddPlanColumns = computed(() =>
    companyType.value === 'trader' ? props.traderAddPlanColumns : props.chemicalAddPlanColumns
);

const openBasePricingDetail = (item: any) => {
    if (!item?.id) return;
    if (normalizeCustomerType(item.customerType) === 'TRADER') {
        traffickerPriceDetailRef.value?.showDialog(item.id);
        return;
    }
    firmPriceDetailRef.value?.showDialog(item.id);
};

const openReportDetail = () => {
    if (props.reportDetailLoading || !props.detail.aiReportId) return;
    emit('open-report-detail');
};
</script>

<style lang="less" scoped>
.basic-info {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 16px;
}

.section {
    flex-shrink: 0;
}

.section-last {
    padding-bottom: 12px;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 4px;
}

.link-list {
    display: inline;
}

.link-text {
    color: #5b83ff;
    cursor: pointer;
}

.link-text:hover {
    text-decoration: underline;
}

.link-text.disabled {
    cursor: default;
    opacity: 0.65;
    text-decoration: none;
}

.company-tabs {
    margin-bottom: 12px;
    padding: 0;
    width: 100%;
    gap: 32px;
    :deep(.tab-item) {
        padding: 0 !important;
    }
    :deep(.tab-item-name-select) {
        font-size: 14px;
    }
    :deep(.tab-item-name) {
        font-size: 14px;
    }
}

:deep(.web-data-table) {
    .web-data-table-top {
        display: none;
    }

    .web-n-data-table-con {
        padding: 0;
    }

    .n-data-table-th {
        height: 44px;
        color: #999999;
        background: var(--base-grey9);
        font-weight: 600;
    }

    .n-data-table-td {
        height: 50px;
        color: #333333;
    }
}
</style>
