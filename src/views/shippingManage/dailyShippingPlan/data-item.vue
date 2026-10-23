<template>
    <div class="item-head" v-if="showEdit || showInfo || visibleActions.length">
        <div :class="['head-left', { selectable: showCheck }]" @click="showCheck && toggleChecked()">
            <button v-if="showCheck" class="check-button" type="button" @click.stop="toggleChecked">
                <img class="check-icon" :src="checked ? checkedIcon : uncheckedIcon" alt="" />
            </button>
            <div class="title">{{ title }}{{ numberToChinese(index) }}</div>
        </div>
        <div class="actions">
            <button class="button edit" v-if="showEdit" @click="emit('edit')">
                <div class="icon"></div>
                {{ editBtnText }}
            </button>
            <button class="button info" v-if="showInfo" @click="emit('edit')">
                <div class="icon"></div>
                运输情况
            </button>
            <button
                class="button action"
                v-for="action in visibleActions"
                :key="action.action"
                @click="emit('action', action)">
                {{ action.text }}
            </button>
        </div>
    </div>
    <div class="data-item mx_mes-wrapper-grey">
        <div class="item-head" v-if="!showEdit && !showInfo && !visibleActions.length">
            <div class="title">{{ title }}{{ numberToChinese(index) }}</div>
            <div class="small-title">{{ smallTitle }}</div>
        </div>
        <MxAppDescriptions :data="getDisplayDictItemData()" :column="1" label-width="120px" :span="2">
        </MxAppDescriptions>
        <div class="expand-toggle" @click="toggleExpand()">
            {{ isExpanded ? '收起' : '展开' }}
            <Icon name="arrow-up" v-if="isExpanded" />
            <Icon name="arrow-down" size="16" v-else />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from 'vant';
import { numberToChinese } from '@/utils/commUtil';
import checkedIcon from '@/assets/images/comm/icon_com_mchoice_sel@3x.png';
import uncheckedIcon from '@/assets/images/comm/icon_com_mchoice_nor@3x.png';
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
    showInfo: {
        type: Boolean,
    },
    showCheck: {
        type: Boolean,
    },
    checked: {
        type: Boolean,
        default: false,
    },
    editBtnText: {
        type: String,
        default: '编辑',
    },
    actions: {
        type: Array,
        default: () => [],
    },
});
const emit = defineEmits(['edit', 'action', 'update:checked']);
const isExpanded = ref(false);
// 过滤隐藏的操作按钮，避免父组件每次都手动处理 show 字段。
const visibleActions = computed(() => props.actions.filter((item: any) => item.show !== false));
/**
 * 切换当前明细勾选状态。
 * @returns 无返回值
 */
const toggleChecked = () => {
    emit('update:checked', !props.checked);
};
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
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333333;
    font-weight: 600;
}
.head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}
.head-left.selectable {
    cursor: pointer;
}
.actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
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
    white-space: nowrap;
    .icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
    }
}
.check-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: transparent;
    flex: none;
}
.check-icon {
    display: block;
    width: 16px;
    height: 16px;
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
.info {
    .icon {
        background: url('@/assets/images/comm/icon_com_wuliu.png') center no-repeat;
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
