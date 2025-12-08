
// Expo Config Plugin 入口文件
// 这个文件会在用户运行 npx expo prebuild 时被调用

// 导入编译后的插件
const withGaodeMap = require('./plugin/build/withGaodeMap').default;

// 导出插件
module.exports = withGaodeMap;