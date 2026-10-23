<template>
    <n-grid :cols="2" :x-gap="16" :y-gap="0">
        <n-grid-item>
            <n-form-item label="销售合同编号" path="contractCode">
                <n-select
                    v-model:value="formData.contractCode"
                    :options="contractOptions"
                    :fallback-option="getContractFallbackOption"
                    placeholder="请选择"
                    filterable
                    clearable
                    @update:value="handleContractChange" />
            </n-form-item>
        </n-grid-item>

        <n-grid-item>
            <n-form-item label="回款到期时间" path="shoulDate">
                <n-date-picker
                    v-model:formatted-value="formData.shoulDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    :is-date-disabled="isReceiptDueDateDisabled"
                    placeholder="请选择"
                    style="width: 100%"
                    clearable />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="企业名称" path="enterpriseName">
                <n-input disabled v-model:value="formData.enterpriseName" placeholder="自动匹配销售合同" />
            </n-form-item>
        </n-grid-item>

        <n-grid-item>
            <n-form-item label="客户类型" path="customerType">
                <n-select
                    v-model:value="formData.customerType"
                    :options="customerTypeOptions"
                    :fallback-option="getCustomerTypeFallbackOption"
                    placeholder="自动匹配销售合同"
                    disabled />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="我方经办人" path="handler">
                <MxPersonSelect
                    v-model:modelValue="formData.handler"
                    v-model:label="formData.ourHandlerName"
                    v-model:selectedPerson="formData.handlerSelectedPerson"
                    placeholder="请选择我方经办人" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="客户经办人" path="handlerName">
                <n-input v-model:value="formData.handlerName" placeholder="请输入客户经办人" maxlength="50" clearable />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="结算总价(元)" path="totalTaxAmount">
                <n-input disabled :value="formatSettlementAmount(formData.totalTaxAmount, '0.0000')" placeholder="根据下方明细表自动计算" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="结算总量(吨)" path="settlementTotal">
                <n-input disabled v-model:value="formData.settlementTotal" placeholder="根据下方明细表自动计算" />
            </n-form-item>
        </n-grid-item>
    </n-grid>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NDatePicker, NInput, NSelect, NFormItem, NGrid, NGridItem } from 'naive-ui';
import { getContractSalesListByStatus, getSettlementDetailListByContractCodeApi } from '@/api';
import { formatSettlementAmount } from '../../utils';
const CONTRACT_STATUS_EXECUTING = 'EXECUTING';
const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
    isEdit: {
        type: Boolean,
        default: false,
    },
});
const customerTypeOptions = [
    { label: '化工企业', value: 'CHEMICAL' },
    { label: '贸易商', value: 'TRADER' },
];
const contractList = ref<any[]>([]);
const contractOptions = computed(() => {
    return contractList.value.map((item) => ({
        label: item.contractCode || '',
        value: item.contractCode || '',
        raw: item,
    }));
});

/**
 * 将当前合同的我方负责人同步到结算表单，供明细业务人员使用。
 * @returns 无返回值
 */
const syncContractDirector = () => {
    const contract = contractList.value.find((item) => item.contractCode === props.formData.contractCode);
    if (!contract) return;
    props.formData.contractDirectorId = contract.directorId || contract.director?.id || contract.director?.code || '';
    props.formData.contractDirectorName = contract.directorName || contract.director?.name || contract.director?.username || '';
    props.formData.contractDirectorLarkId =
        contract.directorLarkId || contract.director?.larkUserId || contract.director?.feishuUserId || '';
};

/**
 * 获取今天零点时间戳，用于限制回款到期时间不能选择当前日期之前。
 * @returns 今天零点时间戳
 */
const getTodayStartTime = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
};

/**
 * 判断回款到期时间是否禁用。
 * @param timestamp 日期时间戳
 * @returns 是否禁用该日期
 */
const isReceiptDueDateDisabled = (timestamp: number) => {
    return timestamp < getTodayStartTime();
};

/**
 * 编辑时如果当前合同不在执行中合同列表内，仍展示详情接口返回的合同编号。
 * @param value 当前合同编号
 * @returns 下拉兜底选项
 */
const getContractFallbackOption = (value: string) => {
    return {
        label: value,
        value,
    };
};

/**
 * 编辑时如果客户类型值与固定选项不匹配，仍展示详情接口返回值。
 * @param value 当前客户类型
 * @returns 下拉兜底选项
 */
const getCustomerTypeFallbackOption = (value: string) => {
    return {
        label: value,
        value,
    };
};

/**
 * 加载执行中销售合同，作为销售合同编号下拉数据源。
 * @returns 无返回值，结果写入合同下拉列表
 */
const loadContractList = async () => {
    try {
        const res: any = await getContractSalesListByStatus(CONTRACT_STATUS_EXECUTING);
        contractList.value = res?.data || [];
        syncContractDirector();
    } catch (error) {
        console.error('加载销售合同失败:', error);
    }
};

watch(
    () => props.formData.contractCode,
    () => syncContractDirector()
);

/**
 * 根据销售合同编号加载可结算明细。
 * @param contractCode 销售合同编号
 * @returns 无返回值，结果写入结算明细表
 */
const loadSettlementDetails = async (contractCode: string) => {
    try {
        const res: any = await getSettlementDetailListByContractCodeApi(contractCode);
        const records = res?.data || [];
        props.formData.tableList = records.map((item: any) => ({
            ...item,
            __checked: props.isEdit ? hasValue(item.id) : true,
        }));
    } catch (error) {
        props.formData.tableList = [];
        console.error('加载可结算明细失败:', error);
    }
};

/**
 * 选择销售合同时回填合同关联的基础信息。
 * @param value 销售合同编号
 * @returns 无返回值
 */
const handleContractChange = async (value: string | null) => {
    const contract = contractList.value.find((item) => item.contractCode === value);
    props.formData.customerId = contract?.customerId;
    props.formData.applyUnit = contract?.supplierUnit || '';
    props.formData.enterpriseName = contract?.customerName || '';
    props.formData.customerType = contract?.customerType || null;
    props.formData.contractDirectorId = contract?.directorId || contract?.director?.id || contract?.director?.code || '';
    props.formData.contractDirectorName =
        contract?.directorName || contract?.director?.name || contract?.director?.username || '';
    props.formData.contractDirectorLarkId =
        contract?.directorLarkId || contract?.director?.larkUserId || contract?.director?.feishuUserId || '';
    props.formData.totalTaxAmount = '';
    props.formData.settlementTotal = 0;
    props.formData.invoiceDetailList = [];
    if (!value) {
        props.formData.contractDirectorId = '';
        props.formData.contractDirectorName = '';
        props.formData.contractDirectorLarkId = '';
        props.formData.tableList = [];
        return;
    }
    await loadSettlementDetails(value);
};

loadContractList();
</script>

<style scoped>
</style>
