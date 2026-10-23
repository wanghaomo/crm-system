<template>
    <div
        v-if="canCancel"
        class="approval-cancel-actions"
        :class="{ 'approval-cancel-actions-footer': inFooter }">
        <VanButton
            v-if="isAppMode"
            class="approval-cancel-button approval-cancel-button-app"
            type="danger"
            plain
            :loading="submitting"
            :disabled="submitting"
            @click="handleCancelClick">
            撤销
        </VanButton>
        <NButton
            v-else
            class="approval-cancel-button"
            type="error"
            ghost
            :loading="submitting"
            :disabled="submitting"
            @click="handleCancelClick">
            撤销
        </NButton>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, useDialog, useMessage } from 'naive-ui';
import { Button as VanButton, showConfirmDialog, showToast } from 'vant';
import { storeToRefs } from 'pinia';
import { cancelFeishuApproval } from '@/api/approval';
import { isApp } from '@/utils/comm';
import { useUserStore } from '@/store/userStore';

const props = withDefaults(
    defineProps<{
        approvalId?: string | number;
        initiatorLarkId?: string;
        reviewing?: boolean;
        inFooter?: boolean;
    }>(),
    {
        approvalId: '',
        initiatorLarkId: '',
        reviewing: false,
        inFooter: false,
    }
);

const emit = defineEmits<{
    (event: 'success'): void;
}>();

const isAppMode = isApp();
const dialog = isAppMode ? null : useDialog();
const message = isAppMode ? null : useMessage();
const submitting = ref(false);
const canceledApprovalId = ref('');
const { userInfo } = storeToRefs(useUserStore());

const currentLarkUserId = computed(() => String(userInfo.value?.larkUserId || '').trim());
const approvalInitiatorLarkId = computed(() => String(props.initiatorLarkId || '').trim());
const hasApprovalId = computed(() => props.approvalId !== null && props.approvalId !== undefined && props.approvalId !== '');

const canCancel = computed(() => {
    return (
        props.reviewing &&
        hasApprovalId.value &&
        canceledApprovalId.value !== String(props.approvalId) &&
        Boolean(currentLarkUserId.value) &&
        currentLarkUserId.value === approvalInitiatorLarkId.value
    );
});

/**
 * 在当前审批仍满足撤销条件时调用撤销接口。
 * @returns 无返回值，成功后通知业务详情刷新
 */
const submitCancel = async () => {
    if (!canCancel.value || submitting.value) return;
    submitting.value = true;
    try {
        const res: any = await cancelFeishuApproval({
            userId: currentLarkUserId.value,
            approvalId: String(props.approvalId),
        });
        if (res?.code !== 200) {
            const errorMessage = res?.msg || '撤销失败，请稍后重试';
            if (isAppMode) showToast(errorMessage);
            else message?.error(errorMessage);
            return;
        }
        canceledApprovalId.value = String(props.approvalId);
        if (isAppMode) showToast('撤销成功');
        else message?.success('撤销成功');
        emit('success');
    } catch (error) {
        console.error('撤销审批失败:', error);
        if (isAppMode) showToast('撤销失败，请稍后重试');
        else message?.error('撤销失败，请稍后重试');
    } finally {
        submitting.value = false;
    }
};

/**
 * 显示撤销二次确认弹窗。
 * @returns 无返回值
 */
const handleCancelClick = async () => {
    if (isAppMode) {
        try {
            await showConfirmDialog({
                title: '确认撤销',
                message: '确认撤销当前审批吗？',
                confirmButtonText: '确认撤销',
                cancelButtonText: '取消',
                confirmButtonColor: '#d03050',
            });
            await submitCancel();
        } catch (error) {
            if (error !== 'cancel' && error !== 'close') {
                console.error('打开撤销确认弹窗失败:', error);
            }
        }
        return;
    }

    dialog?.warning({
        title: '确认撤销',
        content: '确认撤销当前审批吗？',
        positiveText: '确认撤销',
        negativeText: '取消',
        positiveButtonProps: {
            type: 'error',
        },
        onPositiveClick: submitCancel,
    });
};
</script>

<style lang="less" scoped>
.approval-cancel-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    margin-top: auto;
    padding: 12px 16px;
    border-top: 1px solid #eeeeee;
    background: #ffffff;
    box-sizing: border-box;
}

.approval-cancel-button {
    width: 80px;
}

.approval-cancel-button-app {
    width: 100%;
    max-width: 320px;
}

.approval-cancel-actions-footer {
    min-height: 0;
    padding: 0;
    border-top: 0;
    background: transparent;
}
</style>
