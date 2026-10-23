// 子应用中的返回管理模块
class BackButtonManager {
  constructor() {
    this.isInWujie = window.__POWERED_BY_WUJIE__;
    this.isFromMainSystem = false;
    this.init();
  }
  
  init() {
    if (this.isInWujie) {
      this.setupWujieCommunication();
    }
    this.setupBrowserBackListener();
  }
  
  setupWujieCommunication() {
    const { bus } = window.$wujie || {};
    
    if (bus) {
      // 监听主系统的返回指令
      bus.$on('main-system-back', () => {
        this.isFromMainSystem = true;
        this.handleMainSystemBack();
      });
      
      // 通知主系统子应用已就绪
      bus.$emit('subapp-initialized', {
        canHandleBack: true
      });
    }
  }
  
  setupBrowserBackListener() {
    // 监听物理返回键
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });
    
    // 监听页面隐藏（适用于 App 内 WebView）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHide();
      }
    });
  }
  
  handleMainSystemBack() {
    // 主系统触发的返回
    const router = window.subAppRouter; // 假设你保存了路由实例
    
    if (router && router.currentRoute.value.meta.requireBackConfirm) {
      // 如果需要确认，显示确认对话框
      this.showBackConfirm().then(confirmed => {
        if (confirmed) {
          if (window.history.length > 1) {
            router.go(-1);
          } else {
            this.notifyMainSystemToClose();
          }
        }
      });
    } else {
      if (window.history.length > 1) {
        router.go(-1);
      } else {
        this.notifyMainSystemToClose();
      }
    }
  }
  
  handlePopState(event) {
    if (this.isFromMainSystem) {
      this.isFromMainSystem = false;
      return;
    }
    
    // 浏览器物理返回键
    if (this.isInWujie && window.history.length <= 1) {
      // 子应用没有历史记录，通知主系统
      this.notifyMainSystemToClose();
      event.preventDefault(); // 阻止默认行为
    }
  }
  
  handlePageHide() {
    // 页面被隐藏，可能是用户切换到了其他 App
    console.log('页面被隐藏');
  }
  
  notifyMainSystemToClose() {
    if (this.isInWujie && window.$wujie?.bus) {
      window.$wujie.bus.$emit('subapp-request-close');
    }
  }
  
  showBackConfirm() {
    return new Promise((resolve) => {
      // 使用 UI 框架的确认对话框
      ElMessageBox.confirm('确定要返回吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  }
}

