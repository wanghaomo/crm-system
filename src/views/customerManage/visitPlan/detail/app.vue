<template>
    <AppPage title="拜访记录详情" :showSearch="false" :showList="false" noPadding>
        <template #content>
            <div v-if="!loading" class="detail-page">
                <div class="detail-header">
                    <div class="title-row">
                        <div class="detail-title">{{ formatValue(detailData.customerName) }}</div>
                        <AppTag :text="getStatus(detailData.status).label" :type="getStatus(detailData.status).type" />
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">拜访目的</span
                        ><span>{{ purposeMap[detailData.visitPurpose] || formatValue(detailData.visitPurpose) }}</span>
                    </div>
                </div>
                <Tabs v-model:active="activeTab" sticky class="detail-tabs" line-width="24" animated @change="handleTabChange">
                    <Tab title="基础信息" name="basic"
                        ><div class="tab-panel">
                            <div class="info-card">
                                <div class="section-title">基础信息</div>
                                <div
                                    v-for="item in baseRows"
                                    :key="item.label"
                                    class="info-row"
                                    :class="{ long: item.long }">
                                    <span class="label">{{ item.label }}</span
                                    ><template v-if="item.attachment"
                                        ><MxWebFileUpload
                                            v-if="detailData.attachmentList?.length"
                                            class="base-attachments"
                                            :only-show="true"
                                            :model-value="detailData.attachmentList" /><span v-else class="value"
                                            >--</span
                                        ></template
                                    ><span v-else class="value">{{ item.value }}</span>
                                </div>
                            </div>
                        </div></Tab
                    >
                    <Tab title="沟通内容" name="content"
                        ><div class="tab-panel">
                            <div class="content-card">
                                <MxEditorPreview
                                    v-if="detailData.content"
                                    :modelValue="detailData.content"
                                    maxHeight="none"
                                    minHeight="61" />
                                <div v-else class="content-empty">暂无沟通内容</div>
                            </div>
                        </div></Tab
                    >
                    <Tab title="待办事项" name="todo"
                        ><div class="tab-panel">
                            <div class="todo-list-card">
                                <div class="todo-header">
                                    <div class="section-title">待办事项</div>
                                    <button v-if="!isBatchMode && hasIncompleteTodo" type="button" class="batch-complete-trigger" @click="enterBatchMode">批量完成</button>
                                    <button v-else-if="isBatchMode" type="button" class="batch-complete-trigger" @click="exitBatchMode">取消</button>
                                </div>
                                <div v-if="!todoList.length" class="todo-empty">
                                    <img src="@/assets/images/empty.png" alt="" /><span>暂无待办事项</span>
                                </div>
                                <div v-else class="todo-list">
                                    <CheckboxGroup v-model="selectedTodoIds" class="todo-checkbox-group">
                                        <div v-for="(item, index) in displayTodoList" :key="item.id || index" class="todo-select-row">
                                            <Checkbox v-if="isBatchMode" :name="item.id" shape="square" class="todo-checkbox" :disabled="item.id === undefined || item.id === null" />
                                            <div class="todo-card">
                                                <div class="todo-card-header">
                                                    <span>{{ getTodoSequence(index) }}</span
                                                    ><span
                                                        :class="['todo-status', `todo-status--${item.status || 'unknown'}`]"
                                                        >{{ todoStatusMap[item.status] || formatValue(item.status) }}</span
                                                    >
                                                </div>
                                                <div class="todo-row">
                                                    <span>待办事项</span><b>{{ formatValue(item.todoContent) }}</b>
                                                </div>
                                                <div class="todo-row">
                                                    <span>负责人</span><b>{{ getPeople(item.principalList) }}</b>
                                                </div>
                                                <div class="todo-row">
                                                    <span>截止时间</span><b>{{ formatValue(item.dueTime) }}</b>
                                                </div>
                                                <template v-if="expandedIndex === index"
                                                    ><div class="todo-row">
                                                        <span>完成时间</span><b>{{ formatValue(item.completeTime) }}</b>
                                                    </div>
                                                    <div class="todo-row">
                                                        <span>备注</span><b>{{ formatValue(item.remark || item.remarks) }}</b>
                                                    </div>
                                                    <div v-if="item.attachmentList?.length" class="todo-row">
                                                        <span>附件</span
                                                        ><MxWebFileUpload
                                                            :only-show="true"
                                                            :model-value="item.attachmentList" /></div></template
                                                ><button type="button" class="todo-expand" @click="toggleExpand(index)">
                                                    {{ expandedIndex === index ? '收起' : '展开' }}
                                                    <Icon :name="expandedIndex === index ? 'arrow-up' : 'arrow-down'" />
                                                </button>
                                            </div>
                                        </div>
                                    </CheckboxGroup>
                                </div>
                            </div></div
                    ></Tab>
                </Tabs>
            </div>
            <div v-else class="page-loading"><Loading vertical>加载中...</Loading></div>
        </template>
        <template #footer>
            <div v-if="activeTab === 'todo' && isBatchMode" class="batch-complete-footer">
                <Checkbox v-model="allTodoSelected" shape="square">全选</Checkbox>
                <Button plain type="primary" :disabled="!selectedTodoIds.length" @click="handleBatchComplete">确定完成</Button>
            </div>
        </template>
    </AppPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Checkbox, CheckboxGroup, Icon, Loading, Tab, Tabs, showToast } from 'vant';
import { useRoute } from 'vue-router';
import AppPage from '@/appComponents/AppPage/index.vue';
import AppTag from '@/appComponents/AppTag/index.vue';
import MxEditorPreview from '@/components/MxEditor/preview.vue';
import { batchCompleteTodoApi, getVisitPlanApi } from '@/api/customerManage';
import { getDictMapApi } from '@/api/comm';
import enumCfg from '@/config/enum.cfg';
import { STAR_LEVEL_MAP } from '@/config/customer';

const route = useRoute();
const loading = ref(true);
const detailData = ref<any>({});
const activeTab = ref<'basic' | 'content' | 'todo'>('basic');
const todoList = ref<any[]>([]);
const expandedIndex = ref(-1);
const isBatchMode = ref(false);
const selectedTodoIds = ref<Array<number | string>>([]);
const purposeMap = ref<Record<string, string>>({});
const cycleMap = ref<Record<string, string>>({});
const statusMap: Record<string, { label: string; type: string }> = {
    PENDING: { label: '待拜访', type: 'warning' },
    COMPLETED: { label: '已拜访', type: 'primary' },
    ARCHIVED: { label: '已归档', type: 'success' },
    CANCELLED: { label: '已取消', type: 'info' },
};
const todoStatusMap: Record<string, string> = { TODO: '未完成', DONE: '已完成', DELAYED: '延期' };

/** 获取可以批量完成的待办事项。 */
const incompleteTodoList = computed(() => todoList.value.filter((item) => item.status !== 'DONE'));

/** 判断当前待办事项是否存在可批量完成的数据。 */
const hasIncompleteTodo = computed(() => incompleteTodoList.value.some((item) => item.id !== undefined && item.id !== null));

/** 获取当前模式下需要展示的待办事项。 */
const displayTodoList = computed(() => (isBatchMode.value ? incompleteTodoList.value : todoList.value));

/** 控制批量模式底部的全选状态。 */
const allTodoSelected = computed({
    get: () => {
        const selectableIds = incompleteTodoList.value
            .map((item) => item.id)
            .filter((id) => id !== undefined && id !== null);
        return selectableIds.length > 0 && selectableIds.every((id) => selectedTodoIds.value.some((selectedId) => String(selectedId) === String(id)));
    },
    set: (checked: boolean) => {
        selectedTodoIds.value = checked
            ? incompleteTodoList.value.map((item) => item.id).filter((id) => id !== undefined && id !== null)
            : [];
    },
});
const formatValue = (value: any) => (value === null || value === undefined || value === '' ? '--' : value);
const getStatus = (status: string) => statusMap[status] || { label: formatValue(status), type: 'info' };
const getPeople = (value: any) =>
    (Array.isArray(value) ? value : value ? [value] : [])
        .map((item) => item?.username || item?.name || item?.label || item?.contactName || item?.code)
        .filter(Boolean)
        .join('、') || '--';
const getTodoSequence = (index: number) =>
    `序号${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || index + 1}`;
const toggleExpand = (index: number) => {
    expandedIndex.value = expandedIndex.value === index ? -1 : index;
};

/** 进入待办事项批量完成模式。 */
const enterBatchMode = () => {
    isBatchMode.value = true;
    selectedTodoIds.value = [];
    expandedIndex.value = -1;
};

/** 退出待办事项批量完成模式并清空选择。 */
const exitBatchMode = () => {
    isBatchMode.value = false;
    selectedTodoIds.value = [];
    expandedIndex.value = -1;
};

/** 切换详情 Tab 时退出待办事项批量操作模式。 */
const handleTabChange = (name: string | number) => {
    if (name !== 'todo' && isBatchMode.value) exitBatchMode();
};

/** 批量完成选中的待办事项并刷新详情数据。 */
const handleBatchComplete = async () => {
    const todoIds = selectedTodoIds.value.filter((id) => id !== undefined && id !== null);
    if (!todoIds.length) {
        showToast('请选择待办事项');
        return;
    }

    try {
        await batchCompleteTodoApi(todoIds);
        exitBatchMode();
        await loadDetail();
    } catch (error) {
        console.error('批量完成拜访记录待办事项失败:', error);
        showToast('批量完成失败');
    }
};
const baseRows = computed(() => [
    {
        label: '拜访周期',
        value: cycleMap.value[detailData.value.visitCycle] || formatValue(detailData.value.visitCycle),
    },
    { label: '客户星级', value: formatValue(STAR_LEVEL_MAP[detailData.value.starLevel]) },
    { label: '计划拜访时间', value: formatValue(detailData.value.planTime) },
    { label: '拜访人', value: getPeople(detailData.value.executorList) },
    { label: '客户对接人', value: getPeople(detailData.value.contactPersonList) },
    { label: '客户工作规律', value: formatValue(detailData.value.customerWorkPattern), long: true },
    { label: '拜访要求', value: formatValue(detailData.value.visitRequirements), long: true },
    { label: '客户库存/开工率记录', value: formatValue(detailData.value.customerInventoryRate), long: true },
    { label: '拜访附件', attachment: true, long: true },
    { label: '拜访反馈', value: formatValue(detailData.value.feedback), long: true },
    {
        label: '增值服务',
        value: Array.isArray(detailData.value.plusServicesList)
            ? detailData.value.plusServicesList.join('、') || '--'
            : formatValue(detailData.value.plusServicesList),
        long: true,
    },
    { label: '服务详情', value: formatValue(detailData.value.plusServicesDetail), long: true },
    { label: '执行情况', value: formatValue(detailData.value.plusServicesExecution), long: true },
    ...(detailData.value.status === 'CANCELLED'
        ? [{ label: '取消原因', value: formatValue(detailData.value.cancelReason), long: true }]
        : []),
]);
/** 加载详情页字典。 */
const loadDicts = async () => {
    try {
        const res: any = await getDictMapApi({ parentCodes: [enumCfg['拜访目的'], enumCfg['关怀周期']] });
        purposeMap.value = (res?.data?.[enumCfg['拜访目的']] || []).reduce((map, item) => {
            map[item.code || item.value] = item.name || item.label;
            return map;
        }, {});
        cycleMap.value = (res?.data?.[enumCfg['关怀周期']] || []).reduce((map, item) => {
            map[item.code || item.value] = item.name || item.label;
            return map;
        }, {});
    } catch (error) {
        console.error('加载拜访详情字典失败:', error);
    }
};
/** 加载拜访记录详情。 */
const loadDetail = async () => {
    const id = route.query.id;
    if (!id) {
        showToast('拜访记录不存在');
        loading.value = false;
        return;
    }
    try {
        const res: any = await getVisitPlanApi(Number(id));
        detailData.value = res?.data || {};
        todoList.value = Array.isArray(detailData.value.todoList) ? detailData.value.todoList : [];
    } catch (error) {
        console.error('获取拜访记录详情失败:', error);
        showToast('获取详情失败');
    } finally {
        loading.value = false;
    }
};
onMounted(async () => {
    await loadDicts();
    await loadDetail();
});
</script>

<style scoped lang="less">
.detail-page {
    min-height: 100%;
    background: #f5f6f8;
}
.detail-header {
    padding: 12px 18px;
    background: #fff;
}
.title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.detail-title {
    min-width: 0;
    overflow: hidden;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.meta-row {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    color: #333;
    font-size: 14px;
}
.meta-label {
    color: #999;
}
.detail-tabs :deep(.van-tabs__wrap) {
    background: #fff;
}
.detail-tabs :deep(.van-tabs__line) {
    background: #2c65f2;
}
.tab-panel {
    min-height: calc(100vh - 160px);
    padding: 12px;
}
.section-title {
    color: #333;
    font-size: 16px;
    font-weight: 600;
}
.info-card,
.content-card,
.todo-list-card {
    padding: 0 12px 12px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}
.info-card .section-title,
.todo-list-card > .section-title,
.todo-header .section-title {
    padding: 16px 0;
}
.todo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.todo-header .section-title {
    margin: 0;
}
.batch-complete-trigger {
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #2c65f2;
    font-size: 14px;
    line-height: 20px;
}
.info-row,
.todo-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    line-height: 26px;
}
.info-row:last-child,
.todo-row:last-child {
    border-bottom: 0;
}
.info-row .label,
.todo-row span {
    width: 86px;
    flex-shrink: 0;
    color: #aaa;
}
.info-row .value,
.todo-row b {
    flex: 1;
    min-width: 0;
    color: #333;
    font-weight: 400;
    word-break: break-word;
}
.info-row.long {
    display: block;
}
.info-row.long .label {
    display: block;
    width: auto;
    margin-bottom: 6px;
}
.base-attachments {
    display: block;
    margin-top: 8px;
}
.content-card {
    padding: 16px;
    color: #333;
    font-size: 16px;
    line-height: 1.7;
}
.content-card :deep(img) {
    max-width: 100%;
    height: auto;
}
.content-empty,
.page-loading,
.todo-empty {
    display: flex;
    align-items: center;
    justify-content: center;
}
.content-empty {
    min-height: 110px;
    color: #999;
}
.page-loading {
    min-height: 300px;
    color: #999;
}
.todo-empty {
    flex-direction: column;
    color: #999;
    font-size: 14px;
}
.todo-empty img {
    width: 120px;
    margin-bottom: 8px;
}
.todo-card {
    margin-bottom: 12px;
    padding: 0 12px 10px;
    border-radius: 8px;
    background: #f4f4f4;
}
.todo-select-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.todo-checkbox-group {
    display: block;
}
.todo-select-row .todo-card {
    flex: 1;
    min-width: 0;
}
.todo-checkbox {
    flex: 0 0 auto;
}
.todo-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 6px;
    color: #333;
    font-size: 15px;
    font-weight: 500;
}
.todo-status {
    padding: 1px 4px;
    border: 1px solid currentColor;
    border-radius: 2px;
    font-size: 13px;
    font-weight: 400;
    line-height: 20px;
}
.todo-status--TODO {
    color: #f04f55;
}
.todo-status--DONE {
    color: #58a875;
}
.todo-status--DELAYED,
.todo-status--unknown {
    color: #999;
}
.todo-expand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px 0 4px;
    border: 0;
    background: transparent;
    color: #2c65f2;
    font: inherit;
    font-size: 14px;
}
.batch-complete-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px 12px;
    background: #fff;
}
.batch-complete-footer :deep(.van-checkbox) {
    flex: 0 0 auto;
    color: #333;
    font-size: 14px;
}
.batch-complete-footer .van-button {
    flex: 1;
    height: 40px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
}
</style>
