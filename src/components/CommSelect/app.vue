<template>
    <van-field
        v-if="props.appShowVanField"
        :label-align="props.labelAlign"
        :name="props.name"
        :class="attrs.class"
        :rules="props.rules"
        :required="props.required"
        v-model="labels"
        :label="props.title"
        :is-link="!props.readonly"
        readonly
        placeholder="请选择"
        @click="!props.readonly ? handleAppOpen() : null" />
    <div class="comm_select_container">
        <van-action-sheet
            v-model:show="Appshow"
            :close-on-click-overlay="true"
            :title="props.title"
            @closed="handleAppClose">
            <div class="app-action-sheet-content">
                <!-- 搜索区域 -->
                <search
                    class="search-box"
                    v-model="appSearchValue"
                    show-action
                    shape="round"
                    :placeholder="props.placeholder"
                    maxlength="24"
                    @search="onSearch">
                    <template #action>
                        <van-button @click.stop.prevent="onSearch" class="search-btn" type="primary" size="small" round
                            >搜索</van-button
                        >
                    </template>
                </search>
                <!-- 列表内容区域  -->
                <div class="content-main">
                    <div class="list-content" v-if="filteredOptions.length > 0">
                        <van-list>
                            <SelectItem
                                v-for="item in filteredOptions"
                                :key="item.value"
                                :item="item"
                                :selected="isSelected(item.value)"
                                :multiple="props.multiple"
                                :showDataItem="props.appShowFields"
                                @onClick="handleSelect"></SelectItem>
                        </van-list>
                    </div>
                    <div class="list-content" v-else>
                        <van-empty description="数据暂无" />
                    </div>
                </div>
                <!-- 底部 -->
                <div class="content-footer-placeholder" v-if="multiple"></div>
                <div class="content-footer" v-if="multiple">
                    <!-- 多选 -->
                    <div class="check-box" v-if="multiple" @click.stop.prevent="handleSelectAll">
                        <i
                            :class="{
                                icon: true,
                                check_icon: multiple,
                                part_icon: multiple && selectValue.length < options.length && selectValue.length > 0,
                                'check_active_icon ':
                                    multiple && selectValue.length >= options.length && selectValue.length > 0,
                            }"></i>
                        <span class="check-text">全选（{{ selectValue.length }}/{{ options.length }}）</span>
                    </div>
                    <i></i>
                    <van-button class="confirm-btn" type="primary" @click.stop.prevent="submitEvt">确认</van-button>
                </div>
            </div>
        </van-action-sheet>
    </div>
</template>

<script setup lang="ts">
import SelectItem from '@/components/SelectItem/index.vue';
import { computed, onMounted, ref, watch, useAttrs } from 'vue';
import {
    ActionSheet as VanActionSheet,
    Search,
    Button as VanButton,
    List as VanList,
    Empty as VanEmpty,
    Field as VanField,
} from 'vant';
import type { ChildrenSelectProps, SelectEmits, SelectOption } from './index.type';
// 从父组件接收属性
const props = defineProps<ChildrenSelectProps>();
const attrs = useAttrs();
const Appshow = ref(false);
watch(
    () => props.show,
    (newVal) => {
        if (newVal) {
            Appshow.value = newVal;

            if (newVal) {
                handleAppOpen();
                // 清除搜索值
                appSearchValue.value = '';
                filteredOptions.value = props.options || [];
            }
        }
    }
);
watch(
    () => props.options,
    (newVal) => {
        if (newVal) {
            filteredOptions.value = newVal || [];
            onSearch();
        }
    }
);
// 手动打开弹窗
const handleAppOpen = () => {
    Appshow.value = true;
    onSearch();
};
// 从父组件接收事件
const emit = defineEmits<SelectEmits>();
/**
 * 关闭弹窗
 * @param isSubmit 是否提交选择
 */
const handleAppClose = (isSubmit: boolean = false) => {
    if (!isSubmit) {
        selectValue.value = props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) || [] : [];
    }
    Appshow.value = false;
    // 清除搜索值
    // appSearchValue.value = '';
    emit('update:show', Appshow.value);
};
// 搜索
const appSearchValue = ref('');
const onSearch = async () => {
    console.log('props.options', props.options);

    filteredOptions.value = props.options.filter((item) => item.label.includes(appSearchValue.value));
};
// 处理选中数据的label
const labels = ref<string>('');
watch(
    () => props.label,
    (newVal) => {
        if (Array.isArray(newVal)) {
            labels.value = newVal.join('、');
        } else {
            labels.value = newVal || '';
        }
    },
    { immediate: true }
);
// 响应式数据
// const options = ref<SelectOption[]>(props.options || []);
// 筛选数据
const filteredOptions = ref<SelectOption[]>(props.options || []);
// 选择的数据Value
const selectValue = ref<string[] | string>(props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) || [] : []);
// 处理选择
const handleSelect = (value: string) => {
    if (props.multiple) {
        if (!Array.isArray(selectValue.value)) {
            selectValue.value = [];
        }
        if (selectValue.value.indexOf(value) === -1) {
            selectValue.value.push(value);
        } else {
            selectValue.value.splice(selectValue.value.indexOf(value), 1);
        }
    } else {
        // 单选
        selectValue.value = value;
        submitEvt();
    }
};
// 确认选择
const submitEvt = () => {
    if (props.options.length === 0) {
        return;
    }
    if (props.multiple) {
        emit('update:modelValue', selectValue.value);
        // 选中标签集合
        let selectedLabels: string[] = [];
        // 选中的项数据
        let selectedItems: SelectOption[] = [];
        if (Array.isArray(selectValue.value)) {
            // 结果是数组-正常
            selectedLabels = (selectValue.value || [])
                .map((item) => filteredOptions.value.find((opt) => opt.value === item)?.label || '')
                .filter((label) => label !== '');
            selectedItems = (selectValue.value || [])
                .map((item) => props.options.find((opt) => opt.value === item) || null)
                .filter((item): item is SelectOption => item !== null);
        } else {
            // 多选-但值非数组，异常，视同空数组
            selectedLabels = [];
            selectedItems = [];
        }
        // 选中标签集合
        emit('update:label', selectedLabels);
        // 选中项数据
        emit('changeEvt', selectedItems);
        // 选中的数据合集更新事件
        emit('update:selectedData', selectedItems);
        // 关闭弹窗
        handleAppClose(true);
        labels.value = selectedLabels.join('、');
    } else {
        emit('update:modelValue', selectValue.value);
        // 获取选中项
        let selectedItem = filteredOptions.value.find((item) => item.value === selectValue.value) || null;
        // 触发选择变更事件
        emit('changeEvt', selectedItem);
        // 更新标签
        emit('update:label', selectedItem?.label || null);
        // 选中的数据合集更新事件
        emit('update:selectedData', selectedItem);
        labels.value = selectedItem?.label || '';
        // 关闭弹窗
        handleAppClose(true);
    }
};
// 判断是否选中
const isSelected = computed(() => {
    return (value: string) => {
        if (Array.isArray(selectValue.value)) {
            return selectValue.value.includes(value);
        }
        return selectValue.value === value;
    };
});
// 全选
const handleSelectAll = () => {
    if (!Array.isArray(selectValue.value)) {
        selectValue.value = [];
    }
    if (props.options.length === selectValue.value.length) {
        // 已全选，取消全选
        selectValue.value = [];
    } else {
        // 未全选，全选
        const allValues = filteredOptions.value.map((item) => item.value);
        // 如果当前筛选出的数据已经全选，则将其移出，否则添加全选
        if (allValues.every((item) => selectValue.value.includes(item))) {
            // 已全选，将allValues从selectValue.value中移除
            selectValue.value = selectValue.value.filter((item) => !allValues.includes(item));
        } else {
            // 未全选，全选
            selectValue.value = [...new Set([...selectValue.value, ...allValues])];
        }
    }
};
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            selectValue.value = props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) || [] : [];
        }
    },
    { immediate: true, deep: true }
);
</script>

<style>
.comm_select_container .app-action-sheet-content {
    display: flex;
    flex-direction: column;
    position: relative;
    height: calc(80vh - 48px);
    background-color: var(--base-grey3);
    overflow-y: hidden;
}
.comm_select_container .van-search {
    margin-bottom: 12px !important;
}
.comm_select_container .search-box .search-btn {
    width: 72px;
    height: 34px;
    line-height: 34px;
    font-size: 14px;
}
.comm_select_container .content-main {
    flex: 1;
    padding: 12px 0px 0px;
    background-color: var(--base-white);
    overflow-y: hidden;
}
.comm_select_container .content-main .list-content {
    overflow-y: auto;
    padding: 0 12px;
    height: 100%;
}
.comm_select_container .content-main .list-row {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding: 12px 0;
}
.comm_select_container .content-main .list-row .icon {
    margin-right: 12px !important;
}
.comm_select_container .content-main .row-title {
    font-size: 16px;
    color: var(--base-black);
    font-weight: 500;
    line-height: 22px;
    margin-bottom: 4px;
}
.comm_select_container .content-main .row-other {
    font-size: 12px;
    font-weight: 400;
    color: var(--base-grey);
    line-height: 20px;
}
.comm_select_container .content-main .row-other .line-icon {
    margin: 0 8px;
}
.comm_select_container .content-footer-placeholder {
    height: 48px;
}
.comm_select_container .content-footer {
    position: absolute;
    left: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 48px;
    background-color: var(--base-white);
    z-index: 1;
    border-top: 1px solid var(--border);
    padding: 0 12px;
}
.comm_select_container .content-footer .icon {
    width: 16px;
    height: 16px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100%;
}
.comm_select_container .content-footer .check-box {
    display: flex;
    align-items: center;
}
.comm_select_container .content-footer .check-box .icon {
    margin-right: 8px;
}
.comm_select_container .content-footer .confirm-btn {
    width: 140px;
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
}
/* 多选-未选中 */
.comm_select_container .check_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_icon.png');
}
/* 多选-选中 */
.comm_select_container .check_active_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_icon_active.png');
}
/* 多选-部分选中 */
.comm_select_container .part_icon {
    background-image: url('@/components/SelectItem/img/multiple_select_part_active.png');
}
:deep(.comm_select_container .van-field__control) {
    font-size: 14px;
}
:deep(.comm_select_container .van-search__action) {
    display: flex;
    align-items: center;
}
:deep(.comm_select_container .van-cell) {
    padding: 4px 0 !important;
}
</style>
