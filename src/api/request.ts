
import axios from 'axios';
import { createDiscreteApi } from 'naive-ui';

import { showSuccessToast as showSuccessToastVant, showFailToast } from 'vant';
import { isApp, getLocationSearchObj } from '@/utils/comm';
import { installMockAdapter, shouldUseMock } from '@/mock';
const _isApp = isApp();
// 创建独立的消息API
const { message } = createDiscreteApi(['message']);
let loading = window.$loading ? window.$loading() : null;

// 请求计数器，用于防抖节流loading显示
let requestCount = 0;
// 控制loading显示的标志
let loadingVisible = false;

// 显示loading的防抖函数
function showLoading() {
    requestCount++;
    if (!loadingVisible && loading) {
        loadingVisible = true;
        loading.show();
    } else if (!loading && !loadingVisible) {
        loading = window.$loading ? window.$loading() : null;
        loadingVisible = true;
        loading.show();
    }
}

// 隐藏loading的节流函数
function hideLoading() {
    requestCount--;
    // 当所有请求都完成后才隐藏loading
    if (requestCount <= 0 && loadingVisible && loading) {
        requestCount = 0; // 防止负数
        loadingVisible = false;
        loading.hide();
    }
}

// 创建 axios 实例
const service: any = axios.create({
    baseURL: import.meta.env.VITE_PROXY_PATH || '/apis',
    // 超时时间
    timeout: 50000,
});

// 开发环境无 token 时启用前端模拟数据，避免登录校验移除后接口 401 导致页面空白
if (shouldUseMock()) {
    installMockAdapter(service);
}

// 请求拦截器
service.interceptors.request.use(
    (config: any) => {
        console.log('当前代理：', import.meta.env.VITE_PROXY_PATH);
        // 在发送请求之前做些什么
        // token可以在这里添加
        // config.headers.Authorization = `Bearer ${token}`;
        // 显示loading（带防抖）
        if (sessionStorage.getItem('mx_token')) {
            config.headers.Authorization = `Bearer ${sessionStorage.getItem('mx_token')}`;
        }
        // 获取接口的customParams额外参数
        const { isLoading } = config.customParams || {};
        if (isLoading) {
            showLoading();
        }
        return config;
    },
    (error: any) => {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    (response: any) => {
        // 2xx 范围内的状态码都会触发该函数。
        // 对响应数据做点什么
        // 文件下载接口返回的是 Blob/ArrayBuffer，不走业务 code 判断。
        if (response.config.responseType === 'blob' || response.data instanceof Blob || response.data instanceof ArrayBuffer) {
            setTimeout(() => {
                hideLoading();
            });
            return response;
        }
        const { code, msg } = response.data;
        const { showSuccessToast = false, successMessage } = response.config.customParams || {};
        // 隐藏loading（带节流）
        setTimeout(() => {
            hideLoading();
        });
        if (code === 200) {
            // 显示成功提示
            if (showSuccessToast) {
                if (_isApp) {
                    // 时间均为2秒
                    showSuccessToastVant({
                        message: successMessage || msg || '操作成功',
                        duration: 2000,
                    });
                } else {
                    message.success(successMessage || msg || '操作成功', {
                        duration: 2000,
                    });
                }
            }
            return response.data;
        } else if (code === 401) {
            // 401 未授权
            return response;
        } else {
            // 处理非200状态码
            if (_isApp) {
                showFailToast({
                    message: msg || '操作失败',
                    duration: 2000,
                });
            } else {
                message.error(msg || '操作失败', {
                    duration: 2000,
                });
            }
            return response.data;
        }

        // 处理其他错误
        return Promise.reject(new Error(msg || 'Error'));
    },
    (error: any) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 隐藏loading（带节流）
        hideLoading();
        // 对响应错误做点什么
        return Promise.reject(error);
    }
);
export default service;
