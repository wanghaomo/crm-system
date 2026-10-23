<template>
  <WebPage showBack hideAddBtn contentPadding="0" show-back-confirm back-title="返回确认" back-content="是否确认返回？返回后编辑内容将不会被保存">
    <template #headerRight>
      <MxButton border @click="handleSave" v-if="formData.status !== 'STORAGE'" :styleOption="{ color: 'var(--base-color)', 'border-color': 'var(--base-color)' }">
        保 存
      </MxButton>
      <MxButton type="success" @click="handleSubmit"> 提 交 </MxButton>
    </template>
    <template #content>
      <div class="customer-add-container">
        <n-spin :show="pageLoading" description="加载中...">
          <h1 class="addTitle">{{ pageTitle }}</h1>
          <n-form ref="formRef" :model="formData" :rules="rules" require-mark-placement="left" label-placement="left" label-align="right" label-width="110px">
            <!-- 基础信息 -->
            <div class="section">
              <div class="section-title" style="margin-bottom: 16px">
                <span class="title-line"></span>
                <span class="title-text">基础信息</span>
              </div>
              <n-grid :cols="2" :x-gap="24" :y-gap="0">
                <n-grid-item>
                  <n-form-item label="企业单位名称" path="customerName">
                    <n-input v-model:value="formData.customerName" placeholder="请输入" :disabled="isStorageDisabled" maxlength="30" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="客户类型" path="customerType">
                    <n-radio-group v-model:value="formData.customerType" :disabled="isStorageDisabled">
                      <n-space>
                        <n-radio value="CHEMICAL">化工企业</n-radio>
                        <n-radio value="TRADER">贸易商</n-radio>
                      </n-space>
                    </n-radio-group>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="是否合作客户" path="isCooperationCustomer">
                    <n-radio-group v-model:value="formData.isCooperationCustomer" :disabled="isStorageDisabled">
                      <n-space>
                        <n-radio value="YES">是</n-radio>
                        <n-radio value="NO">否</n-radio>
                      </n-space>
                    </n-radio-group>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item v-if="formData.customerType === 'TRADER'">
                  <n-form-item label="是否子公司贸易商" path="isSubsidiary">
                    <n-radio-group v-model:value="formData.isSubsidiary">
                      <n-space>
                        <n-radio :value="1">是</n-radio>
                        <n-radio :value="2">否</n-radio>
                      </n-space>
                    </n-radio-group>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="客户星级" path="starLevel">
                    <n-select v-model:value="formData.starLevel" :disabled="isStorageDisabled" :options="STAR_LEVEL_OPTIONS" placeholder="请选择" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="客户经理" path="manageCodes">
                    <MxPersonSelect multiple v-model:modelValue="formData.manageCodes" placeholder="请选择客户经理" @changeEvt="handleManagerChange" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="地址" path="addressRegion">
                    <n-cascader
                      v-model:value="formData.addressRegion"
                      :options="regionOptions"
                      check-strategy="child"
                      show-path
                      placeholder="请选择省/市/区"
                      clearable />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="详细地址" path="detailAddress">
                    <n-input v-model:value="formData.detailAddress" placeholder="请输入详细地址" maxlength="100" clearable />
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
                <n-grid-item v-if="formData.customerType === 'CHEMICAL'">
                  <n-form-item label="仓储能力(万吨)" path="storageCapacity">
                    <n-input v-model:value="formData.storageCapacity" placeholder="请输入" :allowInput="onlyAllowNumberWithLimit" maxlength="15" clearable />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item>
                  <n-form-item label="合作开始时间">
                    <n-date-picker v-model:formatted-value="formData.cooperationStartDate" type="date" value-format="yyyy-MM-dd" placeholder="请选择" style="width: 100%" clearable />
                  </n-form-item>
                </n-grid-item>
                <!-- 合作状态  仅仅编辑并且为已入库状态时才显示 -->
                <n-grid-item v-if="isStorageDisabled">
                  <n-form-item label="合作状态" path="cooperationStatus">
                    <n-select v-model:value="formData.cooperationStatus" :options="cooperationStatusOptions" placeholder="请选择" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="2">
                  <n-form-item label="客户风险信息" path="riskInfo">
                    <div class="risk-info-box">
                      <MxEditor
                        :autoFocus="false"
                        v-model="formData.riskInfo"
                        minHeight="220px"
                        :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                      <!-- <n-input v-model:value="formData.riskInfo" type="textarea" :rows="4" placeholder="请输入" /> -->
                    </div>
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="2">
                  <n-form-item label="合作流程说明" path="cooperationProcessExplanation">
                    <MxEditor
                      :autoFocus="false"
                      v-model="formData.cooperationProcessExplanation"
                      minHeight="220px"
                      :upload-config="{ image: { enabled: false }, video: { enabled: false }, file: { enabled: false } }" />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="2">
                  <n-form-item label="重要合同条件" path="importantContractCondition">
                    <!-- <MxEditor v-model="formData.importantContractCondition" min-height="220px" :upload-config="{
                                            image: {
                                                enabled: true,
                                                maxFileSize: 10 * 1024 * 1024,
                                                maxNumberOfFiles: 10,
                                                allowedFileTypes: ['image/*'],
                                            },
                                        }" /> -->

                    <n-input v-model:value="formData.importantContractCondition" type="textarea" :rows="3" placeholder="请输入" maxlength="500" show-count />
                  </n-form-item>
                </n-grid-item>
                <n-grid-item :span="2">
                  <n-form-item label="备注" path="remark">
                    <n-input v-model:value="formData.remark" type="textarea" :rows="3" placeholder="请输入" maxlength="500" show-count />
                  </n-form-item>
                </n-grid-item>
              </n-grid>
            </div>

            <!-- 化工厂/贸易商信息 -->
            <div class="section">
              <div class="section-header">
                <div class="section-title">
                  <span class="title-line"></span>
                  <span class="title-text">{{
                    formData.customerType === "CHEMICAL" ? "化工厂企业信息" : "贸易商信息"
                  }}</span>
                </div>
                <MxButton type="default" size="small" @click="addFactoryRow" color="#2C65F2" border>
                  <template #leftIcon>
                    <n-icon>
                      <AddOutline />
                    </n-icon>
                  </template>
                  新增
                </MxButton>
              </div>
              <n-data-table :columns="factoryTableConfig.columns" :data="detailList" :pagination="false" size="small" bordered :single-line="false" :scroll-x="factoryScrollX" />
            </div>

            <!-- 联系人 -->
            <div class="section">
              <div class="section-header">
                <div class="section-title">
                  <span class="title-line"></span>
                  <span class="title-text">联系人</span>
                </div>
                <MxButton type="default" size="small" @click="addContactRow" color="#2C65F2" border>
                  <template #leftIcon>
                    <n-icon>
                      <AddOutline />
                    </n-icon>
                  </template>
                  新增
                </MxButton>
              </div>
              <n-data-table :columns="contactTableConfig.columns" :data="contactList" :pagination="false" size="small" bordered :single-line="false" :scroll-x="contactScrollX" />
            </div>

            <!-- 客户评估 -->
            <div
              v-if="formData.customerType === 'CHEMICAL' && formData.isCooperationCustomer !== 'NO'"
              class="section customer-evaluation-section">
              <div class="section-title evaluation-section-title">
                <span class="title-line"></span>
                <span class="title-text">客户评估</span>
              </div>
              <div class="evaluation-table">
                <div class="evaluation-row evaluation-header">
                  <div class="evaluation-cell evaluation-item-cell">
                    <span class="required-mark">*</span>
                    <span>评估项</span>
                  </div>
                  <div class="evaluation-cell">
                    <span class="required-mark">*</span>
                    <span>选项</span>
                  </div>
                </div>
                <div
                  v-for="(item, index) in CUSTOMER_EVALUATION_CONFIG"
                  :key="item.indicatorCode"
                  class="evaluation-row">
                  <div class="evaluation-cell evaluation-item-cell">
                    <span>{{ item.indicatorName }}</span>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-icon class="evaluation-tip-icon">
                          <InformationCircleOutline />
                        </n-icon>
                      </template>
                      {{ item.description }}
                    </n-tooltip>
                  </div>
                  <div class="evaluation-cell evaluation-option-cell">
                    <n-radio-group v-model:value="formData.evaluationDetailList[index].selectedOption">
                      <n-space :size="20" wrap>
                        <n-radio
                          v-for="option in item.options"
                          :key="option.value"
                          :value="option.value">
                          {{ option.label }}
                        </n-radio>
                      </n-space>
                    </n-radio-group>
                  </div>
                </div>
              </div>
              <n-form-item
                class="evaluation-score-form-item"
                label="客户评估总分"
                path="baseScore">
                <n-input-number
                  v-model:value="formData.baseScore"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :show-button="false"
                  placeholder="请输入"
                  style="width: 100%" />
              </n-form-item>
            </div>
          </n-form>
        </n-spin>
      </div>
    </template>
  </WebPage>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, watch, computed, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  NDataTable,
  NInput,
  NSelect,
  NRadio,
  NRadioGroup,
  NSpace,
  NIcon,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NSpin,
  NDatePicker,
  NInputNumber,
  NTooltip,
  NCascader,
} from "naive-ui";

import { AddOutline, InformationCircleOutline } from "@vicons/ionicons5";
import { getDictMapApi } from "@/api/comm";
import {
  createCustomerBaseApi,
  updateCustomerBaseApi,
  getCustomerBaseApi,
} from "@/api/customerManage";
import type { CustomerBaseCreateDTO } from "@/types/customerManage";
import enumCfg from "@/config/enum.cfg";
import { STAR_LEVEL_OPTIONS } from "@/config/customer";
import { buildRegionOptions } from "@/constants/regionData";
import {
  CUSTOMER_EVALUATION_CONFIG,
  CUSTOMER_EVALUATION_FIELD_MAP,
  createEvaluationDetailList,
} from "../customerEvaluation";
const router = useRouter();
const route = useRoute();

// ========== 页面模式判断（新增/编辑） ==========
const customerId = ref<string>(""); // 编辑时的客户ID
const isEdit = computed(() => !!customerId.value); // 有id则为编辑模式
const pageTitle = computed(() => (isEdit.value ? "编辑客户" : "新增客户"));

// 已入库的客户不可修改企业名称和客户类型
const isStorageDisabled = computed(() => isEdit.value && formData.status === "STORAGE");

// 客户经理选择变更：拿到全字段对象数组
const handleManagerChange = (options: any) => {
  // multiple 模式下 options 为数组，单选时为对象
  const arr = Array.isArray(options) ? options : options ? [options] : [];
  formData.manager = arr.map((item: any) => ({
    username: item.username,
    code: item.code,
    larkUserId: item.larkUserId,
  }));
  console.log("[客户经理]选中完整对象:", formData.manager);
};

// ========== 表格数据（使用 ref 以便触发更新） ==========
const detailList = ref<any[]>([]); // 化工厂/贸易商信息
const contactList = ref<any[]>([]); // 联系人信息

// ========== 化工厂/贸易商信息表格整体验证 ==========
const factoryRequiredFields: Record<string, string> = {
  coreProduct: "核心产品",
  factoryAddress: "厂区地址",
  capacity: "产能(万吨/年)",
  oreDemand: "矿石需求(万吨/年)",
};

const traderRequiredFields: Record<string, string> = {
  coreProduct: "核心产品",
  factoryAddress: "厂区地址",
  tradeScale: "贸易规模(万吨/年)",
};

const validateFactoryTable = (): string | null => {
  const isChemical = formData.customerType === "CHEMICAL";
  const tableName = isChemical ? "化工厂企业信息" : "贸易商信息";
  const requiredFields = isChemical ? factoryRequiredFields : traderRequiredFields;

  if (!detailList.value || detailList.value.length === 0) {
    return `【${tableName}】请至少添加一条数据`;
  }
  for (let i = 0; i < detailList.value.length; i++) {
    const row = detailList.value[i];
    for (const [field, label] of Object.entries(requiredFields)) {
      const val = row[field];
      if (val === "" || val === null || val === undefined) {
        return `【${tableName}】第${i + 1}行「${label}」未填写，不能为空`;
      }
    }
  }
  return null;
};

// ========== 联系人表格整体验证 ==========
const contactRequiredFields: Record<string, string> = {
  contactName: "姓名",
  position: "职务",
  // phone: '联系方式',
};

const validateContactTable = (): string | null => {
  if (!contactList.value || contactList.value.length === 0) {
    return "【联系人】请至少添加一条数据";
  }
  for (let i = 0; i < contactList.value.length; i++) {
    const row = contactList.value[i];
    for (const [field, label] of Object.entries(contactRequiredFields)) {
      const val = row[field];
      if (val === "" || val === null || val === undefined) {
        return `【联系人】第${i + 1}行「${label}」未填写，不能为空`;
      }
    }
  }
  return null;
};

/**
 * 校验客户评估项是否全部选择。
 * @returns 首个校验错误文案，校验通过返回 null
 */
const validateCustomerEvaluation = (): string | null => {
  if (formData.customerType === "TRADER") return null;
  // 非合作客户不需要填写客户评估信息
  if (formData.isCooperationCustomer === "NO") return null;
  for (let index = 0; index < CUSTOMER_EVALUATION_CONFIG.length; index += 1) {
    const config = CUSTOMER_EVALUATION_CONFIG[index];
    const detail = formData.evaluationDetailList[index];
    if (!detail?.selectedOption) {
      return `【客户评估】请选择「${config.indicatorName}」`;
    }
  }
  return null;
};

// ========== 表单数据 ==========
const formData = reactive({
  // 基础信息
  id: undefined as number | undefined, // 编辑时的客户ID
  customerName: "", // 企业名称
  customerType: "CHEMICAL" as "CHEMICAL" | "TRADER", // 客户类型
  isSubsidiary: 2 as 1 | 2, // 是否子公司贸易商，默认否
  starLevel: "ONE" as string, // 客户星级，默认一级客户
  cooperationStatus: null as string | null, // 合作状态
  manager: [] as any[], // 客户经理对象数组
  manageCodes: [] as string[], // 客户经理code数组
  addressRegion: null as string | null, // 地址（省市区级联叶节点全路径，如 四川省/乐山市/马边彝族自治县）
  detailAddress: "", // 详细地址
  longitude: null as number | null, // 经度
  latitude: null as number | null, // 纬度
  isCooperationCustomer: "YES" as "YES" | "NO", // 是否合作客户：非合作客户不填评估、不进内部业务流程下拉
  riskInfo: "", // 风控信息
  cooperationProcessExplanation: "", // 合作流程说明
  importantContractCondition: "", // 重要合同条件
  remark: "", // 备注
  storageCapacity: "" as string, // 仓储能力(万吨) - 仅化工企业
  status: "DRAFT" as "DRAFT" | "STORAGE", // 单据状态
  cooperationStartDate: null as string | null, // 合作开始时间（yyyy-MM-dd）
  evaluationDetailList: createEvaluationDetailList(), // 客户评估明细
  baseScore: 0 as number | null, // 客户评估总分
});

const cooperationStatusOptions = [
  { label: "正常", value: "NORMAL" },
  { label: "暂停", value: "SUSPENDED" },
  { label: "终止", value: "TERMINATED" },
];

// 省市区级联静态数据
const regionOptions = buildRegionOptions();
const coreProductOptions = ref<{ label: string; value: string }[]>([]);

// 数字输入校验：整数不超过12位，小数不超过2位
let _numberLimitTipTimer: any = null;
const onlyAllowNumberWithLimit = (val: string) => {
  if (!val) return true;

  // 只允许数字和小数点
  if (!/^\d*\.?\d*$/.test(val)) {
    return false;
  }

  // 检查整数位不超过12位
  const parts = val.split(".");
  if (parts[0].length > 12) {
    if (!_numberLimitTipTimer) {
      window.$message?.warning("整数位最多12位");
      _numberLimitTipTimer = setTimeout(() => {
        _numberLimitTipTimer = null;
      }, 1500);
    }
    return false;
  }

  // 检查小数位不超过2位
  if (parts.length === 2 && parts[1].length > 2) {
    if (!_numberLimitTipTimer) {
      window.$message?.warning("小数位最多2位");
      _numberLimitTipTimer = setTimeout(() => {
        _numberLimitTipTimer = null;
      }, 1500);
    }
    return false;
  }

  return true;
};

// ========== 百分比输入校验（0-100，最多两位小数） ==========
let _percentInputTipTimer: any = null;
const onlyAllowPercent = (val: string) => {
  if (!val) return true;

  // 先检查是否为有效数字格式（只允许数字和小数点）
  if (!/^\d*\.?\d*$/.test(val)) {
    return false;
  }

  // 检查小数位数（最多两位）
  if (!/^\d*\.?\d{0,2}$/.test(val)) {
    if (!_percentInputTipTimer) {
      window.$message?.warning("最多保留两位小数");
      _percentInputTipTimer = setTimeout(() => {
        _percentInputTipTimer = null;
      }, 1500);
    }
    return false;
  }

  // 检查数值范围（0-100）
  const num = parseFloat(val);
  if (num < 0 || num > 100) {
    if (!_percentInputTipTimer) {
      window.$message?.warning("输入范围0-100");
      _percentInputTipTimer = setTimeout(() => {
        _percentInputTipTimer = null;
      }, 1500);
    }
    return false;
  }

  return true;
};

// ========== 化工厂/贸易商 公共列 ==========
const commonColumns = [
  {
    title: "序号",
    key: "index",
    width: 40,
    render: (_row: any, index: number) => index + 1,
  },
  {
    title() {
      return h(
        NSpace,
        { align: "center", size: 8 },
        {
          default: () => [
            h("span", { style: { color: "#F46B6C" } }, "*"),
            h("span", null, "核心产品"),
          ],
        }
      );
    },
    key: "coreProduct",
    width: 120,
    render: (row: any, index: number) => {
      return h(NSelect, {
        value: row.coreProduct,
        options: coreProductOptions.value,
        placeholder: "请选择",
        style: { width: "100%" },
        clearable: true,
        onUpdateValue: (val: string) => {
          detailList.value[index].coreProduct = val;
        },
      });
    },
  },
  {
    title() {
      return h(
        NSpace,
        { align: "center", size: 8 },
        {
          default: () => [
            h("span", { style: { color: "#F46B6C" } }, "*"),
            h("span", null, "厂区地址"),
          ],
        }
      );
    },
    key: "factoryAddress",
    width: 150,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.factoryAddress,
        placeholder: "请输入",
        maxlength: "200",
        clearable: true,
        style: { width: "100%" },
        onUpdateValue: (val: string) => {
          detailList.value[index].factoryAddress = val;
        },
      });
    },
  },
];

// 化工企业专属列
const chemicalColumns = [
  {
    title() {
      return h(
        NSpace,
        { align: "center", size: 8 },
        {
          default: () => [
            h("span", { style: { color: "#F46B6C" } }, "*"),
            h("span", null, "产能(万吨/年)"),
          ],
        }
      );
    },
    key: "capacity",
    width: 120,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.capacity,
        placeholder: "请输入",
        allowInput: onlyAllowNumberWithLimit,
        style: { width: "100%" },
        maxlength: "15",
        clearable: true,
        onUpdateValue: (val: string) => {
          detailList.value[index].capacity = val;
        },
      });
    },
  },
  {
    title() {
      return h(
        NSpace,
        { align: "center", size: 8 },
        {
          default: () => [
            h("span", { style: { color: "#F46B6C" } }, "*"),
            h("span", null, "矿石需求(万吨/年)"),
          ],
        }
      );
    },
    key: "oreDemand",
    width: 160,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.oreDemand,
        placeholder: "请输入",
        allowInput: onlyAllowNumberWithLimit,
        maxlength: "15",
        clearable: true,
        style: { width: "100%" },
        onUpdateValue: (val: string) => {
          detailList.value[index].oreDemand = val;
        },
      });
    },
  },
  {
    title: "洗选能力(万吨/日)",
    key: "washingCapacity",
    width: 120,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.washingCapacity,
        placeholder: "请输入",
        allowInput: onlyAllowNumberWithLimit,
        maxlength: "15",
        clearable: true,
        style: { width: "100%" },
        onUpdateValue: (val: string) => {
          detailList.value[index].washingCapacity = val;
        },
      });
    },
  },
  {
    title: "开工率(%)",
    key: "operatingRate",
    width: 120,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.operatingRate,
        placeholder: "请输入",
        allowInput: onlyAllowPercent,
        style: { width: "100%" },
        clearable: true,
        onUpdateValue: (val: string) => {
          detailList.value[index].operatingRate = val;
        },
      });
    },
  },
];

// 贸易商专属列
const traderColumns = [
  {
    title() {
      return h(
        NSpace,
        { align: "center", size: 8 },
        {
          default: () => [
            h("span", { style: { color: "#F46B6C" } }, "*"),
            h("span", null, "贸易规模(万吨/年)"),
          ],
        }
      );
    },
    key: "tradeScale",
    width: 120,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.tradeScale,
        placeholder: "请输入",
        allowInput: onlyAllowNumberWithLimit,
        style: { width: "100%" },
        maxlength: "15",
        clearable: true,
        onUpdateValue: (val: string) => {
          detailList.value[index].tradeScale = val;
        },
      });
    },
  },
  {
    title: "可用资金(万元)",
    key: "availableFunds",
    width: 120,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.availableFunds,
        placeholder: "请输入",
        allowInput: onlyAllowNumberWithLimit,
        maxlength: "15",
        clearable: true,
        style: { width: "100%" },
        onUpdateValue: (val: string) => {
          detailList.value[index].availableFunds = val;
        },
      });
    },
  },
  {
    title: "下游供应企业",
    key: "downstreamEnterprises",
    width: 150,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.downstreamEnterprises,
        placeholder: "请输入",
        style: { width: "100%" },
        maxlength: 50,
        clearable: true,
        onUpdateValue: (val: string) => {
          detailList.value[index].downstreamEnterprises = val;
        },
      });
    },
  },
  {
    title: "物流合作渠道",
    key: "logisticsChannels",
    width: 130,
    render: (row: any, index: number) => {
      return h(NInput, {
        value: row.logisticsChannels,
        placeholder: "请输入",
        maxlength: 50,
        clearable: true,
        style: { width: "100%" },
        onUpdateValue: (val: string) => {
          detailList.value[index].logisticsChannels = val;
        },
      });
    },
  },
];

// 操作列
const actionColumn = {
  title: "操作",
  key: "action",
  width: 60,
  align: "center",
  fixed: "right",
  render: (_row: any, index: number) => {
    return h(
      "span",
      {
        style: { color: "#E34242", cursor: "pointer" },
        onClick: () => deleteFactoryRow(index),
      },
      "删除"
    );
  },
};

// 动态表格配置
const factoryTableConfig = computed(() => ({
  columns: [
    ...commonColumns,
    ...(formData.customerType === "CHEMICAL" ? chemicalColumns : traderColumns),
    actionColumn,
  ],
}));

// 化工厂/贸易商表格横向滚动宽度（用于触发固定列阴影）
const factoryScrollX = computed(() => {
  return factoryTableConfig.value.columns.reduce(
    (sum: number, col: any) => sum + (col.width || 0),
    0
  );
});

// 联系人表格横向滚动宽度（用于触发固定列阴影）
const contactScrollX = computed(() => {
  return contactTableConfig.value.columns.reduce(
    (sum: number, col: any) => sum + (col.width || 0),
    0
  );
});

// 标记是否正在回显数据（编辑模式）
const isEchoing = ref(false);

// 监听客户类型变化，清空表格数据
watch(
  () => formData.customerType,
  (newVal, oldVal) => {
    if (newVal !== oldVal && !isEchoing.value) {
      detailList.value = [];
      initDefaultData();
    }
  }
);

// 添加信息行
const addFactoryRow = () => {
  if (formData.customerType === "CHEMICAL") {
    detailList.value.push({
      coreProduct: "",
      factoryAddress: "",
      capacity: "",
      oreDemand: "",
      washingCapacity: "",
      operatingRate: "",
    });
  } else {
    detailList.value.push({
      coreProduct: "",
      factoryAddress: "",
      tradeScale: "",
      availableFunds: "",
      downstreamEnterprises: "",
      logisticsChannels: "",
    });
  }
  console.log("添加信息行", detailList.value);
};

// 删除工厂信息行
const deleteFactoryRow = (index: number) => {
  if (detailList.value.length <= 1) {
    const tableName =
      formData.customerType === "CHEMICAL" ? "化工厂企业信息" : "贸易商信息";
    window.$message.warning(`【${tableName}】至少保留一条数据`);
    return;
  }
  detailList.value.splice(index, 1);
};

// ========== 联系人表格 ==========
const contactTableConfig = ref<any>({
  columns: [
    {
      title: "序号",
      key: "index",
      width: 50,
      render: (_row: any, index: number) => index + 1,
    },
    {
      title() {
        return h(
          NSpace,
          { align: "center", size: 8 },
          {
            default: () => [
              h("span", { style: { color: "#F46B6C" } }, "*"),
              h("span", null, "姓名"),
            ],
          }
        );
      },
      key: "contactName",
      width: 150,
      render: (row: any, index: number) => {
        return h(NInput, {
          value: row.contactName,
          placeholder: "请输入",
          style: { width: "100%" },
          maxlength: 20,
          onUpdateValue: (val: string) => {
            contactList.value[index].contactName = val;
          },
        });
      },
    },
    {
      title() {
        return h(
          NSpace,
          { align: "center", size: 8 },
          {
            default: () => [
              h("span", { style: { color: "#F46B6C" } }, "*"),
              h("span", null, "职务"),
            ],
          }
        );
      },
      key: "position",
      width: 150,
      render: (row: any, index: number) => {
        return h(NInput, {
          value: row.position,
          placeholder: "请输入",
          maxlength: 20,
          style: { width: "100%" },
          onUpdateValue: (val: string) => {
            contactList.value[index].position = val;
          },
        });
      },
    },
    {
      title() {
        return h(
          NSpace,
          { align: "center", size: 8 },
          {
            default: () => h("span", null, "联系方式"),
          }
        );
      },
      key: "phone",
      width: 150,
      render: (row: any, index: number) => {
        return h(NInput, {
          value: row.phone,
          placeholder: "请输入",
          style: { width: "100%" },
          maxlength: 12,
          onUpdateValue: (val: string) => {
            contactList.value[index].phone = val;
          },
        });
      },
    },
    {
      title: "负责内容",
      key: "responsibility",
      width: 200,
      render: (row: any, index: number) => {
        return h(NInput, {
          value: row.responsibility,
          placeholder: "请输入",
          maxlength: 200,
          style: { width: "100%" },
          onUpdateValue: (val: string) => {
            contactList.value[index].responsibility = val;
          },
        });
      },
    },

    {
      title: "生日",
      key: "birthday",
      width: 160,
      render: (row: any, index: number) => {
        return h(NDatePicker, {
          formattedValue: row.birthday,
          type: "date",
          valueFormat: "yyyy-MM-dd",
          placeholder: "请选择",
          size: "small",
          style: { width: "100%", height: "34px" },
          clearable: true,
          class: "birthday-picker",
          onUpdateFormattedValue: (val: string | null) => {
            contactList.value[index].birthday = val;
          },
        });
      },
    },
    {
      title: "备注",
      key: "remark",
      width: 200,
      render: (row: any, index: number) => {
        return h(NInput, {
          value: row.remark,
          placeholder: "请输入",
          style: { width: "100%" },
          maxlength: 200,
          type: "textarea",
          rows: 1,
          onUpdateValue: (val: string) => {
            contactList.value[index].remark = val;
          },
        });
      },
    },
    {
      title: "操作",
      key: "action",
      width: 60,
      align: "center",
      fixed: "right",
      render: (_row: any, index: number) => {
        return h(
          "span",
          {
            style: { color: "#E34242", cursor: "pointer" },
            onClick: () => deleteContactRow(index),
          },
          "删除"
        );
      },
    },
  ],
});

const addContactRow = () => {
  contactList.value.push({
    contactName: "",
    position: "",
    phone: "",
    responsibility: "",
    birthday: null,
    remark: "",
  });
};

const deleteContactRow = (index: number) => {
  if (contactList.value.length <= 1) {
    window.$message.warning("【联系人】至少保留一条数据");
    return;
  }
  contactList.value.splice(index, 1);
};

// ========== 组装提交数据 ==========
const buildSubmitData = (status: "DRAFT" | "STORAGE"): CustomerBaseCreateDTO => {
  const baseInfo: any = {
    ...formData,
    status,
  };
  delete baseInfo.manageCodes; // 移除 v-model 辅助字段，提交时使用 manager 数组
  if (isEdit.value && status === "DRAFT") {
    baseInfo.cooperationStatus = null; // 草稿状态不提交合作状态
  } else if (isEdit.value && status === "STORAGE") {
    // 编辑且提交时：
    // - 若当前回显状态为草稿（用户从草稿提交为已入库），则默认合作状态为 NORMAL
    // - 若当前回显状态已是已入库，则保持原有合作状态不变（不覆盖用户选择）
    if (formData.status === "DRAFT") {
      baseInfo.cooperationStatus = "NORMAL";
    } else {
      // 保持回显的合作状态（可能为 NORMAL/SUSPENDED/TERMINATED 或者已被用户修改）
      baseInfo.cooperationStatus = formData.cooperationStatus ?? undefined;
    }
  } else if (!isEdit.value && status === "STORAGE") {
    baseInfo.cooperationStatus = "NORMAL"; // 新增已入库状态默认正常
  } else if (!isEdit.value && status === "DRAFT") {
    baseInfo.cooperationStatus = null; // 新增草稿状态不提交合作状态
  }

  const getRequiredNumberText = (value: any) => {
    if (value === null || value === undefined || value === "") return "0";
    return String(value);
  };
  const getOptionalNumberText = (value: any) => {
    if (value === null || value === undefined || value === "") return undefined;
    return String(value);
  };

  // 根据 customerType 分别组装 chemicalList 或 traderList
  const isChemical = formData.customerType === "CHEMICAL";

  // 是否子公司贸易商仅适用于化工企业，贸易商不提交该字段。
  if (formData.customerType === "TRADER") {
    baseInfo.isSubsidiary = formData.isSubsidiary;
  } else {
    delete baseInfo.isSubsidiary;
  }

  // 仓储能力仅化工企业提交
  baseInfo.storageCapacity = isChemical
    ? getOptionalNumberText(formData.storageCapacity)
    : undefined;

  const chemicalList = isChemical
    ? detailList.value.map((item: any) => ({
      ...(item.id ? { id: item.id } : {}),
      coreProduct: item.coreProduct,
      factoryAddress: item.factoryAddress,
      capacity: getRequiredNumberText(item.capacity),
      oreDemand: getRequiredNumberText(item.oreDemand),
      washingCapacity: getOptionalNumberText(item.washingCapacity),
      operatingRate: getOptionalNumberText(item.operatingRate),
    }))
    : undefined;

  const traderList = !isChemical
    ? detailList.value.map((item: any) => ({
      ...(item.id ? { id: item.id } : {}),
      coreProduct: item.coreProduct,
      factoryAddress: item.factoryAddress,
      tradeScale: getRequiredNumberText(item.tradeScale),
      availableFunds: getOptionalNumberText(item.availableFunds),
      downstreamEnterprises: item.downstreamEnterprises || undefined,
      logisticsChannels: item.logisticsChannels || undefined,
      purchasePreference: item.purchasePreference || undefined,
    }))
    : undefined;

  const contactListData = contactList.value.map((item: any) => ({
    ...(item.id ? { id: item.id } : {}),
    contactName: item.contactName,
    position: item.position || undefined,
    phone: item.phone,
    responsibility: item.responsibility || undefined,
    birthday: item.birthday || undefined,
    remark: item.remark || undefined,
  }));

  // 非合作客户不提交客户评估信息与总分
  const skipEvaluation = formData.isCooperationCustomer === "NO";
  const evaluationData = isChemical && !skipEvaluation
    ? CUSTOMER_EVALUATION_CONFIG.reduce<Record<string, string>>(
      (result, config, index) => {
        const field = CUSTOMER_EVALUATION_FIELD_MAP[config.indicatorCode];
        result[field] = formData.evaluationDetailList[index]?.selectedOption || "";
        return result;
      },
      {}
    )
    : {};
  delete baseInfo.evaluationDetailList;
  delete baseInfo.evaluationScore;

  return {
    ...baseInfo,
    chemicalList,
    traderList,
    contactList: contactListData,
    ...evaluationData,
    baseScore: isChemical && !skipEvaluation ? Number(formData.baseScore) : undefined,
  };
};

// ========== 保存/提交统一逻辑 ==========
const handleSubmitData = async (status: "DRAFT" | "STORAGE") => {
  const submitData = buildSubmitData(status);
  console.log("提交数据", submitData);
  // return
  try {
    let res: any;
    if (isEdit.value) {
      submitData.id = Number(customerId.value);
      res = await updateCustomerBaseApi(submitData);
    } else {
      res = await createCustomerBaseApi(submitData);
    }
    if (res.code === 200) {
      window.$message.success(status === "DRAFT" ? "保存成功" : "提交成功");
      setTimeout(() => {
        router.back();
      }, 1000);
    }
  } catch (e) {
    console.error("提交失败", e);
  }
};

const saveForm = () => {
  handleSubmitData("DRAFT");
};

const submitForm = () => {
  handleSubmitData("STORAGE");
};

const initDefaultData = () => {
  if (detailList.value.length === 0) {
    if (formData.customerType === "CHEMICAL") {
      detailList.value.push({
        coreProduct: "",
        factoryAddress: "",
        capacity: "",
        oreDemand: "",
        washingCapacity: "",
        operatingRate: "",
      });
    } else {
      detailList.value.push({
        coreProduct: "",
        factoryAddress: "",
        tradeScale: "",
        availableFunds: "",
        downstreamEnterprises: "",
        logisticsChannels: "",
      });
    }
  }
  if (contactList.value.length === 0) {
    contactList.value.push({
      contactName: "",
      position: "",
      phone: "",
      responsibility: "",
      birthday: null,
      remark: "",
    });
  }
};

const formRef = ref<any>(null);

// 表单验证规则
const rules = {
  customerName: { required: true, message: "请输入企业名称", trigger: ["blur", "input"], saveOnly: true },
  customerType: { required: true, message: "请选择客户类型", trigger: ["change"] },
  starLevel: { required: true, message: "请选择客户星级", trigger: ["change"], saveOnly: true },
  // manageCodes: { required: true, message: '请选择客户经理', trigger: ['change'], type: 'array' as const },
  // region: { required: true, message: '请选择区域', trigger: ['change'] },
  // 合作状态仅在编辑且当前为已入库时可见并必填。
  // 因为页面会基于当前回显的状态控制字段显示，所以校验也应以当前回显状态为准。
  cooperationStatus: {
    validator: (_rule: any, value: any) => {
      if (isStorageDisabled.value) {
        if (value === null || value === undefined || value === "") {
          return new Error("请选择合作状态");
        }
      }
      return true;
    },
    trigger: ["change"],
  },
  addressRegion: {
    required: true,
    validator: (_rule: any, value: any) => {
      if (!value) return new Error("请选择地址");
      return true;
    },
    trigger: ["change"],
  },
  longitude: {
    required: true,
    validator: (_rule: any, value: any) => {
      if (value === null || value === undefined || value === "") return new Error("请输入经度");
      return true;
    },
    trigger: ["blur", "change"],
  },
  latitude: {
    required: true,
    validator: (_rule: any, value: any) => {
      if (value === null || value === undefined || value === "") return new Error("请输入纬度");
      return true;
    },
    trigger: ["blur", "change"],
  },
  baseScore: {
    validator: (_rule: any, value: any) => {
      if (formData.customerType === "TRADER") return true;
      // 非合作客户不填评估信息，总分一并跳过
      if (formData.isCooperationCustomer === "NO") return true;
      if (value === null || value === undefined || value === "") {
        return new Error("请输入客户评估总分");
      }
      if (Number(value) < 0 || Number(value) > 100) {
        return new Error("客户评估总分必须在0-100之间");
      }
      return true;
    },
    trigger: ["blur", "change"],
  },
};

// 提交验证：基础表单 + 化工厂表格 + 联系人表格
const validateAll = (onSuccess: () => void) => {
  formRef.value?.validate((errors: any) => {
    if (errors) {
      console.log("表单验证失败", errors);
      return;
    }
    // 化工厂/贸易商表格验证
    const factoryErr = validateFactoryTable();
    if (factoryErr) {
      window.$message.warning(factoryErr);
      return;
    }
    // 联系人表格验证
    const contactErr = validateContactTable();
    if (contactErr) {
      window.$message.warning(contactErr);
      return;
    }
    const evaluationErr = validateCustomerEvaluation();
    if (evaluationErr) {
      window.$message.warning(evaluationErr);
      return;
    }
    onSuccess();
  });
};

// 保存验证：仅校验企业单位名称和客户星级
const validateSave = (onSuccess: () => void) => {
  formRef.value?.validate(
    (errors: any) => {
      if (errors) {
        console.log("保存表单验证失败", errors);
        return;
      }
      onSuccess();
    },
    (rule: any) => rule.saveOnly === true,
  );
};

// 保存按钮 - 仅校验企业单位名称和客户星级
const handleSave = () => {
  validateSave(saveForm);
};

// 提交按钮 - 触发验证
const handleSubmit = () => {
  validateAll(submitForm);
};
// ========== 编辑模式：加载客户详情数据 ==========
const pageLoading = ref(false);

/**
 * 加载客户详情数据（编辑模式）
 * 后期对接接口时，替换此方法内的请求逻辑即可
 * @param id 客户ID
 */
const loadDetailData = async (id: string) => {
  if (!id) return;
  pageLoading.value = true;
  try {
    const res = await getCustomerBaseApi(Number(id));
    if (res.code === 200 && res.data) {
      const data = res.data;

      // 回显基础信息（标记正在回显，避免 watch 清空表格数据）
      isEchoing.value = true;
      Object.assign(formData, {
        customerName: data.customerName || "",
        customerType: data.customerType || "CHEMICAL",
        isSubsidiary: data.isSubsidiary ?? 2,
        starLevel: data.starLevel || "ONE",
        cooperationStatus: data.cooperationStatus || null,
        manager: data.manager || [],
        manageCodes: (data.manager || []).map((item: any) => item.code),
        addressRegion: data.addressRegion || null,
        detailAddress: data.detailAddress || "",
        longitude:
          data.longitude === null || data.longitude === undefined || data.longitude === ""
            ? null
            : Number(data.longitude),
        latitude:
          data.latitude === null || data.latitude === undefined || data.latitude === ""
            ? null
            : Number(data.latitude),
        isCooperationCustomer: data.isCooperationCustomer || "YES",
        riskInfo: data.riskInfo || "",
        cooperationProcessExplanation: data.cooperationProcessExplanation || "",
        importantContractCondition: data.importantContractCondition || "",
        remark: data.remark || "",
        storageCapacity: data.storageCapacity ?? "",
        status: data.status || "DRAFT",
        id: data.id,
        cooperationStartDate: data.cooperationStartDate || null,
        evaluationDetailList: createEvaluationDetailList(data),
        baseScore:
          data.baseScore === null || data.baseScore === undefined
            ? 0
            : Number(data.baseScore),
      });
      // 回显化工厂/贸易商信息
      if (data.customerType === "CHEMICAL" && data.chemicalList?.length) {
        detailList.value = data.chemicalList.map((item: any) => ({
          id: item.id,
          coreProduct: item.coreProduct || "",
          factoryAddress: item.factoryAddress || "",
          capacity: item.capacity ?? "",
          oreDemand: item.oreDemand ?? "",
          washingCapacity: item.washingCapacity ?? "",
          operatingRate: item.operatingRate ?? "",
        }));
      } else if (data.customerType === "TRADER" && data.traderList?.length) {
        detailList.value = data.traderList.map((item: any) => ({
          id: item.id,
          coreProduct: item.coreProduct || "",
          factoryAddress: item.factoryAddress || "",
          tradeScale: item.tradeScale ?? "",
          availableFunds: item.availableFunds ?? "",
          downstreamEnterprises: item.downstreamEnterprises || "",
          logisticsChannels: item.logisticsChannels || "",
        }));
      } else {
        // 无详情数据时初始化默认空行
        initDefaultData();
      }

      // 回显联系人信息
      if (data.contactList?.length) {
        contactList.value = data.contactList.map((item: any) => ({
          id: item.id,
          contactName: item.contactName || "",
          position: item.position || "",
          phone: item.phone || "",
          responsibility: item.responsibility || "",
          birthday: item.birthday || null,
          remark: item.remark || "",
        }));
      } else {
        // 无联系人时初始化默认空行
        if (contactList.value.length === 0) {
          contactList.value.push({
            contactName: "",
            position: "",
            phone: "",
            responsibility: "",
            remark: "",
          });
        }
      }
      nextTick(() => {
        isEchoing.value = false;
      });
    }
  } catch (error) {
    console.error("加载客户详情失败:", error);
    window.$message.error("加载客户详情失败");
  } finally {
    pageLoading.value = false;
  }
};

// 加载字典数据（核心产品类型；地址已改为静态省市区级联，不再走字典）
const loadDictData = async () => {
  try {
    const res = await getDictMapApi({
      parentCodes: [enumCfg["核心产品类型"]],
    });

    if (res.code === 200) {
      coreProductOptions.value = (res.data?.[enumCfg["核心产品类型"]] || []).map(
        (item: any) => ({
          label: item.name,
          value: item.code,
        })
      );
    }
  } catch (e) {
    console.error("加载字典失败", e);
  }
};

onMounted(() => {
  // 从路由参数中获取客户ID，有值则为编辑模式
  const id = (route.query.id as string) || "";
  customerId.value = id;

  // 加载字典
  loadDictData();

  if (isEdit.value) {
    // 编辑模式：加载已有数据回显
    loadDetailData(customerId.value);
  } else {
    // 新增模式：初始化默认空行
    initDefaultData();
  }
});
</script>

<style scoped lang="less">
:deep(.birthday-picker .n-input .n-input__input-el) {
  height: 34px;
}

.customer-add-container {
  height: 100%;
  overflow-y: auto;

  .addTitle {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    padding: 16px;
  }

  .section {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    padding-top: 0px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    // margin-bottom: 16px;

    .title-line {
      width: 4px;
      height: 16px;
      background: var(--base-color);
      border-radius: 2px;
    }

    .title-text {
      font-size: 14px;
      font-weight: 600;
      color: #262626;
    }
  }

  .customer-evaluation-section {
    padding-bottom: 16px;
  }

  .evaluation-section-title {
    margin-bottom: 16px;
  }

  .evaluation-table {
    width: 100%;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .evaluation-row {
    display: grid;
    grid-template-columns: minmax(180px, 20%) minmax(0, 1fr);
    min-height: 48px;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: 0;
    }
  }

  .evaluation-header {
    min-height: 40px;
    color: #666;
    background: #f5f6f8;
    font-weight: 500;
  }

  .evaluation-cell {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 10px 12px;

    &:first-child {
      border-right: 1px solid #e5e7eb;
    }
  }

  .evaluation-item-cell {
    gap: 4px;
  }

  .evaluation-option-cell {
    :deep(.n-radio__label) {
      white-space: normal;
    }
  }

  .evaluation-tip-icon {
    flex-shrink: 0;
    color: #999;
    cursor: help;
  }

  .required-mark {
    color: #e34242;
  }

  .evaluation-score-form-item {
    width: 50%;
    margin-top: 16px;
    margin-bottom: 0;
  }

  .risk-info-box {
    display: flex;
    flex-direction: column;
    width: 100%;

    :deep(.n-input) {
      margin-top: 8px;
    }
  }

  .inner-table {
    :deep(.n-data-table) {
      .n-data-table-th {
        background: #f7f7f7;
        color: #eceef4;
        font-weight: 600;
      }
    }
  }

  :deep(.n-form-item-label) {
    font-weight: 400;
  }
}
</style>
