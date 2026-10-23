<template>
    <div :class="{ card: true, 'app-card': isApp, 'plain-card': plain }">
        <div v-if="!plain" class="head">
            <div class="head-main">
                <div :class="['icon', iconClass]"></div>
                <div class="title">{{ title }}</div>
                <div class="stitle">{{ stitle }}</div>
            </div>
            <div class="head-extra" v-if="$slots['head-right']">
                <slot name="head-right"></slot>
            </div>
        </div>
        <div class="content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
    },
    isApp: {
        type: Boolean,
    },
    stitle: {
        type: String,
    },
    iconClass: {
        type: String,
    },
    plain: {
        type: Boolean,
        default: false,
    },
});
</script>

<style scoped lang="less">
.card {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(83, 84, 88, 0.16);
    border-radius: 12px 12px 12px 12px;
    padding: 16px 16px;
    box-sizing: border-box;
    // margin-bottom: 20px;
    height: auto;
    .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
    }
    .head-main {
        display: flex;
        align-items: center;
        min-width: 0;
        .icon {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            flex-shrink: 0;
        }
        .icon⎽com⎽core {
            background:  url('@/assets/images/dashboard/icon⎽com⎽core.png') center no-repeat;
            background-size: 100% 100%;
        }
        .icon⎽com⎽order {
            background: center url('@/assets/images/dashboard/icon⎽com⎽order.png') no-repeat;
            background-size: 100% 100%;
        }
        .icon⎽com⎽settlement {
            background: center url('@/assets/images/dashboard/icon⎽com⎽settlement.png') no-repeat;
            background-size: 100% 100%;
        }
        .icon⎽com⎽shipment {
            background: center url('@/assets/images/dashboard/icon⎽com⎽shipment.png') no-repeat;
            background-size: 100% 100%;
        }
        .icon⎽com⎽zkcl {
            background: center url('@/assets/images/dashboard/icon⎽com⎽zkcl.png') no-repeat;
            background-size: 100% 100%;
        }
        .title {
            font-size: 16px;
            color: #333333;
            font-weight: 600;
            min-width: 0;
        }
        .stitle {
            font-size: 14px;
            color: #666666;
        }
    }
    .head-extra {
        margin-left: 12px;
        flex-shrink: 0;
    }
    .content{
        height: calc(100% - 26px);
    }
}
.app-card{
    padding: 16px 12px;
    margin-bottom: 20px;
}

.plain-card {
    padding: 0;
    background: transparent;
    box-shadow: none;
    border-radius: 0;

    .content {
        height: auto;
    }
}
</style>
