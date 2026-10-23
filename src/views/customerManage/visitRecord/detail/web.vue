<template>
    <WebPage showBack contentPadding="0" title="来访记录详情">
        <template #content>
            <VisitRecordDetail :record-id="recordId" />
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import VisitRecordDetail from '@/views/customerManage/components/VisitRecordDetail.vue';

const route = useRoute();
const recordId = computed(() => route.query.id || null);
</script>
