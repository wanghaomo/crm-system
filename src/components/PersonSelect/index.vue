<template>
    <component :is="contentView" v-bind="{
        ...newProps,
        options: personOption,
    }" v-on="emitters" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PersonSelectProps, PersonSelectEmits, PersonOption } from './index.type';
import { isApp } from '@/utils';
import { debounce } from 'lodash';
import { useDictStore } from '@/store/commStore';
import { storeToRefs } from 'pinia';
const { dictMap } = storeToRefs(useDictStore());
const { setDictMapByName } = useDictStore();
// 人员列表数据
let personOption = ref<Array<PersonOption>>([]);

// 定义组件属性
const props = withDefaults(defineProps<PersonSelectProps>(), {
    // 组件是否禁用
    disabled: false,
    // 组件值
    modelValue: undefined,
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
    // 标题
    title: '人员选择',
    // 必填校验展示控制
    required: false,
    // 搜索框占位符
    placeholder: isApp() ? '请输入姓名' : '人员选择',
    // 选择人的对象-只用于展示，传入的值不会回显到组件中
    // selectedPerson: undefined,
    // 是否纯文本展示
    text: false,
    // label对齐方式
    labelAlign: undefined,
    // 是否仅使用弹窗效果
    popupOnly: false,
    // 当前数据是否禁用缓存
    disableCache: false,
});
/**
 * 组装人员选择组件的查询参数。
 * 选人组件只展示在职内部员工，避免外部传参或其他模块的查询条件覆盖员工类型。
 * @returns 人员列表接口查询参数
 */
const getPersonListParams = () => ({
    status: 'WORKING',
    needDept: true,
    ...props.extraParams,
    type: 'INTERNAL',
});

/**
 * 根据查询参数生成独立缓存键，避免与审批等“全部人员”查询共用缓存。
 * @param params 人员列表接口查询参数
 * @returns 人员列表缓存键
 */
const getPersonListCacheKey = (params: Record<string, any>) =>
    `人员列表-${Object.keys(params)
        .sort()
        .map((key) => `${key}=${String(params[key])}`)
        .join('&')}`;
const newProps = ref({ ...props });
// 判断是否要更新selectedPerson
const isUpdateSelectedPerson = (
    newVal: PersonOption | PersonOption[] | null,
    oldVal: PersonOption | PersonOption[] | null
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
        const newValues = newVal.map((item: PersonOption) => item.value);
        const oldValues = oldVal.map((item: PersonOption) => item.value);
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
// 处理props数据，兼容selectedPerson双向绑定
const initData = debounce(() => {
    const propsData = { ...props };
    if (props.selectedPerson !== undefined) {
        // 没有传入modelValue，如果传入了selectedPerson，就用selectedPerson的值初始化modelValue
        if (props.multiple) {
            if (Array.isArray(props.selectedPerson)) {
                propsData.modelValue = props.selectedPerson.map((item: PersonOption) => item.value);
                propsData.label = props.selectedPerson.map((item: PersonOption) => item.label);
            } else {
                if (props.selectedPerson) {
                    propsData.modelValue = props.selectedPerson?.value ? [props.selectedPerson?.value] : [];
                    propsData.label = props.selectedPerson?.label ? [props.selectedPerson?.label] : [];
                } else {
                    propsData.modelValue = null;
                    propsData.label = null;
                }
            }
        } else {
            if (props.selectedPerson && !Array.isArray(props.selectedPerson)) {
                propsData.modelValue = props.selectedPerson?.value || '';
                propsData.label = props.selectedPerson?.label || '';
            }
        }
    } else {
        propsData.modelValue = props.modelValue;
    }
    console.log('我要变变变======', propsData);
    newProps.value = { ...propsData };
}, 500);
// 同步props
const propsSync = debounce(() => {
    newProps.value = { ...props };
}, 500);
watch(
    () => props,
    (newVal, oldVal) => {
        // 如果没有传入selectedPerson，就用newVal初始化newProps
        console.log('============PROPSnewVal', newVal);
        console.log('============PROPSoldVal', oldVal);
        if (newVal.selectedPerson === undefined) {
            propsSync();
        } else {
            // 判断，newVal.selectedPerson是否有变化
            // const propsData = { ...props };
            // delete propsData.selectedPerson;
            // newProps.value = { ...newProps.value, ...propsData };
            if (isUpdateSelectedPerson(newVal?.selectedPerson, oldVal?.selectedPerson)) {
                console.log('对象变了喔');

                initData();
            }
            console.log('我要变变变====================newVal.selectedPerson', newProps.value);
        }
    },
    {
        immediate: true,
        deep: true,
    }
);

watch(
    () => props.selectedPerson,
    (newVal, oldVal) => {
        console.log('hhhhhhhhhhhhhhhhhhh', newVal, oldVal);
        if (isUpdateSelectedPerson(newVal, oldVal) && newVal) {
            console.log('对象变了喔2233');
            initData();
        }

        // initData();
    },
    {
        immediate: true,
        deep: true,
    }
);

// 定义组件事件
const emit = defineEmits<PersonSelectEmits>();

// 事件传递
const emitters = {
    'update:modelValue': (value: string | string[]) => emit('update:modelValue', value),
    'update:label': (label: string | string[]) => emit('update:label', label),
    changeEvt: (value: PersonOption | PersonOption[] | null) => emit('changeEvt', value),
    'update:show': (show: boolean) => emit('update:show', show),
    // 选择人变更事件
    'update:selectedPerson': (value: PersonOption | PersonOption[] | null) => emit('update:selectedPerson', value),
};
// 获取人员的数据
const getPersonList = async () => {
    const personParams = getPersonListParams();
    const dictKey = getPersonListCacheKey(personParams);
    console.log('这是人员条件dictKey:', dictKey);
    console.log('这是人员条件dictKey对应的值:', dictMap.value?.[dictKey]);
    // 人员列表数据
    let personList: Array<PersonOption> = [];
    if (dictMap.value?.[dictKey] && !props.disableCache) {
        personList = dictMap.value[dictKey];
    } else {
        try {
            personList = [];
            const _result = await getUserListApi(personParams);
            if (_result.code == 200) {
                console.log('人员数据获取-----', _result.data);
                personList = (_result.data || []).map((item: any) => ({
                    ...item,
                    label: item.username,
                    value: item.code,
                }));
                setDictMapByName(dictKey, personList);
            }
        } catch (error) {
            console.error('人员数据获取失败', error);
        }
    }
    personOption.value = [...personList];
};
watch(
    () => props.extraParams,
    (newVal, oldVal) => {
        if (newVal !== oldVal) {
            getPersonList();
        }
    },
    {
        immediate: true,
        deep: true,
    }
);

import AppView from './app.vue';
import WebView from './web.vue';
import { getUserListApi } from '@/api';

const contentView = computed(() => (isApp() ? AppView : WebView));
</script>

<style scoped lang="less">
.custom_icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.custom_icon svg {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
