<template>
    <WebPage showBack hideAddBtn contentPadding="0px" contentBg="var(--base-grey3)">
        <template #content>
            <div class="detail-con">
                <DetailHeader :detail="detail"></DetailHeader>
                <div class="detail-bottom">
                    <MxTab style="padding: 0;" v-model="tab" :tabs="tabs"></MxTab>
                    <Info v-show="tab == 1" :detail="detail"></Info>
                    <Approve v-show="tab == 2" :detail="detail" @cancel-success="getDetail"></Approve>
                    <LinkedContract v-show="tab == 3" :detail="detail"></LinkedContract>
                </div>
            </div>
        </template>
    </WebPage>
</template>

<script setup lang="ts">
import DetailHeader from './components/DetailHeader.vue';
import Info from './components/Info.vue';
import Approve from './components/Approve.vue';
import LinkedContract from './components/LinkedContract.vue';
import initData from './index';
import { ref } from 'vue';
const tab = ref<any>(1);
const { detail, tabs, getDetail } = initData();
</script>

<style lang="less" scoped>
.detail-con {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.detail-bottom {
    background: #ffffff;
    box-shadow: 0px 3px 20px 1px rgba(132, 132, 132, 0.16);
    border-radius: 8px;
    flex: 1;
    display: flex;
    overflow: hidden;
    flex-direction: column;
}
</style>
