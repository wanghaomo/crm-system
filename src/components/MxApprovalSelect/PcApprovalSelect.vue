<template>
    <n-drawer
        v-model:show="showModal"
        placement="right"
        :width="modalWidth"
        :mask-closable="false"
        class="approval-select-drawer">
        <n-drawer-content
            :title="showDetailModal ? '审批详情' : title"
            closable
            footer-class="approval-select-drawer-footer"
            @close="closeModal">
            <div v-if="!showDetailModal" class="approval-select-body">
                <NFormItem class="approval-filter-form-boundary" :show-feedback="false">
                    <div class="approval-filter-bar">
                        <n-select
                            v-model:value="activeTab"
                            class="approval-scope-select"
                            :options="approvalTabs.map((item) => ({ label: item.label, value: item.value }))"
                            :disabled="isTableFetching"
                            @update:value="handleTabChange" />
                        <n-select
                            v-model:value="selectedApprovalModule"
                            class="approval-module-select"
                            clearable
                            placeholder="审批模块"
                            :options="approvalModuleOptions"
                            :disabled="isTableFetching"
                            @update:value="handleModuleChange" />
                        <n-date-picker
                            v-model:formatted-value="approvalDateRange"
                            class="approval-date-range"
                            type="datetimerange"
                            format="yyyy-MM-dd HH:mm:ss"
                            value-format="yyyy-MM-dd HH:mm:ss"
                            clearable
                            :disabled="isTableFetching"
                            :is-date-disabled="isDateDisabled"
                            start-placeholder="开始时间"
                            end-placeholder="结束时间"
                            @update:formatted-value="handleDateRangeChange" />
                    </div>
                </NFormItem>
                <div ref="tableWrapRef" class="approval-card-list" @scroll="handleTableScroll">
                    <div v-if="loading" class="approval-pc-list-loading">
                        <NSpin size="medium" />
                    </div>
                    <template v-else-if="filteredTableData.length">
                        <div v-for="row in filteredTableData" :key="String(getRowKey(row))" class="approval-card">
                            <input
                                class="approval-card-checkbox"
                                type="checkbox"
                                :checked="isRowChecked(row)"
                                @click.stop
                                @change="handlePcRowChecked(row, ($event.target as HTMLInputElement).checked)" />
                            <div class="approval-card-content">
                                <div class="approval-card-header">
                                    <div class="approval-card-title-wrap">
                                        <span
                                            :class="[
                                                'approval-status-tag',
                                                `status-${String(getApprovalCardStatus(row) || '').toLowerCase()}`,
                                            ]">
                                            {{ formatApprovalStatus(getApprovalCardStatus(row)) }}
                                        </span>
                                        <span class="approval-card-title">{{ getApprovalCardName(row) }}</span>
                                    </div>
                                    <button type="button" class="approval-detail-link" @click.stop="openDetail(row)">
                                        <span>详情</span>
                                        <img class="approval-detail-arrow" :src="approvalDetailArrowIcon" alt="" />
                                    </button>
                                </div>
                                <div class="approval-card-fields">
                                    <div
                                        v-for="field in getApprovalFieldEntries(row)"
                                        :key="field.key"
                                        class="approval-card-field">
                                        <span class="approval-card-field-label">{{ field.label }}</span>
                                        <span class="approval-card-field-value" :title="field.value">{{
                                            field.value
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <div v-else class="approval-card-empty">暂无数据</div>
                    <div v-if="loadMoreLoading" class="approval-load-more-loading">
                        <n-spin size="small" />
                        <span>加载中</span>
                    </div>
                </div>
            </div>

            <div v-else class="approval-detail-view">
                <div v-if="detailData" class="approval-detail-top">
                    <div class="approval-detail-summary">
                        <div class="approval-detail-heading">
                            <span class="approval-detail-name">{{ getApprovalCardName(detailData) }}</span>
                            <span
                                :class="[
                                    'approval-status-tag',
                                    `status-${String(getApprovalCardStatus(detailData) || '').toLowerCase()}`,
                                ]">
                                {{ formatApprovalStatus(getApprovalCardStatus(detailData)) }}
                            </span>
                        </div>
                        <div class="approval-detail-meta">
                            <span>
                                <span class="approval-detail-meta-label">发起人</span>&nbsp;
                                <span class="approval-detail-meta-value">{{ getInitiatorValue(detailData) }}</span>
                            </span>
                            <span>
                                <span class="approval-detail-meta-label">发起时间</span>&nbsp;
                                <span class="approval-detail-meta-value">{{
                                    formatTime(getStartTimeValue(detailData)) || '--'
                                }}</span>
                            </span>
                        </div>
                    </div>
                    <button type="button" class="approval-detail-back" @click="handlePcDetailBack">
                        <img :src="approvalBackIcon" alt="" />
                        <span>返回</span>
                    </button>
                </div>

                <div class="approval-detail-scroll">
                    <n-spin :show="detailLoading">
                        <div v-if="detailData" class="approval-detail">
                            <div class="approval-detail-section">
                                <div class="approval-detail-title">审批信息</div>
                                <div class="approval-detail-info-grid">
                                    <div class="approval-detail-info-item">
                                        <span>流水号</span><strong>{{ getSerialNumberValue(detailData) }}</strong>
                                    </div>
                                    <div class="approval-detail-info-item">
                                        <span>完成时间</span
                                        ><strong>{{ formatTime(detailData.endTime) || '--' }}</strong>
                                    </div>
                                </div>
                            </div>

                            <div v-if="detailFormItems.length" class="approval-detail-section">
                                <div class="approval-detail-title">表单信息</div>
                                <div class="approval-form-grid">
                                    <div
                                        v-for="item in detailFormItems"
                                        :key="item.key"
                                        class="approval-form-item"
                                        :class="{
                                            'approval-form-item-wide': isWideFormItem(item),
                                            'approval-form-item-multiline': item.fieldType === 'textarea',
                                        }">
                                        <span class="approval-form-label">{{ item.name }}</span>
                                        <MxWebFileUpload
                                            v-if="item.type === 'attachment' && item.files.length"
                                            class="approval-form-attachments"
                                            :only-show="true"
                                            :model-value="item.files" />
                                        <div v-else-if="item.type === 'fieldList'" class="approval-field-list">
                                            <div
                                                v-for="row in item.rows"
                                                :key="row.key"
                                                class="approval-field-list-record">
                                                <div class="approval-field-list-grid">
                                                    <div
                                                        v-for="field in row.fields"
                                                        :key="field.key"
                                                        class="approval-field-list-item">
                                                        <span class="approval-field-list-label">{{ field.name }}</span>
                                                        <span class="approval-field-list-value">{{ field.value }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span v-if="!item.rows.length" class="approval-form-value">--</span>
                                        </div>
                                        <span v-else class="approval-form-value">{{ item.value }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="detailTaskList.length" class="approval-detail-section approval-node-section">
                                <div class="approval-detail-title">审批节点</div>
                                <div class="approval-node-list">
                                    <div
                                        v-for="task in detailTaskList"
                                        :key="task.renderKey"
                                        class="approval-node-item">
                                        <div class="approval-node-marker">
                                            <img
                                                class="approval-node-complete-icon"
                                                src="@/assets/images/icon⎽com⎽complete@3x.png"
                                                alt="" />
                                            <i v-if="task.showConnector"></i>
                                        </div>
                                        <div class="approval-node-body">
                                            <div class="approval-node-title">
                                                {{ task.displayNodeName }}
                                            </div>
                                            <div class="approval-node-user">
                                                {{
                                                    formatApprovalUserByUserId(
                                                        task.userId || task.approverId || task.operatorId
                                                    )
                                                }}
                                            </div>
                                            <div class="approval-node-time">
                                                <span
                                                    ><span>开始时间</span
                                                    ><span>{{ formatTime(task.startTime) || '--' }}</span></span
                                                >
                                                <span
                                                    ><span>结束时间</span
                                                    ><span>{{ formatTime(task.endTime) || '--' }}</span></span
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="approval-detail-empty">暂无详情</div>
                    </n-spin>
                </div>
            </div>

            <template v-if="!showDetailModal" #footer>
                <div class="modal-footer">
                    <div class="approval-selection-bar">
                        <label class="approval-select-all">
                            <input
                                type="checkbox"
                                :checked="isPcAllChecked"
                                :indeterminate="isPcIndeterminate"
                                @change="togglePcAllRows(($event.target as HTMLInputElement).checked)" />
                            <span class="all-select">全选</span>
                            <span class="approval-selected-count"
                                >已选 <span>{{ checkedRowKeys.length }}</span> 项</span
                            >
                        </label>
                    </div>
                    <div class="approval-confirm-bar">
                        <MxButton type="success" class="approval-confirm-button" @click="handleConfirm">确 定</MxButton>
                    </div>
                </div>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { NDatePicker, NDrawer, NDrawerContent, NFormItem, NSelect, NSpin } from 'naive-ui';
import { approvalSelectContextKey } from './useApprovalSelect';

const context = inject(approvalSelectContextKey);
if (!context) throw new Error('MxApprovalSelect context is missing.');
const {
    props,
    showModal,
    showDetailModal,
    approvalTabs,
    activeTab,
    isTableFetching,
    handleTabChange,
    selectedApprovalModule,
    approvalModuleOptions,
    handleModuleChange,
    approvalDateRange,
    isDateDisabled,
    handleDateRangeChange,
    tableWrapRef,
    handleTableScroll,
    loading,
    filteredTableData,
    getRowKey,
    isRowChecked,
    handlePcRowChecked,
    getApprovalCardStatus,
    formatApprovalStatus,
    getApprovalCardName,
    approvalDetailArrowIcon,
    openDetail,
    getApprovalFieldEntries,
    loadMoreLoading,
    detailData,
    getInitiatorValue,
    getStartTimeValue,
    formatTime,
    approvalBackIcon,
    handlePcDetailBack,
    getSerialNumberValue,
    detailLoading,
    detailFormItems,
    isWideFormItem,
    detailTaskList,
    formatApprovalUserByUserId,
    isPcAllChecked,
    isPcIndeterminate,
    checkedRowKeys,
    togglePcAllRows,
    handleConfirm,
    closeModal,
} = context;
const { title, modalWidth } = props;
</script>
