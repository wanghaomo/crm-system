<template>
    <AppView v-if="isAppPage" />
    <WebPage v-else contentPadding="0px" @addEvt="addEvt" :hideAddBtn="!checkPermission(['crm:visit_plan:create'])">
        <template #content>
            <n-spin :show="tableLoading" class="loading">
                <div class="visit-plan-container">
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
    <!-- 详情抽屉 -->
    <MxDrawer v-model:show="detailPopShow" title="拜访记录详情" size="large" :closablePop="false">
        <VisitPlanDetail :record-id="currentDetailId" />
    </MxDrawer>
    <!-- 取消拜访抽屉 -->
    <MxDrawer v-model:show="cancelPopShow" title="取消拜访" size="small" :closablePop="false">
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
                <MxButton border :styleOption="{ color: '#000000A6', borderColor: '#00000026', backgroundColor: '#fff' }" @click="handleArchiveCancel">
                    取消
                </MxButton>
                <MxButton :styleOption="{ backgroundColor: '#2C65F2', color: '#fff' }" @click="handleArchiveConfirm">
                    确定
                </MxButton>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import IndexData from './index';
import { ref } from 'vue';
import { isApp } from '@/utils/comm';
import AppView from './app.vue';
import { NForm, NFormItem, NInput, NButton, NModal, NSpin } from 'naive-ui';
import VisitPlanDetail from '@/views/customerManage/components/VisitPlanDetail.vue';
const cancelFormRef = ref<any>(null);
const isAppPage = isApp();
const {
    queryConfiguration,
    handleSearch,
    tableConfig,
    addEvt,
    tableLoading,
    // 详情抽屉
    detailPopShow,
    currentDetailId,
    // 取消拜访
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

</script>

<style scoped lang="less">
:deep(.loading),
:deep(.loading .n-spin-content) {
    height: 100%;
}

.visit-plan-container {
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
