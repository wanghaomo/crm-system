<template>
    <div class="item-head" v-if="showEdit">
        <div class="title">{{ title }}{{ numberToChinese(index) }}</div>
        <button class="button edit" @click="emit('edit')">
            <div class="icon"></div>
            {{ editBtnText }}
        </button>
    </div>
    <div class="data-item mx_mes-wrapper-grey">
        <div class="item-head" v-if="!showEdit">
            <div class="title">{{ title }}{{ numberToChinese(index) }}</div>
            <div class="small-title">{{ smallTitle }}</div>
        </div>
        <MxAppDescriptions :data="getDisplayDictItemData()" :column="1" label-width="110px" :span="2">
        </MxAppDescriptions>
        <div class="expand-toggle" @click="toggleExpand()">
            {{ isExpanded ? '收起' : '展开' }}
            <Icon name="arrow-up" v-if="isExpanded" />
            <Icon name="arrow-down" size="16" v-else />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from 'vant';
import { numberToChinese } from '@/utils/commUtil';
const props = defineProps({
    item: {
        type: Object,
        default: () => ({}),
    },
    descriptions: {
        type: Array,
        default: () => [],
    },
    index: {
        type: Number,
    },
    title: {
        type: String,
    },
    smallTitle: {
        type: String,
    },
    showEdit: {
        type: Boolean,
    },
    editBtnText: {
        type: String,
        default: '编辑',
    },
});
const emit = defineEmits('edit');
const isExpanded = ref(false);
/**
 * 获取当前折叠状态下需要展示的明细字段。
 * @returns 展开时返回全部字段，收起时只展示前五项
 */
const getDisplayDictItemData = () => {
    return isExpanded.value ? props.descriptions : props.descriptions.slice(0, 5);
};
/**
 * 切换明细卡片展开状态。
 * @returns 无返回值
 */
const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};
</script>

<style scoped lang="less">
:deep(.mx-descriptions-item__label) {
    white-space: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    flex: none !important;
    display: block !important;
}
.item-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333333;
    font-weight: 500;
}
.small-title {
    font-size: 14px;
    color: #2c65f2;
    font-weight: normal;
}
.button {
    border: none;
    outline: none;
    font-size: 14px;
    color: #2c65f2;
    display: flex;
    align-items: center;
    background: none;
    cursor: pointer;
    font-weight: normal;
    .icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
    }
}
.mx_mes-wrapper-grey {
    background: #f4f4f4;
    padding: 12px;
    box-sizing: border-box;
    border-radius: 8px 8px 8px 8px;
}
.edit {
    .icon {
        background: url('@/assets/images/comm/edit_icon.png') center no-repeat;
        background-size: 100% 100%;
    }
}
.expand-toggle {
    color: #2c65f2;
    text-align: center;
}
.data-item {
    margin-bottom: 12px;
    &:last-child {
        margin-bottom: 0px;
    }
}
</style>
