<template>
    <div class="edit-content">
        <div class="form-card">
            <Form ref="formRef" label-width="120px">
                <MxPersonSelect :clearable="true" title="申请人" required name="initiatorId" placeholder="请选择申请人"
                    v-model="formData.initiatorId" v-model:label="formData.initiatorName"
                    @changeEvt="handleInitiatorChange" />
                <MxAppDeptTreeSelect
                    v-model:value="formData.deptCode"
                    v-model:label="formData.deptName"
                    title="申请部门"
                    field-label="申请部门"
                    name="deptCode"
                    placeholder="请选择申请部门"
                    required
                    :multiple="false" />
                <Field name="reason" label-align="top" v-model="formData.reason" label="申请事由" rows="5" required autosize
                    maxlength="500" type="textarea" show-word-limit clearable placeholder="请输入" />
                <Field label-align="top" required name="attachmentsInfo" label="结算附件">
                    <template #input>
                        <MxWebFileUpload v-model="formData.attachmentsInfo" :limit="9" :multiple="true" :accept="ATTACHMENT_ACCEPT"
                            fileSize="50MB" force-app-size />
                    </template>
                </Field>
                <div class="associated-approval-field">
                    <div class="associated-approval-header">
                        <div class="associated-approval-label">
                            <span class="required-mark">*</span>
                            <span>关联审批</span>
                        </div>
                        <div class="associated-approval-add" @click="openAssociatedApproval">
                            <img src="@/assets/images/comm/icon⎽com⎽add_blue.png"
                                class="associated-approval-add-icon" />
                            <div class="associated-approval-add-text">添加</div>
                        </div>
                        <!-- <button type="button" class="associated-approval-add" @click="openAssociatedApproval">+ 添加</button> -->
                    </div>
                    <MxApprovalSelect ref="approvalSelectRef" v-model="formData.associatedApproval"
                        class="associated-approval-select" value-format="object" :multiple="true" hide-trigger />
                </div>
                <Field name="remark" label-align="top" v-model="formData.remark" label="结算备注" rows="5" required autosize
                    maxlength="500" type="textarea" show-word-limit clearable placeholder="请输入" />
            </Form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Field, Form } from 'vant';

const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
});

const ATTACHMENT_ACCEPT = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx'];
const approvalSelectRef = ref<{ openModal: () => void } | null>(null);

/**
 * 打开关联审批选择弹窗。
 * @returns 无返回值
 */
const openAssociatedApproval = () => {
    approvalSelectRef.value?.openModal();
};

/**
 * 获取人员飞书 ID，兼容人员组件返回的不同字段名。
 * @param person 人员选择组件返回的人员对象
 * @returns 飞书用户 ID
 */
const getPersonLarkId = (person: any) => {
    return person?.larkUserId || person?.feishuUserId || person?.larkId || '';
};

/**
 * 申请人变化时同步申请人名称、飞书 ID，并带出第一个部门。
 * @param person 人员选择组件返回的人员对象
 * @returns 无返回值
 */
const handleInitiatorChange = (person: any) => {
    if (!person || Array.isArray(person)) {
        props.formData.initiatorName = '';
        props.formData.initiatorLarkId = '';
        return;
    }
    props.formData.initiatorName = person.label || person.username || person.name || '';
    props.formData.initiatorLarkId = getPersonLarkId(person);
    const defaultDept = person.userDeptList?.[0] || {};
    if (defaultDept.deptCode) {
        props.formData.deptCode = defaultDept.deptCode;
        props.formData.deptName = defaultDept.deptName || '';
    }
};
</script>

<style scoped lang="less">
.edit-content {
    padding: 2px 0 8px;

    .form-card {
        padding: 4px 0px;
        background: #ffffff;
        border-radius: 10px;

        :deep(.van-cell) {
            padding: 14px 12px;
        }

        :deep(.van-cell:after) {
            border-bottom: 1px solid #ededed;
        }

        :deep(.van-search__field) {
                padding: 0 !important;
                border-bottom: none !important;
        }
    }
}

:deep(.van-cell) {
    &:last-child {
        padding-bottom: 0;
    }
}

:deep(.van-field__label) {
    font-size: 16px;
    color: var(--base-grey2);
}

:deep(.van-field__control),
:deep(.van-field__value),
:deep(.van-cell__value) {
    color: var(--base-black);
    font-size: 16px;
}

:deep(.van-field__word-limit),
:deep(.van-field__word-num) {
    color: var(--base-grey) !important;
    font-size: 12px !important;
}

:deep(.van-cell__right-icon) {
    transform: rotate(90deg);
}

.associated-approval-field {
    margin: 0 12px;
    padding: 14px 0;
    border-bottom: 1px solid #ededed;
}

.associated-approval-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
}

.associated-approval-label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--base-grey2);
    font-size: 16px;
    line-height: 24px;
}

.required-mark {
    color: #ee0a24;
}

.associated-approval-add {
    // height: 24px;
    // padding: 0;
    // border: 0;
    // background: transparent;
    // color: #2c65f2;
    // font-size: 16px;
    // line-height: 24px;
    display: flex;
    align-items: center;
}

.associated-approval-add-icon {
    width: 16px;
    height: 16px;
}

.associated-approval-add-text {
    color: var(--base-color);
    font-weight: 400;
    font-size: 16px;
}

.associated-approval-select {
    margin-top: 10px;
}
</style>
