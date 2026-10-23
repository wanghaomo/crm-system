<template>
    <div class="evaluation-detail">
        <n-spin :show="loading">
            <!-- 头部信息 -->
            <div class="detail-header">
                <div class="company-name">{{ detailData.customerName }}</div>
                <div class="header-info">
                    <div class="info-item">
                        <span class="info-label">客户星级</span>
                        <span class="info-value">{{ detailData.evaluationLevelName || '--' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">评估时间</span>
                        <span class="info-value">{{ formatTime(detailData.evaluationTime) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">综合评估得分</span>
                        <span class="info-value calcScore-highlight">{{ detailData.evaluationScore ?? '--' }}</span>
                    </div>
                </div>
            </div>

            <!-- 灰色分割 -->
            <div class="gray-separator"></div>

            <!-- tab 区域 -->
            <div class="detail-main">
                <div class="tabs-container">
                    <n-tabs v-model:value="activeTab" type="line" animated :bar-width="36" class="detail-tabs">
                        <n-tab v-for="tab in tabList" :key="tab.value" :name="tab.value">{{ tab.label }}</n-tab>
                    </n-tabs>
                </div>

                <!-- 基础信息 -->
                <div v-if="activeTab === 'basic'" class="tab-content">
                    <!-- 基础信息 -->
                    <div class="section-title"><span class="section-bar"></span>基础信息</div>
                    <div class="basic-info-grid">
                        <div class="basic-info-item">
                            <span class="basic-label">上次评估时间</span>
                            <span class="basic-value">{{ formatTime(detailData.previousEvaluationTime) }}</span>
                        </div>
                        <div class="basic-info-item">
                            <span class="basic-label">服务次数</span>
                            <span class="basic-value">{{ detailData.serviceRuleTimes ?? '--' }}</span>
                        </div>
                        <div class="basic-info-item">
                            <span class="basic-label">增值服务记录数</span>
                            <span class="basic-value">{{ detailData.plusServiceTimes != null ? `${detailData.plusServiceTimes}次` : '--' }}</span>
                        </div>
                    </div>

                    <!-- 评估明细 -->
                    <div v-if="detailData.evaluationDetailList && detailData.evaluationDetailList.length > 0" class="section-title">
                        <span class="section-bar"></span>指标得分明细
                    </div>
                    <n-data-table v-if="detailData.evaluationDetailList && detailData.evaluationDetailList.length > 0" :columns="evaluationDetailColumns" :data="detailData.evaluationDetailList" :pagination="false" size="small" bordered :single-line="false" />
                </div>

                <!-- 评估记录 -->
                <div v-else-if="activeTab === 'record'" class="tab-content">
                    <n-data-table :columns="recordColumns" :data="detailData.evaluationRecordList || []" :pagination="false" size="small" bordered :single-line="false" />
                </div>

                <!-- 数据统计 -->
                <div v-else-if="activeTab === 'statistics'" class="tab-content statistics-content">
                    <div class="top-chart-container">
                        <!-- 雷达图 -->
                        <div class="chart-block">
                            <div class="section-title"><span class="section-bar"></span>多维度指标分布</div>
                            <div ref="radarChartRef" class="chart-container"></div>
                        </div>
                        <!-- 得分趋势折线图 -->
                        <div class="chart-block">
                            <div class="section-title"><span class="section-bar"></span>评估得分趋势</div>
                            <div ref="lineChartRef" class="chart-container"></div>
                        </div>
                    </div>
                    <div class="bottom-chart-container">
                        <!-- 服务次数统计图 -->
                        <div class="chart-block">
                            <div class="section-title"><span class="section-bar" style="margin-top: 4px;"></span>服务次数统计</div>
                            <div ref="serviceChartRef" class="chart-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import { h, ref, watch, nextTick } from 'vue';
import { NTabs, NTab, NDataTable, NSpin, NButton } from 'naive-ui';
import { storeToRefs } from 'pinia';

import { useDictStore } from '@/store/commStore';

import dayjs from 'dayjs';

import * as echarts from 'echarts';

const COMPUTING_CYCLE_DICT_NAME = '计算周期';
const { dictMap } = storeToRefs(useDictStore());

const props = defineProps<{
    detailData: Record<string, any>;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (event: 'record-detail', row: Record<string, any>): void;
}>();


// 格式化时间
const formatTime = (time: string) => {
    if (!time) return '--';
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 将计算周期编码转换为字典名称。
 * @param value 接口返回的计算周期编码或名称
 * @returns 字典名称，未匹配时返回接口原值
 */
const formatComputingCycle = (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '--';
    const options = dictMap.value?.[COMPUTING_CYCLE_DICT_NAME] || [];
    const option = options.find((item: any) => item.value === value || item.label === value);
    return option?.label || value;
};

// Tab 配置
const activeTab = ref('basic');
const tabList = [
    { label: '基础信息', value: 'basic' },
    { label: '评估记录', value: 'record' },
    { label: '数据统计', value: 'statistics' },
];

// 重置 tab 当 detailData 变化
watch(
    () => props.detailData,
    () => {
        activeTab.value = 'basic';
    }
);

// ===== 指标得分明细表格 =====
const evaluationDetailColumns = [
    { title: '序号', key: 'index', width: 60, render: (row: any, rowIndex: number) => rowIndex + 1 },
    { title: '指标名称', key: 'indicatorName', width: 120 },
    { title: '指标权重(%)', key: 'weight', width: 120 },
    { title: '计算周期', key: 'calcCycle', width: 120, render: (row: any) => formatComputingCycle(row.calcCycle) },
    { title: '数据来源', key: 'dataSource', },
    { title: '计算规则', key: 'calcRule', },
    { title: '计算详情', key: 'calcDetail', render: (row: any) => row.calcDetail || '--' },
    { title: '得分', key: 'calcScore', width: 70, render: (row: any) => row.calcScore ?? '--' },
];

// ===== 评估记录表格 =====
const recordColumns = [
    { title: '序号', key: 'index', width: 60, render: (row: any, rowIndex: number) => rowIndex + 1 },
    { title: '历史评估得分', key: 'evaluationScore', },
    { title: '星级变化', key: 'levelChange', render: (row: any) => `${row.starLevelChange}` || '--' },
    { title: '评估时间', key: 'evaluationTime', },
    { title: '调整原因', key: 'adjustReason', },
    {
        title: '操作',
        key: 'operation',
        align: 'center',
        width: 80,
        render: (row: Record<string, any>) => {
            if (row.adjustType !== 'EVALUATION' || !row.evaluationCode) {
                return '--';
            }
            return h(
                NButton,
                {
                    text: true,
                    type: 'primary',
                    size: 'small',
                    onClick: () => emit('record-detail', row),
                },
                { default: () => '详情' }
            );
        },
    },
];

// ===== 图表相关 =====
const radarChartRef = ref<HTMLElement | null>(null);
const lineChartRef = ref<HTMLElement | null>(null);
const serviceChartRef = ref<HTMLElement | null>(null);

let radarChart: echarts.ECharts | null = null;
let lineChart: echarts.ECharts | null = null;
let serviceChart: echarts.ECharts | null = null;

// 模拟数据（用于演示，接口返回数据为空时使用）
const mockEvaluationDetailList = [
    {
        index: 1,
        indicatorName: '交易额',
        weight: '30%',
        calcCycle: '近12个月',
        dataSource: '客户档案-历史合作总量',
        calcRule: '客户累计交易额/行业均值×100×权重',
        calcDetail: '93/100*100*30%',
        calcScore: 28,
    },
    {
        index: 2,
        indicatorName: '利润',
        weight: '25%',
        calcCycle: '近12个月',
        dataSource: '销售合同-含税总金额、成本数据',
        calcRule: '（总营收-总成本）/行业均值×100×权重',
        calcDetail: '92/100*100*25%',
        calcScore: 23,
    },
    {
        index: 3,
        indicatorName: '矿种适配',
        weight: '15%',
        calcCycle: '永久',
        dataSource: '客户档案-核心产品、矿石需求',
        calcRule: '矿种匹配度（0-100分）×权重',
        calcDetail: '100*15%',
        calcScore: 15,
    },
    {
        index: 4,
        indicatorName: '信用评级',
        weight: '15%',
        calcCycle: '每季度更新',
        dataSource: '客户档案-信用评级',
        calcRule: 'A=100分/B=80分/C=60分/D=40分×权重',
        calcDetail: '100*15%',
        calcScore: 15,
    },
    {
        index: 5,
        indicatorName: '合作年限',
        weight: '10%',
        calcCycle: '永久',
        dataSource: '客户档案-合作开始时间',
        calcRule: '合作年限×10（上限100分）×权重',
        calcDetail: '9*10%',
        calcScore: 9,
    },
    {
        index: 6,
        indicatorName: '服务满意度',
        weight: '5%',
        calcCycle: '每月评估',
        dataSource: '服务评价系统',
        calcRule: '满意度评分×权重',
        calcDetail: '95*5%',
        calcScore: 5,
    },
];

const mockEvaluationRecordList = [
    {
        index: 1,
        evaluationScore: 82,
        starLevelChange: '二级→一级',
        evaluationTime: '2026-03-15 09:12:22',
        adjustReason: '月评估',
    },
    {
        index: 2,
        evaluationScore: 78,
        starLevelChange: '三级→二级',
        evaluationTime: '2026-02-15 10:30:00',
        adjustReason: '月评估',
    },
    {
        index: 3,
        evaluationScore: 75,
        starLevelChange: '三级→三级',
        evaluationTime: '2026-01-15 14:20:15',
        adjustReason: '月评估',
    },
    {
        index: 4,
        evaluationScore: 72,
        starLevelChange: '四级→三级',
        evaluationTime: '2025-12-15 11:45:30',
        adjustReason: '月评估',
    },
    {
        index: 5,
        evaluationScore: 68,
        starLevelChange: '四级→四级',
        evaluationTime: '2025-11-15 16:00:00',
        adjustReason: '月评估',
    },
    {
        index: 6,
        evaluationScore: 65,
        starLevelChange: '五级→四级',
        evaluationTime: '2025-10-15 09:30:00',
        adjustReason: '月评估',
    },
];

const mockServiceTimesList = [
    { quarter: 4, visitTimes: 12, callTimes: 8, careTimes: 15, plusServiceTimes: 5 },
    { quarter: 2, visitTimes: 16, callTimes: 12, careTimes: 18, plusServiceTimes: 8 },
    { quarter: 3, visitTimes: 20, callTimes: 15, careTimes: 22, plusServiceTimes: 12 },
    { quarter: 1, visitTimes: 25, callTimes: 18, careTimes: 28, plusServiceTimes: 15 },
];

// 从 evaluationDetailList 提取雷达图数据
const getRadarData = () => {
    const detailList = props.detailData.evaluationDetailList || mockEvaluationDetailList;
    // const detailList = mockEvaluationDetailList;
    return {
        indicator: detailList.map((item: any) => ({
            name: item.indicatorName || '',
            max: parseFloat(item.weight) || 100,
        })),
        values: detailList.map((item: any) => item.calcScore || 0),
    };
};

// 从 evaluationRecordList 提取趋势数据
const getTrendData = () => {
    // const recordList = mockEvaluationRecordList;
    const recordList = (props.detailData.evaluationRecordList || mockEvaluationRecordList).slice(0, 30);
    return {
        xAxis: recordList.map((item: any) =>
            item.evaluationTime ? dayjs(item.evaluationTime).format('YYYY-MM-DD') : ''
        ).reverse(),
        values: recordList.map((item: any) => item.evaluationScore || 0).reverse(),
    };
};

// 从 serviceTimesList 提取服务次数数据
const getServiceData = () => {
    const serviceList = props.detailData.serviceTimesList || mockServiceTimesList;
    // const serviceList = mockServiceTimesList;

    // quarter是数字类型(1-4)，转换为季度显示文本
    const quarterMap: Record<number, string> = {
        1: '一季度',
        2: '二季度',
        3: '三季度',
        4: '四季度',
    };

    const defaultQuarters = [1, 2, 3, 4];
    const serviceMap = new Map<number, any>();
    (serviceList || []).forEach((item: any) => {
        if (item && typeof item.quarter === 'number') {
            serviceMap.set(item.quarter, item);
        }
    });

    const sortedServiceList = defaultQuarters.map((quarter) => {
        const item = serviceMap.get(quarter);
        return item || {
            quarter,
            visitTimes: 0,
            callTimes: 0,
            careTimes: 0,
            plusServiceTimes: 0,
        };
    });

    const quarters: string[] = sortedServiceList.map((item: any) => quarterMap[item.quarter] || `第${item.quarter}季度`);

    const colors = ['#2c65f2', '#36cfc9', '#faad14', '#b37feb', '#ff7875'];

    return {
        xAxis: quarters,
        series: [
            { name: '接待次数', data: sortedServiceList.map((item: any) => item.visitTimes || 0), color: colors[0] },
            { name: '拜访次数', data: sortedServiceList.map((item: any) => item.callTimes || 0), color: colors[1] },
            { name: '关怀次数', data: sortedServiceList.map((item: any) => item.careTimes || 0), color: colors[2] },
            { name: '增值服务', data: sortedServiceList.map((item: any) => item.plusServiceTimes || 0), color: colors[3] },
        ],
    };
};

const initRadarChart = () => {
    if (!radarChartRef.value) return;
    if (radarChart) radarChart.dispose();

    const data = getRadarData();
    if (!data.indicator.length) return;

    radarChart = echarts.init(radarChartRef.value);
    radarChart.setOption({
        tooltip: {
            // 抽屉内容区域存在滚动和裁剪，提示框挂载到 body 后可完整展示所有指标。
            trigger: 'item',
            appendToBody: true,
            confine: false,
            extraCssText: 'max-height: calc(100vh - 24px); overflow-y: auto;',
            // 雷达图高度小于指标列表时，默认定位会把提示框向上推到可视区域外。
            position: (point: number[], _params: any, _dom: HTMLElement, _rect: any, size: any) => {
                const [viewWidth, viewHeight] = size.viewSize;
                const [contentWidth, contentHeight] = size.contentSize;
                const gap = 12;
                const x = Math.max(0, Math.min(point[0] + gap, viewWidth - contentWidth));
                const y = Math.max(0, Math.min(point[1] + gap, viewHeight - contentHeight));
                return [x, y];
            },
        },
        radar: {
            indicator: data.indicator,
            radius: '65%',
            shape: 'circle',  // 背景改为圆形
            splitNumber: 5,  // 增加分隔层数
            axisName: {
                color: '#666',
                fontSize: 12,
                fontWeight: 600,
            },
            splitArea: {
                areaStyle: {
                    color: ['rgba(44, 101, 242, 0.05)', // 最内层
                        'rgba(44, 101, 242, 0.1)', // 第二层
                        'rgba(44, 101, 242, 0.05)', // 第三层
                        'rgba(44, 101, 242, 0.1)', // 第四层
                        'rgba(44, 101, 242, 0.05)', // 最外层
                    ]
                },
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(44, 101, 242, 0.2)', // 圆环线
                }
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(44, 101, 242, 0.3)',// 轴线
                }
            },
        },
        series: [
            {
                type: 'radar',
                data: [
                    {
                        value: data.values,
                        name: '当前评估',
                        areaStyle: {
                            // 填充区域 - 渐变色
                            opacity: 0.3,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(44, 101, 242, 0.5)' },
                                { offset: 1, color: 'rgba(44, 101, 242, 0.1)' },
                            ])
                        },
                        lineStyle: { color: '#2c65f2', width: 3 },// 线条 - 加粗
                        // 数据点 - 带白边
                        itemStyle: {
                            color: '#2c65f2',
                            borderColor: '#fff',
                            borderWidth: 1,
                        },
                        symbol: 'circle',
                        symbolSize: 4, // 数据点大小
                    },
                ],
            },
        ],
    });
};

const initLineChart = () => {
    if (!lineChartRef.value) return;
    if (lineChart) lineChart.dispose();

    const data = getTrendData();
    if (!data.xAxis.length) return;

    lineChart = echarts.init(lineChartRef.value);
    lineChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 40 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.xAxis,
            axisLabel: { fontSize: 11, color: '#999' },
            axisLine: { lineStyle: { color: '#e5e5e5' } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            interval: 20,
            name: '',
            axisLabel: { color: '#999', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        series: [
            {
                name: '综合评估得分',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: data.values,
                lineStyle: { color: '#2c65f2', width: 2 },
                itemStyle: { color: '#2c65f2', borderColor: '#fff', borderWidth: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(44,101,242,0.25)' },
                        { offset: 1, color: 'rgba(44,101,242,0.02)' },
                    ]),
                },
            },
        ],
    });
};

const initServiceChart = () => {
    if (!serviceChartRef.value) return;
    if (serviceChart) serviceChart.dispose();

    const data = getServiceData();
    if (!data.series.length) return;

    // 计算Y轴最大值（向上取整到十位数）
    const allValues = data.series.flatMap((s: any) => s.data);
    const maxValue = Math.max(...allValues);
    const yAxisMax = Math.ceil(maxValue / 10) * 10;

    serviceChart = echarts.init(serviceChartRef.value);
    serviceChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
            data: data.series.map((s: any) => s.name),
            right: 0,
            top: 0,
            itemWidth: 16,
            itemHeight: 8,
            textStyle: { fontSize: 12, color: '#666' },
        },
        grid: { left: 10, right: 10, top: 40, bottom: 30 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.xAxis,
            axisLabel: { fontSize: 12, color: '#999' },
            axisLine: { lineStyle: { color: '#e5e5e5' } },
            axisTick: { show: false },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: yAxisMax,
            axisLabel: { color: '#999', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
        series: data.series.map((s: any) => ({
            name: s.name,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            data: s.data,
            lineStyle: { color: s.color, width: 2 },
            itemStyle: { color: s.color },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: s.color + '33' },
                    { offset: 1, color: s.color + '05' },
                ]),
            },
        })),
    });
};

// 切换到统计 tab 时初始化图表
watch(activeTab, (val) => {
    if (val === 'statistics') {
        nextTick(() => {
            initRadarChart();
            initLineChart();
            initServiceChart();
        });
    }
});

// 窗口大小改变时重绘图表
const handleResize = () => {
    radarChart?.resize();
    lineChart?.resize();
    serviceChart?.resize();
};

if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
}
</script>

<style scoped lang="less">
:deep(.n-tabs-tab__label) {
    font-size: 16px;
}

.evaluation-detail {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 12px 24px;
        border-bottom: 1px solid #eee;
        flex-shrink: 0;

        .company-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        .header-info {
            display: flex;
            gap: 40px;
            flex-wrap: wrap;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .info-label {
                color: #999;
            }

            .info-value {
                color: #333;

                &.calcScore-highlight {
                    color: #2c65f2;
                    // font-size: 18px;
                    font-weight: 700;
                }
            }
        }
    }

    .gray-separator {
        height: 8px;
        background: #f0f0f0;
        flex-shrink: 0;
    }

    .detail-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .tabs-container {
            padding: 6px 24px 0px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .tab-content {
            flex: 1;
            overflow: auto;
            padding: 16px 24px;
        }
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        margin-top: 16px;

        &:first-child {
            margin-top: 0;
        }

        .section-bar {
            display: inline-block;
            width: 3px;
            height: 14px;
            background-color: #2c65f2;
            border-radius: 2px;
        }
    }

    .basic-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px 40px;
        margin-bottom: 16px;

        .basic-info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;

            .basic-label {
                color: #999;
                min-width: 100px;
                text-align: right;
            }

            .basic-value {
                color: #333;
                font-weight:normal;
                text-align: right;
            }
        }
    }

    .statistics-content {
        display: flex;
        flex-direction: column;
        gap: 24px;

        .chart-block {
            background: #fff;
            border-radius: 8px;


            .chart-container {
                width: 100%;
                height: 300px;
            }
        }
    }

    .top-chart-container {
        display: flex;
        gap: 24px;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .chart-block {
            flex: 1;
        }
    }
}
</style>
