<template>
    <div class="mx-app-table">
        <!-- 滚动容器 -->
        <div class="mx-app-table__scroll">
            <div class="mx-app-table__inner" :style="{ minWidth: totalMinWidth + 'px' }">
                <!-- 表头 -->
                <div class="mx-app-table__head">
                    <div
                        v-for="col in columns"
                        :key="col.key"
                        class="mx-app-table__cell head"
                        :style="getCellStyle(col)">
                        {{ col.title }}
                    </div>
                </div>

                <!-- 表体 -->
                <div class="mx-app-table__body">
                    <div
                        v-for="(row, rowIndex) in dataSource"
                        :key="rowKey ? row[rowKey] : rowIndex"
                        class="mx-app-table__row">
                        <div
                            v-for="col in columns"
                            :key="col.key"
                            class="mx-app-table__cell"
                            :style="getCellStyle(col)">
                            <slot
                                :name="col.key"
                                :row="row"
                                :value="row[col.key]"
                                :index="rowIndex">
                                <!-- 默认：序号自动生成 -->
                                <template v-if="col.key === 'index'">{{ rowIndex + 1 }}</template>
                                <template v-else>{{ formatValue(row[col.key]) }}</template>
                            </slot>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-if="!dataSource.length" class="mx-app-table__empty">{{ emptyText }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CSSProperties, computed } from 'vue';

export interface MxAppTableColumn {
    /** 字段名 */
    key: string;
    /** 表头文案 */
    title: string;
    /** 列宽：数字自动 px，字符串按传入值 */
    width?: number | string;
    /** 最小列宽，默认 100 */
    minWidth?: number;
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right';
}

const props = withDefaults(
    defineProps<{
        /** 列配置 */
        columns: MxAppTableColumn[];
        /** 表格数据 */
        dataSource?: any[];
        /** 行唯一键字段名 */
        rowKey?: string;
        /** 空数据文案 */
        emptyText?: string;
    }>(),
    {
        dataSource: () => [],
        rowKey: 'id',
        emptyText: '暂无数据',
    }
);

/** 计算每列宽度（px） */
const getColWidth = (col: MxAppTableColumn): number => {
    if (typeof col.width === 'number') return col.width;
    if (typeof col.width === 'string') {
        const n = parseFloat(col.width);
        return isNaN(n) ? col.minWidth ?? 100 : n;
    }
    return col.minWidth ?? 100;
};

/** 内层最小宽度 = 所有列宽之和，用于触发横向滚动 */
const totalMinWidth = computed(() =>
    props.columns.reduce((sum, c) => sum + getColWidth(c), 0)
);

const getCellStyle = (col: MxAppTableColumn): CSSProperties => {
    const w = getColWidth(col);
    return {
        width: `${w}px`,
        flex: 'none',
        textAlign: col.align || 'center',
    };
};

const formatValue = (v: any) => {
    if (v === null || v === undefined || v === '') return '---';
    return v;
};
</script>

<style scoped lang="postcss">
.mx-app-table {
    width: 100%;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    font-size: 12px;

    .mx-app-table__scroll {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;

        /* 隐藏滚动条，保持移动端观感 */
        &::-webkit-scrollbar {
            height: 0;
            display: none;
        }
    }

    .mx-app-table__inner {
        /* 按内容宽度撑开，保证 flex 行不被压缩换行 */
        display: block;
        width: max-content;
        min-width: 100%;
    }

    .mx-app-table__head {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        height: 40px;
        border-bottom: 1px solid #f0f2f5;
        background: #ffffff;
    }

    .mx-app-table__body {
        .mx-app-table__row {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            min-height: 44px;

            /* 斑马纹：偶数行浅色背景 */
            &:nth-child(even) {
                background: #fafbfc;
            }

            &:last-child {
                border-bottom: none;
            }
        }
    }

    .mx-app-table__cell {
        box-sizing: border-box;
        flex: none;
        padding: 10px 8px;
        color: #303133;
        font-size: 12px;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.head {
            color: #909399;
            font-size: 12px;
            font-weight: 400;
        }
    }

    .mx-app-table__empty {
        padding: 40px 0;
        text-align: center;
        color: #909399;
        font-size: 12px;
    }
}
</style>
