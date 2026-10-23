<template>
    <WebPage closeHeader :contentBg="'none'">
        <template #content>
            <div>通用组件</div>
            <div class="common_component">
                <div class="common_item">
                    <div class="item_label">人员单选</div>
                    <MxPersonSelect
                        v-model="userSelect.radio.value"
                        v-model:label="userSelect.radio.label"
                        @changeEvt="userSelect.radio.change"></MxPersonSelect>
                </div>
                <div class="common_item">
                    <div class="item_label">人员多选</div>
                    <MxPersonSelect
                        v-model="userSelect.multiple.value"
                        v-model:label="userSelect.multiple.label"
                        multiple
                        @changeEvt="userSelect.multiple.change"></MxPersonSelect>
                </div>
                <div style="width: 100%">
                    <n-select v-model:value="commSelectValue" :options="options" @change="commSelectChange" />
                </div>
                <div class="common_item">
                    <div class="item_label">通用单选</div>
                    {{ commSelect.radio.value }}-{{ commSelect.radio.label }}
                    <MxCommSelect
                        v-model="commSelect.radio.value"
                        v-model:label="commSelect.radio.label"
                        :typeName="commSelect.radio.typeName"
                        :extraParams="commSelect.radio.extraParams"
                        @changeEvt="commSelect.radio.change"></MxCommSelect>
                </div>
                <div class="common_item">
                    <div class="item_label">通用多选</div>
                    {{ commSelect.multiple.value }}-{{ commSelect.multiple.label }}
                    <MxCommSelect
                        v-model="commSelect.multiple.value"
                        v-model:label="commSelect.multiple.label"
                        :typeName="commSelect.multiple.typeName"
                        :collapseTags="true"
                        multiple
                        :extraParams="commSelect.multiple.extraParams"
                        @changeEvt="commSelect.multiple.change"></MxCommSelect>
                </div>
                <div style="width: 100%; height: 400px; border-radius: 0">
                    <MxWebDataTable v-bind="tableConfig"></MxWebDataTable>
                </div>
            </div>
        </template>
    </WebPage>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { NSelect } from 'naive-ui';
const userSelect = reactive({
    // 单选
    radio: {
        value: '',
        label: '',
        option: null,
        change: (newValue: any) => {
            userSelect.radio.option = newValue;

        },
    },
    // 多选
    multiple: {
        value: [],
        label: [],
        option: null,
        change: (newValue: any) => {
            userSelect.multiple.option = newValue;

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
        value: '',
        label: '',
        option: null,
        typeName: '作业面',
        extraParams: {},
        change: (newValue: any) => {
            commSelect.radio.option = newValue;

        },
    },
    multiple: {
        value: [],
        label: [],
        option: null,
        typeName: '作业面',
        extraParams: {},
        change: (newValue: any) => {
            commSelect.radio.option = newValue;

        },
    },
});
// 表格配置（建议一个对象）
const tableConfig = ref<any>({
    // 表头
    columns: [
        {
            key: 'categoryName',
            title: '分类名称',
            width: 240,
        },
        {
            key: 'categoryCode',
            title: '分类编码',
            width: 160,
        },
        {
            key: 'sort',
            title: '排序',
            width: 160,
        },
        {
            key: 'createdAt',
            title: '创建时间',
            width: 160,
        },
        {
            key: 'remark',
            title: '备注',
            width: 360,
        },
    ],
    // 表格数据
    tableList: [
        {
            index: 1,
            categoryName: '分类名称',
            categoryCode: '分类编码',
            sort: '排序',
            createdAt: '创建时间',
            remark: '备注',
        },
    ],
    // 按钮
    tableBtns: [
        {
            btnName: '新增',
            permission: 'sat:category:create',
            btnColor: '#4DB16B',
            isBtnHide: (row: any) => row.level < 2,
            clickTableBtns: (row: any) => {
                // changeTableDate(2, 'add', row);
            },
        },
        {
            btnName: '编辑',
            permission: 'sat:category:edit',
            btnColor: '#396ACE',
            clickTableBtns: (row: any) => {
                // changeTableDate(2, 'exit', row);
            },
        },
        {
            btnName: '删除',
            permission: 'sat:category:delete',
            btnColor: '#E34242',
            clickTableBtns: async (row: any) => {
                // const { code, data } = await delCategoryPageApi(row.id);
                // if (code === 200) {
                //     loadTableData();
                // }
            },
        },
    ],
    // 是否展示分页
    isShowPagination: true,
});
</script>
<style lang="postcss" scoped>
.common_component {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .common_item {
        width: calc(50% - 5px);
    }
    > div {
        margin-bottom: 10px;
    }
}
</style>
