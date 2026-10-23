<template>
        <component :is="_isApp ? MobileView : PcView" />
</template>

<script setup>
import PcView from "./web.vue"
import MobileView from "./app.vue"
import { isApp } from "@/utils/comm"
const _isApp = isApp()
</script>
