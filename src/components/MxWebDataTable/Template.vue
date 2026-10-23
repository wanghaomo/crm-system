<template>
    <div class="web-page-container no-padding">
        <WebDataTable v-bind="tableConfig">
            <!-- 外部一些样式 -->
            <template #tableContent></template>
            <!-- 表格内部输入框或者标题 -->
            <template #tableTitle></template>
            <!-- 表格右侧固定按钮 -->
            <template #tableBtn></template>
            <template #tableSearch>
                <WebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></WebSearchBar>
            </template>
        </WebDataTable>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, h } from 'vue';
import { WebDataTableType } from './type';
import { QueryItem } from '@/types/web-search-bar';
const queryConfiguration = ref<QueryItem[]>([
    {
        type: 'input',
        placeholder: '请输入用户名',
        label: '用户名',
        value: 'username',
    },
    {
        type: 'select',
        placeholder: '请选择用户状态',
        label: '用户状态',
        value: 'status',
        options: [
            {
                label: '正常',
                value: 1,
            },
        ],
    },
]);
const queryEvt = (row: any) => {

};
// 表格配置（建议一个对象）
const tableConfig = ref<WebDataTableType>({
    // 表头
    columns: [
        {
            key: 'index',
            title: '序号',
            width: 80,
        },
        {
            key: 'Field1',
            title: '字段1',
            width: 160,
        },
        {
            key: 'Field2',
            title: '字段2',
            width: 160,
        },
        {
            key: 'Field3',
            title: '字段3',
            width: 160,
        },
        {
            key: 'Field4',
            title: '字段4',
            width: 160,
        },
        {
            key: 'Field5',
            title: '字段5',
            width: 160,
        },
        {
            key: 'Field6',
            title: '字段6',
            width: 160,
        },
    ],
    // 表格数据
    tableList: [
       
    ],
    // 按钮
    tableBtns: [
        {
            btnName: '处理',
            permission: 'test:button',
            isBtnHide: (row: any) => row.Field1 === 1, //多状态按钮当前状态
            clickTableBtns: (row: any) => {
                row['Field1'] = 2;
            },
        },
        {
            btnName: '未处理',
            permission: 'test:button',
            isBtnHide: (row: any) => row.Field1 === 2, //多状态按钮当前状态
            clickTableBtns: (row: any) => {
                row['Field1'] = 1;
            },
        },
        {
            btnName: '新增',
            permission: 'test:button',
            // 自定义render优先级大于内部按钮
            // render(row: any) {
            //     return h(
            //         'div',
            //         {
            //             strong: true,
            //             tertiary: true,
            //             size: 'small',
            //             onClick: () => console.log(row)
            //         },
            //         { default: () => 'Play' }
            //     )
            // },
            clickTableBtns: (row: any) => {

            },
        },
        {
            btnName: '删除',
            permission: 'test:button',
            clickTableBtns: (row: any) => {

            },
        },
        {
            btnName: '编辑',
            permission: 'test:button',
            clickTableBtns: (row: any) => {

            },
        },
    ],
    // 分页
    paginationConfig: {
        // 分页参数
        pagConfig: {
            total: 30,
            pageSize: 30,
            page: 1,
        },
        // 是否展示头部border
        showHeadBorder: false,
        // 是否展示总条数
        showTotal: true,
        // 分页方法
        onPageChange: (page: any) => {
            if (tableConfig.value.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                loadTableData()
            }
        },
    },
});
// 异步获取数据
const loadTableData = async () => {
    try {
        // 拼接分页参数和搜索条件
        const { paginationConfig } = tableConfig.value;
        // 查询参数queryConfiguration需自己拼装到queryParame中
        let queryParame = {
            pageSize: paginationConfig?.pagConfig.pageSize,
            page: paginationConfig?.pagConfig.page,
        };
        // 测试数据
        for (let i = 0; i <= 29; i++) {
            tableConfig.value.tableList.push({
                index: i + 1,
                Field1: 1,
                Field2: 1,
                Field3: `第${i + 1}条内容3`,
                Field4: `第${i + 1}条内容4`,
                Field5: `第${i + 1}条内容5`,
                Field6: `第${i + 1}条内容6`,
            });
        }

    } catch (error) {}
};
onMounted(() => {
    loadTableData();
});
</script>
<style lang="less" scoped></style>
