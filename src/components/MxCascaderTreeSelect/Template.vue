<template>
    <MxCascaderTreeSelect v-bind="mxCascaderSelect" v-model:value="code" v-model:label="name" />
    code:{{ code }}
    name:{{ name }}
</template>
<script setup lang="ts">
import { ref } from 'vue'
const code = ref('')
const name = ref('')
import { mxCascaderTreeSelectTypes } from '@/types/index'
const mxCascaderSelect = ref<mxCascaderTreeSelectTypes>({
    type: 1,
    // 次级联动option数据
    option: [
        {
            id: 'value1',
            label: `label1`,
            children: [
                {
                    id: 'value3',
                    label: `label3`,

                }
            ]
        },
        {
            id: 'value2',
            label: `label2`,
            children: [
                {
                    id: 'value4',
                    label: `label4`,

                }
            ]
        }
    ],

    // 是否是多选或者单选(默认单选)
    multiple: false,
    // 当为多选或者单选的时候是否是返回的 单个值或者单个值数组 整个对象或者对象数组 默认为false
    isAllItem: false,
    // valueKey(默认value)
    valueKey: 'id',
    // labelKey(默认label)
    labelKey: 'label',
    // childrenKey(默认children)
    childrenKey: 'children'
})
</script>
<style lang="less" scoped></style>