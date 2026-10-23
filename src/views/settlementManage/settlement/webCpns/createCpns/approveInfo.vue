<template>
    <n-grid :cols="2" :x-gap="16" :y-gap="0">
        <n-grid-item>
            <n-form-item label="申请人" path="initiatorId" class="myFormItem">
                <MxPersonSelect
                    v-model:modelValue="formData.initiatorId"
                    v-model:label="formData.initiatorName"
                    placeholder="请选择申请人"
                    :clearable="true"
                    @changeEvt="handleInitiatorChange" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item>
            <n-form-item label="申请部门" path="deptCode" class="myFormItem">
                <MxDeptSelect
                    v-model:value="formData.deptCode"
                    v-model:label="formData.deptName"
                    placeholder="请选择申请部门" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item span="2">
            <n-form-item label="申请事由" path="reason" class="myFormItem">
                <n-input
                    type="textarea"
                    v-model:value="formData.reason"
                    maxlength="500"
                    show-count
                    rows="5"
                    placeholder="请输入" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item :span="2">
            <n-form-item label="结算附件" path="attachmentsInfo" class="myFormItem">
                <MxWebFileUpload
                    v-model="formData.attachmentsInfo"
                    :limit="9"
                    :multiple="true"
                    :accept="['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx']"
                    fileSize="50MB"></MxWebFileUpload>
            </n-form-item>
        </n-grid-item>
        <n-grid-item span="2">
            <n-form-item label="关联审批" path="associatedApproval" class="myFormItem">
                <MxApprovalSelect
                    v-model="formData.associatedApproval"
                    value-format="object"
                    :multiple="true" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item span="2">
            <n-form-item label="结算备注" path="remark" class="myFormItem">
                <n-input
                    type="textarea"
                    v-model:value="formData.remark"
                    maxlength="500"
                    show-count
                    rows="5"
                    placeholder="请输入" />
            </n-form-item>
        </n-grid-item>
    </n-grid>
</template>

<script setup lang="ts">
import { NFormItem, NGrid, NGridItem, NInput } from 'naive-ui';

const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
});

/**
 * 获取人员飞书 ID，兼容人员组件返回的不同字段名。
 * @param person 人员选择组件返回的人员对象
 * @returns 飞书用户 ID
 */
const getPersonLarkId = (person: any) => {
    return person?.larkUserId || person?.feishuUserId || person?.larkId || '';
};

/**
 * 申请人变化时同步审批申请人信息，并默认带出该人员第一个部门。
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
:deep(.myFormItem .n-form-item-label){
    width: 100px !important;
}
</style>
