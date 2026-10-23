<template>
    <Popup
        v-model:show="showModal"
        position="bottom"
        class="approval-app-popup"
        @opened="handleAppPopupOpened"
        :style="{ height: '100%' }">
        <div class="approval-app-modal">
            <div class="approval-app-header">
                <div class="approval-app-title">{{ title }}</div>
                <div type="button" class="approval-app-close" @click="closeModal">×</div>
            </div>
            <DropdownMenu ref="appFilterMenuRef" class="approval-app-filter-menu" :close-on-click-outside="true">
                <DropdownItem
                    v-model="activeTab"
                    :options="approvalAppTabOptions"
                    :disabled="isTableFetching"
                    @change="handleTabChange">
                    <template #title>
                        <div class="approval-app-filter-title">
                            <span class="approval-app-filter-label">{{ activeTabLabel }}</span>
                            <img class="approval-app-filter-arrow" src="@/assets/images/more@3x.png" alt="" />
                        </div>
                    </template>
                </DropdownItem>
                <DropdownItem title="时间筛选" :disabled="isTableFetching">
                    <template #title>
                        <div class="approval-app-filter-title" @click.stop="openAppDateCalendar">
                            <span class="approval-app-filter-label" :class="{ active: approvalDateRange }">{{
                                appDateRangeLabel
                            }}</span>
                            <span
                                v-if="approvalDateRange"
                                class="approval-app-date-filter-clear"
                                role="button"
                                tabindex="0"
                                aria-label="清空时间筛选"
                                @click.stop="clearAppDateRange"
                                @keydown.enter.stop="clearAppDateRange"
                                @keydown.space.prevent.stop="clearAppDateRange"
                                >×</span
                            >
                            <img class="approval-app-filter-arrow" src="@/assets/images/more@3x.png" alt="" />
                        </div>
                    </template>
                </DropdownItem>
                <DropdownItem
                    v-model="selectedApprovalModule"
                    :options="approvalAppModuleOptions"
                    :disabled="isTableFetching"
                    @change="handleModuleChange">
                    <template #title>
                        <div class="approval-app-filter-title">
                            <span class="approval-app-filter-label">{{ approvalModuleLabel }}</span>
                            <img class="approval-app-filter-arrow" src="@/assets/images/more@3x.png" alt="" />
                        </div>
                    </template>
                </DropdownItem>
            </DropdownMenu>
            <Calendar
                v-model:show="showAppDateCalendar"
                type="range"
                :default-date="appDateCalendarDefaultDate"
                :min-date="APPROVAL_FILTER_MIN_DATE"
                :max-date="APPROVAL_FILTER_MAX_DATE"
                :readonly="isTableFetching"
                @confirm="handleAppDateRangeConfirm" />
            <div ref="appListRef" class="approval-app-list" @scroll="handleAppListScroll">
                <div v-if="loading" class="approval-list-loading">
                    <Loading size="24px" />
                </div>
                <template v-else-if="filteredTableData.length">
                    <div
                        v-for="row in filteredTableData"
                        :key="String(getRowKey(row))"
                        class="approval-app-card"
                        @click="toggleAppRow(row)">
                        <Checkbox
                            class="approval-app-checkbox"
                            shape="square"
                            icon-size="16px"
                            :model-value="isRowChecked(row)"
                            @click.stop
                            @update:model-value="(checked) => handleAppRowChecked(row, checked)">
                            <template #icon="{ checked }">
                                <img class="approval-checkbox-icon" :src="getApprovalCheckboxIcon(checked)" alt="" />
                            </template>
                        </Checkbox>
                        <div class="approval-app-card-body">
                            <div class="approval-app-card-main">
                                <span class="approval-app-card-title">{{ getApprovalCardName(row) }}</span>
                            </div>
                            <div
                                v-for="field in getApprovalFieldEntries(row)"
                                :key="field.key"
                                class="approval-app-card-row">
                                <span class="approval-app-card-field">{{ field.label }}</span>
                                <span class="approval-app-card-value">{{ field.value }}</span>
                            </div>
                        </div>
                        <span
                            :class="[
                                'approval-app-status',
                                `status-${String(getApprovalCardStatus(row) || '').toLowerCase()}`,
                            ]">
                            {{ formatApprovalStatus(getApprovalCardStatus(row)) }}
                        </span>
                    </div>
                    <div v-if="loadMoreLoading" class="approval-app-load-more">
                        <Loading size="18px" />
                        <span>加载中</span>
                    </div>
                </template>
                <div v-else class="approval-app-empty-state">
                    <Empty description="暂无数据" />
                </div>
            </div>
            <div class="approval-app-footer">
                <Checkbox
                    class="approval-app-select-all-checkbox"
                    shape="square"
                    icon-size="18px"
                    :model-value="isAppAllChecked"
                    :indeterminate="isAppIndeterminate"
                    @update:model-value="toggleAppAllRows">
                    <template #icon="{ checked }">
                        <img
                            class="approval-checkbox-icon"
                            :src="getApprovalCheckboxIcon(checked, isAppIndeterminate)"
                            alt="" />
                    </template>
                    全选
                </Checkbox>
                <button type="button" class="approval-app-confirm" @click="handleConfirm">确定</button>
            </div>
        </div>
    </Popup>

    <n-drawer
        v-if="isAppMode"
        v-model:show="showDetailModal"
        placement="right"
        :width="modalWidth"
        :mask-closable="false"
        class="approval-detail-drawer">
        <n-drawer-content title="审批详情" closable @close="showDetailModal = false">
            <div class="approval-detail-view">
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
                                <strong>{{ getInitiatorValue(detailData) }}</strong>
                            </span>
                            <span>
                                <span class="approval-detail-meta-label">发起时间</span>&nbsp;
                                <strong>{{ formatTime(getStartTimeValue(detailData)) || '--' }}</strong>
                            </span>
                        </div>
                    </div>
                    <button type="button" class="approval-detail-back" @click="showDetailModal = false">
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
        </n-drawer-content>
    </n-drawer>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { NDrawer, NDrawerContent, NSpin } from 'naive-ui';
import { Calendar, Checkbox, DropdownItem, DropdownMenu, Empty, Loading, Popup } from 'vant';
import { approvalSelectContextKey } from './useApprovalSelect';

const context = inject(approvalSelectContextKey);
if (!context) throw new Error('MxApprovalSelect context is missing.');
const {
    props,
    showModal,
    showAppDateCalendar,
    appFilterMenuRef,
    loading,
    loadMoreLoading,
    appListRef,
    activeTab,
    showDetailModal,
    detailLoading,
    detailData,
    selectedApprovalModule,
    approvalDateRange,
    APPROVAL_FILTER_MIN_DATE,
    APPROVAL_FILTER_MAX_DATE,
    getApprovalCheckboxIcon,
    approvalAppTabOptions,
    approvalAppModuleOptions,
    activeTabLabel,
    approvalModuleLabel,
    appDateRangeLabel,
    appDateCalendarDefaultDate,
    isTableFetching,
    filteredTableData,
    isAppAllChecked,
    isAppIndeterminate,
    getRowKey,
    isRowChecked,
    handleAppRowChecked,
    toggleAppRow,
    getApprovalCardName,
    getApprovalFieldEntries,
    getApprovalCardStatus,
    formatApprovalStatus,
    handleAppListScroll,
    clearAppDateRange,
    openAppDateCalendar,
    handleAppDateRangeConfirm,
    handleTabChange,
    handleModuleChange,
    handleAppPopupOpened,
    closeModal,
    handleConfirm,
    approvalBackIcon,
    getInitiatorValue,
    getStartTimeValue,
    formatTime,
    getSerialNumberValue,
    detailFormItems,
    isWideFormItem,
    detailTaskList,
    formatApprovalUserByUserId,
} = context;
const { title } = props;
</script>
