<template>
    <div class="web_inventory_report">
        <ReportBox title="总库存量树状图" :icon-src="zkclIcon">
            <div class="report-box__body">
                <div class="report-box__title">
                    <span>总库存量</span>
                    <span class="report-box__title-value">{{ formatInventoryTons(totalInventory) }}</span>
                    <span>｜</span>
                    <span>高品位库存</span>
                    <span class="report-box__title-value">{{ formatInventoryTons(highInventory) }}</span>
                    <span>｜</span>
                    <span>低品位库存</span>
                    <span class="report-box__title-value">{{ formatInventoryTons(lowInventory) }}</span>
                    <span>｜</span>
                    <span>混合矿库存</span>
                    <span class="report-box__title-value">{{ formatInventoryTons(mixedOreNum) }}</span>
                    <span>｜</span>
                    <span>交付在途量</span>
                    <span class="report-box__title-value">{{ formatInventoryTons(transferNums) }}</span>
                </div>
                <div class="report-box__content">
                    <div v-for="item in inventoryOptions" :key="item.value" class="report-box__card-item">
                        <CardBox
                            :title="item.label"
                            :value="formatInventoryTons(item.num)"
                            :type="item.value === 'IN_TRANSIT_INVENTORY' ? 'orange' : 'default'">
                            <!-- 在途库存明细 -->
                            <n-popover
                                v-if="item.value === 'IN_TRANSIT_INVENTORY'"
                                trigger="hover"
                                placement="bottom-start"
                                :show-arrow="false"
                                @update:show="(show) => handleShowChange(show, item)">
                                <template #trigger>
                                    <div class="report-box__item report-box__item--in-transit report-box__item--last">
                                        <span class="report-box__item-text">船运明细</span>
                                        <span class="report-box__item-icon">
                                            <n-icon size="16">
                                                <ChevronDown v-if="!item.show" />
                                                <ChevronUp v-else />
                                            </n-icon>
                                        </span>
                                    </div>
                                </template>
                                <div class="report-box__popover report-box__popover-table">
                                    <div class="report-box__table-header">{{ item.label }}</div>
                                    <n-data-table
                                        v-bind="{ columns: getInventoryColumns(item), data: item.detail }"
                                        :bordered="false"
                                        :bottom-bordered="false">
                                    </n-data-table>
                                </div>
                            </n-popover>
                            <!-- 堆场明细 -->
                            <n-popover
                                v-else-if="item.yardList.length > 0"
                                v-for="(detail, detailIndex) in item.yardList"
                                :key="detail.yardName"
                                trigger="hover"
                                placement="right-start"
                                :show-arrow="false">
                                <template #trigger>
                                    <div
                                        :class="[
                                            'report-box__item',
                                            'report-box__item--detail',
                                            detailIndex === item.yardList.length - 1 ? 'report-box__item--last' : '',
                                        ]">
                                        <span class="report-box__item-text">{{ detail.yardName }}</span>
                                        <span class="report-box__item-value"
                                            >{{ formatInventoryTons(detail.num) }}</span
                                        >
                                    </div>
                                </template>
                                <div class="report-box__popover">
                                    <div class="report-box__popover-title">{{ detail.yardName }}</div>
                                    <div
                                        v-for="d in detail.goodsList"
                                        :key="d.goodsName"
                                        class="report-box__popover-row">
                                        <span class="report-box__popover-name">{{ d.goodsName }}</span>
                                        <span class="report-box__popover-value"
                                            >{{ formatInventoryTons(d.num) }}</span
                                        >
                                    </div>
                                </div>
                            </n-popover>
                            <div v-else class="report-box__no-data">暂无库存</div>
                        </CardBox>
                    </div>
                </div>
            </div>
        </ReportBox>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import { NPopover, NDataTable, NIcon } from 'naive-ui';
import { ChevronDown, ChevronUp } from '@vicons/ionicons5';
import ReportBox from './ReportBox.vue';
import CardBox from './CardBox.vue';
import { formatInventoryTons, normalizeInventoryReport, type InventoryOptionItem } from '../../inventoryReport';

const zkclIcon = new URL('@/assets/images/dashboard/icon⎽com⎽zkcl.png', import.meta.url).href;

// 在途库存移入显示表格列
const columns = [
    {
        key: 'licensePlate',
        title: '船号',
        width: 100,
        ellipsis: {
            tooltip: true,
        },
    },
    {
        key: 'originYard',
        title: '始发码头',
        width: 100,
        ellipsis: {
            tooltip: true,
        },
    },
    {
        key: 'destinationYard',
        title: '目的码头',
        width: 100,
        ellipsis: {
            tooltip: true,
        },
    },
    {
        key: 'goods',
        title: '货物',
        width: 100,
        ellipsis: {
            tooltip: true,
        },
    },
    {
        key: 'netWeight',
        title: '吨位',
        width: 100,
        render: (row: any) => formatInventoryTons(row.netWeight),
        ellipsis: {
            tooltip: true,
        },
    },
];
// 客户交割在途库存独有客户字段，内部转运在途库存沿用基础字段。
const customerColumns = [
    columns[0],
    {
        key: 'salesSubject',
        title: '客户',
        width: 100,
        ellipsis: {
            tooltip: true,
        },
    },
    ...columns.slice(1),
];
const getInventoryColumns = (inventory: any) => (inventory?.inventoryType === 'customer' ? customerColumns : columns);

const props = defineProps({
    inventoryData: { type: Object, default: () => ({}) },
    inventoryOptions: { type: Array as PropType<InventoryOptionItem[]>, default: () => [] },
    totalInventory: { type: Number, default: 0 },
    highInventory: { type: Number, default: 0 },
    lowInventory: { type: Number, default: 0 },
    mixedOreNum: { type: Number, default: 0 },
    transferNums: { type: Number, default: 0 },
    columns: { type: Array as PropType<any[]>, default: () => [] },
});

const totalInventory = computed(() => props.totalInventory ?? props.inventoryData?.num ?? 0);
const highInventory = computed(() => props.highInventory ?? props.inventoryData?.highNum ?? 0);
const lowInventory = computed(() => props.lowInventory ?? props.inventoryData?.lowNum ?? 0);
const mixedOreNum = computed(() => props.mixedOreNum ?? props.inventoryData?.mixedOreNum ?? 0);
const transferNums = computed(() => props.transferNums ?? props.inventoryData?.transferNums ?? 0);
// 本地响应式副本，用于 popover show 状态切换。
const inventoryOptions = ref<InventoryOptionItem[]>(props.inventoryOptions.length ? [...props.inventoryOptions] : normalizeInventoryReport(props.inventoryData));

// 父组件异步加载或刷新库存数据时，同步本地副本。
watch(
    () => props.inventoryData,
    (newValue) => {
        if (!props.inventoryOptions.length) inventoryOptions.value = normalizeInventoryReport(newValue);
    },
    { deep: true, immediate: true }
);

watch(
    () => props.inventoryOptions,
    (newValue) => {
        inventoryOptions.value = [...(newValue || [])];
    },
    { deep: true, immediate: true }
);

// 在途库存 popover 显隐控制
const handleShowChange = (show: boolean, item: any) => {
    item.show = show;
};
</script>

<style lang="less" scoped>
// 独占一行，最大宽度不超出父容器
.web_inventory_report {
    width: 100%;
    max-width: 100%;
}
:deep(.component_page_content) {
    > div {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
    }
}
.report-box__body {
    background-color: #f7faff;
    border-radius: 8px;
    overflow: hidden;
}
.report-box__title {
    display: inline-flex;
    width: fit-content;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin: -12px auto 12px;
    padding: 18px 30px 6px;
    color: #ffffff;
    background: linear-gradient(180deg, #3a78ff 0%, #1e5fff 100%);
    border-radius: 0 0 16px 16px;
    font-size: 14px;
    box-shadow: 0 10px 22px rgba(45, 109, 255, 0.28);
    text-align: center;
    line-height: 16px;
    gap: 4px;
}
.report-box__content {
    /* Keep a single row; cards expand to fill the width and scroll when needed. */
    padding: 0 16px 24px;
    box-sizing: border-box;
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 16px;
    overflow-x: auto;
}
.report-box__no-data {
    color: var(--base-grey2);
    padding-top: 12px;
}
.report-box__card-item {
    position: relative;
    /* Grow when there is room, but never compress content into ellipses. */
    flex: 1 0 max-content;
    width: auto;
    min-width: 220px;
}
.report-box__card-item :deep(.card-box) {
    width: 100%;
    min-width: max-content;
}
.report-box__card-item :deep(.card-box__title) {
    flex-shrink: 0;
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
}

.report-box__item {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    background-color: #ffffff;
    border-radius: 4px;
    margin-bottom: 12px;
    box-shadow: 0px 3px 10px 1px rgba(157, 183, 245, 0.16);
    transition: background-color 0.15s ease, color 0.15s ease;
    height: 40px;
}
.report-box__item--last {
    margin-bottom: 0;
}
.report-box__item--in-transit {
    cursor: pointer;
    box-shadow: 0px 3px 10px 1px rgba(248, 206, 126, 0.16);
    &:hover {
        background-color: #ff9300;
    }
}
.report-box__item--detail {
    cursor: pointer;
    &:hover {
        background-color: #2c65f2;
    }
}
.report-box__item:hover {
    & .report-box__item-text,
    & .report-box__item-value,
    & .report-box__item-icon {
        color: #fff;
    }
}
.report-box__item-text {
    color: var(--base-grey2);
    flex-shrink: 0;
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
}
.report-box__item-icon {
    color: var(--base-grey);
}
.report-box__item-value {
    flex-shrink: 0;
    white-space: nowrap;
    font-weight: 600;
    color: var(--base-black);
}
.report-box__popover {
    padding: 8px 2px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 300px;
    max-height: 350px;
    overflow-y: auto;
}
.report-box__popover-table {
    width: 610px;
    max-width: 610px;
    gap: 0px;
}
.report-box__popover-title {
    font-size: 12px;
    color: var(--base-grey);
}
.report-box__table-header {
    font-weight: 600;
    color: var(--base-black);
}
:deep(.n-data-table-thead) {
    background: transparent;
}
:deep(.n-data-table-thead .n-data-table-tr .n-data-table-th) {
    font-size: 12px;
    color: var(--base-grey);
    background: transparent;
    border-bottom: 1px solid #eceef4;
}
.report-box__popover-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    min-width: 0;
    color: var(--base-grey2);
}
.report-box__popover-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #646a73;
}
.report-box__popover-value {
    flex-shrink: 0;
    color: var(--base-black);
}
</style>
