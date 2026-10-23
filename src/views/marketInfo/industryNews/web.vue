<template>
    <WebPage contentPadding="0" @addEvt="handleAdd" :hideAddBtn="!checkPermission(['crm:industry_news:create'])">
        <template #content>
            <div class="industryNewsContainer">
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
import { ref, onBeforeUnmount, h } from 'vue';
import { NSpace } from 'naive-ui';

import add from './wCpns/add.vue';
import detail from './wCpns/detail.vue';
import push from './wCpns/push.vue';
import { getIndustryNewsPageApi, deleteIndustryNewsApi, industryNewsPushStateRefresh } from '@/api';
import { deepClone, checkPermission } from '@/utils/comm';
import {
    industryNewsStatusMap,
    INDUSTRY_NEWS_STATUS_CONSTANT,
    INDUSTRY_NEWS_PUSH_STATUS_CONSTANT,
    sourceOptions,
    industryNewsPushStatusMap,
    inputTypeOptions,
} from '@/constants/industryNews';
const addRef = ref<any>(null);
const detailRef = ref<any>(null);
const pushRef = ref<any>(null);

// ==================== 搜索栏配置 ====================
const queryConfiguration = [
    { type: 'input', label: '', value: 'title', placeholder: '标题' },
    { type: 'personSelect', label: '', value: 'publishPersonId', placeholder: '发布人' },
    {
        type: 'select',
        label: '状态',
        value: 'status',
        placeholder: '请选择状态',
        options: [
            { label: '草稿', value: INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT },
            { label: '已归档', value: INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED },
        ],
    },
    { type: 'dateTimeRange', label: '发布时间', value: 'publishTime', placeholder: '请选择创建时间' },
    {
        type: 'select',
        label: '信息来源',
        value: 'source',
        placeholder: '请选择信息来源',
        options: sourceOptions,
    },
];

const getInputTypeLabel = (type) => {
    let findItem = inputTypeOptions.find((item) => item.value == type);
    return findItem ? findItem.label : type;
};
const getSourceOptionsLabel = (source) => {
    let findItem = sourceOptions.find((item) => item.value == source);
    return findItem ? findItem.label : source;
};
const desensitizeDomain = (str) => {
    const reg = /(www\.)([^.,]+)([.,].+)/g;
    return str.replace(reg, (_, p1, p2, p3) => {
        return p1 + 'x'.repeat(3) + p3;
        // return p1 + 'x'.repeat(p2.length) + p3;
    });
};
// ==================== 表格列配置 ====================
const tableColumns = [
    { title: '标题', key: 'title', width: 260, ellipsis: { tooltip: true } },
    { title: '发布人', key: 'publishPersonName', width: 100 },
    {
        title: '发布时间',
        key: 'publishTime',
        width: 170,
    },
    {
        title: '信息来源',
        key: 'source',
        width: 100,
        render: (row: any) => {
            return getSourceOptionsLabel(row.source) || '--';
        },
    },
    {
        title: '录入方式',
        key: 'inputType',
        width: 100,
        render: (row: any) => {
            return getInputTypeLabel(row.inputType) || '--';
        },
    },
    {
        title: '单据状态',
        key: 'status',
        width: 100,
        render(row: any) {
            const color = industryNewsStatusMap[row.status]?.iconColor || 'var(--base-grey)';
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
                        h('span', null, industryNewsStatusMap[row.status]?.label),
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
            const color = industryNewsPushStatusMap[row.latestPushStatus]?.iconColor || 'var(--base-grey)';
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
    {
        title: '目标网址',
        key: 'targetUrl',
        width: 200,
        ellipsis: { tooltip: true },
        render: (row: any) => {
            // 脱敏展示
            if (!row.targetUrl) return '--';

            try {
                const url = new URL(row.targetUrl);
                return desensitizeDomain(`https://www.${url.hostname.replace(/^www\./, '')}`);
            } catch {
                return desensitizeDomain(row.targetUrl);
            }
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
            isBtnHide: (row: any) => row.status === INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT && checkPermission(["crm:industry_news:edit"]),
            clickTableBtns: (row: any) => handleEdit(row),
        },
        {
            btnName: '推送',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status === INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED && checkPermission(["crm:industry_news:push"]),
            clickTableBtns: (row: any) => handlePush(row),
        },
        {
            btnName: '删除',
            btnColor: '#E34242',
            isBtnHide: (row: any) => row.status === INDUSTRY_NEWS_STATUS_CONSTANT.DRAFT && checkPermission(["crm:industry_news:delete"]),
            clickTableBtns: (row: any) => handleDelete(row),
        },
        {
            btnName: '详情',
            btnColor: '#2C65F2',
            isBtnHide: (row: any) => row.status === INDUSTRY_NEWS_STATUS_CONSTANT.ARCHIVED,
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

// 预览
const handlePreview = (row: any) => {
    detailRef.value.showDrawer('preview', deepClone(row));
};
const changeItem = (item, pushState) => {
    item.latestPushStatus = pushState;
    item.latestPushStatusName = industryNewsPushStatusMap[pushState].label;
};
const pushRefresh = (id: any) => {
    let findItem = tableConfig.value.tableList.find((item) => item.id == id);
    if (findItem) {
        changeItem(findItem, INDUSTRY_NEWS_PUSH_STATUS_CONSTANT.PENDING);
        industryNewsPushStateRefresh(findItem, changeItem);
    }
};
// 推送 — 打开推送抽屉
const handlePush = (row: any) => {
    pushRef.value.showDrawer(deepClone(row));
};

// 删除
const handleDelete = async (row: any) => {
    try {
        const res = await deleteIndustryNewsApi(row.id);
        if (res && res.code === 200) {
            getPageList();
        }
    } catch (error) {
        console.error('Delete industry news failed:', error);
    }
};

// 打开新增抽屉
const handleAdd = () => {
    addRef.value.showDrawer('add');
};

// 打开编辑抽屉
const handleEdit = (row: any) => {
    addRef.value.showDrawer('edit', deepClone(row));
};

// 查看详情
const handleView = (row: any) => {
    detailRef.value.showDrawer('detail', deepClone(row));
};
const queryParams = ref({
    title: '',
    publishPersonId: '',
    status: '',
    source: '',
    publishTimeStart: '',
    publishTimeEnd: '',
});
const getPageList = async () => {
    try {
        const res = await getIndustryNewsPageApi({
            ...queryParams.value,
            current: tableConfig.value.paginationConfig.pagConfig.page,
            size: tableConfig.value.paginationConfig.pagConfig.pageSize,
        });

        if (res && res.code === 200) {
            let data = res.data?.records || [];
            tableConfig.value.tableList = data;
            tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
        }
    } catch (error) {
        console.error('Failed to obtain industry news:', error);
    }
};
const handleSearch = (query: any) => {
    console.log('查询', query);
    queryParams.value.title = query.title ? query.title : '';
    queryParams.value.publishPersonId = query.publishPersonId ? query.publishPersonId : '';
    queryParams.value.status = query.status ? query.status : '';
    queryParams.value.source = query.source ? query.source : '';
    let publishTime = query.publishTime || [];
    queryParams.value.publishTimeStart = publishTime[0] ? publishTime[0] : '';
    queryParams.value.publishTimeEnd = publishTime[1] ? publishTime[1] : '';
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
.industryNewsContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.formMain {
    padding: 16px;
}

.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}

/* 详情样式 */
.detail-content {
    display: flex;
    flex-direction: column;
    height: 100%;

    .detail-header {
        padding: 16px 24px;
        flex-shrink: 0;

        .detail-header-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 6px;

            .detail-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
        }

        .detail-header-info {
            display: flex;
            gap: 40px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;

                .info-label {
                    color: #999;
                    font-size: 14px;
                }

                .info-value {
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                }
            }
        }
    }

    .gray-separator {
        height: 8px;
        background: #f0f0f0;
        flex-shrink: 0;
    }

    .detail-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .detail-tabs-container {
            padding: 0 24px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .tab-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: auto;
            padding: 16px 24px;
        }
    }
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    margin-top: 16px;

    &:first-child {
        margin-top: 0;
    }

    .section-bar {
        display: inline-block;
        width: 3px;
        height: 14px;
        background-color: #2c65f2;
        border-radius: 2px;
    }
}

.basic-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 40px;
    margin-bottom: 16px;

    .basic-info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        &.full-width {
            grid-column: span 2;
        }

        .basic-label {
            color: #999;
            font-size: 14px;
        }

        .basic-value {
            color: #333;
            font-size: 14px;

            &.url-value {
                color: #2c65f2;
                word-break: break-all;
            }
        }
    }
}

.sectionContent {
    flex: 1;
    padding: 12px;
    background-color: #f5f7fb;
    border-radius: 4px;
}

/* 推送抽屉 */
.push-content {
    padding: 16px;
    display: flex;
    gap: 8px;

    .push-label {
        font-size: 14px;
        color: #333;
        margin-bottom: 12px;
        font-weight: 600;

        .push-required {
            color: #e34242;
            margin-right: 2px;
        }
    }

    .push-select-container {
        flex: 1;
    }
}
</style>
