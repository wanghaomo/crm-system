<template>
    <div>
        <div class="content-item">
            <DetailsTitle title="基础信息" :styleOption="{ padding: '0px 0px 20px 0' }" :fontSize="16" />
            <n-descriptions label-placement="left" :column="2" :separator="false" class="mx_crm_descriptions_style">
                <n-descriptions-item label="与会人员" :span="2">
                    <div class="link-value">{{ text(detail.attendees) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="主流化工企业存库情况" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.mainstreamChemInventory) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="矿山存库情况" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.mineInventory) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="下游产品市场情况" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.downstreamMarketSituation) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="竞品矿山让利金额" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.competitorConcessionAmount) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="财务费用" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.financialCost) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="备注" :span="2">
                    <div class="link-value">{{ text(detail.extTraderDTO.remark) }}</div>
                </n-descriptions-item>
                <n-descriptions-item label="物流运输费用" :span="2">
                    <MxWebFileUpload v-if="detail.logistics?.length" only-show force-app-size :model-value="detail.logistics" :accept="LOGISTICS_ATTACHMENT_ACCEPT" />
                    <span v-else>--</span>
                </n-descriptions-item>
            </n-descriptions>
        </div>
        <!-- <div class="content-item">
            <DetailsTitle title="物流运输费用" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
            <MxWebDataTable v-bind="transportConfig"> </MxWebDataTable>
        </div> -->
        <div class="content-item">
            <DetailsTitle title="市场价(参考价)" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
            <MxWebDataTable v-bind="marketPriceConfig"> </MxWebDataTable>
        </div>
        <div class="content-item">
            <DetailsTitle title="贸易商磷矿石销售价" :styleOption="{ padding: '20px 0' }" :fontSize="16" />
            <MxWebDataTable v-bind="goodsPriceConfig"> </MxWebDataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, h, resolveComponent } from 'vue';
import { NDescriptions, NDescriptionsItem } from 'naive-ui';
import { ATTACHMENT_ACCEPT, LOGISTICS_ATTACHMENT_ACCEPT } from '../../../commonTs/conmon';

const props = withDefaults(defineProps<{ detail: Record<string, any> }>(), {
    detail: () => ({}),
});

const isEmptyValue = (value: any) => value === null || value === undefined || value === '';

const text = (value: any) => (isEmptyValue(value) ? '--' : value);

/*
// 运输费用表格
const transportConfig = computed(() => {
    return {
        columns: [
            {
                key: 'routeInfo',
                title: '路线',
                width: 200,
            },
            {
                key: 'freightFee',
                title: '运费(元/吨)',
                width: 200,
            },
            {
                key: 'loadingUnloadingFee',
                title: '装卸费(元/吨)',
                width: 200,
            },
            {
                key: 'transferFee',
                title: '翻坝费(元/吨)',
                width: 200,
            },
            {
                key: 'terminalFee',
                title: '码头费(元/吨)',
                width: 200,
            },
            {
                key: 'totalFee',
                title: '合计(元/吨)',
                width: 200,
            },
            {
                key: 'remark',
                title: '备注',
                width: 200,
            },
        ],
        tableList: props.detail.logisticsDTOList || [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: {
            padding: '0px',
        },
        tableBtns: [],
        isShowPagination: false,
    };
});
*/

// 市场价格表格
const marketPriceConfig = computed(() => {
    return {
        columns: [
            {
                key: 'refCompanyName',
                title: '化工企业名称',
                width: 200,
            },
            {
                key: 'grade',
                title: '品位(%)',
                width: 200,
            },
            {
                key: 'deliveryLocationName',
                title: '交货地址',
                width: 200,
            },
            {
                key: 'currentPrice',
                title: '当前采购价(元/吨)',
                width: 200,
            },
            {
                key: 'remark',
                title: '备注',
                width: 200,
            },
            {
                key: 'attachmentUrls',
                title: '附件',
                width: 200,
                render: (row: any) => {
                    const MxWebFileUpload = resolveComponent('MxWebFileUpload');
                    return h(MxWebFileUpload, {
                        limit: 9,
                        onlyShow: true,
                        forceAppSize: true,
                        appSizeWidth: 80,
                        modelValue: row.attachmentUrls || [],
                        accept: ATTACHMENT_ACCEPT,
                    });
                },
            },
        ],
        tableList: props.detail.refDTOList || [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: {
            padding: '0px',
        },
        tableBtns: [],
        isShowPagination: false,
    };
});

// 贸易商磷矿石销售价
const goodsPriceConfig = computed(() => {
    return {
        columns: [
            {
                key: 'grade',
                title: '矿石品位(%)',
                width: 200,
            },
            {
                key: 'deliveryLocationName',
                title: '交货地址',
                width: 200,
            },
            {
                key: 'guidePrice',
                title: '下游厂家指导价(元/吨)',
                width: 200,
            },
            {
                key: 'transportFee',
                title: '运输费用',
                width: 200,
            },
            {
                key: 'marketAdjustment',
                title: '市场调节金额',
                width: 200,
            },
            {
                key: 'financialAcceptanceDiscount',
                title: '财务承兑优惠金额 (元/吨)',
                width: 200,
            },
            {
                key: 'financialCashDiscount',
                title: '财务现金优惠金额 (元/吨)',
                width: 200,
            },
            {
                key: 'traderDraftMinPrice',
                title: '贸易商汇票最低报价 (元/吨)',
                width: 200,
            },
            {
                key: 'traderCashMinPrice',
                title: '贸易商现金最低报价 (元/吨)',
                width: 200,
            },
        ],
        tableList: props.detail.traderItemDTOList || [],
        flexHeight: false,
        bordered: true,
        singleLine: false,
        styleOption: {
            padding: '0px',
        },
        tableBtns: [],
        isShowPagination: false,
    };
});
</script>
