<template>
    <div class="video_play_container" v-if="show">
        <n-icon class="icon" @click="close" size="32"><CloseSharpIcon /></n-icon>
        <video
            ref="video"
            class="video_dom"
            controls
            preload="auto"
            :style="{
                width: isapp ? '100%' : '90%',
                height: isapp ? 'auto' : '90%',
                maxHeight: '80%',
            }">
            <source :src="url" type="video/mp4" />
            您的浏览器不支持 video 标签。
        </video>
    </div>
</template>
<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { isApp } from '@/utils';
import { NIcon } from 'naive-ui';
import { ReloadSharp as ReloadSharpIcon ,CloseSharp as CloseSharpIcon,} from '@vicons/ionicons5';
interface Props {
    url: string;
    show: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    url: '',
    show: false,
});

const emit = defineEmits(['update:show']);

const video = ref<HTMLVideoElement | null>(null);
const isapp = ref(isApp());

watch(
    () => props.show,
    (newVal) => {
        if (newVal === false) {
            close();
        }
    }
);

watch(
    () => props.url,
    (newVal) => {
        if (newVal && video.value) {
            // 视频地址变化时，设置新的视频源,并重新播放
            video.value.src = newVal;
        }
    }
);

const close = () => {
    // 关闭视频流
    try {
        if (video.value) {
            video.value.pause();
            video.value.src = '';
        }
    } catch (error) {}
    emit('update:show', false);
};

onUnmounted(() => {
    // 关闭视频流
    try {
        if (video.value) {
            video.value.pause();
            video.value.src = '';
        }
    } catch (error) {}
});
</script>
<style lang="postcss" scoped>
.video_play_container {
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.5);

    .icon {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 30px;
        color: #fff;
        cursor: pointer;
        z-index: 3;
    }
}
</style>
