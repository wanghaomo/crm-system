<template>
    <MxDetailPage :showApprovalLogs="tab == 2" :approval-logs="detail.approvalLogs || []" approval-logs-title="流程信息" :hasTabBorder="true" class="dialog" v-model:show="show" title="贸易商基准定价详情" :left-content-style="{ padding: '24px' }" :right-content-style="{ padding: '24px' }" :closablePop="false">
        <template #header-sub-title>
            <div class="detail-title">
                <div class="detail-title-top">
                    <div class="detail-name">{{ detail.projectName || '--' }}</div>
                    <StatusTag :text="statusName" :color="statusStyle.color" :bgColor="statusStyle.backgroundColor" :borderColor='statusStyle.bdColor' />
                </div>
                <div class="detail-title-bottom">
                    <div class="label-value">
                        <div class="label">基准定价单号</div>
                        <div class="value">{{ detail.pricingCode || '--' }}</div>
                    </div>
                    <div class="label-value">
                        <div class="label">定价月份</div>
                        <div class="value">{{ detail.pricingMonth || '--' }}</div>
                    </div>
                    <div class="label-value">
                        <div class="label">创建人</div>
                        <div class="value">{{ detail.createdByName || '--' }}</div>
                    </div>
                    <div class="label-value">
                        <div class="label">创建时间</div>
                        <div class="value">{{ detail.createdAt || '--' }}</div>
                    </div>
                </div>
            </div>
        </template>
        <template #tabs-content>
            <MxTab :tabs="tabs" v-model="tab"></MxTab>
        </template>
        <template #right-content>
            <Info :detail="detail" v-show="tab == 1"></Info>
            <Approve :detail="detail" v-show="tab == 2"></Approve>
        </template>
        <template #footer>
            <MxApprovalCancel
                v-if="tab == 2"
                in-footer
                :approval-id="detail.approvalDTO?.id"
                :initiator-lark-id="detail.approvalDTO?.larkUserId"
                :reviewing="detail.status === 'REVIEWING'"
                @success="handleCancelSuccess" />
        </template>
    </MxDetailPage>
</template>

<script setup lang="ts">
import initData from './index';
import Info from './components/Info.vue';
import Approve from './components/Approve.vue';
import MxApprovalCancel from '@/components/MxApprovalCancel/index.vue';
const emit = defineEmits<{
    (event: 'refresh'): void;
}>();
const { detail, statusName, statusStyle, tabs, tab, show, showDialog } = initData();

/**
 * 撤销审批成功后重新加载详情并通知分页刷新。
 * @returns 无返回值
 */
const handleCancelSuccess = async () => {
    await showDialog(detail.value.id);
    tab.value = 2;
    emit('refresh');
};

defineExpose({
    showDialog,
});
</script>

<style lang="less" scoped>
.detail-con {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.detail-bottom {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px;
    flex: 1;
    display: flex;
    overflow: hidden;
    flex-direction: column;
}

.detail-title {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.detail-title-top {
    display: flex;
    align-items: center;
    overflow: hidden;
    gap: 8px;
    margin-bottom: 8px;
}

.status-tag {
    padding: 1px 4px;
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
}

.detail-name {
    font-weight: 600;
    font-size: 16px;
    color: #333333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.detail-title-bottom {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px 80px;
}

.label-value {
    display: flex;
    align-items: center;
    gap: 8px;
}

.label {
    flex-shrink: 0;
    font-weight: 400;
    font-size: 14px;
    color: #999999;
}

.value {
    font-weight: 400;
    font-size: 14px;
    color: #333333;
    flex: 1;
}

:deep(.n-descriptions-table-content__label) {
    text-align: right;
}
</style>
