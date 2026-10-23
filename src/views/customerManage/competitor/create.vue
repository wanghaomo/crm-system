<template>
    <WebPage
        showBack
        hideAddBtn
        contentPadding="0"
        show-back-confirm
        back-title="返回确认"
        back-content="是否确认返回？返回后编辑内容将不会被保存">
        <template #headerRight>
            <div class="header-btns">
                <n-button
                    class="save-btn"
                    :disabled="submitLoading || detailLoading"
                    :loading="saveLoading"
                    @click="handleSubmit(true)">保 存</n-button>
                <n-button
                    type="primary"
                    :disabled="saveLoading || detailLoading"
                    :loading="submitLoading"
                    @click="handleSubmit(false)">提 交</n-button>
            </div>
        </template>
        <template #content>
            <n-spin :show="detailLoading">
                <div class="form-body">
                    <h1 class="addTitle">{{ isEdit ? '编辑竞争对手' : '新增竞争对手' }}</h1>
                    <n-form
                        ref="formRef"
                        :model="formData"
                        :rules="formRules"
                        require-mark-placement="left"
                        label-placement="left"
                        label-align="right"
                        label-width="170px">
                        <n-grid :cols="2" :x-gap="24">
                            <n-grid-item>
                                <n-form-item label="企业名称" path="enterpriseName">
                                    <n-input
                                        v-model:value="formData.enterpriseName"
                                        placeholder="请输入企业名称"
                                        :disabled="isStorage"
                                        :maxlength="100"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="矿山名称" path="mineName">
                                    <n-input
                                        v-model:value="formData.mineName"
                                        placeholder="请输入矿山名称（唯一）"
                                        :disabled="isStorage"
                                        :maxlength="100"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="资源储存量（万吨）" path="resourceReserves">
                                    <n-input-number
                                        v-model:value="formData.resourceReserves"
                                        :precision="1"
                                        :min="0"
                                        :show-button="false"
                                        placeholder="请输入"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="设计开采能力（万吨/年）" path="designCapacity">
                                    <n-input-number
                                        v-model:value="formData.designCapacity"
                                        :precision="1"
                                        :min="0"
                                        :show-button="false"
                                        placeholder="请输入"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="矿山类型" path="mineType">
                                    <n-select
                                        v-model:value="formData.mineType"
                                        :options="mineTypeOptions"
                                        placeholder="请选择矿山类型" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="年产量（万吨）" path="yearOutput">
                                    <n-input-number
                                        v-model:value="formData.yearOutput"
                                        :precision="1"
                                        :min="0"
                                        :show-button="false"
                                        placeholder="请输入"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="联系人" path="contactPerson">
                                    <n-input
                                        v-model:value="formData.contactPerson"
                                        placeholder="请输入联系人"
                                        :maxlength="50"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="联系电话" path="contactPhone">
                                    <n-input
                                        v-model:value="formData.contactPhone"
                                        placeholder="请输入联系电话"
                                        :maxlength="20"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="矿石库存（万吨）" path="oreStock">
                                    <n-input-number
                                        v-model:value="formData.oreStock"
                                        :precision="1"
                                        :min="0"
                                        :show-button="false"
                                        placeholder="请输入"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="开工率（%）" path="operatingRate">
                                    <n-input-number
                                        v-model:value="formData.operatingRate"
                                        :precision="0"
                                        :min="0"
                                        :max="100"
                                        :show-button="false"
                                        placeholder="请输入"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="区域" path="region">
                                    <n-select
                                        v-model:value="formData.region"
                                        :options="regionSelectOptions"
                                        placeholder="请选择区域" />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="地址" path="addressRegion">
                                    <n-cascader
                                        v-model:value="formData.addressRegion"
                                        :options="regionCascaderOptions"
                                        check-strategy="child"
                                        show-path
                                        placeholder="请选择省/市/区"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="经度" path="longitude">
                                    <n-input-number
                                        v-model:value="formData.longitude"
                                        :precision="6"
                                        :min="-180"
                                        :max="180"
                                        :show-button="false"
                                        placeholder="请输入经度"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                            <n-grid-item>
                                <n-form-item label="纬度" path="latitude">
                                    <n-input-number
                                        v-model:value="formData.latitude"
                                        :precision="6"
                                        :min="-90"
                                        :max="90"
                                        :show-button="false"
                                        placeholder="请输入纬度"
                                        style="width: 100%"
                                        clearable />
                                </n-form-item>
                            </n-grid-item>
                        </n-grid>
                        <!-- 备注等大字段不进栅格，整行展示 -->
                        <n-form-item label="备注" path="remark">
                            <n-input
                                v-model:value="formData.remark"
                                type="textarea"
                                placeholder="客户其他补充说明（如重点关注旺季供货需求）"
                                :maxlength="255"
                                :autosize="{ minRows: 3, maxRows: 6 }"
                                show-count />
                        </n-form-item>
                    </n-form>
                </div>
            </n-spin>
        </template>
    </WebPage>
</template>

<script setup lang="ts" name="competitorCreate">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NSpin, NButton, NForm, NFormItem, NGrid, NGridItem, NInput, NInputNumber, NSelect, NCascader, useDialog, useMessage } from 'naive-ui';
import {
    createCompetitorBaseApi,
    updateCompetitorBaseApi,
    queryCompetitorBaseDetailApi,
} from '@/api/competitorBase';
import { buildRegionOptions } from '@/constants/regionData';

const route = useRoute();
const router = useRouter();
const dialog = useDialog();
const message = useMessage();

const formRef = ref<any>(null);
const detailLoading = ref(false);
const saveLoading = ref(false);
const submitLoading = ref(false);

const isEdit = computed(() => Boolean(route.query.id));
const formData = reactive<any>({
    id: '',
    status: '',
    enterpriseName: '',
    mineName: '',
    resourceReserves: null,
    designCapacity: null,
    mineType: '大型矿山',
    yearOutput: null,
    contactPerson: '',
    contactPhone: '',
    oreStock: 0, // 默认0，根据调研数据更新最新的
    operatingRate: 100, // 默认100，根据调研数据更新最新的
    region: '川内', // 默认第一个下拉
    addressRegion: null,
    detailAddress: '',
    longitude: null,
    latitude: null,
    remark: '',
});

// 已入库状态：不可修改企业名称、矿山名称
const isStorage = computed(() => formData.status === 'STORAGE');

// 矿山类型选项（枚举值在字典维护，demo 内置）
const mineTypeOptions = [
    { label: '大型矿山', value: '大型矿山' },
    { label: '中小型矿山', value: '中小型矿山' },
];

// 区域选项（枚举：川内、湖北等）
const regionSelectOptions = [
    { label: '川内', value: '川内' },
    { label: '湖北', value: '湖北' },
    { label: '其他', value: '其他' },
];

// 地址省市区级联数据
const regionCascaderOptions = buildRegionOptions();

const formRules = {
    enterpriseName: {
        required: true,
        trigger: ['blur', 'input'],
        validator: (_rule: any, value: any) => {
            if (!value || !String(value).trim()) return new Error('请输入企业名称');
            return true;
        },
    },
    mineName: {
        required: true,
        trigger: ['blur', 'input'],
        validator: (_rule: any, value: any) => {
            if (!value || !String(value).trim()) return new Error('请输入矿山名称');
            return true;
        },
    },
    resourceReserves: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入资源储存量');
            return true;
        },
    },
    designCapacity: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入设计开采能力');
            return true;
        },
    },
    mineType: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (!value) return new Error('请选择矿山类型');
            return true;
        },
    },
    yearOutput: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入年产量');
            return true;
        },
    },
    oreStock: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入矿石库存');
            return true;
        },
    },
    operatingRate: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入开工率');
            if (Number(value) < 0 || Number(value) > 100) return new Error('开工率需在 0-100 之间');
            return true;
        },
    },
    region: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (!value) return new Error('请选择区域');
            return true;
        },
    },
    addressRegion: {
        required: true,
        trigger: ['change'],
        validator: (_rule: any, value: any) => {
            if (!value) return new Error('请选择地址');
            return true;
        },
    },
    longitude: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入经度');
            return true;
        },
    },
    latitude: {
        required: true,
        trigger: ['blur', 'change'],
        validator: (_rule: any, value: any) => {
            if (value === null || value === undefined || value === '') return new Error('请输入纬度');
            return true;
        },
    },
};

/**
 * 加载竞争对手详情用于编辑回显。
 * @returns 无返回值
 */
const loadDetail = async () => {
    if (!route.query.id) return;
    detailLoading.value = true;
    try {
        const res: any = await queryCompetitorBaseDetailApi(Number(route.query.id));
        const data = res?.data;
        if (data) {
            Object.keys(formData).forEach((key) => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData[key] = data[key];
                }
            });
            formData.status = data.status || 'DRAFT';
        }
    } catch (error) {
        console.error('加载竞争对手详情失败:', error);
    } finally {
        detailLoading.value = false;
    }
};

/**
 * 保存（草稿）或提交（已入库）。
 * @param isSave 是否保存为草稿；false 表示提交入库
 * @returns 无返回值
 */
const handleSubmit = async (isSave: boolean) => {
    try {
        await formRef.value?.validate();
    } catch (error) {
        return;
    }
    if (isSave) {
        // 保存为草稿，无需二次确认
        await executeSubmit('DRAFT');
        return;
    }
    dialog.warning({
        title: '提交确认',
        content: '提交后竞争对手将更新为已入库状态，是否确认提交？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
            await executeSubmit('STORAGE');
        },
    });
};

/**
 * 执行保存/提交请求。
 * @param status 目标状态（DRAFT 草稿 / STORAGE 已入库）
 * @returns 无返回值
 */
const executeSubmit = async (status: string) => {
    const loading = status === 'DRAFT' ? saveLoading : submitLoading;
    try {
        loading.value = true;
        const payload = { ...formData, status };
        delete payload.researchRecordList;
        const res: any = route.query.id ? await updateCompetitorBaseApi(payload) : await createCompetitorBaseApi(payload);
        if (res?.code === 200) {
            message.success(status === 'DRAFT' ? '保存成功，已存为草稿' : '提交成功，已入库');
            router.back();
        }
    } catch (error) {
        console.error('提交竞争对手失败:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadDetail();
});
</script>

<style lang="less" scoped>
.header-btns {
    display: flex;
    gap: 12px;

    .save-btn {
        color: #2c65f2;
        border-color: #2c65f2;
    }
}

.form-body {
    height: 100%;
    overflow-y: auto;
    padding: 16px;

    .addTitle {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
    }

    :deep(.n-form-item-label) {
        font-weight: 400;
    }
}
</style>
