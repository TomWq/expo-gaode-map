
import { NativeModule, requireNativeModule } from 'expo';
import type { ExpoGaodeMapModuleEvents } from './ExpoGaodeMap.types';


declare class ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  // 地图控制方法已移至 MapView 的 ref 调用
  // 使用方式: mapRef.current.moveCamera() 等
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoGaodeMapModule>('ExpoGaodeMap');
