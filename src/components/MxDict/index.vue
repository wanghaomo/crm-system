<template>
    <component :is="contentView" v-bind="newProps" v-on="emitters" />
</template>
<script lang="ts" setup>
import AppView from './app.vue';
import WebView from './web.vue';
import { MxDictPropsType, MxDictEmits, MxOptionItemType } from './index.type';
import { computed, ref, watch } from 'vue';
import { isApp } from '@/utils/comm';
const contentView = computed(() => (isApp() ? AppView : WebView));

const props = withDefaults(defineProps<MxDictPropsType>(), {
    modelValue:undefined,
    multiple: false,
    clearable: false,
    placeholder: '请选择',
    text: false,
});
const newProps = ref({...props});

const emits = defineEmits<MxDictEmits>();


// 事件传递
const emitters = {
    'update:modelValue': (value: string | string[]) => emits('update:modelValue', value),
    'update:label': (label: string | string[]) => emits('update:label', label),
    'update:selectedData': (value: string | string[]) => emits('update:selectedData', value),
    change: (value: string | string[]) => emits('change', value),
};
// 处理props数据，兼容selectedData双向绑定
const initData = () => {
    newProps.value = {...props};
    // 处理selectedData
    if (props.selectedData) {
        newProps.value.selectedData = props.selectedData;
    }
    if (props.modelValue === undefined) {
        // 没有传入modelValue，如果传入了selectedData，就用selectedData的值初始化modelValue
        if (props.multiple) {
            if (Array.isArray(props.selectedData)) {
                newProps.value.modelValue = props.selectedData.map((item: MxOptionItemType) => item.value);
            } else {
                newProps.value.modelValue = props.selectedData?.value ? [props.selectedData?.value] : [];
            }
        } else {
            if (props.selectedData && !Array.isArray(props.selectedData)) {
                newProps.value.modelValue = props.selectedData?.value || '';
            }
        }
    }else{
        newProps.value.modelValue = props.modelValue;
    }
};
watch(()=>props,()=>{
    initData();
},{
    immediate:true,
    deep:true,
})
</script>
<style lang="postcss" scoped></style>
