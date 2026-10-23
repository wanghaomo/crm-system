<template>
    <div class="execution-progress">
        <div class="section">
            <div class="chart-title-row">
                <DetailsTitle title="计划与实际发货情况" :styleOption="{ padding: '0 0 12px' }" :fontSize="16" />
                <div class="legend-list">
                    <div class="legend-item">
                        <span class="legend-dot plan"></span>
                        <span>计划</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot actual"></span>
                        <span>实际</span>
                    </div>
                </div>
            </div>
            <div class="unit-text">单位:吨</div>
            <div ref="chartRef" class="chart-box"></div>
        </div>

        <div class="section section-last">
            <DetailsTitle title="月计划实际情况" :styleOption="{ padding: '22px 0px 18px' }" :fontSize="16" />
            <MxWebDataTable v-bind="tableConfig" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch, ref } from 'vue';
import * as echarts from 'echarts';

const props = withDefaults(
    defineProps<{
        detail: Record<string, any>;
        tableConfig: Record<string, any>;
        visible?: boolean;
    }>(),
    {
        detail: () => ({}),
        tableConfig: () => ({}),
        visible: false,
    }
);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const formatNumber = (value: number) => value.toLocaleString();
/**
 * 格式化图表品位标签，底部类目统一展示百分号。
 * @param value 品位原始值
 * @returns 带百分号的品位文案
 */
const formatGradeLabel = (value: any) => {
    if (value === undefined || value === null || value === '') return '--';
    const valueText = String(value);
    return valueText.includes('%') ? valueText : `${valueText}%`;
};
const renderTooltipMarker = (color: string) =>
    `<span style="display:inline-block;width:6px;height:6px;margin-right:8px;border-radius:50%;background:${color};vertical-align:middle;"></span>`;

const initChart = () => {
    if (!chartRef.value) return;
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
    }

    const chartList = props.detail.executionChartList || [];
    chartInstance.setOption({
        color: ['#3f6ee8', '#65c0dc'],
        grid: {
            left: 58,
            right: 20,
            top: 24,
            bottom: 36,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            formatter(params: any[]) {
                const title = formatGradeLabel(params?.[0]?.axisValue);
                const lines = params.map(
                    (item) => `${renderTooltipMarker(item.color)}${item.seriesName}: ${formatNumber(item.value)}吨`
                );
                return [title, ...lines].join('<br/>');
            },
        },
        xAxis: {
            type: 'category',
            data: chartList.map((item: any) => item.grade),
            boundaryGap: true,
            axisTick: {
                show: false,
                alignWithLabel: true,
            },
            axisLine: {
                lineStyle: {
                    color: '#d9d9d9',
                },
            },
            axisLabel: {
                color: '#999999',
                fontSize: 14,
                margin: 12,
                align: 'center',
                formatter: formatGradeLabel,
            },
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: undefined,
            axisTick: {
                show: false,
            },
            axisLine: {
                show: false,
            },
            axisLabel: {
                color: '#999999',
                fontSize: 14,
                formatter(value: number) {
                    return formatNumber(value);
                },
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                },
            },
        },
        series: [
            {
                name: '计划',
                type: 'bar',
                barWidth: 12,
                barGap: '20%',
                data: chartList.map((item: any) => item.planQty),
            },
            {
                name: '执行',
                type: 'bar',
                barWidth: 12,
                data: chartList.map((item: any) => item.actualQty),
            },
        ],
    });
};

const resizeChart = () => {
    chartInstance?.resize();
};

watch(
    () => [props.visible, props.detail.executionChartList],
    () => {
        if (!props.visible) return;
        nextTick(() => {
            initChart();
            resizeChart();
        });
    },
    { deep: true, immediate: true }
);

onMounted(() => {
    window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart);
    chartInstance?.dispose();
    chartInstance = null;
});
</script>

<style lang="less" scoped>
.execution-progress {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 16px;
}

.section {
    flex-shrink: 0;
}

.section-last {
    padding-bottom: 4px;
}

.chart-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.legend-list {
    display: flex;
    align-items: center;
    gap: 24px;
    color: #999999;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    &.plan {
        background: #3f6ee8;
    }

    &.actual {
        background: #65c0dc;
    }
}

.unit-text {
    margin-bottom: 4px;
    color: #999999;
}

.chart-box {
    width: 100%;
    height: 360px;
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
        height: 54px;
        color: #333333;
    }
}
</style>
