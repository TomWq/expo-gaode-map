import ExpoModulesCore

public class ExpoSmartrefreshlayoutModule: Module {
    public func definition() -> ModuleDefinition {
        // 模块名称
        Name("ExpoSmartrefreshlayout")
        
        // 定义事件
        Events(
            "onRefresh",
            "onLoadMore",
            "onStateChanged",
            "onHeaderMoving",
            "onFooterMoving"
        )
        
        // 注册 View 组件
        View(ExpoSmartrefreshlayoutView.self) {
            
            // ------------------- Events -------------------
            Events(
                "onRefresh",
                "onLoadMore",
                "onStateChanged",
                "onHeaderMoving",
                "onFooterMoving"
            )
            
            // ------------------- Props -------------------
            
            // 基础配置
            Prop("enableRefresh") { (view: ExpoSmartrefreshlayoutView, value: Bool) in
                view.setEnableRefresh(value)
            }
            
            Prop("enableLoadMore") { (view: ExpoSmartrefreshlayoutView, value: Bool) in
                view.setEnableLoadMore(value)
            }
            
            Prop("enableAutoLoadMore") { (view: ExpoSmartrefreshlayoutView, value: Bool) in
                view.setEnableAutoLoadMore(value)
            }
            
            // Header 类型
            Prop("headerType") { (view: ExpoSmartrefreshlayoutView, value: String) in
                view.setHeaderType(value)
            }
            
            // 经典样式配置
            Prop("classicRefreshHeaderProps") { (view: ExpoSmartrefreshlayoutView, value: [String: Any]) in
                view.setClassicRefreshHeaderProps(value)
            }
            
            Prop("classicLoadMoreFooterProps") { (view: ExpoSmartrefreshlayoutView, value: [String: Any]) in
                view.setClassicLoadMoreFooterProps(value)
            }
            
            // 自定义 Header 标志
            Prop("hasCustomHeader") { (view: ExpoSmartrefreshlayoutView, value: Bool) in
                view.setHasCustomHeader(value)
            }
            
            // 触觉反馈
            Prop("enableHapticFeedback") { (view: ExpoSmartrefreshlayoutView, value: Bool) in
                view.setEnableHapticFeedback(value)
            }
        }
        
        // ------------------- Commands/Functions -------------------
        
        /**
         * 完成刷新操作
         * @param view 视图实例
         * @param success 是否刷新成功
         * @param delay 延迟时间（毫秒）
         */
        Function("finishRefresh") { (view: ExpoSmartrefreshlayoutView, success: Bool, delay: Int) in
            view.finishRefresh(success: success, delay: delay)
        }
        
        /**
         * 完成加载更多操作
         * @param view 视图实例
         * @param success 是否加载成功
         * @param delay 延迟时间（毫秒）
         * @param noMoreData 是否没有更多数据
         */
        Function("finishLoadMore") { (view: ExpoSmartrefreshlayoutView, success: Bool, delay: Int, noMoreData: Bool) in
            view.finishLoadMore(success: success, delay: delay, noMoreData: noMoreData)
        }
        
        /**
         * 自动刷新
         * @param view 视图实例
         * @param delay 延迟时间（毫秒）
         */
        Function("autoRefresh") { (view: ExpoSmartrefreshlayoutView, delay: Int) in
            view.autoRefresh(delay: delay)
        }
        
        /**
         * 自动加载更多
         * @param view 视图实例
         * @param delay 延迟时间（毫秒）
         */
        Function("autoLoadMore") { (view: ExpoSmartrefreshlayoutView, delay: Int) in
            view.autoLoadMore(delay: delay)
        }
        
        /**
         * 设置是否没有更多数据
         * @param view 视图实例
         * @param noMore 是否没有更多数据
         */
        Function("setNoMoreData") { (view: ExpoSmartrefreshlayoutView, noMore: Bool) in
            view.setNoMoreData(noMore: noMore)
        }
    }
}
