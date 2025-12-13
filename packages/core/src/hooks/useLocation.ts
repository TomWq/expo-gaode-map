
// useLocation.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type { Coordinates, ReGeocode,UseLocationOptions,UseLocationResult } from '../types';


export function useLocation(options: UseLocationOptions = {}): UseLocationResult {
  const { autoStart = false, autoGet = false } = options;

  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [timestamp, setTimestamp] = useState<number | null>(null);

  const listenerRef = useRef<{ remove: () => void } | null>(null);

  // ⭐ 连续定位：订阅原生 listener
  const start = useCallback(() => {
    ExpoGaodeMapModule.start();
    setIsStarted(true);

    // 避免重复注册 listener
    if (!listenerRef.current) {
      listenerRef.current = ExpoGaodeMapModule.addLocationListener((loc) => {
        setLocation(loc);
        setTimestamp(Date.now());
      });
    }
  }, []);

  // ⭐ 停止连续定位
  const stop = useCallback(() => {
    ExpoGaodeMapModule.stop();
    setIsStarted(false);

    listenerRef.current?.remove();
    listenerRef.current = null;
  }, []);

  // ⭐ 一次定位（自动处理连续定位冲突）
  const get = useCallback(async () => {
    // 如果连续定位运行中 → 直接返回最新位置（高德 iOS 官方行为）
    if (isStarted && location) {
      return location;
    }

    // 否则执行一次定位
    const loc = await ExpoGaodeMapModule.getCurrentLocation();
    setLocation(loc);
    setTimestamp(Date.now());
    return loc;
  }, [isStarted, location]);

  // 自动触发连续定位
  useEffect(() => {
    if (autoStart) start();

    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  // 自动获取一次定位
  useEffect(() => {
    if (autoGet) get();
  }, [autoGet, get]);

  return {
    location,
    isStarted,
    start,
    stop,
    get,
    timestamp,
  };
}

//🌟 自动连续定位 + 实时位置
//const { location, isStarted } = useLocation({ autoStart: true });

//🌟 页面进入获取一次当前位置（自动）
//const { location, get } = useLocation({ autoGet: true });

//🌟 按钮点击定位（不会受连续定位影响）
// const { get } = useLocation();
// const handlePress = async () => {
//   const loc = await get();
//   console.log("按钮定位：", loc);
// };