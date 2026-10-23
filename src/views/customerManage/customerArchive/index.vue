<template>
    <WebPage contentPadding="0px" @addEvt="addEvt" :hideAddBtn="!checkPermission(['crm:customer_archive:create'])">
        <template #content>
            <n-spin :show="tableLoading" class="loading">
                <div class="customer-archive-container">
                    <MxWebDataTable v-bind="tableConfig">
                        <!-- 搜索栏 -->
                        <template #tableSearch>
                            <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                            </MxWebSearchBar>
                        </template>
                    </MxWebDataTable>
                    <!-- 调整星级弹窗 -->
                    <MxDrawer v-model:show="adjustStarPopShow" title="客户星级调整" size="small" :closablePop="false" footer-style="padding: 0">
                        <div class="formMain">
                            <n-form ref="adjustStarFormRef" :model="adjustStarForm" :rules="adjustStarRules" require-mark-placement="left" label-placement="left" label-align="right" label-width="100px">
                                <n-form-item label="客户星级" path="starLevel">
                                    <n-select v-model:value="adjustStarForm.starLevel" placeholder="请选择客户星级" :options="STAR_LEVEL_OPTIONS" />
                                </n-form-item>
                                <n-form-item label="调整原因" path="reason">
                                    <n-input v-model:value="adjustStarForm.reason" type="textarea" placeholder="请输入" :maxlength="255" show-count />
                                </n-form-item>
                            </n-form>
                        </div>
                        <template #footer>
                            <div class="drawer-footer">
                                <n-button color="#2C65F2" @click="submitAdjustStar(adjustStarFormRef)">提 交</n-button>
                            </div>
                        </template>
                    </MxDrawer>
                </div>
            </n-spin>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import IndexData from './index';
import { ref } from 'vue';
import { NForm, NFormItem, NSelect, NInput, NButton, NSpin } from 'naive-ui';
const adjustStarFormRef = ref<any>(null);
const {
    queryConfiguration,
    handleSearch,
    tableConfig,
    addEvt,
    adjustStarPopShow,
    adjustStarForm,
    adjustStarRules,
    STAR_LEVEL_OPTIONS,
    tableLoading,
    submitAdjustStar,
    checkPermission
} = IndexData();
</script>

<style scoped lang="less">
:deep(.loading) {
    height: 100%;
}

:deep(.loading .n-spin-content) {
    height: 100%;
}

.customer-archive-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.formMain {
    padding: 24px;
}

.drawer-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
    width: 100%;
}

</style>
