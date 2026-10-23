import { reactive } from 'vue';

export const settlementCreateState = reactive({
    applyUnit: '',
    customerName: '',
});

/**
 * 同步销售合同带出的开票信息字段。
 * @param data 销售合同带出的供方单位和需方单位
 * @returns 无返回值
 */
export const updateSettlementInvoiceBaseInfo = (data: { applyUnit?: string; customerName?: string }) => {
    settlementCreateState.applyUnit = data.applyUnit || '';
    settlementCreateState.customerName = data.customerName || '';
};
