<template>
    <div>通用组件</div>
    <div class="common_component">
        <div class="common_item">
            <div class="item_label" @click="userSelect.radio.show = true">人员单选</div>
            <div>{{ userSelect.radio.label }}</div>
            <MxPersonSelect
                v-model:show="userSelect.radio.show"
                v-model="userSelect.radio.value"
                v-model:label="userSelect.radio.label"
                @changeEvt="userSelect.radio.change"></MxPersonSelect>
        </div>
        <div class="common_item">
            <div class="item_label" @click="userSelect.multiple.show = true">人员多选</div>
            <div>{{ userSelect.multiple.label.join(',') }}</div>
            <MxPersonSelect
                v-model:show="userSelect.multiple.show"
                v-model="userSelect.multiple.value"
                v-model:label="userSelect.multiple.label"
                multiple
                @changeEvt="userSelect.multiple.change"></MxPersonSelect>
        </div>
        <div class="common_item">
        <n-select v-model:value="commSelectValue" :options="options" @change="commSelectChange" />
        </div>
        <div class="common_item">
            <div class="item_label" @click="commSelect.radio.show = true">通用单选</div>
            {{ commSelect.radio.value }}-{{ commSelect.radio.label }}
            <MxCommSelect
                v-model="commSelect.radio.value"
                v-model:show="commSelect.radio.show"
                v-model:label="commSelect.radio.label"
                :typeName="commSelect.radio.typeName"
                :extraParams="commSelect.radio.extraParams"
                @changeEvt="commSelect.radio.change"></MxCommSelect>
        </div>
        
        <div class="common_item">
            <div class="item_label" @click="commSelect.multiple.show = true">通用多选</div>
            {{ commSelect.multiple.value }}-{{ commSelect.multiple.label }}
            <MxCommSelect
                v-model="commSelect.multiple.value"
                v-model:show="commSelect.multiple.show"
                v-model:label="commSelect.multiple.label"
                :typeName="commSelect.multiple.typeName"
                :collapseTags="true"
                multiple
                :extraParams="commSelect.multiple.extraParams"
                @changeEvt="commSelect.multiple.change"></MxCommSelect>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { NSelect } from 'naive-ui';
const userSelect = reactive({
    // 单选
    radio: {
        show: false,
        value: '',
        label: '',
        option: null,
        change: (newValue: any) => {
            userSelect.radio.option = newValue;
            window.console.log('人员单选', newValue);
        },
    },
    // 多选
    multiple: {
        show: false,
        value: [],
        label: [],
        option: null,
        change: (newValue: any) => {
            userSelect.multiple.option = newValue;
            window.console.log('人员多选', newValue);
        },
    },
});
const commSelectValue = ref('作业面');
const options = ref([
    {
        label: '作业面',
        value: '作业面',
    },
    {
        label: '班组',
        value: '班组',
    },
    {
        label: '巡检项目',
        value: '巡检项目',
    },
    {
        label: '设备',
        value: '设备',
    },
]);
const commSelectChange = (val: string) => {
    commSelect.radio.typeName = val;
    commSelect.radio.value = '';
    commSelect.radio.label = '';
    commSelect.multiple.typeName = val;
    commSelect.multiple.value = [];
    commSelect.multiple.label = [];
};
const commSelect = reactive({
    radio: {
        show:false,
        value: '',
        label: '',
        option: null,
        typeName: '作业面',
        extraParams: {},
        change: (newValue: any) => {
            commSelect.radio.option = newValue;
            console.log('通用单选', newValue);
        },
    },
    multiple: {
          show:false,
        value: [],
        label: [],
        option: null,
        typeName: '作业面',
        extraParams: {},
        change: (newValue: any) => {
            commSelect.radio.option = newValue;
            console.log('通用单选', newValue);
        },
    },
});
</script>
<style lang="postcss" scoped>
.common_component {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .common_item {
        width: 100%;
    }
    
}
</style>
