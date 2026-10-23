<template>
    <WebPage contentPadding="0px" @addEvt="createEvt" :hideAddBtn="!checkPermission(['crm:framework_contract:create'])">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableContent>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></MxWebSearchBar>
                </template>
            </MxWebDataTable>
            <MxDrawer v-model:show="terminateDrawerShow" title="终止框架合同" size="small" :closablePop="false">
                <div class="terminate-drawer-body" style="padding: 16px;">
                    <n-form
                        ref="terminateFormRef"
                        :model="terminateForm"
                        :rules="terminateRules"
                        require-mark-placement="left"
                        label-placement="left"
                        label-align="right"
                        label-width="88px">
                        <n-form-item label="终止原因" path="terminationReason">
                            <n-input
                                v-model:value="terminateForm.terminationReason"
                                type="textarea"
                                placeholder="请输入"
                                :maxlength="255"
                                show-count
                                :autosize="{ minRows: 7, maxRows: 10 }" />
                        </n-form-item>
                    </n-form>
                </div>
                <template #footer>
                    <div class="terminate-drawer-footer" style="width: 100%;text-align: center;display: flex;justify-content: center;">
                        <MxButton :disabled="terminateSubmitLoading" @click="submitTerminate">
                            {{ terminateSubmitLoading ? '提交中' : '提 交' }}
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
    terminateDrawerShow,
    terminateFormRef,
    terminateForm,
    terminateRules,
    terminateSubmitLoading,
    submitTerminate,
} = initData();
</script>
