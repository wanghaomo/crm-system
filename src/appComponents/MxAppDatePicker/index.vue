<template>
    <van-action-sheet v-model:show="showModel">
        <van-date-picker
            v-model="currentData"
            :title="title"
            :min-date="minDate"
            :max-date="maxDate"
            :columns-type="columnsType"
            @confirm="confirm"
            @cancel="cancel"
            @change="change" />
    </van-action-sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ActionSheet as vanActionSheet, DatePicker as VanDatePicker } from 'vant';
/**
 * 参数见 vant-date-picker https://vant-ui.github.io/vant/#/zh-CN/date-picker
 */
const props = defineProps({
    title: {
        type: String,
        default: '选择日期',
    },
    show: {
        type: Boolean,
        default: false,
    },
    modelValue: {
        type: Array,
        default: function () {
            return [];
        },
    },
    columnsType: {
        type: Array,
        default: function () {
            return ['year', 'month', 'day'];
        },
        validator(value: [], props) {
            return value.every((item) => ['year', 'month', 'day'].includes(item));
        },
    },
    minDate: {
        type: Date,
    },
    maxDate: {
        type: Date,
    },
    filter: {
        type: Function,
    },
    formatter: {
        type: Function,
    },
});
const currentData = ref([]);

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel', 'change']);

const showModel = computed({
    get() {
        return props.show;
    },
    set(v) {
        emit('update:show', v);
    },
});
watch(
    () => props.show,
    (newValue) => {
        if (newValue) {
            currentData.value = props.modelValue;
        }
    }
);
const confirm = (e) => {
    emit('update:modelValue', currentData.value);
    emit('confirm', e);
    showModel.value = false;
};
const cancel = (e) => {
    emit('cancel', e);
    showModel.value = false;
};
const change = (e) => {
    emit('change', e);
};
</script>

<style scoped>
</style>