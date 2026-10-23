<template>
    <div>
        <component :is="_isApp ? MobileView : PcView" />
    </div>
</template>

<script setup>
import PcView from "./web.vue"
import MobileView from "./app.vue"
import { isApp } from "@/utils/comm"
// 根据运行容器切换 PC / App 发货订单列表页。
const _isApp = isApp()
</script>
