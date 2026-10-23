<template>
    <card title="总库存量树状图" iconClass="icon⎽com⎽zkcl" isApp>
        <template #head-right>
            <div class="inventory-total">
                <span class="inventory-total__label">总库存量</span>
                <span class="inventory-total__value">{{ formatInventoryTons(totalInventory) }}</span>
            </div>
        </template>
        <div class="inventory-tree">
            <div class="inventory-tree-top">
                <div class="inventory-tree-top__item">
                    <span class="inventory-tree-top__label">高品位库存</span>
                        <span class="inventory-tree-top__value">{{ formatInventoryTons(highInventory) }}</span>
                </div>
                <div class="inventory-tree-top__item">
                    <span class="inventory-tree-top__label">低品位库存</span>
                        <span class="inventory-tree-top__value">{{ formatInventoryTons(lowInventory) }}</span>
                </div>
            </div>
            <div v-if="normalizedOptions.length" class="inventory-tabs">
                <button
                    v-for="(item, index) in normalizedOptions"
                    :key="`${item.value}-${index}`"
                    type="button"
                    :class="['inventory-tab', { 'inventory-tab--active': item.__key === activeKey }]"
                    @click="handleTabChange(item.__key)">
                    {{ item.appLabel || item.label }}
                </button>
            </div>
            <template v-if="activeOption">
                <div class="inventory-panel__header">
                    <span class="inventory-panel__title">{{ activeOption.label }}</span>
                    <span class="inventory-panel__value">{{ formatInventoryTons(activeOption.num) }}</span>
                </div>
                <div v-if="activeOption.value === 'IN_TRANSIT_INVENTORY'" class="ship-list">
                    <div class="ship-panel">
                        <div class="ship-panel__head" @click="shipDetailExpanded = !shipDetailExpanded">
                            <span class="ship-panel__title">船运明细</span>
                            <span class="ship-panel__action">
                                <span>{{ shipDetailExpanded ? '收起明细' : '展开明细' }}</span>
                                <Icon :name="shipDetailExpanded ? 'arrow-up' : 'arrow-down'" />
                            </span>
                        </div>
                        <div v-if="shipDetailExpanded" class="ship-panel__body">
                            <template v-if="activeOption.detail?.length">
                                <div v-for="(item, index) in activeOption.detail" :key="item.licensePlate || `${activeOption.value}-${index}`" class="ship-card">
                                    <MxAppDescriptions :data="getShipDescriptions(item, activeOption)" :column="2" label-align="justify" label-width="56px" />
                                </div>
                            </template>
                            <div v-else class="empty-text empty-text--inner empty-text--inner-ship">暂无船运明细</div>
                        </div>
                    </div>
                </div>
                <div v-else class="yard-list">
                    <template v-if="activeOption.yardList?.length">
                        <div v-for="(yard, index) in activeOption.yardList" :key="yardExpandKey(yard, Number(index))" class="yard-card">
                            <div class="yard-card__head" @click="toggleYard(yard, Number(index))">
                                <div class="yard-card__title">
                                    <span class="yard-card__title-name">{{ yard.yardName || `堆场${Number(index) + 1}` }}</span>
                                    <span class="yard-card__title-value">{{ formatInventoryTons(yard.num) }}</span>
                                </div>
                                <div class="yard-card__action">
                                    <span>{{ isYardExpanded(yard, Number(index)) ? '收起明细' : '展开明细' }}</span>
                                    <Icon :name="isYardExpanded(yard, Number(index)) ? 'arrow-up' : 'arrow-down'" />
                                </div>
                            </div>
                            <div v-if="isYardExpanded(yard, Number(index))" class="yard-card__body">
                                <template v-if="yard.goodsList?.length">
                                    <div v-for="(goods, goodsIndex) in yard.goodsList" :key="goods.goodsName || goodsIndex" class="goods-row">
                                        <span class="goods-row__name">{{ goods.goodsName || '--' }}</span>
                                        <span class="goods-row__value">{{ formatInventoryTons(goods.num) }}</span>
                                    </div>
                                </template>
                                <div v-else class="empty-text empty-text--inner">暂无货物明细</div>
                            </div>
                        </div>
                    </template>
                    <div v-else class="empty-text">暂无库存明细</div>
                </div>
            </template>
            <div v-else class="empty-text">暂无库存数据</div>
        </div>
    </card>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import { Icon } from 'vant';
import card from './card.vue';
// import MxAppDescriptions from '@/appComponents/MxAppDescriptions/index.vue';
import { formatInventoryTons, type InventoryOptionItem } from '../inventoryReport';

const props = defineProps({
    totalInventory: { type: Number, default: 0 },
    highInventory: { type: Number, default: 0 },
    lowInventory: { type: Number, default: 0 },
    inventoryOptions: { type: Array as PropType<InventoryOptionItem[]>, default: () => [] },
});

const activeKey = ref('');
const expandedYardKeys = ref<string[]>([]);
const shipDetailExpanded = ref(true);

const normalizedOptions = computed<InventoryOptionItem[]>(() => (props.inventoryOptions || []).map((item, index) => ({
    ...item,
    __key: `${item.value || 'inventory'}-${index}`,
})));
const activeOption = computed(() => normalizedOptions.value.find((item) => item.__key === activeKey.value) || null);

/** 转换在途库存明细为移动端描述项。 */
const getShipDescriptions = (ship: any, inventory: InventoryOptionItem) => {
    const descriptions = [
        { label: '船号', value: ship?.licensePlate || '--' },
        { label: '货物', value: ship?.goods || '--' },
        { label: '始发码头', value: ship?.originYard || '--', colSpan: 2 },
        { label: '目的码头', value: ship?.destinationYard || '--', colSpan: 2 },
        { label: '吨位', value: formatInventoryTons(ship?.netWeight), colSpan: 2 },
    ];
    if (inventory.inventoryType === 'customer') descriptions.splice(2, 0, { label: '客户', value: ship?.salesSubject || '--', colSpan: 2 });
    return descriptions;
};

const yardExpandKey = (yard: any, index: number) => `${activeOption.value?.value || 'inventory'}_${activeOption.value?.inventoryType || ''}_${yard?.yardCode || yard?.yardName || index}`;
const isYardExpanded = (yard: any, index: number) => expandedYardKeys.value.includes(yardExpandKey(yard, index));
const toggleYard = (yard: any, index: number) => {
    const key = yardExpandKey(yard, index);
    expandedYardKeys.value = isYardExpanded(yard, index) ? expandedYardKeys.value.filter((item) => item !== key) : [...expandedYardKeys.value, key];
};
const initExpandedYards = () => {
    shipDetailExpanded.value = true;
    const yardList = activeOption.value?.yardList || [];
    expandedYardKeys.value = yardList.length ? [yardExpandKey(yardList[0], 0)] : [];
};
const handleTabChange = (key?: string) => {
    if (!key || key === activeKey.value) return;
    activeKey.value = key;
    initExpandedYards();
};

watch(
    () => normalizedOptions.value,
    (options) => {
        if (!options.length) {
            activeKey.value = '';
            expandedYardKeys.value = [];
            return;
        }
        if (!options.some((item) => item.__key === activeKey.value)) activeKey.value = options[0].__key || '';
        initExpandedYards();
    },
    { immediate: true, deep: true }
);
</script>

<style scoped lang="less">
.inventory-total { display: flex; align-items: center; gap: 6px; text-align: right; line-height: 1.2; }
.inventory-total__value { color: var(--base-black); font-size: 14px; font-weight: 600; }
.inventory-total__label { margin-top: 2px; color: var(--base-grey); font-size: 12px; }
.inventory-tree { width: 100%; }
.inventory-tree-top { display: flex; gap: 12px; margin-top: 12px; }
.inventory-tree-top__item { font-size: 14px; line-height: 20px; }
.inventory-tree-top__label { margin-right: 8px; color: #999; }
.inventory-tree-top__value { color: #333; }
.inventory-tabs { display: flex; gap: 12px; margin-top: 12px; margin-bottom: 16px; overflow-x: auto; }
.inventory-tabs::-webkit-scrollbar { display: none; }
.inventory-tab { flex-shrink: 0; width: 56px; min-height: 64px; padding: 0; border: 1px solid #dddee0; border-radius: 8px; color: var(--base-grey2); font-size: 14px; font-weight: 500; line-height: 1.2; background: transparent; word-break: break-word; }
.inventory-tab--active { border-color: #2c65f2; background: #2c65f2; color: #fff; }
.inventory-panel__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.inventory-panel__title { color: var(--base-black); font-size: 16px; font-weight: 700; }
.inventory-panel__value { color: var(--base-black); font-size: 14px; font-weight: 600; }
.yard-list, .ship-list { display: flex; flex-direction: column; gap: 12px; }
.ship-panel, .yard-card { overflow: hidden; border-radius: 8px; background: #f4f4f4; }
.ship-panel__head, .yard-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; }
.ship-panel__title, .yard-card__title { color: var(--base-grey2); font-size: 14px; font-weight: 500; }
.ship-panel__action, .yard-card__action { display: inline-flex; align-items: center; flex-shrink: 0; gap: 4px; color: var(--base-grey2); font-size: 12px; }
.ship-panel__body { display: flex; flex-direction: column; gap: 12px; padding: 0 12px 12px; }
.ship-card { padding: 12px 12px 0; overflow: hidden; border-radius: 4px; background: #fff; }
.yard-card__title { display: flex; align-items: center; min-width: 0; gap: 8px; line-height: 16px; }
.yard-card__title-name { min-width: 0; }
.yard-card__title-value { flex-shrink: 0; color: var(--base-black); font-size: 14px; font-weight: 600; }
.yard-card__body { margin: 0 12px 12px; padding: 12px; border-radius: 4px; background: #fff; }
.goods-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--base-grey); }
.goods-row + .goods-row { margin-top: 10px; }
.goods-row__name { min-width: 100px; }
.goods-row__value { flex-shrink: 0; color: var(--base-black); font-size: 14px; }
.empty-text { padding: 20px 0; color: var(--base-grey); font-size: 14px; text-align: center; }
.empty-text--inner { padding: 12px; border-radius: 4px; background: #fff; }
.empty-text--inner-ship { padding: 24px 12px; }
</style>
