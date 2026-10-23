import { h } from 'vue';
import {
    MxWebDataTable,
    MxPagination,
    MxDrawer,
    MxCustomIcon,
    MxWebPage,
    MxFileUpload 
} from '@mx/mx-ui'  // mx-ui组件

import dayjs from 'dayjs';
import MainLayout from './MainLayout.vue';
import BlankLayout from './BlankLayout.vue';
import PdfPreview from './PdfPreview.vue';

// 表格组件
// import MxWebDataTable from './MxWebDataTable/index.vue';

//分页组件
// import MxPagination from './Pagination/index.vue';

// 抽屉组件
// import MxDrawer from './MxDrawer/index.vue';

// 普通Web页面组件
// import MxWebPage from './WebPage/index.vue';

// 文件上传组件
// import MxFileUpload from './FileUpload/index.vue';

// web查询栏
import MxWebSearchBar from './MxWebSearchBar/index.vue';


// 富文本编辑
import MxEditor from './MxEditor/index.vue';
// 级联/树形选择
import MxCascaderTreeSelect from './MxCascaderTreeSelect/index.vue';
// 部门选择
import MxDeptSelect from './MxDeptSelect/index.vue';
// 部门人员选择
import MxDeptUserSelect from './MxDeptUserSelect/index.vue';

// 标签
import MxTag from './MxTag/index.vue';
// 简易标签
import StatusTag from './StatusTag/index.vue';
// 按钮
import MxButton from './MxButton/index.vue';

// 人员选择组件
import MxPersonSelect from './PersonSelect/index.vue';
// 通用选择组件
import MxCommSelect from './CommSelect/index.vue';

// 字典组件
import MxDict from './MxDict/index.vue';
// 详情小标题
import DetailsTitle from './DetailsTitle/index.vue';
// tab栏
import MxTab from './MxTab/index.vue';
// 详情页面组件
import MxDetailPage from './MxDetailPage/index.vue';
// 时间线组件
import MxTimeLine from './MxTimeLine/index.vue';
// 审批选择组件
import MxApprovalSelect from './MxApprovalSelect/index.vue';
// 空数据组件
import Empty from './Empty/index.vue';
// 审批信息
import ApprovalDetails from './ApprovalDetails/index.vue';
export default function plugin(app) {
    // 时间过滤器
    app.config.globalProperties.$filters = {
        dateFormat: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
            const newData = dayjs(date);
            // 校验时间是否有效,无效则返回原时间
            if (!newData.isValid()) {
                return date;
            }
            return newData.format(format);
        },
    };

    /**
     * 全局loading效果
     * @param {string|object} msg loading配置对象
     */

    window.$loading = app.config.globalProperties.$loading = (msg) => {
        // 如果msg为空,则默认显示加载中...
        if (!msg) {
            msg = { message: '加载中...', width: 46 };
        }
        // 如果msg为字符串,则默认宽度为46
        if (typeof msg === 'string') {
            msg = { message: msg, width: 46 };
        }
        // 如果msg.message为空,则默认显示加载中...
        if (!msg.message) {
            msg.message = '加载中...';
        }
        // 如果msg.width为空,则默认宽度为46
        if (!msg.width) {
            msg.width = 46;
        }
        // 创建loading框
        let _box = document.createElement('div');
        _box.setAttribute(
            'style',
            'display: none;position: fixed;top: 0;left: 0;width: 100%;height: 100%;z-index: 99999999999999;'
        );
        // 创建loading蒙层
        let _mask = document.createElement('div');
        _mask.setAttribute(
            'style',
            'display: block;position: absolute;top: 0;left: 0;width: 100%;height: 100%;background: rgba(0, 0, 0, .2);z-index: 1;'
        );
        // 创建loading内容
        let _content = document.createElement('div');
        _content.setAttribute('style', 'display: block;position: absolute;top: 38%;left: 0;width: 100%;z-index: 2;');
        // 创建loading图标
        let _icon = document.createElement('div');
        _icon.setAttribute('class', 'loading_container');
        _icon.setAttribute('style', `width: ${msg.width}px;height: ${msg.width}px;`);

        // 创建8个dot元素
        for (let i = 0; i < 8; i++) {
            let dot = document.createElement('div');
            dot.setAttribute('class', 'dot');
            _icon.appendChild(dot);
        }
        // 创建loading文字

        // 将loading内容添加到蒙层中
        _box.appendChild(_mask);
        _box.appendChild(_content);
        _content.appendChild(_icon);
        document.body.appendChild(_box);
        return {
            close() {
                setTimeout(() => {
                    _box.remove();
                }, 200);
            },
            show() {
                _box.style.display = 'block';
            },
            hide() {
                _box.style.display = 'none';
            },
        };
    };
    // 全局布局组件
    app.component('MainLayout', MainLayout);
    // 普通Web页面组件
    app.component('WebPage', MxWebPage);
    app.component('BlankLayout', BlankLayout);
    app.component('PdfPreview', PdfPreview);
    app.component('MxPagination', MxPagination);
    app.component('MxWebDataTable', MxWebDataTable);
    app.component('MxWebSearchBar', MxWebSearchBar);
    app.component('MxCascaderTreeSelect', MxCascaderTreeSelect);
    app.component('MxDeptSelect', MxDeptSelect);
    app.component('MxDeptUserSelect', MxDeptUserSelect);
    app.component('MxTag', MxTag);
    app.component('StatusTag', StatusTag);
    app.component('MxButton', MxButton);
    app.component('MxCustomIcon', MxCustomIcon);
    app.component('MxPersonSelect', MxPersonSelect);
    app.component('MxCommSelect', MxCommSelect);
    // 包装 MxFileUpload，兼容 fileName 默认值（当前项目使用 'fileName'，第三方默认 'name'）
    const MxFileUploadWrapper = {
        name: 'MxFileUploadWrapper',
        setup(_props, { attrs, slots }) {
            return () => h(MxFileUpload, {
                fileName: 'fileName',
                ...attrs,
            }, slots);
        }
    };
    app.component('MxWebFileUpload', MxFileUploadWrapper);
    app.component('MxDrawer', MxDrawer);
    app.component('MxEditor', MxEditor);
    app.component('MxDict', MxDict);
    app.component('DetailsTitle', DetailsTitle);
    app.component('MxTab', MxTab);
    app.component('MxDetailPage', MxDetailPage);
    app.component('MxTimeLine', MxTimeLine);
    app.component('MxApprovalSelect', MxApprovalSelect);
    app.component('Empty', Empty);
    app.component('ApprovalDetails', ApprovalDetails);
}
