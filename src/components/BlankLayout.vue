<template>
    <n-modal-provider>
        <n-message-provider>
            <router-view></router-view>
        </n-message-provider>
    </n-modal-provider>
</template>
<script setup lang="ts">
import { NMessageProvider, NModalProvider } from 'naive-ui'
</script>
