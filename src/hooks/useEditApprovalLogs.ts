import { ref } from 'vue';
import { getCommonApprovalLogsNewMap } from '@/api/approval';
import { getApprovalUserNameMap, normalizeApprovalDetailsNewMap } from '@/utils/approval';

export const useEditApprovalLogs = () => {
    const approvalLogs = ref<any[]>([]);
    const approvalLogsLoading = ref(false);

    const loadEditApprovalLogs = async (approvalId: any) => {
        approvalLogs.value = [];
        if (!approvalId) return [];

        approvalLogsLoading.value = true;
        try {
            const res = await getCommonApprovalLogsNewMap(approvalId);
            const list = res?.code === 200 ? res.data || [] : [];
            if (!Array.isArray(list) || !list.length) return [];

            const userNameMap = await getApprovalUserNameMap();
            approvalLogs.value = normalizeApprovalDetailsNewMap(list, userNameMap);
            return approvalLogs.value;
        } catch {
            approvalLogs.value = [];
            return [];
        } finally {
            approvalLogsLoading.value = false;
        }
    };

    return {
        approvalLogs,
        approvalLogsLoading,
        loadEditApprovalLogs,
    };
};
