import * as echarts from 'echarts';
type LineChartOption = {};

export const initLineOption = <T extends { label: string; arr: Array<number> }>(
    data: T[],
    xAxisLabel: string[],
    grid?: {
        left: string;
        right: string;
        bottom: string;
        top: string;
    }
) => {
    const op = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
        },
        legend: {
            data: data.map((item) => item.label),
        },
        grid: {
            ...(grid ? grid : { left: '20px', right: '20px', bottom: '50px', top: '10px' }),
            containLabel: true,
        },
        xAxis: [
            {
                type: 'category',
                boundaryGap: true, // 改为true，使数据点在坐标轴之间，便于tooltip触发
                data: xAxisLabel,
                axisTick: {
                    show: false,
                },
                // 移除position: 'center'，避免坐标系位置异常
                axisLabel: {
                    show: true,
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        color: 'rgba(0,0,0,0.2)',
                    },
                },
            },
        ],

        yAxis: [
            {
                type: 'value',
                name: '',
                axisLine: {
                    show: false,
                },
                //y轴分割线
                axisTick: {
                    show: false,
                },
                // 移除position: 'center'，避免坐标系位置异常
                axisLabel: {
                    show: true,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgba(0,0,0,0.2)',
                    },
                },
            },
        ],
        series: data.map((item) => ({
            name: item.label,
            type: 'line',
            stack: 'a',
            data: item.arr,
            showSymbol: true, // 显示节点，便于触发tooltip
            symbolSize: 6, // 设置节点大小
            emphasis: {
                focus: 'series', // 鼠标悬停时高亮当前系列
            },
        })),
        // 数据缩放配置，只有当数据量超过24时才完整启用
        dataZoom:
            xAxisLabel.length > 24
                ? [
                      {
                          // 内置于坐标系中，支持鼠标滚轮缩放
                          type: 'inside',
                          start: 0,
                          end: 100 / (xAxisLabel.length / 24), // 只显示24个数据点
                          zoomLock: false,
                          // 只缩放x轴
                          xAxisIndex: [0],
                          // 启用鼠标滚轮缩放
                          zoomOnMouseWheel: true,
                      },
                      {
                          // 底部滑动条
                          type: 'slider',
                          start: 0,
                          end: 100 / (xAxisLabel.length / 24), // 只显示24个数据点
                          xAxisIndex: [0],
                          // 显示详细的缩放信息
                          showDetail: true,
                          // 显示缩放按钮
                          show: true,
                      },
                  ]
                : [], // 数据量不超过24时，不添加缩放配置
    };
    return op;
};

// 纯柱状图配置
export const markBarOption = <T extends { time: string | number; num: number | string }>(data: T[]) => {
    // x轴数据
    const xData = data.map((item) => item.time);
    // y轴数据
    const yData = data.map((item) => item.num);
    // 配置数据
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    opacity: 1,
                },
            },
            formatter: function (prams: any[]) {
                return prams[0].name + '：' + prams[0].data;
            },
        },
        grid: {
            left: '0%',
            top: '5%',
            right: '0%',
            bottom: '0%',
            containLabel: true,
        },
        xAxis: [
            {
                type: 'category',
                gridIndex: 0,
                data: xData,
                axisTick: {
                    show: false,
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        type: 'solid',
                        width: 1,
                    },
                },
                axisLabel: {
                    show: true,
                    fontSize: 12,
                },
            },
        ],
        yAxis: [
            {
                type: 'value',
                name: '',
                axisLine: {
                    show: false,
                },
                //y轴分割线
                axisTick: {
                    show: false,
                },
                position: 'center',
                //y轴标签
                axisLabel: {
                    show: true,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgba(0,0,0,0.2)',
                        width: 1,
                        type: 'dashed',
                    },
                },
            },
        ],
        series: [
            {
                name: '',
                type: 'bar',
                barWidth: 25,
                itemStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 0,
                                color: '#1B95FF',
                            },
                            {
                                offset: 1,
                                color: 'rgba(27, 149, 255, 0.1)',
                            },
                        ]),
                    },
                },
                data: yData,
                z: 10,
                zlevel: 2,
            },
        ],
    };
    return option;
};
