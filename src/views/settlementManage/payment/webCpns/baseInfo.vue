<template>
    <div>
        <div class="title">基础信息</div>
        <div class="row">
            <div class="item" style="width: 50%">
                <div class="label">合同编号</div>
                <button
                    v-if="detailData.contractCode"
                    type="button"
                    class="value link-value"
                    @click="handleContractClick">
                    {{ detailData.contractCode }}
                </button>
                <div v-else class="value">--</div>
            </div>
            <div class="item" style="width: 50%">
                <div class="label">关联结算单号</div>
                <button
                    v-if="detailData.settlementCode"
                    type="button"
                    class="value link-value"
                    @click="handleSettlementClick">
                    {{ detailData.settlementCode }}
                </button>
                <div v-else class="value">--</div>
            </div>
            <div class="item" style="width: 50%">
                <div class="label">客户名称</div>
                <div class="value">{{ detailData.customerName || '--' }}</div>
            </div>
            <div class="item" style="width: 50%">
                <div class="label">跟单人</div>
                <div class="value">{{ detailData.handlerName || '--' }}</div>
            </div>
            <div class="item" style="width: 50%">
                <div class="label">计划回款日</div>
                <div class="value">{{ detailData.plannedDate || '--' }}</div>
            </div>
            <div class="item">
                <div class="label">应收金额(元)</div>
                <div class="value">{{ detailData.amountDue ?? '--' }}</div>
            </div>
            <div class="item">
                <div class="label">已收金额(元)</div>
                <div class="value">{{ detailData.amountPaid ?? '--' }}</div>
            </div>
            <div class="item">
                <div class="label">未收金额(元)</div>
                <div class="value">{{ detailData.amountUnpaid ?? '--' }}</div>
            </div>
            <div class="item">
                <div class="label">结算附件</div>
                <div class="value">
                    <MxWebFileUpload
                        v-if="detailData.attachmentsList?.length"
                        :onlyShow="true"
                        :model-value="detailData.attachmentsList"></MxWebFileUpload>
                    <span v-else>--</span>
                </div>
            </div>
            <div class="item">
                <div class="label">备注</div>
                <div class="value">{{ detailData.remark || '--' }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { getContractSalePage, getSettlementPageApi } from '@/api';

const router = useRouter();
// PC 回款单详情基础信息展示组件。
const props = defineProps(['detailData']);

/**
 * 从分页接口响应中获取第一条匹配记录。
 * @param res 分页接口响应
 * @param codeKey 编号字段名
 * @param code 当前编号
 * @returns 匹配编号的记录，未匹配到时返回第一条
 */
const getFirstRecord = (res: any, codeKey: string, code: any) => {
    const records = res?.data?.records || [];
    if (!Array.isArray(records) || !records.length) return null;
    return records.find((item: any) => item?.[codeKey] === code) || records[0];
};

/**
 * 跳转销售合同详情。
 * @returns 无返回值
 */
const handleContractClick = async () => {
    const contractCode = props.detailData?.contractCode;
    if (!contractCode) return;
    try {
        const contractId = props.detailData?.contractId || props.detailData?.contractSalesId || props.detailData?.salesContractId;
        if (contractId) {
            router.push({ path: '/salesContract/detail', query: { id: contractId } });
            return;
        }
        const res = await getContractSalePage({ contractCode, current: 1, size: 1 });
        const record = getFirstRecord(res, 'contractCode', contractCode);
        if (record?.id) {
            router.push({ path: '/salesContract/detail', query: { id: record.id } });
        }
    } catch (error) {
        console.error('跳转销售合同详情失败:', error);
    }
};

/**
 * 跳转结算单详情。
 * @returns 无返回值
 */
const handleSettlementClick = async () => {
    const settlementCode = props.detailData?.settlementCode;
    if (!settlementCode) return;
    try {
        const settlementId = props.detailData?.settlementId || props.detailData?.settlementMainId || props.detailData?.financeSettlementMainId;
        if (settlementId) {
            router.push({ path: '/settlementManage/settlement/detail', query: { id: settlementId } });
            return;
        }
        const res = await getSettlementPageApi({ settlementCode, current: 1, size: 1 });
        const record = getFirstRecord(res, 'settlementCode', settlementCode);
        if (record?.id) {
            router.push({ path: '/settlementManage/settlement/detail', query: { id: record.id } });
        }
    } catch (error) {
        console.error('跳转结算单详情失败:', error);
    }
};
</script>

<style scoped lang="less">
.title {
    margin-top: 16px;
    font-size: 16px;
    color: #333333;
    font-weight: 600;
    position: relative;
    padding-left: 12px;
    display: flex;
    justify-content: space-between;
    &::before {
        content: '';
        position: absolute;
        width: 4px;
        height: 16px;
        background: #2c65f2;
        border-radius: 2px 2px 2px 2px;
        left: 0px;
        top: 50%;
        transform: translateY(-50%);
    }
}
.row {
    display: flex;
    flex-wrap: wrap;
    .item {
        display: flex;
        width: 100%;
        margin-top: 16px;
        .label {
            width: 95px;
            font-size: 14px;
            color: #999999;
            margin-right: 12px;
            text-align: right;
        }
        .value {
            font-size: 14px;
            color: #333333;
        }
        .blue {
            color: #2c65f2;
        }
        .link-value {
            padding: 0;
            border: 0;
            background: transparent;
            color: #2c65f2;
            cursor: pointer;
            line-height: 20px;
        }
    }
}
</style>
