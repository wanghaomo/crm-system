<!-- 审批弹窗 -->
<template>
    <div class="approval_pop_container" v-if="modelValue">
        <div class="approval_pop_content" @click.stop>
            <div class="approval_pop_header">
                <span class="title_text">审批记录</span>
                <div class="approval_pop_close" @click="closePop()">
                    <n-icon size="20">
                        <CloseIcon />
                    </n-icon>
                </div>
            </div>
            <div class="approval_pop_body">
                <n-form
                    :model="approvalForm"
                    require-mark-placement="left"
                    :rules="rules"
                    ref="formRef"
                    label-placement="left"
                    label-width="100px">
                    <n-grid>
                        <n-grid-item :span="24">
                            <n-form-item label="审批结果" path="results">
                                <n-radio-group v-model:value="approvalForm.results">
                                    <n-radio value="by">通过</n-radio>
                                    <n-radio value="refused">拒绝</n-radio>
                                </n-radio-group>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="24">
                            <n-form-item label="审批人" path="approver">
                                <MxPersonSelect
                                    :clearable="false"
                                    v-model="approvalForm.plannerCodes"
                                    v-model:selectedPerson="approvalForm.approver"></MxPersonSelect>
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="24">
                            <n-form-item label="审批时间" path="approvalTime">
                                <n-date-picker
                                    v-model:value="approvalForm.approvalTime"
                                    type="datetime"
                                    placeholder="请选择审批时间" />
                            </n-form-item>
                        </n-grid-item>
                        <n-grid-item :span="24">
                            <n-form-item
                                label="审批意见"
                                path="remark"
                                :rule="
                                    approvalForm.results === 'refused'
                                        ? { required: true, message: '请输入审批意见', trigger: ['blur'] }
                                        : {}
                                ">
                                <n-input
                                    v-model:value="approvalForm.remark"
                                    rows="4"
                                    type="textarea"
                                    placeholder="请输入审批意见"
                                    maxlength="200"
                                    show-count />
                            </n-form-item>
                        </n-grid-item>
                    </n-grid>
                </n-form>
                <div class="approval_pop_footer">
                    <MxButton
                        border
                        :styleOption="{
                            padding: '4px 12px',
                        }"
                        @click="closePop(true)">
                        取消
                    </MxButton>
                    <MxButton
                        :styleOption="{
                            padding: '4px 12px',
                        }"
                        @click="submitApproval">
                        提交
                    </MxButton>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { NIcon, NForm, NFormItem, NInput, NGrid, NGridItem, NRadioGroup, NRadio, NDatePicker } from 'naive-ui';
import { Close as CloseIcon } from '@vicons/ionicons5';
import { useUserStore } from '@/store/userStore';
import { storeToRefs } from 'pinia';
// 用户信息
const { userInfo } = storeToRefs(useUserStore());
const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        results?: 'by' | 'refused';
        // 额外参数，用于回调后使用者自定义处理
        extraParams?: any;
    }>(),
    {
        modelValue: true,
        results: 'by',
        extraParams: null,
    }
);
const show = ref(false);
const emit = defineEmits(['update:modelValue', 'submit']);
const formRef = ref<any>();

const rules = ref({
    // remark: [{ required: true, message: '请输入审批意见', trigger: ['blur'] }],
    results: [{ required: true, message: '请选择审批结果', trigger: ['change', 'blur', 'input'] }],
});
// 审批记录表单
const approvalForm = ref({
    // 审批结果(by:通过)(refused:拒绝)
    results: 'by',
    // 审批人
    approver: {
        code: userInfo.value?.code,
        name: userInfo.value?.username,
    },
    // 审批人Code
    plannerCodes: userInfo.value?.code,
    // 审批时间
    approvalTime: new Date().getTime(),
    // 审批意见
    remark: '',
});
//
// 初始化审批记录表单
const initApprovalForm = (results?: string) => {
    approvalForm.value = {
        results: results || 'by',
        approver: {
            code: userInfo.value?.code,
            name: userInfo.value?.username,
        },
        plannerCodes: userInfo.value?.code,
        approvalTime: new Date().getTime(),
        remark: '',
    };
};
// 关闭弹窗
const closePop = (isInit?: boolean) => {
    if (isInit) {
        initApprovalForm();
    }
    emit('update:modelValue', false);
};
// 提交审批记录
const submitApproval = () => {
    formRef.value.validate().then((valid) => {
        if (valid) {
            emit('submit', { ...approvalForm.value, extraParams: props.extraParams });
        }
    });
};
watch(
    () => props.modelValue,
    (newVal) => {
        show.value = newVal;
        if (newVal) {
            initApprovalForm(props.results);
        }
    },
    { immediate: true }
);
</script>
<style lang="postcss" scoped>
.approval_pop_container {
    position: fixed;
    left: 0px;
    top: 0px;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99;
    .approval_pop_content {
        width: 447px;
        height: auto;
        background-color: var(--base-white);
        border-radius: 4px;
    }
    .approval_pop_header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 48px;
        padding: 0 24px;
        border-bottom: 1px solid #f1f1f1;
        .title_text {
            font-size: 16px;
            font-weight: 600;
            color: var(--base-black);
        }
        .approval_pop_close {
            color: var(--base-grey);
            cursor: pointer;
        }
    }
    .approval_pop_body {
        padding: 24px;
        padding-top: 32px;
    }
    .approval_pop_footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
    }
}
</style>
