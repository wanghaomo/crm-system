<template>
  <n-cascader :show-path="false" v-if="type === 1" :cascade="false" :allow-checking-not-loaded="false"
    :multiple="multiple" :value-field="valueKey" :label-field="labelKey" :children-field="childrenKey"
    :check-strategy="checkStrategy" v-model:value="valueModel" placeholder="请选择" @update:value="handleSelect"
    :options="option" size="large" />
  <n-tree-select size="large" v-else :multiple="multiple" @update:value="handleSelect" placeholder="请选择" :checkable="multiple"
    :label-field="labelKey" v-model:value="valueModel" :key-field="valueKey" :options="option"
    :override-default-node-click-behavior="override" />
</template>

<script setup lang="ts">
import { NCascader, NTreeSelect } from 'naive-ui';
import { computed } from 'vue';
import { mxCascaderTreeSelectTypes } from '@/types/index'
const valueModel = defineModel('value');
const labelModel = defineModel('label');
const props = withDefaults(defineProps<mxCascaderTreeSelectTypes>(), {
  type: 1,
  multiple: false,
  isAllItem: false,
  allowParentSelect: true,
  valueKey: 'value',
  labelKey: 'label',
  childrenKey: 'children',
});
const checkStrategy = computed(() => {
  const { multiple, allowParentSelect } = props;
  if (multiple || allowParentSelect) return 'all';
  return 'child';
});
const override: any = ({ option }: any) => {
  if (props.allowParentSelect) return 'default';
  if (option.children) {
    return 'toggleExpand'
  }
  return 'default'
}
// 获取label
const handleSelect = (val: any, selectedOptions: any) => {
  const { multiple, labelKey, isAllItem, childrenKey } = props;
  const getLabel = () => {
    if (!multiple) {
      return isAllItem ? selectedOptions : selectedOptions[labelKey];
    }
    return selectedOptions.map((item: any) => {
      if (isAllItem) {
        const clonedItem = JSON.parse(JSON.stringify(item));
        if (clonedItem[childrenKey]) delete clonedItem[childrenKey];
        return clonedItem;
      }
      return item[labelKey];
    });
  };
  valueModel.value = val;
  labelModel.value = getLabel();
};
</script>

<style scoped lang="less">
:deep(.n-base-selection-label) {
    height: 34px;
}
:deep(.n-base-selection) {
  height: 34px;
  min-height: 34px;
}
</style>
