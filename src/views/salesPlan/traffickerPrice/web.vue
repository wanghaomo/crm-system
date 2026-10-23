<template>
    <WebPage contentPadding="0px" @addEvt="createEvt" :hideAddBtn="!checkPermission(['crm:trafficker_rice:create'])">
        <template #content>
            <MxWebDataTable v-bind="tableConfig">
                <template #tableContent>
                    <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="queryEvt"></MxWebSearchBar>
                </template>
            </MxWebDataTable>
            <Detail ref="detailRef" @refresh="getList" />
            <MxDrawer v-model:show="cancelDrawerShow" title="作废基准定价" size="small" :closablePop="false">
                <div class="cancel-drawer-body">
                    <n-form
                        ref="cancelFormRef"
                        :model="cancelForm"
                        :rules="cancelRules"
                        require-mark-placement="left"
                        label-placement="left"
                        label-align="right"
                        label-width="88px">
                        <n-form-item label="作废原因" path="cancelReason">
                            <n-input
                                v-model:value="cancelForm.cancelReason"
                                type="textarea"
                                placeholder="请输入"
                                :maxlength="255"
                                show-count
                                :autosize="{ minRows: 7, maxRows: 10 }" />
                        </n-form-item>
                    </n-form>
                </div>
                <template #footer>
                    <div class="cancel-drawer-footer">
                        <MxButton :disabled="cancelSubmitLoading" @click="submitCancel">
                            {{ cancelSubmitLoading ? '提交中' : '提交' }}
                        </MxButton>
                    </div>
                </template>
            </MxDrawer>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NInput } from 'naive-ui';
import initData from './index';
import Detail from './components/Detail/index.vue';
import MxDrawer from '@/components/MxDrawer/index.vue';
import { checkPermission } from '@/utils/comm';

const {
    createEvt,
    tableConfig,
    queryConfiguration,
    queryEvt,
    detailRef,
    cancelDrawerShow,
    cancelFormRef,
    cancelForm,
    cancelRules,
    cancelSubmitLoading,
    submitCancel,
    getList,
} = initData();
</script>

<style lang="less" scoped>
.cancel-drawer-body {
    padding: 24px;
}

.cancel-drawer-footer {
    display: flex;
    justify-content: center;
    width: 100%;
}
</style>
