<template>
    <n-grid :cols="2" :x-gap="16" :y-gap="0">
        <n-grid-item>
            <n-form-item label="申请单位" path="applyUnit">
                <n-input :value="applyUnitLabel" disabled placeholder="自动匹配销售合同供方单位" />
            </n-form-item>
        </n-grid-item>

        <n-grid-item>
            <n-form-item label="客户名称" path="enterpriseName">
                <n-input v-model:value="formData.enterpriseName" disabled placeholder="自动匹配销售合同需方单位" />
            </n-form-item>
        </n-grid-item>

        <n-grid-item span="2">
            <n-form-item label="本次开票类型" path="invoiceType">
                <n-radio-group v-model:value="formData.invoiceType" name="invoiceType">
                    <n-space>
                        <n-radio
                            v-for="item in invoiceTypeOptions"
                            :key="item.value"
                            :value="item.value">
                            {{ item.label }}
                        </n-radio>
                    </n-space>
                </n-radio-group>
            </n-form-item>
        </n-grid-item>
        <n-grid-item span="2">
            <n-form-item label="开票信息" path="invoiceInformation">
                <n-input
                    type="textarea"
                    v-model:value="formData.invoiceInformation"
                    maxlength="500"
                    show-count
                    rows="5"
                    placeholder="请输入" />
            </n-form-item>
        </n-grid-item>
        <n-grid-item span="2">
            <n-form-item label="开票备注" path="invoiceRemark">
                <n-input
                    type="textarea"
                    v-model:value="formData.invoiceRemark"
                    maxlength="500"
                    show-count
                    rows="5"
                    placeholder="请输入" />
            </n-form-item>
        </n-grid-item>
    </n-grid>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { NInput, NRadioGroup, NRadio, NSpace, NFormItem, NGrid, NGridItem } from 'naive-ui';
import { useDictStore } from '@/store/commStore';
import { useRoute } from 'vue-router';
const { dictMap } = storeToRefs(useDictStore());
const route = useRoute();
const props = defineProps({
    formData: {
        type: Object,
        default: () => ({}),
    },
});
const SUPPLIER_UNIT_DICT = '供方单位';
const INVOICE_TYPE_DICT = '增值税开票类型';

/**
 * 将销售合同带出的供方单位编码转换为字典展示文案。
 * @param value 供方单位编码或名称
 * @returns 供方单位字典 label，未匹配时返回原值
 */
const getSupplierUnitLabel = (value: string) => {
    const options = dictMap.value?.[SUPPLIER_UNIT_DICT] || [];
    const option = options.find((item: any) => item.value === value || item.label === value);
    return option?.label || value || '';
};
const applyUnitLabel = computed(() => getSupplierUnitLabel(props.formData.applyUnit));
const invoiceTypeOptions = computed(() => dictMap.value?.[INVOICE_TYPE_DICT] || []);

/**
 * 新增结算单时默认选中第一个开票类型字典项。
 * @returns 无返回值
 */
const setDefaultInvoiceType = () => {
    if (route.query.id) return;
    if (props.formData.invoiceType !== null && props.formData.invoiceType !== undefined && props.formData.invoiceType !== '') return;
    props.formData.invoiceType = invoiceTypeOptions.value[0]?.value || null;
};

watch(
    invoiceTypeOptions,
    () => {
        setDefaultInvoiceType();
    },
    { immediate: true }
);
</script>

<style scoped>
</style>
