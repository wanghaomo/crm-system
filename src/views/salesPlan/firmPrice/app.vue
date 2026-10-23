<template>
    <AppPage :showList="false" title="企业基准定价">
        <template #content>
            <div class="app_page_content">
                <div class="search-bar">
                    <n-input v-model:value="searchForm.keyword" placeholder="产品名称" clearable />
                    <n-button type="primary" @click="handleSearch">查询</n-button>
                </div>
                <n-button type="primary" block @click="handleAdd" style="margin-bottom: 15px;">新增定价</n-button>
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
    { title: '产品名称', key: 'productName' },
    { title: '基准价', key: 'basePrice' },
    { title: '状态', key: 'status', render: (row: any) => h(NTag, { type: row.status === 'effective' ? 'success' : 'default' }, () => row.statusName) }
];
const tableData = ref([]);
const handleSearch = () => console.log('查询', searchForm);
const handleAdd = () => console.log('新增');
</script>
<style scoped lang="postcss">
.app_page_content { padding: 15px; .search-bar { display: flex; gap: 10px; margin-bottom: 15px; } }
</style>
