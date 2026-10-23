<template>
    <div class="app-home-page">
        <!-- 顶部渐变背景 -->
        <div class="home-bg-gradient"></div>

        <!-- 顶部安全区占位 -->
        <!-- <div class="safe-area-top"></div> -->

        <!-- 可滚动内容区 -->
        <div class="home-scroll-wrap">
            <!-- 页面标题 -->
            <div class="home-header">
                <div class="home-header-title">智慧矿山·CRM</div>
            </div>
            <div class="home-body">
                <!-- ========================================================== -->
                <!-- 骨架屏 - 数据加載中 -->
                <!-- ========================================================== -->
                <template v-if="loading">
                    <!-- 用户信息骨架 -->
                    <div class="skeleton-user">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-user-info">
                            <div class="skeleton-line skeleton-name"></div>
                            <div class="skeleton-line skeleton-phone"></div>
                        </div>
                    </div>
                    <!-- 数据概览骨架 -->
                    <div class="skeleton-overview">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-overview-list">
                            <div class="skeleton-stat" v-for="i in 3" :key="'s' + i">
                                <div class="skeleton-line skeleton-stat-num"></div>
                                <div class="skeleton-line skeleton-stat-label"></div>
                            </div>
                        </div>
                    </div>
                    <!-- 轮播图骨架 -->
                    <div class="skeleton-banner"></div>
                    <!-- 我的应用骨架 -->
                    <div class="skeleton-apps">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-apps-grid">
                            <div class="skeleton-app-item" v-for="i in 8" :key="'a' + i">
                                <div class="skeleton-app-icon"></div>
                                <div class="skeleton-line skeleton-app-name"></div>
                            </div>
                        </div>
                    </div>
                </template>
                <!-- ========================================================== -->
                <!-- 真实内容 -->
                <!-- ========================================================== -->
                <template v-else>
                    <!-- 用户信息卡片 -->
                    <div class="user-card">
                        <div class="avatar">
                            <img :src="userAvatar" alt="avatar" />
                        </div>
                        <div class="info">
                            <div class="name-row">
                                <span class="name">{{ userInfo?.username || '未知用户' }}</span>
                                <span v-if="userInfo.code" class="no-tag">
                                    <img class="prefix" :src="icon_no" />
                                    <span class="value">{{ userInfo?.code }}</span>
                                </span>
                            </div>
                            <div class="phone">{{ userInfo?.phone }}</div>
                        </div>
                        <div class="portal" @click="handleBackPortal">
                            <span>返回门户</span>
                            <van-icon name="arrow" size="12" color="#666666" />
                        </div>
                    </div>

                    <!-- 数据概览卡片 -->
                    <div class="overview-card">
                        <div class="head">
                            <div class="title">
                                <span class="text">数据概览</span>
                                <span class="date">({{ overviewDate }})</span>
                            </div>
                            <div class="entry" @click="handleGoDashboard">
                                <span>数据看板</span>
                                <van-icon name="arrow" size="12" />
                            </div>
                        </div>
                        <div class="list">
                            <div class="item" v-for="item in overviewList" :key="item.label">
                                <div class="value">
                                    <span class="num">{{ item.value }}</span>
                                    <span class="unit">{{ item.unit }}</span>
                                </div>
                                <div class="label">{{ item.label }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 轮播图 -->
                    <div class="banner-wrap" v-if="bannerList.length">
                        <appBanner :bannerList="bannerList" />
                    </div>

                    <!-- 我的应用 -->
                    <div class="apps-card">
                        <div class="apps-card-title">我的应用</div>
                        <div class="apps-grid">
                            <div class="apps-grid-item" v-for="app in appDisplayList" :key="app.code" @click="handleAppClick(app)">
                                <img :src="app.icon" class="apps-grid-icon" :alt="app.name" />
                                <div class="apps-grid-name" :title="app.name">{{ textEllipsis(app.name, 4) }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- 底部安全区占位 -->
            <div class="safe-area-bottom"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Swipe as VanSwipe, SwipeItem as VanSwipeItem, Icon as VanIcon } from 'vant';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/userStore';
import { useRouteStore } from '@/store/index';
import { storeToRefs } from 'pinia';
import { showConfirmDialog } from 'vant';
import { generateTextAvatar } from '@mx/mx-ui/utils';
import appBanner from "../dashboard/cpns/appBanner.vue"
import { useDashboardData } from '../dashboard/useDashboardData';
import { formatDashboardValue } from '../dashboard/utils';
import icon_no from "@/assets/images/icon⎽com⎽no.png"
// 用户信息
const { userInfo } = storeToRefs(useUserStore());
const { routerArray } = storeToRefs(useRouteStore());
import { goToHome } from '@/router/routeUtils';
import { DEFAULT_MENU_PATH } from '@/config/global.cfg';

// 图标资源
import iconJsgl from '@/assets/appImages/home/icon⎽func⎽jsgl.png';      // 结算
import iconHkgl from '@/assets/appImages/home/icon⎽func⎽hkgl.png';      // 回款
import iconRfhgl from '@/assets/appImages/home/icon⎽func⎽rfhgl.png';    // 发运
import iconAiyc from '@/assets/appImages/home/icon⎽func⎽aiyc.png';      // AI
import iconJzdj from '@/assets/appImages/home/icon⎽func⎽jzdj.png';      // 基准定价
import iconYfhjh from '@/assets/appImages/home/icon⎽func⎽yfhjh.png';    // 月发货计划
import iconXsdj from '@/assets/appImages/home/icon⎽func⎽xsdj.png';      // 销售定价
import iconScbg from '@/assets/appImages/home/icon⎽func⎽scbg.png';      // 市场报告
import iconHydt from '@/assets/appImages/home/icon⎽func⎽hydt.png';      // 行业动态
import iconHgqydy from '@/assets/appImages/home/icon⎽func⎽hgqydy.png';  // 化工企业调研
import iconJzdsdy from '@/assets/appImages/home/icon⎽func⎽jzdsdy.png';  // 竞争对手调研
import defaultAvatar from '@/assets/appImages/home/img⎽com⎽user.png';   // 默认头像
import iconLfjl from '@/assets/appImages/home/icon_func_lfjl.png'; // 来访记录
import iconBfjl from '@/assets/appImages/home/icon_func_bfjl.png'; // 拜访记录
import iconKhgh from '@/assets/appImages/home/icon_func_khgh.png'; // 客户关怀

const router = useRouter();

// 计算属性，处理头像
const userAvatar = computed(() => {
    if (userInfo.value && userInfo.value.avatar) {
        return userInfo.value.avatar;
    } else {
        // return defaultAvatar
        return generateTextAvatar(userInfo.value?.username || '未知用户', false, {
            baseFontSize: 20 * 2.8,
            size: 192,
            isCircle: false,
        });
    }
});

// 计算属性-设置字符串超多指定字符后面展示省略号
const textEllipsis = computed(() => {
    return (str: string, num: number) => {
        if (str.length > num) {
            return str.slice(0, num) + '...';
        } else {
            return str;
        }
    };
});

// 是否显示菜单
function isShowMenu(menu: any) {
    if (menu) {
        return menu.type === "MENU" && menu.path && menu.path !== DEFAULT_MENU_PATH && menu.supportApp;
    }
    return false;
}
const menuList = computed(() => {
    const _nowList: any[] = [];

    function loop(list: any[]) {
        list.forEach((it: any) => {
            if (isShowMenu(it)) _nowList.push({ ...it });
            if (it.children && it.children.length) loop(it.children);
        });
    }

    loop(routerArray.value);

    console.log('处理前的菜单', routerArray.value);
    console.log('处理后的菜单', _nowList);

    return _nowList;
});

// 通过 code 匹配 appList，提取图标、名称等显示信息
const appDisplayList = computed(() => {
    const menuCodes = new Set(menuList.value.map((m: any) => m.code));
    return appList.value.filter((app) => menuCodes.has(app.code));
});

// 当前日期
const overviewDate = computed(() => dayjs().format('YYYY年MM月DD日'));

// 数据概览 - 与数据看板共用同一数据源
const { coreDataLoading, bannerLoading, coreData, bannerList } = useDashboardData();
const loading = computed(() => coreDataLoading.value && bannerLoading.value);

const overviewList = computed(() => [
    { label: '发货总览', value: formatDashboardValue(coreData.shipmentNum), unit: '万吨' },
    { label: '已回款', value: formatDashboardValue(coreData.payment), unit: '万元' },
    { label: '应回款', value: formatDashboardValue(coreData.amountDue), unit: '万元' },
]);

// 我的应用(静态菜单通过code匹配)
const appList = ref([
    { code: 'crm:settlement', name: '结算管理', icon: iconJsgl, path: '/settlementManage/settlement/index' },
    { code: 'crm:payment', name: '回款管理', icon: iconHkgl, path: '/settlementManage/payment/index' },
    { code: 'crm:daily_shipping_plan', name: '发货订单', icon: iconRfhgl, path: '/shippingManage/dailyShippingPlan/index' },
    { code: 'crm:ai_prediction', name: 'Ai预测', icon: iconAiyc, path: '/salesPlan/aiPrediction/index' },
    { code: 'crm:market_report', name: '市场报告', icon: iconScbg, path: '/marketInfo/marketReport/index' },
    { code: 'crm:industry_news', name: '行业动态', icon: iconHydt, path: '/marketInfo/industryNews/index' },
    { code: 'crm:chemical_company', name: '化工企业调研', icon: iconHgqydy, path: '/marketInfo/chemicalCompany/index' },
    { code: 'crm:competitor', name: '竞争对手调研', icon: iconJzdsdy, path: '/marketInfo/competitor/index' },
    { code: 'crm:visit_record', name: '来访记录', icon: iconLfjl, path: '/customerManage/visitRecord/index' },
    { code: 'crm:visit_plan', name: '拜访记录', icon: iconBfjl, path: '/customerManage/visitPlan/index' },
    { code: 'crm:customer_car', name: '客户关怀', icon: iconKhgh, path: '/customerManage/customerCare/index' },
]);

// 返回门户
const handleBackPortal = () => {
    showConfirmDialog({
        title: '退出提示',
        message: '确认退出系统？',
    })
        .then(() => {
            goToHome();
        })
        .catch(() => { });
};

// 进入数据看板
const handleGoDashboard = () => {
    router.push('/dashboard/index');
};

// 点击轮播图
const handleBannerClick = (banner: any) => {
    if (banner?.path) {
        router.push(banner.path);
    }
};

// 点击应用
const handleAppClick = (app: any) => {
    if (app?.path) {
        router.push(app.path);
    }
};
</script>

<style lang="less" scoped>
.app-home-page {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #f3f3f3;
}

/* 顶部渐变背景 */
.home-bg-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 320px;
    background: linear-gradient(180deg, #e0e8ff 0%, #f3f3f3 100%);
    pointer-events: none;
    z-index: 0;
}

/* 顶部安全区 */
.safe-area-top {
    height: env(safe-area-inset-top);
    position: relative;
    z-index: 1;
}

/* 底部安全区 */
.safe-area-bottom {
    height: calc(env(safe-area-inset-bottom) + 12px);
}

/* 滚动容器 */
.home-scroll-wrap {
    position: relative;
    z-index: 1;
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }
}

/* 页面标题 */
.home-header {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;

    .home-header-title {
        font-size: 17px;
        font-weight: 500;
        color: #1a1a1a;
        letter-spacing: 1px;
    }
}

.home-body {
    padding: 8px 12px 0;
}

/* 用户卡片 */
.user-card {
    display: flex;
    align-items: center;

    .avatar {
        width: 72px;
        height: 72px;
        flex-shrink: 0;
        overflow: hidden;
        background: #ffffff;
        border: 2px solid #ffffff;
        border-radius: 8px;
        box-sizing: border-box;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
        }
    }

    .info {
        flex: 1;
        margin-left: 12px;
        overflow: hidden;

        .name-row {
            display: flex;
            align-items: center;
            gap: 8px;

            .name {
                font-size: 17px;
                font-weight: 500;
                color: #1a1a1a;
            }

            .no-tag {
                display: inline-flex;
                align-items: center;
                padding-right: 6px;
                background: #ffffff;
                border-radius: 9px;
                font-weight: 400;
                font-size: 12px;
                color: #2C65F2;
                padding: 2px 10px 2px 1px;

                .prefix {
                    width: 16px;
                    height: 16px;
                    margin-right: 4px;
                }

            }
        }

        .phone {
            margin-top: 8px;
            font-size: 14px;
            color: #999999;
            letter-spacing: 0.5px;
        }

        .dept {
            margin-top: 4px;
            font-size: 12px;
            color: #999999;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .portal {
        position: absolute;
        right: 0;
        flex-shrink: 0;
        padding: 6px 10px;
        font-size: 12px;
        color: #666666;
        background: #ffffff;
        border-radius: 15px 0 0 15px;
        box-shadow: 0 2px 8px rgba(44, 101, 242, 0.08);

    }
}

/* 数据概览 */
.overview-card {
    position: relative;
    margin-top: 16px;
    width: 100%;
    padding: 0 8px 16px 12px;
    background-color: rgba(255, 255, 255, 0.7);
    background-image: url('@/assets/appImages/home/dataBoard_bg.png');
    background-repeat: no-repeat;
    background-position: center top;
    background-size: 100%;
    border-radius: 12px;

    .head {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            display: flex;
            align-items: baseline;
            gap: 4px;
            margin-top: 12px;

            .text {
                font-size: 16px;
                font-weight: 500;
                color: #333;

            }

            .date {
                font-size: 14px;
                color: #999999;
            }
        }

        .entry {
            display: flex;
            align-items: center;
            gap: 2px;
            border-radius: 0 12px 0 14px;
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            margin-top: 6px;

            :deep(.van-icon) {
                margin-left: 2px;
                margin-top: 2px;
            }
        }
    }

    .list {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;

        .item {
            flex: 1;
            min-width: 0;
            text-align: center;

            .value {
                display: flex;
                align-items: baseline;
                justify-content: center;
                gap: 4px;
                overflow: hidden;

                .num {
                    font-size: 18px;
                    font-weight: 500;
                    color: #1a1a1a;
                    font-family: 'DIN Alternate', 'PingFang SC-Semibold', sans-serif;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .unit {
                    font-weight: 500;
                    font-size: 12px;
                    color: #1a1a1a;
                    flex-shrink: 0;
                }
            }

            .label {
                margin-top: 10px;
                font-size: 14px;
                color: #999999;
            }
        }
    }
}

/* 轮播图 */
.banner-wrap {
    margin: 16px 0;
    border-radius: 12px;
}

.banner-swipe {
    /* height: 110px; */
}

.banner-item {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, #d8e3ff 0%, #a8c0ff 60%, #7ea4ff 100%);
}

.banner-content {
    position: absolute;
    top: 0;
    left: 0;
    padding: 16px 14px;
    color: #1a3a8a;
}

.banner-title {
    font-size: 16px;
    font-weight: 500;
}

.banner-tag {
    display: inline-block;
    margin-top: 8px;
    padding: 2px 8px;
    background: linear-gradient(90deg, #6a90ff 0%, #2c65f2 100%);
    color: #ffffff;
    font-size: 12px;
    border-radius: 4px;
}

.banner-time {
    margin-top: 10px;
    font-size: 12px;
    color: #4a6a9a;
}

/* 我的应用 */
.apps-card {
    padding: 16px 12px;
    background: #ffffff;
    border-radius: 12px;

    .apps-card-title {
        color: #1a1a1a;
        font-weight: 500;
        font-size: 16px;
    }
}

.apps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    row-gap: 16px;
    margin-top: 16px;
}

.apps-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;

    &:active {
        opacity: 0.8;
    }
}

.apps-grid-icon {
    width: 44px;
    height: 44px;
    object-fit: contain;
}

.apps-grid-name {
    margin-top: 8px;
    font-size: 14px;
    color: #333333;
    max-width: 72px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ==========================================================
   骨架屏
   ========================================================== */
.skeleton-line {
    background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 37%, #e8e8e8 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
    border-radius: 4px;
}

.skeleton-title {
    height: 16px;
    width: 80px;
}

/* 用户卡片骨架 */
.skeleton-user {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.skeleton-avatar {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    flex-shrink: 0;
    background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 37%, #e8e8e8 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
}

.skeleton-user-info {
    margin-left: 12px;
    flex: 1;

    .skeleton-name {
        width: 120px;
        height: 16px;
        margin-bottom: 10px;
    }

    .skeleton-phone {
        width: 80px;
        height: 14px;
    }
}

/* 数据概览骨架 */
.skeleton-overview {
    margin-top: 16px;
    padding: 16px 12px;
    background: #fff;
    border-radius: 12px;

    .skeleton-title {
        width: 100px;
        margin-bottom: 16px;
    }
}

.skeleton-overview-list {
    display: flex;
    justify-content: space-between;

    .skeleton-stat {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;

        .skeleton-stat-num {
            width: 60px;
            height: 18px;
        }

        .skeleton-stat-label {
            width: 48px;
            height: 14px;
        }
    }
}

/* 轮播图骨架 */
.skeleton-banner {
    margin: 16px 0;
    height: 110px;
    border-radius: 12px;
    background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 37%, #e8e8e8 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
}

/* 我的应用骨架 */
.skeleton-apps {
    padding: 16px 12px;
    background: #fff;
    border-radius: 12px;

    .skeleton-title {
        width: 80px;
        margin-bottom: 16px;
    }
}

.skeleton-apps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    row-gap: 16px;
}

.skeleton-app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.skeleton-app-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 37%, #e8e8e8 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
}

.skeleton-app-name {
    width: 56px;
    height: 14px;
}

@keyframes skeleton-loading {
    0% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0 50%;
    }
}
</style>
