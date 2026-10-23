<template>
    <div class="steps">
        <template v-for="(item, index) in steps" :key="item.id">
            <div :class="{ item: true, active: modelValue >= index }">
                <div class="icon"></div>
                <div class="label">{{ item.label }}</div>
            </div>
            <div
                v-if="index != steps.length - 1"
                :class="{ line: true, active: modelValue == index, activeed: modelValue > index }"></div>
        </template>
    </div>
</template>

<script lang="ts" setup>
const steps = [
    {
        label: '信息填写',
        id: 'baseInfo',
    },
    {
        label: '开票信息',
        id: 'invoice',
    },
    {
        label: '审批信息',
        id: 'approve',
    },
];
const props = defineProps({
    modelValue: {
        type: Number,
        default: 0,
    },
});
const emit = defineEmits('update:modelValue');
</script>

<style lang="less" scoped>
.steps {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 12px;
    box-sizing: border-box;
    .item {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        .icon {
            width: 16px;
            height: 16px;
            background: #79849e;
            border-radius: 50%;
            border: 4px solid #e4e6ec;
        }
        .label {
            font-size: 14px;
            color: #79849e;
            width: 100%;
            margin-top: 4px;
            text-align: center;
        }
        &.active {
            .icon {
                width: 16px;
                height: 16px;
                background: #2c65f2;
                border-radius: 50%;
                border: 4px solid #d6e1fc;
            }
            .label {
                color: #2c65f2;
                font-weight: 500;
            }
        }
    }
    .line {
        width: 48px;
        height: 4px;
        background: #d7e5f5;
        border-radius: 0px 0px 0px 0px;
        &.active {
            background: linear-gradient(90deg, #2c65f2, #2c65f2 50%, #d7e5f5 50%, #d7e5f5 100%);
        }
        &.activeed {
            background: #2c65f2;
        }
    }
}
</style>