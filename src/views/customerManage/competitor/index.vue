<template>
    <WebPage
        contentPadding="0px"
        @addEvt="addEvt"
        :hideAddBtn="!checkPermission(['crm:competitor_manage:create'])">
        <template #content>
            <n-spin :show="tableLoading" class="loading">
                <div class="competitor-container">
                    <MxWebDataTable v-bind="tableConfig">
                        <!-- 搜索栏：支持企业名称模糊查询 -->
                        <template #tableSearch>
                            <MxWebSearchBar :queryConfiguration="queryConfiguration" @queryEvt="handleSearch">
                            </MxWebSearchBar>
                        </template>
                    </MxWebDataTable>
                </div>
            </n-spin>
        </template>
    </WebPage>
</template>

<script setup lang="ts" name="competitorIndex">
import { NSpin } from 'naive-ui';
import indexFn from './index';

const { queryConfiguration, handleSearch, tableConfig, addEvt, tableLoading, checkPermission } = indexFn();
</script>

<style lang="less" scoped>
/* n-spin 组件解析为异步组件，scoped 属性不落在其根节点，需要 :deep 穿透保持高度链 */
:deep(.loading) {
    height: 100%;
}

:deep(.loading .n-spin-content) {
    height: 100%;
}

.competitor-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>
