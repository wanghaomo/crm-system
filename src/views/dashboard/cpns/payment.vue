<template>
    <card title="待结算-待回款对比" :isApp="isApp" iconClass="icon⎽com⎽settlement">
        <div v-if="hasData" class="bar-card" ref="chartRef"></div>
        <Empty v-else :scale="isApp ? 0.7 : 0.85" class="payment-empty" />
    </card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type PropType } from 'vue';
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import card from './card.vue';

/** 折线图系列数据项 */
export interface SeriesItem {
    name: string;
    data: number[];
}

/** 系列颜色映射 - 纯前端配置 */
const seriesColorMap: Record<string, string> = {
    '待结算': '#326EE6',
    '待回款': '#42C5E5',
};

const props = defineProps({
    isApp: {
        type: Boolean,
    },
    xAxisData: {
        type: Array as PropType<string[]>,
        default: () => [] as string[],
    },
    seriesData: {
        type: Array as PropType<SeriesItem[]>,
        default: () => [] as SeriesItem[],
    },
});

/** 是否存在有效图表数据 */
const hasData = computed(() => {
    if (!props.xAxisData.length) return false;
    return props.seriesData.some(item => item.data && item.data.length > 0);
});

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: EChartsType | null = null;

/**
 * 构建 echarts 配置项
 * 数据可能异步加载，抽为函数供 onMounted 和 watch 共用
 */
const getOption = () => ({
    title: {
        text: '单位:万元',
        left: 0,
        top: 10,
        textStyle: {
            color: '#999',
            fontSize: 12,
            fontWeight: 'normal',
        },
    },
    legend: {
        data: props.seriesData.map(item => item.name),
        top: 10,
        right: 10,
        icon: 'circle',
        textStyle: {
            fontSize: 12,
            color: '#646A73',
        },
        itemWidth: 8,
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
    },
    grid: {
        containLabel: true,
        left: 10,
        right: 10,
        top: 50,
        bottom: props.isApp ? 0 : 6,
    },
    xAxis: {
        type: 'category',
        data: props.xAxisData,
        axisLabel: {
            interval: 0,
            fontSize: props.isApp ? 10 : 12,
            color: '#999',
            rotate: 0,
            padding: [5, 0, 0, 0],
        },
        axisLine: {
            show: true,
            lineStyle: {
                color: '#1F232930',
            },
        },
        axisTick: { show: false },
    },
    yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
            fontSize: 12,
            color: '#999',
            formatter: '{value}',
        },
        splitLine: {
            lineStyle: {
                color: '#1F232910',
            },
        },
    },

    barGap: '60%',
    series: props.seriesData.map(item => ({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: item.data,
        lineStyle: {
            color: seriesColorMap[item.name] || '#326EE6',
            width: 1,
        },
        itemStyle: {
            color: seriesColorMap[item.name] || '#326EE6',
            borderColor: '#fff',
            borderWidth: 2,
        },
    }))
});

let resizeObserver: ResizeObserver | null = null;

const handleResize = () => {
    chartInstance?.resize();
};

onMounted(() => {
    if (!hasData.value || !chartRef.value) return;
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption(getOption());

    // 监听容器尺寸变化
    resizeObserver = new ResizeObserver(handleResize);
    if (chartRef.value) {
        resizeObserver.observe(chartRef.value);
    }

    // 监听窗口尺寸变化兜底
    window.addEventListener('resize', handleResize);
});

// 监听数据变化，接口异步返回后重绘图表
watch(
    () => [props.xAxisData, props.seriesData],
    () => {
        if (!hasData.value) {
            chartInstance?.dispose();
            chartInstance = null;
            resizeObserver?.disconnect();
            resizeObserver = null;
            window.removeEventListener('resize', handleResize);
            return;
        }
        if (!chartInstance && chartRef.value) {
            chartInstance = echarts.init(chartRef.value);
            if (chartRef.value) {
                resizeObserver = new ResizeObserver(handleResize);
                resizeObserver.observe(chartRef.value);
            }
            window.addEventListener('resize', handleResize);
        }
        chartInstance?.setOption(getOption());
        chartInstance?.resize();
    },
    { deep: true }
);

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    resizeObserver?.disconnect();
    chartInstance?.dispose();
});
</script>

<style scoped lang="less">
.bar-card {
    width: 100%;
    height: 236px;
}

.payment-empty {
    width: 100%;
    height: 236px;
}
</style>
