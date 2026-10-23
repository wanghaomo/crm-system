<template>
    <div :class="{ card: true }">
        <div class="head">
            <slot name="titleLeft"></slot>
            <div class="title">{{ title }}</div>
        </div>
        <div class="content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
    },
    isWeb: {
        type: Boolean,
    },
    stitle: {
        type: String,
    },
    iconClass: {
        type: String,
    },
});
</script>

<style scoped lang="less">
.card {
    width: 100%;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 12px 12px 12px 12px;
    padding: 16px 12px;
    box-sizing: border-box;
    margin-bottom: 12px;
    .head {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        .title {
            font-size: 16px;
            color: #333333;
            font-weight: 500;
        }
        .content {
        }
    }
}
</style>