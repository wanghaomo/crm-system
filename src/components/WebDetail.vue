<template>
    <div v-if="_isApp" class="app-detail">
        <div class="detail-item" v-for="(it, index) in detailedConfiguration" :key="index">
            <div class="label">{{ it.label }}</div>
            <div v-if="!it.isSlot" class="value">{{ detailData[it.key] }}</div>
            <div v-else class="value">
                <slot :name="it.slotName" :value="detailData">
                    {{ detailData[it.key] }}
                </slot>
            </div>
        </div>
    </div>
    <div v-else>
        <n-grid cols="1 s:1 m:2 l:2 xl:2 2xl:3" responsive="screen">
            <n-grid-item v-for="(it, index) in detailedConfiguration" :key="index">
                <div class="web-detail-form-item">
                    <div class="title">{{ it.label }}</div>
                    <div v-if="!it.isSlot" class="value">
                        <n-ellipsis :style="{ 'max-width': `100%` }">
                            {{ detailData[it.key] }}
                        </n-ellipsis>
                    </div>
                    <div v-else class="value">
                        <n-ellipsis :style="{ 'max-width': `100%` }">
                            <slot :name="it.slotName" :value="detailData">
                                {{ detailData[it.key] }}
                            </slot>
                        </n-ellipsis>

                    </div>
                </div>
            </n-grid-item>
        </n-grid>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { NGrid, NGridItem, NEllipsis } from 'naive-ui';
import { isApp } from '@/utils';
const _isApp = isApp();
interface DetailConfigItem {
    label: string;
    key: string;
    isSlot?: boolean;
    slotName?: string;
}

const props = defineProps<{
    detailData: Record<string, any>;
    detailedConfiguration: DetailConfigItem[];
    labelWidth?: string;
}>();
</script>

<style lang="less" scoped>
.app-detail {
    .detail-item {
        margin-bottom: 16px;

        .label {
            padding: 8px 0 8px 0;
            margin-right: 4px;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--base-grey6);
        }

        .value {
            font-size: 14px;
            padding: 8px 0 8px 0;
            white-space: wrap;
            color: var(--black-color);
            border-bottom: solid 1px var(--border);
            word-wrap: break-word;
        }

    }

}
</style>