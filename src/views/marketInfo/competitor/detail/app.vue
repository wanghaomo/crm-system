<template>
    <AppPage title="竞争对手调研详情" :showSearch="false" :showList="false" noPadding>
        <template #content>
            <!-- 头部：名称、状态、录入信息 -->
            <div class="detail-header">
                <div class="title-row">
                    <AppTag class="status-tag" :text="statusName" :type="statusTagType" />
                    <span class="title">{{ detailData.competitorName || detailData.enterpriseName || '--' }}</span>
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

            <!-- Tab 切换：基础数据 / 库存变化趋势 -->
            <Tabs v-model:active="activeTab" sticky class="detail-tabs" line-width="24" animated @change="handleTabChange">
                <Tab title="基础数据" name="base">
                    <div class="tab-panel">
                        <div class="info-card">
                            <div class="section-title">基础数据</div>
                            <div v-for="item in baseRows" :key="item.label" class="info-row" :class="{ column: item.long }">
                                <span class="label">{{ item.label }}</span>
                                <div class="value" :class="{ remark: item.long }">{{ item.value }}</div>
                            </div>
                        </div>
                    </div>
                </Tab>
                <Tab title="库存变化趋势" name="trend">
                    <div class="tab-panel trend-panel">
                        <!-- 库存变化趋势图 -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <span class="chart-title">库存变化趋势</span>
                                <div class="chart-select" @click="inventoryPickerVisible = true">
                                    <span>{{ inventoryPeriod }}</span>
                                    <Icon name="arrow" size="14" color="#909399" />
                                </div>
                            </div>
                            <div class="chart-unit">单位:万吨</div>
                            <Loading v-if="inventoryLoading" class="chart-loading" />
                            <Empty v-else-if="!inventoryTrendData.length" class="chart-empty" description="暂无数据" />
                            <div v-show="!inventoryLoading && inventoryTrendData.length" ref="inventoryChartRef" class="chart-container"></div>
                        </div>

                        <!-- 开工率vs价格对比图 -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <span class="chart-title">开工率vs价格对比图</span>
                                <div class="chart-select" @click="ratePickerVisible = true">
                                    <span>{{ ratePeriod }}</span>
                                    <Icon name="arrow" size="14" color="#909399" />
                                </div>
                            </div>
                            <Loading v-if="rateLoading" class="chart-loading" />
                            <Empty v-else-if="!ratePriceData.length" class="chart-empty" description="暂无数据" />
                            <div v-show="!rateLoading && ratePriceData.length" ref="rateChartRef" class="chart-container"></div>
                        </div>
                    </div>
                </Tab>
            </Tabs>
        </template>
    </AppPage>

    <!-- 页面加载遮罩 -->
    <Overlay :show="detailLoading" class="page-loading-overlay">
        <div class="page-loading-box">
            <Loading color="#fff" vertical>加载中...</Loading>
        </div>
    </Overlay>

    <!-- 库存趋势月份选择 -->
    <Popup v-model:show="inventoryPickerVisible" position="bottom" round>
        <Picker :columns="inventoryRangeOptions" title="选择时间范围" @confirm="onInventoryRangeConfirm" @cancel="inventoryPickerVisible = false" />
    </Popup>

    <!-- 开工率价格对比月份选择 -->
    <Popup v-model:show="ratePickerVisible" position="bottom" round>
        <Picker :columns="rateRangeOptions" title="选择时间范围" @confirm="onRateRangeConfirm" @cancel="ratePickerVisible = false" />
    </Popup>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { Empty, Icon, Loading, Overlay, Picker, Popup, Tab, Tabs } from 'vant';
import AppPage from '@/appComponents/AppPage/index.vue';
import AppTag from '@/appComponents/AppTag/index.vue';
import {
    queryCompetitorDetailApi,
    queryCompetitorInventoryTrendApi,
    queryCompetitorRatePriceContrastApi,
} from '@/api/competitor';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';

// ---------- 类型定义 ----------

type TrendItem = {
    date: string;
    inventory: number | null;
    operatingRate: number | null;
    price: number | null;
};

// ---------- 路由与状态 ----------

const route = useRoute();
const activeTab = ref<'base' | 'trend'>('base');
const detailData = ref<any>({});
const detailLoading = ref(true);
const regionMap = ref<Record<string, string>>({});
const mineTypeMap = ref<Record<string, string>>({});

// ---------- 图表引用 ----------

const inventoryChartRef = ref<HTMLElement | null>(null);
const rateChartRef = ref<HTMLElement | null>(null);
let inventoryChartInstance: echarts.ECharts | null = null;
let rateChartInstance: echarts.ECharts | null = null;

// ---------- 趋势数据加载状态 ----------

const inventoryLoading = ref(false);
const rateLoading = ref(false);
const inventoryTrendData = ref<TrendItem[]>([]);
const ratePriceData = ref<TrendItem[]>([]);

// ---------- 月份选择 ----------

const inventoryMonths = ref(6);
const rateMonths = ref(3);
const inventoryPickerVisible = ref(false);
const ratePickerVisible = ref(false);
const inventoryRangeOptions = [
    { text: '近3月', value: 3 },
    { text: '近6月', value: 6 },
    { text: '近12月', value: 12 },
];
const rateRangeOptions = [
    { text: '近3月', value: 3 },
    { text: '近6月', value: 6 },
];
const inventoryPeriod = computed(() => inventoryRangeOptions.find((item) => item.value === inventoryMonths.value)?.text || '近6月');
const ratePeriod = computed(() => rateRangeOptions.find((item) => item.value === rateMonths.value)?.text || '近3月');

// ---------- 状态和格式化 ----------

const statusName = computed(() => detailData.value.statusName || (detailData.value.status === 'ARCHIVED' ? '已归档' : '草稿'));
const statusTagType = computed(() => (detailData.value.status === 'ARCHIVED' ? 'success' : 'warning'));

/**
 * 格式化任意值为展示文本，null/undefined/空字符串 → '--'
 */
const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);

/**
 * 格式化调研月份：截取前7位（YYYY-MM）
 */
const formatSurveyMonth = (value: any) => (value ? `${value}`.slice(0, 7) : '--');

/**
 * 格式化数字：保留指定位数小数（默认1位），小数位为0时不展示小数部分
 * 参考化工企业调研详情页的 formatNumber 实现
 * @param value - 原始值
 * @param digits - 小数位数，默认 1
 */
const formatNumber = (value: any, digits: number = 1) => {
    const num = Number(value);
    if (value === null || value === undefined || value === '' || !Number.isFinite(num)) return '--';
    const formatted = num.toFixed(digits);
    // 小数位为0不展示小数（如 "1.0" → "1"）
    return digits > 0 ? formatted.replace(/\.0+$/, '') : formatted;
};

/**
 * 格式化价格：显示为整数（带千位分隔符）
 */
const formatPrice = (value: any) => {
    const num = Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isFinite(num) ? num.toLocaleString() : '--';
};

/**
 * 获取区域名称（优先使用接口返回的 name，其次查字典，最后用原始值）
 */
const getRegionName = (value: any) => detailData.value.regionName || regionMap.value[value] || value || '--';

/**
 * 获取矿山类型名称（优先使用接口返回的 name，其次查字典，最后用原始值）
 */
const getMineTypeName = (value: any) => detailData.value.mineTypeName || mineTypeMap.value[value] || value || '--';

/**
 * 获取竞争对手名称，兼容 competitorName / enterpriseName 两种字段
 */
const getCompetitorName = () => detailData.value.competitorName || detailData.value.enterpriseName || '';

// ---------- 基础数据行 ----------

/**
 * 构建基础数据展示行，数字字段统一保留1位小数
 * 参考化工企业调研详情页的 baseRows 结构
 */
const baseRows = computed(() => [
    { label: '区域', value: getRegionName(detailData.value.region) },
    { label: '矿山类型', value: getMineTypeName(detailData.value.mineType) },
    { label: '调研月份', value: formatSurveyMonth(detailData.value.surveyMonth) },
    { label: '详细地址', value: formatValue(detailData.value.detailAddress) },
    { label: '联系人', value: formatValue(detailData.value.contactPerson) },
    { label: '联系电话', value: formatValue(detailData.value.contactPhone) },
    { label: '矿山库存(万吨)', value: formatNumber(detailData.value.inventory ?? detailData.value.oreInventory) },
    { label: '开工率(%)', value: formatValue(detailData.value.operatingRate) },
    { label: '开工率变化原因', value: formatValue(detailData.value.rateChangeReason), long: true },
    { label: '月产量(万吨)', value: formatNumber(detailData.value.monthlyOutput) },
    { label: '最大产能(万吨/月)', value: formatNumber(detailData.value.maxOutput) },
    { label: '产品品位(%)', value: formatNumber(detailData.value.productGrade) },
    { label: '主要码头名称', value: formatValue(detailData.value.wharfName || detailData.value.mainTerminalName) },
    { label: '主要码头库存(万吨)', value: formatNumber(detailData.value.wharfInventory ?? detailData.value.mainTerminalInventory) },
    { label: '销售价格(元/吨)', value: formatPrice(detailData.value.salesPrice) },
    { label: '销售渠道', value: formatValue(detailData.value.salesChannel) },
    { label: '价格变动原因', value: formatValue(detailData.value.priceChangeReason), long: true },
]);

// ---------- 趋势数据归一化 ----------

/** 从多种可能的响应结构中提取趋势数组 */
const getTrendList = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.inventoryTrendList)) return data.inventoryTrendList;
    if (Array.isArray(data?.trendList)) return data.trendList;
    if (Array.isArray(data?.ratePriceList)) return data.ratePriceList;
    return [];
};

const normalizeDate = (value: string) => (value ? value.slice(0, 10).replace(/-/g, '.') : '--');

/** 将接口数据统一转换为 TrendItem 数组 */
const normalizeTrendData = (data: any): TrendItem[] =>
    getTrendList(data).map((item: any) => {
        const inventory = Number(item.inventory);
        const operatingRate = Number(item.operatingRate);
        const price = Number(item.price ?? item.salesPrice);
        return {
            date: normalizeDate(item.inputTime || item.surveyMonth || item.date || item.createTime),
            inventory: Number.isFinite(inventory) ? inventory : null,
            operatingRate: Number.isFinite(operatingRate) ? operatingRate : null,
            price: Number.isFinite(price) ? price : null,
        };
    });

// ---------- 图表渲染 ----------

/**
 * 等待 loading 状态切换后的布局完成，避免 ECharts 在隐藏容器中初始化导致宽度异常
 * 参考化工企业调研详情页的 waitChartLayout 实现
 */
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

/**
 * 为 X 轴数据较多的图表构建 dataZoom 配置
 * 数据超过6个时启用滚动条，默认展示最近6个点
 * @param xAxisData - X 轴数据数组
 * @param hasTwoYAxis - 是否为双 Y 轴图表（需要更大的 bottom 空间）
 */
const buildDataZoom = (xAxisData: string[], hasTwoYAxis = false) => {
    const visibleCount = 6;
    const enableDataZoom = xAxisData.length > visibleCount;
    if (!enableDataZoom) return { dataZoom: [], gridBottom: 20 };
    const startIndex = xAxisData.length - visibleCount;
    const endIndex = xAxisData.length - 1;
    return {
        dataZoom: [
            {
                // 支持手势横向拖动图表内容
                type: 'inside',
                xAxisIndex: 0,
                startValue: xAxisData[startIndex],
                endValue: xAxisData[endIndex],
                zoomLock: true, // 锁定缩放，仅允许平移
            },
            {
                // 底部滚动条，用于数据点较多时左右查看月份
                type: 'slider',
                xAxisIndex: 0,
                height: 10,
                bottom: hasTwoYAxis ? 32 : 4,
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
        ],
        gridBottom: hasTwoYAxis ? 66 : 56,
    };
};

/**
 * 渲染库存变化趋势图
 * - 数据点超过6个时启用 dataZoom 横向滚动条
 * - X 轴标签倾斜35度，避免月份文字遮挡
 */
const renderInventoryChart = async () => {
    await waitChartLayout();
    if (!inventoryChartRef.value || !inventoryChartRef.value.clientWidth || !inventoryTrendData.value.length) return;

    const xAxisData = inventoryTrendData.value.map((item) => item.date);
    const seriesData = inventoryTrendData.value.map((item) => item.inventory);
    const { dataZoom, gridBottom } = buildDataZoom(xAxisData);

    inventoryChartInstance?.dispose();
    inventoryChartInstance = echarts.init(inventoryChartRef.value);
    inventoryChartInstance.setOption({
        color: ['#2C65F2'],
        // 为倾斜的 X 轴标签末端和底部滚动条预留空间
        grid: { left: 20, right: 18, top: 18, bottom: 0, containLabel: true },
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
            // X 轴标签全部显示并倾斜35度，避免月份文字横向拥挤遮挡
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
        dataZoom,
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

/**
 * 渲染开工率vs价格对比图（双 Y 轴）
 * - 左 Y 轴：价格（元），右 Y 轴：开工率（%）
 * - 数据点超过6个时启用 dataZoom 横向滚动条
 * - X 轴标签倾斜35度，避免月份文字遮挡
 */
const renderRateChart = async () => {
    await waitChartLayout();
    if (!rateChartRef.value || !rateChartRef.value.clientWidth || !ratePriceData.value.length) return;

    const xAxisData = ratePriceData.value.map((item) => item.date);
    const { dataZoom, gridBottom } = buildDataZoom(xAxisData, true);

    rateChartInstance?.dispose();
    rateChartInstance = echarts.init(rateChartRef.value);
    rateChartInstance.setOption({
        color: ['#2C65F2', '#57C7D4'],
        legend: {
            bottom: dataZoom.length ? 34 : 0,
            itemWidth: 8,
            itemHeight: 8,
            textStyle: { color: '#606266', fontSize: 11 },
            data: ['价格', '开工率'],
        },
        // 为 legend、右 Y 轴标签、倾斜的 X 轴标签和底部滚动条预留空间
        grid: { left: 16, right: 22, top: 30, bottom: gridBottom, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#eef0f4' } },
            // X 轴标签全部显示并倾斜35度，避免月份文字横向拥挤遮挡
            axisLabel: { color: '#A8ABB2', fontSize: 11, interval: 0, rotate: 35, margin: 14 },
        },
        yAxis: [
            {
                type: 'value',
                min: 0,
                name: '价格',
                nameTextStyle: { color: '#999', padding: [0, 0, 0, -40] },
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#A8ABB2', fontSize: 11, formatter: '{value}元' },
                splitLine: { lineStyle: { color: '#F1F3F5' } },
            },
            {
                type: 'value',
                min: 0,
                max: 100,
                name: '开工率',
                nameTextStyle: { color: '#999', padding: [0, -50, 0, 0] },
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#A8ABB2', fontSize: 11, formatter: '{value}%' },
                splitLine: { show: false },
            },
        ],
        dataZoom,
        series: [
            {
                name: '价格',
                type: 'line',
                data: ratePriceData.value.map((item) => item.price),
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { color: '#8DB9FF', width: 2 },
                itemStyle: { color: '#2C65F2', borderColor: '#fff', borderWidth: 2 },
            },
            {
                name: '开工率',
                type: 'line',
                yAxisIndex: 1,
                data: ratePriceData.value.map((item) => item.operatingRate),
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { color: '#7ADBE3', width: 2 },
                itemStyle: { color: '#57C7D4', borderColor: '#fff', borderWidth: 2 },
            },
        ],
    });
};

// ---------- 数据加载 ----------

/**
 * 加载库存变化趋势数据并渲染图表
 * 参考化工企业调研详情页的 loadTrend 实现
 */
const loadInventoryTrend = async () => {
    if (!getCompetitorName()) return;
    inventoryLoading.value = true;
    try {
        const res = await queryCompetitorInventoryTrendApi({
            accurateName: getCompetitorName(),
            months: inventoryMonths.value,
        });
        inventoryTrendData.value = res?.code === 200
            ? normalizeTrendData(res.data).filter((item) => item.inventory !== null)
            : [];
    } finally {
        inventoryLoading.value = false;
    }
    // loading 关闭后图表容器才会重新显示，此时再渲染可避免宽度被算窄
    await renderInventoryChart();
};

/**
 * 加载开工率vs价格对比数据并渲染图表
 */
const loadRatePriceContrast = async () => {
    if (!getCompetitorName()) return;
    rateLoading.value = true;
    try {
        const res = await queryCompetitorRatePriceContrastApi({
            accurateName: getCompetitorName(),
            months: rateMonths.value,
        });
        ratePriceData.value = res?.code === 200
            ? normalizeTrendData(res.data).filter((item) => item.price !== null || item.operatingRate !== null)
            : [];
    } finally {
        rateLoading.value = false;
    }
    await renderRateChart();
};

/**
 * 加载详情数据和趋势数据
 * 详情加载完成后并行请求两个趋势接口
 */
const loadDetail = async () => {
    const id = route.query.id;
    if (!id) return;

    detailLoading.value = true;
    let needLoadTrend = false;
    try {
        const res = await queryCompetitorDetailApi(id);
        if (res?.code === 200) {
            detailData.value = res.data || {};
            needLoadTrend = true;
        }
    } finally {
        detailLoading.value = false;
    }

    if (needLoadTrend) {
        // 并行加载两个趋势数据，提升加载速度
        await Promise.all([loadInventoryTrend(), loadRatePriceContrast()]);
    }
};

// ---------- 事件处理 ----------

/**
 * Tab 切换时重绘图表（ECharts 在 display:none 容器中可能错位）
 * @param name - 当前激活的 tab 名称
 */
const handleTabChange = async (name: string) => {
    if (name === 'trend') {
        await nextTick();
        inventoryChartInstance?.resize();
        rateChartInstance?.resize();
        await Promise.all([renderInventoryChart(), renderRateChart()]);
    }
};

/**
 * 确认库存趋势时间范围选择
 */
const onInventoryRangeConfirm = async ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    if (option) inventoryMonths.value = option.value;
    inventoryPickerVisible.value = false;
    await loadInventoryTrend();
};

/**
 * 确认开工率vs价格对比时间范围选择
 */
const onRateRangeConfirm = async ({ selectedOptions }: any) => {
    const option = selectedOptions?.[0];
    if (option) rateMonths.value = option.value;
    ratePickerVisible.value = false;
    await loadRatePriceContrast();
};

/**
 * 窗口大小变化时重绘图表，确保响应式适配
 */
const handleResize = () => {
    inventoryChartInstance?.resize();
    rateChartInstance?.resize();
};

// ---------- 字典数据 ----------

/**
 * 加载区域和矿山类型字典，用于将 code 映射为中文名称
 * 参考化工企业调研详情页的 loadDictData 实现
 */
const loadDictData = async () => {
    const res = await getDictMapApi({ parentCodes: [enumCfg['区域类型'], enumCfg['矿山类型']] });
    if (res?.code === 200) {
        regionMap.value = (res.data?.[enumCfg['区域类型']] || []).reduce((map: Record<string, string>, item: any) => {
            map[item.code] = item.name;
            return map;
        }, {});
        mineTypeMap.value = (res.data?.[enumCfg['矿山类型']] || []).reduce((map: Record<string, string>, item: any) => {
            map[item.code] = item.name;
            return map;
        }, {});
    }
};

// ---------- 生命周期 ----------

onMounted(async () => {
    await loadDictData();
    await loadDetail();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    inventoryChartInstance?.dispose();
    rateChartInstance?.dispose();
});
</script>

<style scoped lang="less">
// ---------- 页面加载遮罩 ----------
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

// ---------- 详情头部 ----------
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
        gap: 16px;
        font-size: 14px;
        line-height: 18px;

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

// ---------- Tab ----------
.detail-tabs {
    :deep(.van-tab) {
        font-size: 16px;
        line-height: 36px;
        color: #333;
    }
}

// ---------- Tab 面板 ----------
.tab-panel {
    min-height: calc(100vh - 132px);
    padding: 12px;
    box-sizing: border-box;
    background: #f3f4f6;
}

.trend-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

// ---------- 信息卡片 ----------
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
    align-items: center;
    min-height: 38px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 16px;
    line-height: 18px;

    &:last-child {
        border-bottom: none;
    }

    &.column {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
        padding: 9px 0;
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

// ---------- 图表卡片 ----------
// 参考化工企业调研详情页的图表样式
.chart-card {
    padding: 12px 12px 16px;
    // 固定卡片高度，避免图表高度变化导致布局跳动
    min-height: 280px;

    .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
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
        height: 300px;
        // 允许内部横向滚动（ECharts 的 dataZoom slider 在此容器内渲染）
        overflow: hidden;
    }

    .chart-loading,
    .chart-empty {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
