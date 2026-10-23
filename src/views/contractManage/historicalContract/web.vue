<template>
    <WebPage contentPadding="0px" :hideAddBtn="true">
        <template #headerRight>
            <MxButton
                border
                color="#666"
                @click="handleDownloadTemplate">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download1.png" alt="" style="width: 16px; height: 16px" />
                </template>
                模板下载
            </MxButton>
            <MxButton
                border
                color="#666"
                @click="handleImport">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽download2.png" alt="" style="width: 16px; height: 16px" />
                </template>
                批量导入
            </MxButton>
            <MxButton
                border
                color="#666"
                :disabled="exportLoading"
                @click="handleExport">
                <template #leftIcon>
                    <img src="@/assets/images/comm/icon⎽com⎽import.png" alt="" style="width: 16px; height: 16px" />
                </template>
                导出数据
            </MxButton>
            <MxButton
                border
                color="#D03050"
                :disabled="deleteLoading"
                @click="handleBatchDelete">
                全量删除
            </MxButton>
        </template>
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableSearch>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch" />
                </template>
            </MxWebDataTable>
        </template>
    </WebPage>

    <input ref="fileInputRef" type="file" accept=".xlsx,.xls" hidden @change="handleFileChange" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { useDialog, useMessage } from 'naive-ui';
import { checkPermission } from '@/utils/comm';
import {
    downloadHistoricalContractTemplateApi,
    exportHistoricalContractApi,
    getHistoricalContractPageApi,
    importHistoricalContractApi,
    batchDeleteHistoricalContractApi,
} from '@/api/historicalContract';
import {
    HISTORICAL_CONTRACT_DATE_FORMAT,
    HISTORICAL_CONTRACT_EXPORT_PAGINATION_KEYS,
} from './index';

const message = useMessage();
const dialog = useDialog();
const fileInputRef = ref<HTMLInputElement | null>(null);
const exportLoading = ref(false);
const deleteLoading = ref(false);
const searchParams = ref<Record<string, any>>({});

const renderText = (value: any) => {
    if (value === 0) return 0;
    return value === null || value === undefined || value === '' ? '--' : value;
};

const formatDate = (value: any) => (value ? dayjs(value).format(HISTORICAL_CONTRACT_DATE_FORMAT) : '--');

const queryConfiguration = computed(() => [
    {
        value: 'contractCode',
        defaultValue: '',
        label: '合同编号',
        type: 'input',
        placeholder: '合同编号',
    },
    {
        value: 'customerShortName',
        defaultValue: '',
        label: '需方单位',
        type: 'input',
        placeholder: '需方单位',
    },
    {
        value: 'directorName',
        defaultValue: '',
        label: '业务人员',
        type: 'input',
        placeholder: '业务人员',
    },
]);

const tableConfig = ref<any>({
    isShowIndex: true,
    columns: [
        { key: 'contractCode', title: '合同编号', width: 170, render: (row: any) => renderText(row.contractCode) },
        { key: 'contractSubject', title: '合同主体', width: 210, render: (row: any) => renderText(row.contractSubject) },
        {
            key: 'customerShortName',
            title: '需方单位',
            width: 210,
            render: (row: any) => renderText(row.customerShortName),
        },
        { key: 'subjectMatter', title: '标的物', width: 130, render: (row: any) => renderText(row.subjectMatter) },
        { key: 'signDate', title: '签订日期', width: 130, render: (row: any) => formatDate(row.signDate) },
        { key: 'directorName', title: '业务人员', width: 140, render: (row: any) => renderText(row.directorName) },
        { key: 'salesGrade', title: '销售品位（%）', width: 130, render: (row: any) => renderText(row.salesGrade) },
        { key: 'salesUnitPrice', title: '销售单价（元/吨）', width: 160, render: (row: any) => renderText(row.salesUnitPrice) },
        { key: 'contractQuantity', title: '合同量（吨）', width: 150, render: (row: any) => renderText(row.contractQuantity) },
        { key: 'contractTotalAmount', title: '合同总金额（万元）', width: 180, render: (row: any) => renderText(row.contractTotalAmount) },
        { key: 'miningPlace', title: '开采地', width: 180, render: (row: any) => renderText(row.miningPlace) },
        { key: 'shipmentGrade', title: '发货品位（%）', width: 140, render: (row: any) => renderText(row.shipmentGrade) },
        { key: 'shipmentPlace', title: '发货地', width: 180, render: (row: any) => renderText(row.shipmentPlace) },
        { key: 'receivingPlace', title: '收货地', width: 180, render: (row: any) => renderText(row.receivingPlace) },
        { key: 'shipmentTime', title: '发货时间', width: 140, render: (row: any) => formatDate(row.shipmentTime) },
        { key: 'shipmentQuantity', title: '发货数量（吨）', width: 160, render: (row: any) => renderText(row.shipmentQuantity) },
        {
            key: 'shippedUndeliveredQuantity',
            title: '已发货未交货量（吨）',
            width: 190,
            render: (row: any) => renderText(row.shippedUndeliveredQuantity),
        },
        {
            key: 'estimatedSettlementAmount',
            title: '预计已发货结算金额（元）',
            width: 210,
            render: (row: any) => renderText(row.estimatedSettlementAmount),
        },
        { key: 'receivedQuantity', title: '收货量（吨）', width: 150, render: (row: any) => renderText(row.receivedQuantity) },
        { key: 'moistureDeduction', title: '水分扣除（吨）', width: 160, render: (row: any) => renderText(row.moistureDeduction) },
        { key: 'settlementQuantity', title: '结算量（吨）', width: 150, render: (row: any) => renderText(row.settlementQuantity) },
        { key: 'acceptanceGrade', title: '验收品位（%）', width: 150, render: (row: any) => renderText(row.acceptanceGrade) },
        { key: 'settlementUnitPrice', title: '结算单价（元/吨）', width: 170, render: (row: any) => renderText(row.settlementUnitPrice) },
        { key: 'settlementAmount', title: '结算金额（元）', width: 160, render: (row: any) => renderText(row.settlementAmount) },
        {
            key: 'settlementAmountExcludingTax',
            title: '不含税结算金额（元）',
            width: 190,
            render: (row: any) => renderText(row.settlementAmountExcludingTax),
        },
        { key: 'taxAmount', title: '税额（元）', width: 140, render: (row: any) => renderText(row.taxAmount) },
        { key: 'settlementTime', title: '结算时间', width: 140, render: (row: any) => formatDate(row.settlementTime) },
        { key: 'settlementPitPrice', title: '结算坑口价（元/吨）', width: 190, render: (row: any) => renderText(row.settlementPitPrice) },
        { key: 'transportFee', title: '运输费（元/吨）', width: 160, render: (row: any) => renderText(row.transportFee) },
        { key: 'amountReceived1', title: '已收款1（元）', width: 150, render: (row: any) => renderText(row.amountReceived1) },
        { key: 'amountReceived1Date', title: '已收款1日期', width: 150, render: (row: any) => formatDate(row.amountReceived1Date) },
        { key: 'amountReceived2', title: '已收款2（元）', width: 150, render: (row: any) => renderText(row.amountReceived2) },
        { key: 'amountReceived2Date', title: '已收款2日期', width: 150, render: (row: any) => formatDate(row.amountReceived2Date) },
        { key: 'amountReceived3', title: '已收款3（元）', width: 150, render: (row: any) => renderText(row.amountReceived3) },
        { key: 'amountReceived3Date', title: '已收款3日期', width: 150, render: (row: any) => formatDate(row.amountReceived3Date) },
        { key: 'amountReceived4', title: '已收款4（元）', width: 150, render: (row: any) => renderText(row.amountReceived4) },
        { key: 'amountReceived4Date', title: '已收款4日期', width: 150, render: (row: any) => formatDate(row.amountReceived4Date) },
        { key: 'amountReceived5', title: '已收款5（元）', width: 150, render: (row: any) => renderText(row.amountReceived5) },
        { key: 'amountReceived5Date', title: '已收款5日期', width: 150, render: (row: any) => formatDate(row.amountReceived5Date) },
        { key: 'amountReceived6', title: '已收款6（元）', width: 150, render: (row: any) => renderText(row.amountReceived6) },
        { key: 'amountReceived6Date', title: '已收款6日期', width: 150, render: (row: any) => formatDate(row.amountReceived6Date) },
        { key: 'totalAmountReceived', title: '已回款总金额（万元）', width: 190, render: (row: any) => renderText(row.totalAmountReceived) },
        { key: 'receivableBalance', title: '应收货款余额（元）', width: 190, render: (row: any) => renderText(row.receivableBalance) },
        { key: 'remark', title: '备注', width: 220, render: (row: any) => renderText(row.remark) },
    ],
    tableList: [],
    isShowPagination: true,
    paginationConfig: {
        pagConfig: {
            total: 0,
            pageSize: 20,
            page: 1,
        },
        showHeadBorder: true,
        showTotal: true,
        onPageChange: (page: number) => {
            tableConfig.value.paginationConfig.pagConfig.page = page;
            getList();
        },
    },
    styleOption: {
        padding: '16px',
        paddingBottom: '0px',
    },
});

const getPagePayload = () => ({
    ...searchParams.value,
    current: tableConfig.value.paginationConfig.pagConfig.page,
    size: tableConfig.value.paginationConfig.pagConfig.pageSize,
});

const getExportPayload = () => {
    const payload = { ...searchParams.value };
    HISTORICAL_CONTRACT_EXPORT_PAGINATION_KEYS.forEach((key) => {
        delete payload[key];
    });
    return payload;
};

const getList = async () => {
    try {
        const res = await getHistoricalContractPageApi(getPagePayload());
        if (res?.code !== 200) return;
        tableConfig.value.tableList = res.data?.records || [];
        tableConfig.value.paginationConfig.pagConfig.total = res.data?.total || 0;
    } catch (error) {
        console.error('历史合同分页查询失败:', error);
        message.error('历史合同列表加载失败，请稍后重试');
    }
};

const handleSearch = (searchData: any) => {
    const params = { ...searchData };
    searchParams.value = params;
    tableConfig.value.paginationConfig.pagConfig.page = 1;
    getList();
};

const getFileNameFromHeader = (headers: any, fallbackName: string) => {
    const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    const matched = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/);
    return matched ? decodeURIComponent(matched[1] || matched[2]) : fallbackName;
};

const downloadBlob = (response: any, fallbackName: string) => {
    const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileNameFromHeader(response?.headers, fallbackName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const handleDownloadTemplate = async () => {
    try {
        const res = await downloadHistoricalContractTemplateApi();
        downloadBlob(res, '历史合同记录导入模板.xlsx');
    } catch (error) {
        console.error('历史合同模板下载失败:', error);
        message.error('模板下载失败，请稍后重试');
    }
};

const handleExport = async () => {
    if (exportLoading.value) return;
    if (!tableConfig.value.paginationConfig.pagConfig.total) {
        message.warning('当前筛选条件暂无数据，不能导出');
        return;
    }
    exportLoading.value = true;
    try {
        const res = await exportHistoricalContractApi(getExportPayload());
        downloadBlob(res, '历史合同记录.xlsx');
    } catch (error) {
        console.error('历史合同导出失败:', error);
        message.error('导出失败，请稍后重试');
    } finally {
        exportLoading.value = false;
    }
};

/**
 * 弹出二次确认并全量删除历史合同记录。
 * 删除成功后重新查询当前列表，确保页面数据与服务端保持一致。
 */
const handleBatchDelete = () => {
    if (deleteLoading.value) return;

    dialog.warning({
        title: '确认删除',
        content: '是否清除所有数据？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            deleteLoading.value = true;
            try {
                const res = await batchDeleteHistoricalContractApi();
                if (res?.code === 200) {
                    message.success(res.msg || '删除成功');
                    tableConfig.value.paginationConfig.pagConfig.page = 1;
                    await getList();
                } else {
                    message.error(res?.msg || '删除失败');
                }
            } catch (error) {
                console.error('历史合同全量删除失败:', error);
                message.error('删除失败，请稍后重试');
            } finally {
                deleteLoading.value = false;
            }
        },
    });
};

const handleImport = () => {
    fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await importHistoricalContractApi(formData);
        if (res?.code === 200) {
            message.success(res.data || res.msg || '导入成功');
            await getList();
        }
    } catch (error) {
        console.error('历史合同导入失败:', error);
        message.error('导入失败，请稍后重试');
    }
};

onMounted(() => {
    getList();
});
</script>
