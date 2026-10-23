<template>
    <AppPage :showList="false" title="销售合同">
        <template #content>
            <div class="app_page_content">
                <div class="search-bar">
                    <n-input v-model:value="searchForm.keyword" placeholder="合同编号/客户名称" clearable />
                    <n-button type="primary" @click="handleSearch">查询</n-button>
                </div>
                <n-button type="primary" block @click="handleAdd" style="margin-bottom: 15px;">新增合同</n-button>
                <n-data-table :columns="columns" :data="tableData" size="small" />
            </div>
        </template>
    </AppPage>
</template>
<script setup lang="ts">
import { ref, reactive, h } from 'vue';
import { NButton, NInput, NDataTable, NTag } from 'naive-ui';
const searchForm = reactive({ keyword: '' });
const columns = [
    { title: '客户名称', key: 'customerName' },
    { title: '合同金额', key: 'amount' },
    { title: '状态', key: 'status', render: (row: any) => h(NTag, { type: row.status === 'completed' ? 'success' : 'warning' }, () => row.statusName) }
];
const tableData = ref([]);
const handleSearch = () => console.log('查询', searchForm);
const handleAdd = () => console.log('新增');
</script>
<style scoped lang="postcss">
.app_page_content { padding: 15px; .search-bar { display: flex; gap: 10px; margin-bottom: 15px; } }
</style>
