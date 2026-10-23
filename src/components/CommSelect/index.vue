<!-- 工作面选择组件 -->
<template>
    <component
        :is="contentView"
        v-bind="{
            ...newProps,
            options: commOptionList,
            showFields: webShowFields,
            title: title,
            placeholder: placeholder,
            appShowFields: appShowFields,
            loading: loading,
        }"
        v-on="emitters" />
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import type { SelectProps, SelectEmits, SelectOption, WebShowFields } from './index.type';
import { isApp } from '@/utils';
import { initData } from './apiFun';
import { debounce } from 'lodash';
// 定义组件属性
const props = withDefaults(defineProps<SelectProps>(), {
    // 组件是否禁用
    disabled: false,
    // 组件值
    // modelValue: undefined,
    // 组件是否可清空
    clearable: true,
    // 组件是否多选
    multiple: false,
    // 额外参数
    extraParams: () => ({}),
    // 多选模式下，是否合并选中项的标签
    collapseTags: false,
    // 组件是否只读
    readonly: false,
    // 组件标签
    label: undefined,
    // app端-是否显示
    show: false,
    // 下拉选择组件类型
    typeName: undefined,
    // 选中的数据合集-仅用于web端展示
    selectedData: undefined,
    // 是否纯文本展示
    text: false,
    required: false,
    // 下拉选择组件选项
    options: undefined,
    // 禁用的选项值数组
    disabledValues: undefined,
    // 是否禁止缓存
    disableCache: false,
    // 是否仅显示label项（没有额外的字段展示）
    onlyShowLabel: false,
    //app是否显示van-field
    appShowVanField: true,
});
// 定义组件事件
const emit = defineEmits<SelectEmits>();
// 组件标题
const title = ref('选择');
// 组件搜索框占位符
const placeholder = ref('请输入');
// 列表数据
const commOptionList = ref<SelectOption[]>([]);
// web端展示的字段对象集合
const webShowFields = ref<WebShowFields[]>([]);
// app端额外展示的字段
const appShowFields = ref<string[]>([]);
// loading状态
const loading = ref(false);
// 事件传递
const emitters = {
    'update:modelValue': (value: string | string[]) => emit('update:modelValue', value),
    'update:label': (label: string | string[]) => emit('update:label', label),
    changeEvt: (value: SelectOption | SelectOption[] | null) => emit('changeEvt', value),
    'update:show': (show: boolean) => emit('update:show', show),
    // 选中的数据合集更新事件
    'update:selectedData': (selectedData: SelectOption | SelectOption[] | null) =>
        emit('update:selectedData', selectedData),
};

import AppView from './app.vue';
import WebView from './web.vue';

const contentView = computed(() => (isApp() ? AppView : WebView));
const newProps = ref({});
// 判断是否要更新selectedData
const isUpdateSelectedData = (
    newVal: SelectOption | SelectOption[] | null,
    oldVal: SelectOption | SelectOption[] | null
) => {
    if (!oldVal) {
        return true;
    }
    if (Array.isArray(newVal)) {
        if (!Array.isArray(oldVal)) {
            return true;
        }
        if (newVal.length !== oldVal.length) {
            return true;
        }
        const newValues = newVal.map((item: SelectOption) => item.value);
        const oldValues = oldVal.map((item: SelectOption) => item.value);
        if (!newValues.every((item) => oldValues.includes(item))) {
            return true;
        }
    } else {
        if (Array.isArray(oldVal)) {
            return true;
        }
        if (newVal?.value !== oldVal?.value) {
            return true;
        }
    }
    return false;
};
// 数据获取/初始化
const init = debounce(async () => {
    // newProps.value = { ...props };
    // if (!props.selectedData) {
    // }
    console.log('这是这是通用选择的key-数据获取', props);

    loading.value = true;
    const res = await initData(
        props.typeName,
        props.extraParams,
        props.options,
        props.disabledValues,
        props.disableCache,
        props.onlyShowLabel
    );
    console.log('处理后的值', res);

    loading.value = false;
    if (res) {
        // const { title, placeholder, webShowFields, commOptionList } = res;
        title.value = res.title || title.value;
        placeholder.value = res.placeholder || placeholder.value;
        webShowFields.value = res.webShowFields || webShowFields.value;
        commOptionList.value = res.commOptionList || commOptionList.value;
        appShowFields.value = res.appShowFields || appShowFields.value;
    }
}, 500);
// props同步
const propsSync = debounce(() => {
    newProps.value = { ...props };
}, 500);

const handleInitData = debounce(() => {
    const propsData = { ...props };
    if (props.selectedData !== undefined) {
        // 没有传入modelValue，如果传入了selectedData，就用selectedData的值初始化modelValue
        if (props.multiple) {
            if (Array.isArray(props.selectedData)) {
                propsData.modelValue = props.selectedData.map((item: SelectOption) => item.value);
                propsData.label = props.selectedData.map((item: SelectOption) => item.label);
            } else {
                propsData.modelValue = props.selectedData?.value ? [props.selectedData?.value] : [];
                propsData.label = props.selectedData?.label ? [props.selectedData?.label] : [];
            }
        } else {
            if (props.selectedData && !Array.isArray(props.selectedData)) {
                propsData.modelValue = props.selectedData?.value || '';
                propsData.label = props.selectedData?.label || '';
            }
        }
    } else {
        propsData.modelValue = props.modelValue;
    }
    newProps.value = { ...propsData };
}, 500);

watch(
    () => props,
    (newValue, oldValue) => {
        if (props.selectedData === undefined) {
            propsSync();
        } else {
            if (isUpdateSelectedData(newValue?.selectedData, oldValue?.selectedData)) {
                handleInitData();
            }
        }
    },
    {
        deep: true,
        immediate: true,
    }
);

watch(
    () => props.selectedData,
    (newVal, oldVal) => {
        if (isUpdateSelectedData(newVal, oldVal)) {
            handleInitData();
        }
    },
    {
        deep: true,
        immediate: true,
    }
);

// typeName发生改变
watch(
    () => props.typeName,
    (newValue, oldValue) => {
        if (newValue !== oldValue && newValue !== undefined) {
            init();
        }
    },
    {
        deep: true,
        immediate: true,
    }
);
watch(
    () => props.options,
    (newValue, oldValue) => {
        if (newValue !== oldValue && newValue !== undefined) {
            init();
        }
    },
    {
        deep: true,
        immediate: true,
    }
);
// extraParams发生改变
watch(
    () => props.extraParams,
    (newValue, oldValue) => {
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue) && JSON.stringify(newValue) !== '{}') {
            init();
        }
    },
    {
        deep: true,
    }
);
// show发生改变/App端时使用
watch(
    () => props.show,
    (newValue) => {
        if (newValue === true && isApp()) {
            init();
        }
    },
    {
        deep: true,
    }
);
</script>
