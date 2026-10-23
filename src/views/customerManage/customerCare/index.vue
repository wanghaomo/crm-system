<template>
    <CustomerCareApp v-if="isAppPage" />
    <WebPage v-else @addEvt="addEvt" contentPadding="0" :hideAddBtn="!checkPermission(['crm:customer_car:create'])">
        <template #content>
            <n-spin :show="tableLoading" class="loading">
                <div class="customer-care-container">
                    <MxWebDataTable v-bind="tableConfig">
                        <template #tableSearch>
                            <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                            </MxWebSearchBar>
                        </template>
                    </MxWebDataTable>
                </div>
            </n-spin>
        </template>
    </WebPage>
    <!-- 详情抽屉（无Tab切换） -->
    <MxDrawer v-model:show="detailPopShow" title="客户关怀详情" size="large" :closablePop="false">
        <CustomerCareDetail :record-id="currentDetailId" />
    </MxDrawer>
    <!-- 取消关怀抽屉 -->
    <MxDrawer v-model:show="cancelPopShow" title="取消关怀" size="small" :closablePop="false">
        <div class="formMain">
            <n-form ref="cancelFormRef" :model="cancelForm" :rules="cancelRules" require-mark-placement="left" label-placement="left" label-align="right" label-width="100px">
                <n-form-item label="取消原因" path="reason">
                    <n-input v-model:value="cancelForm.reason" type="textarea" placeholder="请输入" :maxlength="255" show-count />
                </n-form-item>
            </n-form>
        </div>
        <template #footer>
            <div class="drawer-footer">
                <n-button color="#2C65F2" @click="submitCancel(cancelFormRef)">提 交</n-button>
            </div>
        </template>
    </MxDrawer>
    <!-- 单据归档弹窗 -->
    <n-modal v-model:show="archivePopShow" :mask-closable="false" :closable="false" preset="dialog" :show-icon="false">
        <template #header>
            <div style="display: flex; align-items: center; gap: 8px">
                <img src="@/assets/images/icon⎽com⎽warn.png" alt="" style="width: 24px; height: 24px" />
                <span style="font-size: 16px; font-weight: 600; color: #000">确认要单据归档吗？</span>
            </div>
        </template>
        <div style="color: #000000a6; padding-left: 30px">该单据归档后，不可进行再次编辑！</div>
        <template #action>
            <div style="display: flex; justify-content: center; gap: 12px">
                <MxButton border :styleOption="{
                    color: '#000000A6',
                    borderColor: '#00000026',
                    backgroundColor: '#fff',
                }" @click="handleArchiveCancel">
                    取 消
                </MxButton>
                <MxButton :styleOption="{ backgroundColor: '#2C65F2', color: '#fff' }" @click="handleArchiveConfirm">
                    确 定
                </MxButton>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import IndexData from './index';
import { ref } from 'vue';
import { isApp } from '@/utils/comm';
import CustomerCareApp from './app.vue';
import { NForm, NFormItem, NInput, NButton, NModal, NSpin } from 'naive-ui';
import CustomerCareDetail from '@/views/customerManage/components/CustomerCareDetail.vue';
const {
    queryConfiguration,
    handleSearch,
    tableConfig,
    tableLoading,
    addEvt,
    // 详情抽屉
    detailPopShow,
    currentDetailId,
    // 取消关怀
    cancelPopShow,
    cancelForm,
    cancelRules,
    submitCancel,
    // 归档弹窗
    archivePopShow,
    handleArchiveConfirm,
    handleArchiveCancel,
    checkPermission
} = IndexData();

const cancelFormRef = ref<any>(null);
const isAppPage = isApp();
</script>

<style scoped lang="less">
:deep(.loading),
:deep(.loading .n-spin-content) {
    height: 100%;
}

.customer-care-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.formMain {
    padding: 16px 8px;
}

.drawer-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
    width: 100%;
}

</style>
