<template>
    <WebPage showBack contentPadding="0" title="拜访记录详情">
        <template #content><VisitPlanDetail :record-id="recordId" /></template>
    </WebPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import VisitPlanDetail from '@/views/customerManage/components/VisitPlanDetail.vue';

const route = useRoute();
const recordId = computed(() => route.query.id || null);
</script>
