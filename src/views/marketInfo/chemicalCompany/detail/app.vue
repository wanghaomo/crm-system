<template>
    <AppPage title="化工企业调研详情" :showSearch="false" :showList="false" noPadding>
        <template #content>
            <div class="detail-header">
                <div class="title-row">
                    <AppTag class="status-tag" :text="statusName" :type="statusTagType" />
                    <span class="title">{{ detailData.enterpriseName || '--' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-item">
                        <span class="label">录入人</span>
                        <span class="value">{{ detailData.inputPerson || detailData.createdByName || '--' }}</span>
                    </span>
                    <span class="meta-item">
                        <span class="label">录入时间</span>
                        <span class="value">{{ detailData.inputTime || detailData.createdAt || '--' }}</span>
                    </span>
                </div>
            </div>

            <Tabs
                v-model:active="activeTab"
                sticky
                class="detail-tabs"
                line-width="24"
                animated
                @change="handleTabChange">
                <Tab title="基础数据" name="base">
                    <div class="tab-panel">
                        <div class="info-card">
                            <div class="section-title">基础数据</div>
                            <div
                                v-for="item in baseRows"
                                :key="item.label"
                                class="info-row"
                                :class="{ column: item.long }">
                                <span class="label">{{ item.label }}</span>
                                <div class="value" :class="{ remark: item.long }">{{ item.value }}</div>
                            </div>
                        </div>
                    </div>
                </Tab>
                <Tab title="库存变化趋势" name="trend">
                    <div class="tab-panel">
                        <div class="chart-card">
                            <div class="chart-header">
                                <span class="chart-title">库存变化趋势</span>
                                <div class="chart-select" @click="trendPickerVisible = true">
                                    <span>{{ trendPeriod }}</span>
                                    <Icon name="arrow" size="14" color="#909399" />
                                </div>
                            </div>
                            <div class="chart-unit">单位:万吨</div>
                            <Loading v-if="inventoryTrendLoading" class="chart-loading" />
                            <Empty v-else-if="!inventoryTrendData.length" class="chart-empty" description="暂无数据" />
                            <div
                                v-show="!inventoryTrendLoading && inventoryTrendData.length"
                                ref="chartRef"
                                class="chart-container"></div>
                        </div>
                    </div>
                </Tab>
            </Tabs>
        </template>
    </AppPage>

    <Overlay :show="detailLoading" class="page-loading-overlay">
        <div class="page-loading-box">
            <Loading color="#fff" vertical>加载中...</Loading>
        </div>
    </Overlay>

    <Popup v-model:show="trendPickerVisible" position="bottom" round>
        <Picker
            :columns="trendOptions"
            title="选择时间范围"
            @confirm="onTrendConfirm"
            @cancel="trendPickerVisible = false" />
    </Popup>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { Empty, Icon, Loading, Overlay, Picker, Popup, Tab, Tabs } from 'vant';
import AppPage from '@/appComponents/AppPage/index.vue';
import { queryChemicalCompanyDetailApi, queryInventoryTrendApi } from '@/api/chemicalCompany';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';

type TrendItem = {
    surveyMonth: string;
    inventory: number;
};

const route = useRoute();
const activeTab = ref<'base' | 'trend'>('base');
const detailData = ref<any>({});
const detailLoading = ref(true);
const inventoryTrendLoading = ref(false);
const inventoryTrendData = ref<TrendItem[]>([]);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const regionMap = ref<Record<string, string>>({});
const purchaseProductTypeMap = ref<Record<string, string>>({});

const trendMonths = ref(6);
const trendOptions = [
    { text: '近3月', value: 3 },
    { text: '近6月', value: 6 },
    { text: '近9月', value: 9 },
    { text: '近12月', value: 12 },
];
const trendPickerVisible = ref(false);
const trendPeriod = computed(() => trendOptions.find((item) => item.value === trendMonths.value)?.text || '近6月');

const statusName = computed(
    () => detailData.value.statusName || (detailData.value.status === 'ARCHIVED' ? '已归档' : '草稿')
);
const statusTagType = computed(() => (detailData.value.status === 'ARCHIVED' ? 'success' : 'warning'));

const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);
const formatNumber = (value: any, digits?: number) => {
    const num = Number(value);
    if (value === null || value === undefined || value === '' || !Number.isFinite(num)) return '--';
    if (typeof digits === 'number') {
        const formatted = num.toFixed(digits);
        // 小数位为0不展示小数部分（如 "1.0" → "1"）
        return digits > 0 ? formatted.replace(/\.0+$/, '') : formatted;
    }
    return num.toLocaleString();
};
const formatSurveyMonth = (value: any) => (value ? `${value}`.slice(0, 7) : '--');

const getRegionName = (value: any) => detailData.value.regionName || regionMap.value[value] || value || '--';
const getPurchaseTypeName = (value: any) =>
    detailData.value.purchaseProductTypeName || purchaseProductTypeMap.value[value] || value || '--';

const baseRows = computed(() => [
    { label: '区域', value: getRegionName(detailData.value.region) },
    { label: '调研月份', value: formatSurveyMonth(detailData.value.surveyMonth) },
    { label: '详细地址', value: formatValue(detailData.value.detailAddress || detailData.value.address) },
    { label: '联系人', value: formatValue(detailData.value.contactPerson) },
    { label: '联系电话', value: formatValue(detailData.value.contactPhone) },
    { label: '库存情况(万吨)', value: formatNumber(detailData.value.inventory, 0) },
    { label: '开工率(%)', value: formatValue(detailData.value.operatingRate) },
    {
        label: '开工率变化原因',
        value: formatValue(detailData.value.rateChangeReason || detailData.value.operatingRateReason),
        long: true,
    },
    {
        label: '企业主要产品规模',
        value: formatValue(detailData.value.mainProductScale || detailData.value.mainProduct),
        long: true,
    },
    { label: '主要产品价格(元/吨)', value: formatNumber(detailData.value.mainProductPrice) },
    { label: '下月采购计划(万吨)', value: formatNumber(detailData.value.nextMonthPlan, 0) },
    { label: '采购产品类型', value: getPurchaseTypeName(detailData.value.purchaseProductType) },
    { label: '采购预算(万元)', value: formatNumber(detailData.value.purchaseBudget) },
]);
const normalizeDate = (value: string) => (value ? value.slice(0, 10).replace(/-/g, '.') : '--');

const normalizeTrendData = (data: any): TrendItem[] =>
    data
        .map((item: any) => {
            const inventory = Number(item.inventory);
            return {
                surveyMonth: normalizeDate(item.surveyMonth),
                inventory: Number.isFinite(inventory) ? inventory : null,
            };
        })
        .filter((item: any) => item.inventory !== null);

// 等待 loading 状态切换后的布局完成，避免 ECharts 在隐藏容器中初始化导致宽度异常。
const waitChartLayout = async () => {
    await nextTick();
    await new Promise<void>((resolve) => {
        if (typeof window === 'undefined' || !window.requestAnimationFrame) {
            resolve();
            return;
        }
        window.requestAnimationFrame(() => resolve());
    });
};

const renderChart = async () => {
    // 没有趋势数据时清理旧图表，避免切换筛选条件后残留上一次的曲线。
    if (!inventoryTrendData.value.length) {
        chartInstance?.dispose();
        chartInstance = null;
        return;
    }
    // 基础数据页中图表容器不可见，延后到切换到趋势页后再初始化。
    if (activeTab.value !== 'trend') return;

    // 等待 loading 消失和 DOM 重排完成，确保 ECharts 读取到真实容器宽度。
    await waitChartLayout();
    // 容器宽度仍未就绪时跳过本次渲染，后续 tab 切换或 resize 会重新触发。
    if (!chartRef.value || !chartRef.value.clientWidth) return;

    // 拆分横轴和折线数据，方便同时配置 dataZoom 的起止月份。
    const xAxisData = inventoryTrendData.value.map((item) => item.surveyMonth);
    const seriesData = inventoryTrendData.value.map((item) => item.inventory);
    // 数据较多时默认展示最近 6 个点，并通过横向滚动查看更早月份。
    const visibleCount = 6;
    const enableDataZoom = xAxisData.length > visibleCount;
    const startIndex = enableDataZoom ? xAxisData.length - visibleCount : 0;
    const endIndex = xAxisData.length - 1;

    // 每次重绘前销毁旧实例，避免月份切换后旧尺寸、旧配置影响新图表。
    chartInstance?.dispose();
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption({
        color: ['#2C65F2'],
        // 为倾斜的 x 轴标签和底部滚动条预留空间。
        grid: { left: 10, right: 18, top: 18, bottom: enableDataZoom ? 58 : 42, containLabel: true },
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
            data: xAxisData,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#eef0f4' } },
            // 横轴月份全部显示并倾斜，缓解月份文字横向拥挤。
            axisLabel: { color: '#A8ABB2', fontSize: 11, interval: 0, rotate: 35, margin: 14 },
        },
        yAxis: {
            type: 'value',
            min: 0,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#A8ABB2', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F1F3F5' } },
        },
        dataZoom: enableDataZoom
            ? [
                  {
                      // 支持手势横向拖动图表内容。
                      type: 'inside',
                      xAxisIndex: 0,
                      startValue: xAxisData[startIndex],
                      endValue: xAxisData[endIndex],
                      zoomLock: true,
                  },
                  {
                      // 底部滚动条用于数据点较多时左右查看月份。
                      type: 'slider',
                      xAxisIndex: 0,
                      height: 10,
                      bottom: 4,
                      startValue: xAxisData[startIndex],
                      endValue: xAxisData[endIndex],
                      showDetail: false,
                      brushSelect: false,
                      zoomLock: true,
                      borderColor: 'transparent',
                      fillerColor: 'rgba(44, 101, 242, 0.18)',
                      backgroundColor: '#EEF2F7',
                      handleSize: 0,
                  },
              ]
            : [],
        series: [
            {
                type: 'line',
                data: seriesData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { color: '#8DB9FF', width: 2 },
                itemStyle: { color: '#2C65F2', borderColor: '#fff', borderWidth: 2 },
            },
        ],
    });
};

const loadTrend = async () => {
    if (!detailData.value.enterpriseName) return;
    inventoryTrendLoading.value = true;
    try {
        const res = await queryInventoryTrendApi({
            accurateName: detailData.value.enterpriseName,
            months: trendMonths.value,
        });
        inventoryTrendData.value = res?.code === 200 ? normalizeTrendData(res.data) : [];
    } finally {
        inventoryTrendLoading.value = false;
    }
    // loading 关闭后图表容器才会重新显示，此时再渲染可避免宽度被算窄。
    await renderChart();
};

const loadDetail = async () => {
    const id = route.query.id;
    if (!id) return;
    detailLoading.value = true;
    let needLoadTrend = false;
    try {
        const res = await queryChemicalCompanyDetailApi(id);
        if (res?.code === 200) {
            detailData.value = res.data || {};
            needLoadTrend = true;
        }
    } finally {
        detailLoading.value = false;
    }
    if (needLoadTrend) await loadTrend();
};

const handleTabChange = async (name: string) => {
    if (name === 'trend') await renderChart();
};

const onTrendConfirm = async ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    if (option) trendMonths.value = option.value;
    trendPickerVisible.value = false;
    await loadTrend();
};

const handleResize = () => chartInstance?.resize();

const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['采购产品类型']] });
    if (res?.code === 200) {
        regionMap.value = (res.data?.[enumCfg['区域类型']] || []).reduce((map: Record<string, string>, item: any) => {
            map[item.code] = item.name;
            return map;
        }, {});
        purchaseProductTypeMap.value = (res.data?.[enumCfg['采购产品类型']] || []).reduce(
            (map: Record<string, string>, item: any) => {
                map[item.code] = item.name;
                return map;
            },
            {}
        );
    }
};

onMounted(async () => {
    await loadDictData();
    await loadDetail();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance?.dispose();
});
</script>

<style scoped lang="less">
.page-loading-overlay {
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.38);
}

.page-loading-box {
    min-width: 96px;
    padding: 18px 20px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.68);
    display: flex;
    align-items: center;
    justify-content: center;
}

.detail-header {
    padding: 10px 12px 0px;
    background: #fff;

    .title-row {
        display: block;
        margin-bottom: 7px;

        .status-tag {
            float: left;
            margin-right: 8px;
            margin-top: 2px;
        }

        .title {
            display: inline;
            font-size: 16px;
            font-weight: 700;
            color: #222;
            line-height: 1.5;
        }
    }

    .meta-row {
        display: flex;
        align-items: center;
        gap: 36px;
        font-size: 14px;
        // line-height: 18px;

        .meta-item {
            display: flex;
            min-width: 0;

            .label {
                flex-shrink: 0;
                color: #9a9a9a;
                margin-right: 8px;
            }

            .value {
                min-width: 0;
                color: #333;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}

.detail-tabs {
    :deep(.van-tab) {
        font-size: 16px;
    }
}

.tab-panel {
    // min-height: calc(100vh - 132px);
    padding: 16px 12px;
    box-sizing: border-box;
    background: #f3f4f6;
}

.info-card,
.chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px 12px;
}

.section-title,
.chart-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    line-height: 20px;
}

.section-title {
    margin-bottom: 4px;
}

.info-row {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 16px;

    &:last-child {
        border-bottom: none;
    }

    &.column {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
        .label {
            width: 130px;
        }
    }

    .label {
        width: 124px;
        flex-shrink: 0;
        color: #969ca6;
    }

    .value {
        flex: 1;
        color: #222;
        word-break: break-all;

        &.remark {
            width: 100%;
            line-height: 18px;
        }
    }
}

.chart-card {
    padding: 12px 12px 16px;
    height: 360px;
    .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
    }

    .chart-select {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 12px;
        color: #747b86;
    }

    .chart-unit {
        margin-bottom: 2px;
        font-size: 11px;
        color: #a4a9b2;
        line-height: 16px;
    }

    .chart-container {
        width: 100%;
        height: 100%;
    }

    .chart-loading,
    .chart-empty {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
