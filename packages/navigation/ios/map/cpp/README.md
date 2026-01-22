# C++ 共享核心库 (Shared Core)

该目录包含了 `expo-gaode-map` 跨平台核心逻辑的 C++ 实现。这些代码被 Android 和 iOS 平台共享，以确保计算逻辑的一致性并提升高性能计算场景（如点聚合、几何计算）的处理速度。

## 模块说明

### 1. GeometryEngine (几何引擎)
[GeometryEngine.hpp](file:///Users/wangqiang/Desktop/expo-gaode-map/packages/core/shared/cpp/GeometryEngine.hpp)
提供地理空间相关的数学计算：
- **距离计算**: 基于 Haversine 公式计算经纬度点之间的球面距离。
- **点位判断**: 判断点是否在多边形 (Point-in-Polygon) 或圆形内。
- **面积计算**: 计算多边形或矩形的地理面积。
- **轨迹处理**:
    - **抽稀算法**: 实现 Ramer-Douglas-Peucker 算法，用于简化复杂的折线轨迹。
    - **路径长度**: 计算折线段的总长度。
    - **路径插值**: 获取路径上指定距离的点坐标及其切线方向。
- **GeoHash**: 支持经纬度到 GeoHash 字符串的编码。
- **质心计算**: 计算多边形的几何质心。

### 2. ClusterEngine (点聚合引擎)
[ClusterEngine.hpp](file:///Users/wangqiang/Desktop/expo-gaode-map/packages/core/shared/cpp/ClusterEngine.hpp)
负责大规模地图标记点的聚合计算：
- 使用 **QuadTree** 进行空间索引优化。
- 支持基于半径的聚合逻辑。
- 高性能处理，适用于数千甚至数万个点的实时聚合。

### 3. QuadTree (四叉树)
[QuadTree.hpp](file:///Users/wangqiang/Desktop/expo-gaode-map/packages/core/shared/cpp/QuadTree.hpp)
为地理坐标提供高效的空间索引结构：
- **空间分割**: 自动将空间划分为四个象限。
- **范围查询**: 快速检索指定矩形区域内的所有点位。
- 被 `ClusterEngine` 用于加速近邻点搜索。

### 4. ColorParser (颜色解析器)
[ColorParser.hpp](file:///Users/wangqiang/Desktop/expo-gaode-map/packages/core/shared/cpp/ColorParser.hpp)
跨平台的颜色字符串解析工具：
- 支持 **Hex** 格式 (如 `#RRGGBB`, `#AARRGGBB`, `#RGB`)。
- 支持 **RGB/RGBA** 函数格式 (如 `rgba(255, 0, 0, 0.5)`)。
- 支持 **命名颜色** (如 `red`, `blue`, `transparent`)。
- 统一输出为 `0xAARRGGBB` 格式的 32 位整数。

## 测试

测试用例位于 `tests/` 目录。

### 运行测试
在 macOS/Linux 环境下，可以通过以下命令运行 C++ 单元测试：

```bash
cd tests
chmod +x run.sh
./run.sh
```

该脚本会使用 `clang++` 编译源代码并运行生成的测试二进制文件，验证各核心模块的逻辑准确性。
