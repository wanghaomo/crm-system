<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" :detailData="detailData" />
    </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import PcView from './web.vue';
import MobileView from './app.vue';
import { isApp } from '@/utils/comm';
const _isApp = isApp();
import { useRoute } from 'vue-router';
import { getMarketReportDetailApi } from '@/api';
import { getFileType } from '@/utils/comm';
const route = useRoute();
console.log(route.query);
const detailData = ref<any>({});
const bytesToMB = (size) => {
    // 处理非数字、空值、负数
    if (isNaN(size) || size === null || size === undefined || size < 0) {
        return '--';
    }

    // 1MB = 1024 * 1024 字节（标准存储换算）
    const mb = size / (1024 * 1024);

    // 保留两位小数并返回字符串
    return mb.toFixed(2) + 'MB';
};
const getDetail = async (id?: any) => {
    try {
        const res = await getMarketReportDetailApi(id);
        detailData.value = res.data;
        detailData.value.fileType = '--';
        detailData.value.fileSize = '--';
        if (detailData.value.fileInfo) {
            detailData.value.fileType = getFileType(detailData.value.fileInfo.type) || '--';
            detailData.value.fileSize = bytesToMB(detailData.value.fileInfo.size);
        }
        console.log('detailData', detailData.value);
    } catch (error) {
        console.log(error, '1');
    }
};
getDetail(route.query.encryptedId);
</script>

<style scoped>
</style>
