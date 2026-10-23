<template>
    <MxCascaderTreeSelect
        v-model:value="valueModel"
        v-model:label="labelModel"
        :type="2"
        :option="deptTree"
        :valueKey="valueKey"
        :labelKey="labelKey"
        :childrenKey="childrenKey"
        :multiple="multiple" />
</template>

<script setup lang="ts">
import { getDeptTree } from '@/api';
import { onMounted, ref, watch } from 'vue';

const props = withDefaults(
    defineProps<{
        multiple?: boolean;
        valueKey?: string;
        labelKey?: string;
        childrenKey?: string;
        requestParams?: Record<string, any>;
    }>(),
    {
        multiple: false,
        valueKey: 'value',
        labelKey: 'label',
        childrenKey: 'children',
        requestParams: () => ({}),
    }
);

const valueModel = defineModel<any>('value');
const labelModel = defineModel<any>('label');
const deptTree = ref<any[]>([]);

/**
 * 获取部门树，外部查询参数会随部门请求一并传入。
 * @returns 无返回值
 */
const loadDeptTree = async () => {
    try {
        const res = await getDeptTree({
            ...props.requestParams,
            type:'INTERNAL',
        });
        if (res.code === 200) {
            deptTree.value = res.data || [];
        }
    } catch (error) {
        console.error('部门树获取失败', error);
    }
};

onMounted(() => {
    loadDeptTree();
});

watch(
    () => props.requestParams,
    () => {
        loadDeptTree();
    },
    { deep: true }
);
</script>
