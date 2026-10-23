<template>
    <MxDrawer v-model:show="pushPopShow" title="消息推送" size="small" :closablePop="false">
        <div class="push-content">
            <div class="push-label"><span class="push-required">*</span> 消息推送</div>
            <div class="push-select-container">
                <n-select v-model:value="pushChatList" multiple :options="larkChartList" placeholder="请选择" />
            </div>
        </div>
        <template #footer>
            <div class="drawer-footer">
                <n-button color="#2C65F2" @click="handlePushSubmit">推 送</n-button>
            </div>
        </template>
    </MxDrawer>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NButton, useMessage, NSelect } from 'naive-ui';
import { pushIndustryNewsApi, getLarkChatListApi } from '@/api';

const emit = defineEmits('refresh');
const message = useMessage();
const pushPopShow = ref(false);
const pushRow = ref<any>(null);
const pushChatList = ref<any[]>([]);
let detailData: any = null;

//获取飞书群组列表
let larkChartList: any[] = [];
const getLarkChatList = async () => {
    try {
        const res = await getLarkChatListApi();
        larkChartList = (res.data || []).map((item) => {
            return {
                label: item.name,
                value: item.chatId,
            };
        });
    } catch (error) {
        console.log(error);
    }
};
getLarkChatList();
// 推送保存
const handlePushSubmit = async () => {
    if (pushChatList.value.length === 0) {
        message.warning('请选择推送对象');
        return;
    }
    const params = {
        ...pushRow.value,
        pushChatList: larkChartList
            .filter((item) => pushChatList.value.includes(item.value))
            .map((item) => ({ name: item.label, chatId: item.value })),
    };
    try {
        const res = await pushIndustryNewsApi(params);
        console.log('res', res);

        if (res && res.code == 200) {
            pushPopShow.value = false;
            emit('refresh', detailData.id);
        }
    } catch (error) {
        console.error('Failed to push market report:', error);
    }
};

const showDrawer = (data?: any) => {
    console.log('DAta', data);
    pushRow.value = data;
    detailData = data;
    // 回显已有的推送对象
    pushChatList.value = data.pushChatList ? data.pushChatList.map((item) => item.chatId) : [];
    pushPopShow.value = true;
};
defineExpose({
    showDrawer,
});
</script>

<style scoped lang="less">
/* 推送抽屉 */
.push-content {
    padding: 16px;
    display: flex;
    gap: 8px;

    .push-label {
        font-size: 14px;
        color: #333;
        margin-bottom: 12px;
        font-weight: 600;

        .push-required {
            color: #e34242;
            margin-right: 2px;
        }
    }

    .push-select-container {
        flex: 1;
    }
}

.drawer-footer {
    display: flex;
    justify-content: center !important;
    gap: 12px;
    width: 100%;
}
</style>