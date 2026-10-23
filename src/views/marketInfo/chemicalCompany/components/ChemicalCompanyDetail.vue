<template>
    <n-spin :show="detailLoading">
        <div class="detail-content">
            <!-- 顶部区域只展示最关键的识别信息，便于从列表或客户档案进入时快速确认当前调研对象。 -->
            <div class="detail-header">
                <div class="detail-header-top">
                    <span class="detail-title">{{ detailData.enterpriseName || '--' }}</span>
                    <StatusTag :text="detailData.statusName || getStatusText(detailData.status)" color="#5AA771" bgColor="#F0F9EB" borderColor='#E2F4D8' />
                </div>
                <div class="detail-header-info">
                    <div class="info-item">
                        <span class="info-label">录入人</span>
                        <span class="info-value">{{ detailData.inputPerson || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">区域</span>
                        <span class="info-value">
                            <MxDict v-if="detailData.region" :model-value="detailData.region" dict-type="区域类型" text />
                            <span v-else>--</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">录入时间</span>
                        <span class="info-value">{{ detailData.inputTime || '--' }}</span>
                    </div>
                </div>
            </div>

            <!-- 基础信息：字段顺序保持与原化工企业调研抽屉一致，降低迁移后的认知成本。 -->
            <div class="detail-section">
                <div class="section-title"><span class="section-bar"></span>基础信息</div>
                <n-descriptions label-placement="left" :column="2" :separator="false" class="detail-descriptions chemical-detail-descriptions">
                    <n-descriptions-item label="调研月份">
                        {{ formatSurveyMonth(detailData.surveyMonth) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="详细地址">
                        {{ detailData.detailAddress || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="联系人">
                        {{ detailData.contactPerson || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="联系电话">
                        {{ detailData.contactPhone || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="库存情况(万吨)">
                        {{ formatNumber(detailData.inventory, 1) }}
                    </n-descriptions-item>
                    <n-descriptions-item label="开工率(%)">
                        <span :class="{ 'text-error': isOperatingRateInvalid(detailData.operatingRate) }">
                            {{ detailData.operatingRate ?? '--' }}
                        </span>
                    </n-descriptions-item>
                    <n-descriptions-item :span="2" label="开工率变化原因">
                        {{ detailData.rateChangeReason || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item :span="2" label="企业主要产品规模" class="long-description-item">
                        {{ detailData.mainProductScale || '--' }}
                    </n-descriptions-item>
                    <n-descriptions-item label="主要产品价格(元/吨)">
                        {{ detailData.mainProductPrice ?? '--' }}
                        <span class="field-unit"></span>
                    </n-descriptions-item>
                    <n-descriptions-item label="下月采购计划(万吨)">
                        {{ formatNumber(detailData.nextMonthPlan, 1) }}
                        <span class="field-unit"></span>
                    </n-descriptions-item>
                    <n-descriptions-item label="采购产品类型">
                        <MxDict v-if="detailData.purchaseProductType" :model-value="detailData.purchaseProductType" dict-type="采购产品类型" text />
                        <span v-else>--</span>
                    </n-descriptions-item>
                    <n-descriptions-item label="采购预算(万元)">
                        {{ detailData.purchaseBudget ?? '--' }}
                    </n-descriptions-item>
                </n-descriptions>
            </div>

            <!-- 趋势图数据由当前调研企业名称精确匹配查询，月份下拉只影响本组件内部状态。 -->
            <div class="detail-section trend-section">
                <div class="section-title"><span class="section-bar"></span>库存变化趋势</div>
                <div class="chart-filter">
                    <n-select v-model:value="inventoryTrendMonths" :options="inventoryTrendOptions" size="small" style="width: 232px" @update:value="handleInventoryTrendChange" />
                </div>
                <div class="chart-unit">单位:万吨</div>
                <n-spin :show="inventoryTrendLoading">
                    <n-empty v-if="!inventoryTrendData.length" class="chart-empty" description="暂无数据" />
                    <div v-show="inventoryTrendData.length" ref="inventoryChartRef" class="chart-container"></div>
                </n-spin>
            </div>
        </div>
    </n-spin>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { NDescriptions, NDescriptionsItem, NEmpty, NSelect, NSpin } from 'naive-ui';
import { queryChemicalCompanyDetailApi, queryInventoryTrendApi } from '@/api/chemicalCompany';

type InventoryTrendItem = {
    surveyMonth: string;
    inventory: number | null;
};

const props = withDefaults(
    defineProps<{
        // 当前调研记录ID；两个入口都通过它触发详情接口请求。
        recordId: number | string | null;
        // 列表行缓存数据；接口未返回前先用于头部和基础字段回显，避免抽屉短暂空白。
        initialData?: Record<string, any>;
    }>(),
    {
        initialData: () => ({}),
    }
);

const detailData = ref<any>({});
const detailLoading = ref(false);
const inventoryTrendLoading = ref(false);
const inventoryTrendData = ref<InventoryTrendItem[]>([]);
const inventoryChartRef = ref<HTMLElement | null>(null);
let inventoryChartInstance: echarts.ECharts | null = null;

const inventoryTrendMonths = ref(6);
const inventoryTrendOptions = [
    { label: '近3月', value: 3 },
    { label: '近6月', value: 6 },
    { label: '近9月', value: 9 },
    { label: '近12月', value: 12 },
];

const getStatusText = (status: string) => {
    if (status === 'ARCHIVED') return '已归档';
    if (status === 'DRAFT') return '草稿';
    return '--';
};

const isOperatingRateInvalid = (rate: number | null | undefined) =>
    rate !== null && rate !== undefined && (rate < 0 || rate > 100);

const formatNumber = (val: number | string | null | undefined, digits: number) => {
    const numberValue = Number(val);
    return val !== null && val !== undefined && Number.isFinite(numberValue) ? numberValue.toFixed(digits) : '--';
};

const formatSurveyMonth = (value: string) => (value ? value.slice(0, 7).replace('-', '.') : '--');

const normalizeDateText = (value: string) => (value ? value.slice(0, 10).replace(/-/g, '.') : '--');


// ECharts 只消费日期和库存数值；这里集中做字段兼容、数字转换和无效数据过滤。
const normalizeTrendData = (data: any): InventoryTrendItem[] => {
    return data.map((item: any) => {
        const inventory = Number(item.inventory);
        return {
            surveyMonth: normalizeDateText(item.surveyMonth),
            inventory: Number.isFinite(inventory) ? inventory : null,
        };
    })
        .filter((item: InventoryTrendItem) => item.inventory !== null);
};

// 每次筛选月份或切换记录时重建图表，避免复用旧实例导致尺寸和数据残留。
const initInventoryChart = (data: InventoryTrendItem[]) => {
    if (!inventoryChartRef.value) return;
    if (inventoryChartInstance) {
        inventoryChartInstance.dispose();
    }
    inventoryChartInstance = echarts.init(inventoryChartRef.value);
    inventoryChartInstance.setOption({
        color: ['#2C65F2'],
        grid: { left: 18, right: 24, top: 18, bottom: 30, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
                const item = params?.[0];
                return item ? `${item.axisValue}<br/>库存: ${item.value} 万吨` : '';
            },
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map((item: any) => item.surveyMonth),
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#A8ABB2', fontSize: 11, interval: 'auto', rotate: 0, margin: 14 },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#A8ABB2', fontSize: 12 },
            splitLine: { lineStyle: { color: '#F1F3F5' } },
        },
        series: [
            {
                data: data.map((item) => item.inventory),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { color: '#8DB9FF', width: 2 },
                itemStyle: { color: '#2C65F2', borderColor: '#fff', borderWidth: 2 },
            },
        ],
    });
};

const resetInventoryChart = () => {
    inventoryTrendData.value = [];
    inventoryChartInstance?.dispose();
    inventoryChartInstance = null;
};

const getInventoryTrend = async () => {
    if (!detailData.value.enterpriseName) {
        inventoryTrendData.value = [];
        initInventoryChart([]);
        return;
    }
    inventoryTrendLoading.value = true;
    try {
        const res = await queryInventoryTrendApi({
            accurateName: detailData.value.enterpriseName,
            months: inventoryTrendMonths.value,
        });
        const trendData = res?.code === 200 ? normalizeTrendData(res.data) : [];
        console.log('trendData', trendData);

        inventoryTrendData.value = trendData;
        await nextTick();
        initInventoryChart(trendData);
    } finally {
        inventoryTrendLoading.value = false;
    }
};

const handleInventoryTrendChange = () => {
    getInventoryTrend();
};

const handleChartResize = () => {
    inventoryChartInstance?.resize();
};

// 详情接口和趋势接口都放在公共组件内部，父页面只需要传入记录ID。
const loadDetail = async (id: number | string) => {
    detailLoading.value = true;
    resetInventoryChart();
    inventoryTrendMonths.value = 6;
    try {
        const res = await queryChemicalCompanyDetailApi(id);
        detailData.value = res?.code === 200 ? { ...props.initialData, ...res.data } : { ...props.initialData };
        await nextTick();
        await getInventoryTrend();
    } finally {
        detailLoading.value = false;
    }
};

watch(
    () => [props.recordId, props.initialData],
    ([recordId]) => {
        detailData.value = { ...props.initialData };
        if (recordId) {
            loadDetail(recordId as number | string);
        } else {
            resetInventoryChart();
        }
    },
    { immediate: true, deep: true }
);

onMounted(() => {
    window.addEventListener('resize', handleChartResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleChartResize);
    resetInventoryChart();
});
</script>

<style scoped lang="less">
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 64px);
    min-width: 800px;
    background: #fff;
    color: #333;

    .detail-header {
        padding: 12px 24px;
        flex-shrink: 0;
        border-bottom: 1px solid #eef0f3;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
            }
        }

        .detail-header-info {
            display: flex;
            align-items: center;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                margin-right: 88px;

                .info-label {
                    color: #999;
                }

                .info-value {
                    color: #333;
                }
            }
        }
    }


    .detail-section {
        padding: 24px 24px 20px 24px;

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 14px;

            .section-bar {
                display: inline-block;
                width: 4px;
                height: 14px;
                background-color: #2c65f2;
                border-radius: 2px;
            }
        }

        .detail-descriptions {
            font-size: 14px;
            color: #333;

            :deep(.n-descriptions-table) {
                table-layout: fixed;
            }

            :deep(.n-descriptions-table-content) {
                padding-bottom: 14px;
                vertical-align: top;
            }


            :deep(.n-descriptions-table-content__content) {
                color: #333;
                line-height: 20px;
                word-break: break-all;
            }
        }

        .chemical-detail-descriptions {
            max-width: 1120px;

            :deep(.n-descriptions-table-wrapper) {
                width: 100%;
            }

            :deep(.n-descriptions-table-content) {
                padding-bottom: 12px;
            }

            :deep(.n-descriptions-table-content__label) {
                display: inline-block;
                width: 140px !important;
                margin-right: 12px;
                color: #999;
                text-align: right;
                vertical-align: top;
                line-height: 20px;
                white-space: normal;
            }

            :deep(.n-descriptions-table-content__content) {
                min-width: 190px;
            }

            :deep(.long-description-item .n-descriptions-table-content__content) {
                max-width: 900px;
            }

            .field-unit {
                color: #999;
                margin-left: 2px;
            }
        }
    }

    .chart-filter {
        margin-bottom: 10px;

        :deep(.n-base-selection) {
            --n-height: 30px !important;
        }
    }

    .chart-container {
        width: 100%;
        height: 320px;
    }

    .detail-section.trend-section {
        padding: 0px 24px;
        max-width: 1120px;

        .section-title {
            margin-bottom: 14px;
        }

        .chart-unit {
            color: #a8abb2;
            font-size: 12px;
            line-height: 16px;
            margin: 16px 0 12px 0;
        }
    }
}

:deep(.n-spin-container),
:deep(.n-spin-content) {
    height: 100%;
}

.text-error {
    color: #e34242;
}
</style>
