<template>
    <WebPage contentPadding="0" @addEvt="handleAdd" :hideAddBtn="!checkPermission(['crm:market_report:create'])">
        <template #content>
            <div class="marketReportContainer">
                <MxWebDataTable v-bind="tableConfig">
                    <template #tableSearch>
                        <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                        </MxWebSearchBar>
                    </template>
                </MxWebDataTable>
            </div>
        </template>
    </WebPage>

    <add ref="addRef" @refresh="getPageList" />
    <!-- 详情页 -->
    <detail ref="detailRef" />
    <!-- 推送抽屉 -->
    <push ref="pushRef" @refresh="pushRefresh" />
</template>

<script setup lang="ts">
import { ref,h, onBeforeUnmount } from 'vue';
import { NSpace } from 'naive-ui';
import add from './wCpns/add.vue';
import detail from './wCpns/detail.vue';
import push from './wCpns/push.vue';
import { getMarketReportPageApi, deleteMarketReportApi, marketReportPushStateRefresh } from '@/api';
import { deepClone, getFileType, checkPermission } from '@/utils/comm';
import {
    marketReportStatusMap,
    MARKET_REPORT_STATUS_CONSTANT,
    MARKET_REPORT_PUSH_STATUS_CONSTANT,
    marketReportPushStatusMap,
} from '@/constants/marketReport';
const addRef = ref<any>(null);
const detailRef = ref<any>(null);
const pushRef = ref<any>(null);

// ==================== 搜索栏配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'title', placeholder: '报告标题' },
    { type: 'personSelect', label: '', value: 'authorId', placeholder: '作者' },
    {
        type: 'select',
        label: '状态',
        value: 'status',
        placeholder: '请选择状态',
        options: [
            { label: '草稿', value: MARKET_REPORT_STATUS_CONSTANT.DRAFT },
            { label: '已归档', value: MARKET_REPORT_STATUS_CONSTANT.ARCHIVED },
        ],
    },
    { type: 'dateTimeRange', label: '创建时间', value: 'createTime', placeholder: '请选择创建时间' },
];
// ==================== 表格列配置 ====================
const tableColumns = [
    { title: '报告标题', key: 'title', width: 200, ellipsis: { tooltip: true } },
    {
        title: '文件类型',
        key: 'fileType',
        width: 100,
    },
    { title: '创建时间', key: 'createdAt', width: 170 },
    { title: '作者', key: 'authorName', width: 100 },
    { title: '文件大小', key: 'fileSize', width: 100, align: 'center' },
    {
        title: '单据状态',
        key: 'status',
        width: 100,
        render(row: any) {
            const color = marketReportStatusMap[row.status]?.iconColor || 'var(--base-grey)';
            return h(
                NSpace,
                { align: 'center', size: 8 },
                {
                    default: () => [
                        h('div', {
                            style: {
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: color,
                            },
                        }),
                        h('span', null, marketReportStatusMap[row.status]?.label),
                    ],
                }
            );
        },
    },
    {
        title: '推送状态',
        key: 'latestPushStatus',
        width: 100,
        render(row: any) {
            const color = marketReportPushStatusMap[row.latestPushStatus]?.iconColor || 'var(--base-grey)';
            return h(
                NSpace,
                { align: 'center', size: 8 },
                {
                    default: () => [
                        h('div', {
                            style: {
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: color,
                            },
                        }),
                        h('span', null, row.latestPushStatusName),
                    ],
                }
            );
        },
    },
];

// ==================== 表格配置 ====================
const tableConfig = ref<any>({
    columns: tableColumns,
    tableList: [],
    tableBtns: [
        {
            btnName: '预览',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => true,
            clickTableBtns: (row: any) => handlePreview(row),
        },
        {
            btnName: '编辑',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT && checkPermission(["crm:market_report:edit"]),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '推送',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status === MARKET_REPORT_STATUS_CONSTANT.ARCHIVED && checkPermission(["crm:market_report:push"]),
            clickTableBtns: (row: any) => handlePush(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status === MARKET_REPORT_STATUS_CONSTANT.DRAFT && checkPermission(["crm:market_report:delete"]),
            clickTableBtns: (row: any) => handleDelete(row),
        },
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status === MARKET_REPORT_STATUS_CONSTANT.ARCHIVED,
            clickTableBtns: (row: any) => handleView(row),
        },
    ],
    isShowPagination: true,
    flexHeight: true,
    paginationConfig: {
        pagConfig: {
            page: 1,
            pageSize: 20,
            total: 0,
            showSizePicker: false,
            pageSizes: [10, 20, 50, 100],
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.page = page;
                getPageList();
            }
        },
        onPageSizeChange: (pageSize: number) => {
            if (tableConfig.value?.paginationConfig?.pagConfig) {
                tableConfig.value.paginationConfig.pagConfig.pageSize = pageSize;
                getPageList();
            }
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

// 打开新增抽屉
const handleAdd = () => {
    addRef.value.showDrawer('add');
};

// 打开编辑抽屉
const handleEdit = (row: any) => {
    addRef.value.showDrawer('edit', JSON.parse(JSON.stringify(row)));
};

// 删除
const handleDelete = async (row: any) => {
    try {
        const res = await deleteMarketReportApi(row.id);
        if (res && res.code === 200) {
            getPageList();
        }
    } catch (error) {
        console.error('Delete market report failed:', error);
    }
};
// 预览
const handlePreview = (row: any) => {
    detailRef.value.showDrawer('preview', deepClone(row));
};
// 查看详情
const handleView = (row: any) => {
    detailRef.value.showDrawer('detail', deepClone(row));
};
const changeItem = (item, pushState) => {
    item.latestPushStatus = pushState;
    item.latestPushStatusName = marketReportPushStatusMap[pushState].label;
};
const pushRefresh = (id: any) => {
    let findItem = tableConfig.value.tableList.find((item) => item.id == id);
    if (findItem) {
        changeItem(findItem, MARKET_REPORT_PUSH_STATUS_CONSTANT.PENDING);
        marketReportPushStateRefresh(findItem, changeItem);
    }
};
// 推送 — 打开推送抽屉
const handlePush = (row: any) => {
    pushRef.value.showDrawer(deepClone(row));
};
const bytesToMB = (size) => {
    // 处理非数字、空值、负数
    if (isNaN(size) || size === null || size === undefined || size < 0) {
        return '--';
    }

    // 1MB = 1024 * 1024 字节（标准存储换算）
    const mb = size / (1024 * 1024);

    // 保留两位小数并返回字符串
    return mb.toFixed(2) + 'MB';
};

const queryParams = ref({
    title: '',
    authorId: '',
    status: '',
    createTimeStart: '',
    createTimeEnd: '',
});
const getPageList = async () => {
    try {
        const res = await getMarketReportPageApi({
            ...queryParams.value,
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
        });

        if (res && res.code === 200) {
            let data = res.data?.records || [];
            data.forEach((item) => {
                item.fileType = '--';
                item.fileSize = '--';
                if (item.fileInfo) {
                    item.fileType = getFileType(item.fileInfo.type) || '--';
                    item.fileSize = bytesToMB(item.fileInfo.size);
                }
            });
            tableConfig.value.tableList = data;
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    } catch (error) {
        console.error('Failed to obtain market report:', error);
    }
};
const handleSearch = (query: any) => {
    console.log('查询', query);
    queryParams.value.title = query.title ? query.title : '';
    queryParams.value.authorId = query.authorId ? query.authorId : '';
    queryParams.value.status = query.status ? query.status : '';
    let createTime = query.createTime || [];
    queryParams.value.createTimeStart = createTime[0] ? createTime[0] : '';
    queryParams.value.createTimeEnd = createTime[1] ? createTime[1] : '';
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getPageList();
};
getPageList();
onBeforeUnmount(() => {
    tableConfig.value.tableList.forEach((item) => {
        clearTimeout(item.pushTimer);
    });
});
</script>

<style scoped lang="less">
.marketReportContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
