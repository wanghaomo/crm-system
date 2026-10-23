// stores/theme.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const isDark = ref(false)
  const primaryColor = ref('#2080f0')
  const presetColors = {
    blue: '#2080f0',
    indigo: '#5c6bc0',
    teal: '#26a69a',
    purple: '#ab47bc',
    orange: '#ff9800',
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  // 设置主题色
  const setPrimaryColor = (color: string) => {
    primaryColor.value = color
  }

  // 计算主题配置
  const themeConfig = computed(() => ({
    common: {
      primaryColor: isDark.value ? lightenColor(primaryColor.value, 20) : primaryColor.value,
      primaryColorHover: isDark.value ? lightenColor(primaryColor.value, 30) : lightenColor(primaryColor.value, 10),
      primaryColorPressed: isDark.value ? darkenColor(primaryColor.value, 10) : darkenColor(primaryColor.value, 20),
      primaryColorSuppl: isDark.value ? lightenColor(primaryColor.value, 20) : lightenColor(primaryColor.value, 10),
    }
  }))

  // 颜色工具函数
  const lightenColor = (color: string, percent: number) => {
    // 颜色处理逻辑
    return color
  }

  const darkenColor = (color: string, percent: number) => {
    // 颜色处理逻辑
    return color
  }

  return {
    isDark,
    primaryColor,
    presetColors,
    toggleTheme,
    setPrimaryColor,
    themeConfig
  }
})