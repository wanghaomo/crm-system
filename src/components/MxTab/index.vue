<template>
        <div class="detail-tab">
            <div class="tab-item" v-for="it in tabs" :key="it.key" @click="onTabClick(it)">
                <span :class="[tabValue === it.key ? 'tab-item-name-select' : 'tab-item-name']">{{ it.name }}</span>
                <div class="tab-item-line" v-if="tabValue == it.key"></div>
            </div>
        </div>
</template>

<script setup lang="ts">
interface TabItem {
    name: string;
    key: string | number;
}

const tabValue = defineModel();

const emits = defineEmits<{
    (e: 'change', value: string | number): void;
}>();

const props = withDefaults(
    defineProps<{
        tabs: TabItem[];
    }>(),
    {
        tabs: () => [],
    }
);

const onTabClick = (item: TabItem) => {
    if (item.key === tabValue.value) return;
    tabValue.value = item.key;
    emits('change', item.key);
};
</script>

<style lang="less" scoped>

.detail-tab {
    flex-shrink: 0;
    height: 50px;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e2e2e2;
    padding: 0 8px;
}
.tab-item {
    padding: 0 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    position: relative;
    cursor: pointer;
}
.tab-item-name {
    font-weight: 400;
    font-size: 16px;
    color: #666666;
}
.tab-item-name-select {
    font-weight: 600;
    font-size: 16px;
    color: #333333;
}
.tab-item-line {
    width: 36px;
    height: 3px;
    background: #2c65f2;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
}
</style>
