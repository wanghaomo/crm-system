<template>
    <WebPage contentPadding="0px" @addEvt="createEvt">
        <template #headerRight>
            <MxButton v-if="checkPermission(['crm:sales_contract:export'])" border color="#666" :disabled="exportLoading" @click="exportEvt">
                <template #leftIcon>
                    <img
                        src="@/assets/images/comm/icon⎽com⎽import.png"
                        alt=""
                        style="width: 16px; height: 16px" />
                </template>
                导出数据
            </MxButton>
        </template>
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableContent>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></MxWebSearchBar>
                </template>
            </MxWebDataTable>
            <MxDrawer v-model:show="invalidateDrawerShow" title="作废销售合同" size="small" :closablePop="false">
                <div class="invalidate-drawer-body">
                    <n-form
                        ref="invalidateFormRef"
                        :model="invalidateForm"
                        :rules="invalidateRules"
                        require-mark-placement="left"
                        label-placement="left"
                        label-align="right"
                        label-width="88px">
                        <n-form-item label="作废原因" path="terminationReason">
                            <n-input
                                v-model:value="invalidateForm.terminationReason"
                                type="textarea"
                                placeholder="请输入"
                                :maxlength="INVALIDATE_REASON_MAX_LENGTH"
                                show-count
                                :autosize="{ minRows: 7, maxRows: 10 }" />
                        </n-form-item>
                    </n-form>
                </div>
                <template #footer>
                    <div class="invalidate-drawer-footer">
                        <MxButton :disabled="invalidateSubmitLoading" @click="submitInvalidate">
                            {{ invalidateSubmitLoading ? '提交中' : '提交' }}
                        </MxButton>
                    </div>
                </template>
            </MxDrawer>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NInput } from 'naive-ui';
import MxDrawer from '@/components/MxDrawer/index.vue';
import initData from './index';
import { checkPermission } from '@/utils/comm';

const {
    tableConfig,
    queryConfiguration,
    createEvt,
    queryEvt,
    exportEvt,
    exportLoading,
    invalidateDrawerShow,
    invalidateFormRef,
    invalidateForm,
    invalidateRules,
    invalidateSubmitLoading,
    submitInvalidate,
    INVALIDATE_REASON_MAX_LENGTH,
} = initData();
</script>

<style lang="less" scoped>
.invalidate-drawer-body {
    padding: 24px;
}

.invalidate-drawer-footer {
    display: flex;
    justify-content: center;
    width: 100%;
}
</style>
