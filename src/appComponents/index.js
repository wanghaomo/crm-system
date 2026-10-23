import AppPage from './AppPage/index.vue';
import MxAppDatePicker from './MxAppDatePicker/index.vue';
// import MxAppDescriptions from './MxAppDescriptions/index.vue';
import MxAppListItem from './MxAppListItem/index.vue';
import MxAppSearchActionItem from './MxAppSearchActionItem/index.vue';
import MxAppSearchBar from './MxAppSearchBar/index.vue';
import MxAppTable from './MxAppTable/index.vue';
import MxAppDeptTreeSelect from './MxAppDeptTreeSelect/index.vue';
import MxAppTreeSelect from './MxAppTreeSelect/index.vue';
import AppTag from './AppTag/index.vue';
import {MxAppDescriptions} from '@mx/mx-ui';

export default function install(app) {
    app.component('AppPage', AppPage);
    app.component('MxAppDatePicker', MxAppDatePicker);
    app.component('MxAppDescriptions', MxAppDescriptions);
    app.component('MxAppListItem', MxAppListItem);
    app.component('MxAppSearchActionItem', MxAppSearchActionItem);
    app.component('MxAppSearchBar', MxAppSearchBar);
    app.component('MxAppTable', MxAppTable);
    app.component('MxAppDeptTreeSelect', MxAppDeptTreeSelect);
    app.component('MxAppTreeSelect', MxAppTreeSelect);
    app.component('AppTag', AppTag);
}
