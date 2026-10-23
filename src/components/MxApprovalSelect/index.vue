<template>
    <div class="mx-approval-select">
        <div class="approval-trigger">
            <div v-if="onlyShowOptions.length" class="approval-readonly-list">
                <div
                    v-for="option in onlyShowOptions"
                    :key="option.instanceCode"
                    class="approval-readonly-tag"
                    :title="option.approvalName">
                    <span class="approval-readonly-label">{{ option.approvalName }}</span>
                    <button
                        type="button"
                        class="approval-readonly-eye"
                        title="查看审批详情"
                        @click.stop="openDetail(option)">
                        <n-icon size="16">
                            <EyeOutlineIcon />
                        </n-icon>
                    </button>
                </div>
            </div>
            <span v-else-if="props.onlyShow">--</span>
            <div
                v-if="!props.onlyShow && selectedOptions.length"
                :class="isAppMode ? 'approval-app-selected-list' : 'selected-approval-list'">
                <span
                    v-for="option in selectedOptions"
                    :key="option.key"
                    :class="isAppMode ? 'approval-app-selected-item' : 'selected-approval-item'"
                    :title="option.label">
                    <span :class="isAppMode ? 'approval-app-selected-label' : 'selected-approval-label'">{{
                        option.label
                    }}</span>
                    <button
                        type="button"
                        :class="isAppMode ? 'approval-app-selected-remove' : 'selected-approval-remove'"
                        title="删除"
                        @click.stop="removeSelectedOption(option.key)">
                        <!-- <n-icon v-if="isAppMode" size="16">
                                <TrashOutlineIcon />
                            </n-icon> -->
                        <img v-if="isAppMode" src="@/assets/images/delete.png" class="approval-remove-icon" />
                        <template v-else>×</template>
                    </button>
                </span>
            </div>
            <button
                v-if="!props.onlyShow && isAppMode && !props.hideTrigger"
                type="button"
                class="approval-app-trigger"
                @click="openModal">
                {{ selectedOptions.length ? '重新选择' : '选择审批' }}
            </button>
            <MxButton
                v-if="!props.onlyShow && !isAppMode && !props.hideTrigger"
                border
                type="success"
                class="approval-add-btn"
                @click="openModal">
                <template #leftIcon>
                    <img class="add-icon" src="@/assets/images/comm/icon⎽com⎽add_blue.png" />
                </template>
                添加
            </MxButton>
        </div>
        <PcApprovalSelect v-if="!isAppMode" />
        <AppApprovalSelect v-else />
    </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { NIcon } from 'naive-ui';
import { EyeOutline as EyeOutlineIcon } from '@vicons/ionicons5';
import AppApprovalSelect from './AppApprovalSelect.vue';
import PcApprovalSelect from './PcApprovalSelect.vue';
import { approvalSelectContextKey, useApprovalSelect, type ApprovalSelectProps } from './useApprovalSelect';
import './approval-select.less';

const props = withDefaults(defineProps<ApprovalSelectProps>(), {
    modelValue: null,
    selectedRows: () => [],
    multiple: true,
    title: '选择审批',
    rowKey: 'instanceCode',
    modalWidth: 'calc(100vw - 260px)',
    tableMaxHeight: 420,
    status: 'APPROVED',
    valueFormat: 'array',
    separator: ',',
    columns: () => [],
    onlyShow: false,
    hideTrigger: false,
});
const emit = defineEmits<{
    (event: 'update:modelValue', value: any): void;
    (event: 'update:selectedRows', rows: ApprovalSelectProps['selectedRows']): void;
    (event: 'change', payload: { value: any; rows: ApprovalSelectProps['selectedRows'] }): void;
}>();
const controller = useApprovalSelect(props as Required<ApprovalSelectProps>, emit as (...args: any[]) => void);
provide(approvalSelectContextKey, controller);

const { isAppMode, onlyShowOptions, selectedOptions, removeSelectedOption, openModal, openDetail, closeModal } =
    controller;

defineExpose({ openModal, closeModal });
</script>
