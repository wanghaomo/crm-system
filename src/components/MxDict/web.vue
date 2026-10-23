<template>
    <n-select
        v-if="!text"
        style="width: 100%;"
        @change="handleSelect"
        v-model:value="currentValue"
        :multiple="multiple"
        :clearable="clearable"
        :placeholder="placeholder"
        :options="getDictEnum"></n-select>
    <span v-else>{{ label ? label : getLabel }}</span>
</template>
<script lang="ts" setup>
import { NSelect } from 'naive-ui';
import { MxDictPropsType, MxDictEmits, MxOptionItemType } from './index.type';
import { computed, ref, watch } from 'vue';
import { useDictStore } from '@/store/commStore';
import { storeToRefs } from 'pinia';
const { dictMap } = storeToRefs(useDictStore());
const props = defineProps<MxDictPropsType>();
const emit = defineEmits<MxDictEmits>();
// 选中的value
const currentValue = ref(props.modelValue);
// 同步valueModel变化到currentValue
watch(
    () => props.modelValue,
    (newVal) => {
        currentValue.value = newVal;
    },
    { immediate: true }
);

// 字典枚举获取
const getDictEnum = computed(() => {
    console.log('这是=============', props, dictMap.value);
    if (dictMap.value && props.dictType) {
        return dictMap.value[props.dictType] || [];
    }
    return [];
});
// 根据字典枚举value获取label
const getDictLabel = computed(() => {
    return (value: string | string[]) => {
        if (props.dictType) {
            return Array.isArray(value)
                ? value.map((item: string) => getDictLabel.value(item)).join('、')
                : getDictEnum.value.find((item: any) => item.value === value)?.label || '';
        }
        return '';
    };
});
// 根据字典枚举value获取数据项
const getDictItem = computed(() => {
    return (value: string | string[]) => {
        if (props.dictType) {
            return Array.isArray(value)
                ? value.map((item: string) => getDictItem.value(item))
                : getDictEnum.value.find((item: any) => item.value === value) || {};
        }
        return {};
    };
});
// 下拉选择数据变化时触发
const handleSelect = (val: string | string[]) => {
    const label = getDictLabel.value(val);
    emit('update:modelValue', val);
    emit('update:label', label);
    emit('update:selectedData', getDictItem.value(val));
    emit('change', getDictItem.value(val));
};
// 计算属性获取label
const getLabel = computed(() => {
    if (props.multiple) {
        if (Array.isArray(currentValue.value)) {
            return currentValue.value.map((item: string) => getDictLabel.value(item)).join('、');
        } else {
            return '';
        }
    } else {
        return getDictLabel.value(currentValue.value as string);
    }
});
</script>
<style lang="postcss" scoped></style>
