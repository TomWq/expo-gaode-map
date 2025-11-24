/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2024-07-09 16:16:06
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-11-24 10:01:11
 * @FilePath     : /jintan-app/hook/useMap.ts
 * @Description  :  地图的hook
 *
 * Copyright (c) 2024 by 尚博信_王强, All Rights Reserved.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";

import {initSDK, requestLocationPermission, ExpoGaodeMapModule, ReGeocode, Coordinates, checkLocationPermission, getCurrentLocation, addLocationListener, MapViewRef, CameraPosition, configure} from 'expo-gaode-map'

import { HapticsUtil } from "@/utils/Haptics";
import { router, useLocalSearchParams } from "expo-router";
import useCameraStore, { Photo } from "@/store/useCameraStore";
import usePermissions from "./usePermissions";
import {
  ApprovePass,
  ApproveReject,
  CancelApproval,
  FieldworkClockInReSubmit,
  GeneratePresignedUri,
  GetApprovalDetail,
  GetClockCalendar,
  GetClockEx,
  GetClockRecord,
  GetCurrentClock,
  GetListForAppAndApprove,
  GetListForAppAndStart,
  GetRuleForClock,
  PunchClock,
  ReSubmitApproval,
  SubmitForLeave,
} from "@/api";
import useTeamsStore from "@/store/useTeamsStore";
import useAuthStore from "@/store/useAuthStore";
import RNFetchBlob from "react-native-blob-util";
import {
  ClockRecordResponse,
  CurrentClockRequest,
  GetApprovalDetailResponse,
  GetClockExResponse,
  GetListForAppAndStartRequest,
  GetListForAppAndStartResponse,
  JintanIdentityServiceClocksDtosClockApplyInfoDto,
  JintanIdentityServiceClocksDtosRulePoints,
  PunchClockRequest,
  RuleForClockResponse,
  SubmitForLeaveRequest,
} from "@/types/teams";
import {
  formatTime,
  formatTimeClockYMD,
  formatTimeYMD,
  haversineDistance,
  isNotEmpty,
} from "@/utils/Fun";
import { startActivityAsync, ActivityAction } from "expo-intent-launcher";
import AttendancePopupModal from "@/lib/Popup/AttendancePopup";
import AttendanceShiftPopupModal from "@/lib/Popup/AttendanceShiftPopup";
import CoustomLoad from "@/lib/Load/CoustomLoad";
import { ShowNormalPicker, ShowTimePicker } from "@/lib/Picker";
import CommonConstants from "@/hook/constants/CommonConstants";
import { useEffectSkipFirst } from "@/components/useEffectSkipFirst";
import ApplyForDialog from "@/lib/Dialog/ApplyForDialog";
import { ApiResponse } from "apisauce";
import { useCallStore } from "@/store/useCallStore";
import CommonDatePopupModal from "@/lib/Popup/CommonDatePopup";
import dayjs from "dayjs";
import { trackEvent } from "@/utils/Umeng";
import { toast } from "sonner-native";
import ConfirmDialog from "@/lib/Dialog/ConfirmDialog";


export default function useMap() {
  const { checkLocationPermissions, isLocationPermissions } = usePermissions();
    const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const mapViewRef = useRef<MapViewRef>(null);
  const { currentTeam, setClockType, clockType } = useTeamsStore();
  const { userInfo, appPositions } = useAuthStore();
  const { photo, setCameraType, setPhoto } = useCameraStore();
  const { setRefreshMap, refreshMap } = useCallStore();
  const { status, applyTime, id } = useLocalSearchParams<{
    status?: string;
    applyTime?: string;
    id?: string;
  }>();
  const [clockInCoord, setClockInCoord] = useState<
    JintanIdentityServiceClocksDtosRulePoints[]
  >([]);
  //是否在打卡范围内
  const [isWithinRange, setIsWithinRange] = useState(false);
  //考勤规则的data
  const [clockRule, setClockRule] = useState<RuleForClockResponse[]>([]);
  //选中的考勤规则
  const [clockRuleIndex, setClockRuleIndex] = useState<number>(0);
  //考勤班次的data
  const [shifts, setShifts] = useState<string[]>([]);
  //选中的班次
  const [shiftIndex, setShiftIndex] = useState<number>(0);
  //打卡范围
  const [clockRange, setClockRange] = useState<number>(0);
  //补卡的考勤规则选中的，支持多选
  const [replaceClockRuleIndex, setReplaceClockRuleIndex] = useState<number[]>(
    []
  );
  //补卡的类型选择
  const [replaceTypeSelectItem, setReplaceTypeSelectItem] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  //补卡时间的选择
  const [replaceTime, setReplaceTime] = useState<string | undefined>(applyTime);
  //补卡天数
  const [replaceDay, setReplaceDay] = useState<number>(1);
  //申请原因
  const [applyReason, setApplyReason] = useState<string>("");

  //审批页状态：提交还是查阅
  const [isApprove, setIsApprove] = useState<string>("102");
  //补卡按钮是否可以点击
  const [isReplaceEnable, setIsReplaceEnable] = useState(false);
  //打卡记录列表
  const [clockRecordList, setClockRecordList] = useState<ClockRecordResponse[]>(
    []
  );
  //打卡日历
  const [clockDayList, setClockDayList] = useState<string[]>([]);
  //补卡请假审批日期筛选
  const [applyForDate, setApplyForDate] = useState<string | undefined>();
  //补卡请假审批审核状态筛选
  const [applyForStatus, setApplyForStatus] = useState<{
    label: string;
    value: string;
  }>({ label: "", value: "" });
  //补卡请假审批列表
  const [applyForList, setApplyForList] = useState<
    JintanIdentityServiceClocksDtosClockApplyInfoDto[]
  >([]);
  //补卡请假审批的审批流水data
  const [applyForPreviewList, setApplyForPreviewList] =
    useState<GetApprovalDetailResponse>();
  const [totalCount, setTotalCount] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  //考勤详情页的规则名称
  const [clockRuleName, setClockRuleName] = useState<string>(
    clockRule[clockRuleIndex]?.ruleName || ""
  );
  const [mapState, setMapState] = useState(true);
  //异常规则的数组
  const [abnormalRule, setAbnormalRule] = useState<GetClockExResponse[]>([]);
  //是否支持外勤打卡
  const [isSupportOutWork, setIsSupportOutWork] = useState(false);


  let timer = useRef<NodeJS.Timeout | number>(0);

  const [data, setData] = useState<{
    location: ReGeocode | null;
    isListener: boolean;
    isStarted: boolean;
    isGps: boolean;
    isLocationCacheEnable: boolean;
  }>({
    location: null,
    isListener: false,
    isStarted: false,
    isGps: false,
    isLocationCacheEnable: true,
  });

  useEffect(() => {
    //先判断是否有定位权限
    // checkLocationPermissions()
    //获取考勤规则
    //  getClockInRule()
  }, []);

  // useEffect(() => {
  //   if (appPositions[0] !== '专员') {
  //     return
  //   }


  //    const initialize = async () => {
  //      try {
  //       initSDK({
  //         androidKey:'dcee3ae4bd6a53b44fbd3d55b9996cbf',
  //         iosKey:'b09eaba1eeca575db7a89b9738cb0246'
  //       })

  //         // 2. 检查并请求权限
  //      const status = await checkLocationPermission();
  //       if (!status.granted) {
  //         const result = await requestLocationPermission();
  //         if (!result.granted) {
  //           setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
  //           return;
  //         }
  //       }

  //       configure({
  //         withReGeocode: true,
  //         interval: 5000,
  //         // allowsBackgroundLocationUpdates: true,
  //         distanceFilter: 10,
  //         accuracy:3
  //       });

  //       const subscription = addLocationListener((location) => {
  //         if (location.latitude && location.longitude) {
  //             setData({ ...data, location: location as ReGeocode });
  //           } else {
  //             setData({
  //               ...data,
  //               //@ts-ignore
  //               location: {
  //                 ...location,
  //                 latitude: 0,
  //                 longitude: 0,
  //               },
  //             });
  //           }
  //       });
        
  //       const loc = await getCurrentLocation();
  //       setData({ ...data, location: loc as ReGeocode });
  //       setInitialPosition({
  //         target: { latitude: loc.latitude, longitude: loc.longitude },
  //         zoom: 16
  //       });
        
  //       return () => subscription.remove();
      
      
      
  //     } catch (error) {
  //       console.log("error:", error);
  //     }
  //    }

  //    initialize()

  //   // 开始定位
  //   ExpoGaodeMapModule.start();

  //   return () => {
  //     ExpoGaodeMapModule.stop();
  //     // listener && listener?.remove();
  //     timer.current && clearTimeout(timer.current);
  //   };
  // }, [isLocationPermissions, appPositions]);

  useEffect(() => {
  if (appPositions[0] !== '专员') {
    return
  }

  const initialize = async () => {
    try {
      // 1. 初始化 SDK
      // initSDK({
      //   androidKey:'dcee3ae4bd6a53b44fbd3d55b9996cbf',
      //   iosKey:'b09eaba1eeca575db7a89b9738cb0246'
      // })

      // 2. 检查并请求权限
      const status = await checkLocationPermission();
      if (!status.granted) {
        const result = await requestLocationPermission();
        if (!result.granted) {
          setInitialPosition({ 
            target: { latitude: 39.9, longitude: 116.4 }, 
            zoom: 15 
          });
          return;
        }
      }

      // 3. 配置定位
      configure({
        withReGeocode: true,
        interval: 5000,
        distanceFilter: 1,
        accuracy: 3
      });

      // 4. 添加监听
      const subscription = addLocationListener((location) => {
        if (location.latitude && location.longitude) {
          setData({ ...data, location: location as ReGeocode });
        } else {
          setData({
            ...data,
            location: {
              ...location,
              latitude: 0,
              longitude: 0,
            },
          });
        }
      });
      
      // 5. 获取当前位置
      const loc = await getCurrentLocation();
      setData({ ...data, location: loc as ReGeocode });
      setInitialPosition({
        target: { latitude: loc.latitude, longitude: loc.longitude },
        zoom: 16
      });
      
      // ✅ 关键：在所有初始化完成后再 start()
      ExpoGaodeMapModule.start();
      
      return subscription;
      
    } catch (error) {
      console.log("error:", error);
    }
  }

  // 调用初始化函数并保存清理函数
  let cleanupFn: (() => void) | undefined;
  initialize().then(result => {
    // result 是一个 subscription 对象，不是函数
    cleanupFn = result ? () => result.remove() : undefined;
  });

  // 清理函数
  return () => {
    ExpoGaodeMapModule.stop();
    if (cleanupFn) {
      cleanupFn();
    }
    timer.current && clearTimeout(timer.current);
  };
}, [appPositions]);


  useEffect(() => {
    // setIsApprove(status)
    if (appPositions[0] === CommonConstants.role_name_attache) {
      //如果是专员
      //如果是提交，
      if (status === "") {

        getClockInRule();
        setIsReplaceEnable(true);
      } else if (status === "104" || status === "102" || status === "103") {
        applyForPreview();
        setIsReplaceEnable(false);
      }
    } else {
      //如果是经理或者组长
      //如果是要审批
      // applyForPreview();
      setIsReplaceEnable(false);
    }
  }, [status]);

  useEffectSkipFirst(() => {
    if (refreshMap) {
      getClockRecord();
    }
  }, [refreshMap]);

  const getClockInRule = async () => {
    try {
      // 设置加载状态
      setMapState(true);

      // 准备参数
      let params = {
        teamId: currentTeam?.id || "",
      };

      // 使用 Promise.all 并行请求数据
      const ruleResult = await GetRuleForClock(params);

      if (!ruleResult.ok || !ruleResult.data) {
        toast.info("提示", {
          description: "获取考勤规则失败，请刷新重新获取",
        });
        return;
      }

      if(ruleResult.data.length === 0){
         toast.info("提示", {
          description: "未找到考勤规则，请先在金探后台配置",
        });
        return;
      }

      // 批量更新状态，减少重渲染次数
      const firstRule = ruleResult.data[0];

      // 一次性设置所有状态
      setClockRule(ruleResult.data);
      if (firstRule.rulePoints) {
        setClockInCoord(firstRule.rulePoints);
      }
      if (firstRule.frequency) {
        setShifts(firstRule.frequency);
      }
      if (firstRule.clockRange) {
        setClockRange(firstRule.clockRange);
      }
      if (firstRule.isFieldworkClockIn) {
        setIsSupportOutWork(firstRule.isFieldworkClockIn)
      }

      // 获取打卡状态
      if (firstRule.id) {
        const clockParams = {
          userId: userInfo?.id,
          ruleId: firstRule.id,
          clockSeq: 1,
        };

        const clockResult = await GetCurrentClock(clockParams);
        if (clockResult.ok && clockResult.data) {
          setClockType(clockResult.data);
        }
      }
    } catch (error) {
      console.log("获取考勤规则失败", error);
      throw error; // 重要：确保错误被传播出去
    } 
    // 无论成功失败都关闭加载状态
    setMapState(false);
  };

  const getClockInShow = async (params: CurrentClockRequest) => {
    // CoustomLoad.show('正在获取打卡状态...')
    try {
      const result = await GetCurrentClock(params);
      if (result.ok && result.data) {
        setClockType(result.data);
      }
    } catch (error) {
      console.log(error);
    } 
    CoustomLoad.hide();
  };
  //item.lat || 0, item.lon || 0, data.location?.latitude || 0, data.location?.longitude || 0

  useEffect(() => {
    if (clockInCoord && clockInCoord.length > 0 && data.location) {
      // 使用 requestAnimationFrame 优化频繁计算
      requestAnimationFrame(() => {
        const index = clockInCoord.some((item) => {
          return (
            haversineDistance(
              { latitude: item.lat || 0, longitude: item.lon || 0 },
              {
                latitude: data.location?.latitude || 0,
                longitude: data.location?.longitude || 0,
              }
            ) <= clockRange
          );
        });
        setIsWithinRange(index);
      });
    }
  }, [
    clockInCoord,
    data.location?.latitude,
    data.location?.longitude,
    clockRange,
  ]);

  // 计算两个地理坐标之间的距离（单位：米）
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  //拍照
  const takePhoto = async () => {
    setCameraType("CLOCK");
    // 在这里清空照片，确保每次拍照都是新的

    HapticsUtil.triggerHaptic();
    // //打开相机
    router.push({
      pathname: "/camera-modal-clock",
      params: {
        type: "camera",
        location: JSON.stringify(data.location),
      },
    });
  };

  //打卡
  const ClockIn = async () => {
    trackEvent("click_clock_in", "考勤打卡", {
      page: "考勤打卡页",
    });
    //是否在打卡范围内
    if (!isWithinRange) {
      if (!isSupportOutWork) {
        toast.info("打卡提示", {
          description: "当前位置不在考勤范围无法打卡",
        });
        return;
      }
    }

    console.log("photo:", photo);

    //必须要有照片
    if (!isNotEmpty(photo.content)) {
      toast.info("打卡提示", {
        description: "请先上传打卡照片",
      });

      return;
    }

    if (clockType === 1001) {
      CoustomLoad.show("上班打卡中...");
    } else {
      CoustomLoad.show("下班打卡中...");
    }

    try {
      let params: PunchClockRequest = {
        clockLat: data.location?.latitude || 0,
        clockLon: data.location?.longitude || 0,
        clockPositionName: data.location?.address || "",
        clockTime: formatTime(new Date()),
        teamId: currentTeam?.id,
        userId: userInfo?.id,
        clockRuleId: clockRule[clockRuleIndex]?.id || "",
        clockSeq: shiftIndex + 1,
        hasImages: photo ? true : false,
      };
      //先对图片进行检查,如果没有图片直接提交,如果有图片先上传再提交
      if (photo) {
        const image_res = await generatePresignedUri([photo]);
        if (image_res && image_res.length > 0) {
          params.clockPic = image_res[0];
        }
      }
      const result = await PunchClock(params);
      if (result.ok) {
        CoustomLoad.hide();
        toast.success(`${clockType === 1001 ? "上班" : "下班"}打卡成功`, {
          onAutoClose: () => {
            //如果有拍照，就清空拍照
            setPhoto({} as Photo);
            getClockInShow({
              userId: userInfo?.id,
              ruleId: clockRule[clockRuleIndex]?.id,
              clockSeq: shiftIndex + 1,
            });
            setRefreshMap(true);
          },
        });
      } else {
      }
    } catch (error) {
      console.log(error);
      CoustomLoad.hide();
    } 
    CoustomLoad.hide();
  };

  //移动到当前位置
  const moveToCurrentLocation = async() => {
    HapticsUtil.triggerHaptic();
   
    try {
      // ✅ 优先使用 data.location（实时更新的位置）
      let location = data.location;
      
      // 如果 data.location 不存在或无效，才重新获取
      if (!location || !location.latitude || !location.longitude) {
        location = await getCurrentLocation() ;
      }
      
      // 确保有有效的坐标
      if (location && location.latitude && location.longitude) {
        if (mapViewRef.current) {
          await mapViewRef.current.moveCamera({
            target: {
              latitude: location.latitude,
              longitude: location.longitude
            },
            zoom: 16,
          }, 300);
        }
      } else {
        toast.info("提示", {
          description: "无法获取当前位置，请稍后再试"
        });
      }
      
    } catch (error) {
      console.log("moveToCurrentLocation error:", error);
      toast.info("提示", {
        description: "定位失败，请检查定位权限"
      });
    }
  };

  //生成用于上传前面的url
  const generatePresignedUri = async (params: Photo[]) => {
    try {
      const promise = params.map(async (item) => {
        const result = await GeneratePresignedUri("CLOCK");
        if (result.ok) {
          const res = await uploadPhoto(result.data?.url, item.content);
          //fileName的文件名结尾都换成.png
          let fileName = item.fileName?.replace(/\.\w+$/, ".png");
          return {
            fullUrl: result.data?.fullUrl,
            fileName: fileName,
          };
        }
      });
      const res = await Promise.all(promise);

      return res;
      // return res.filter(item => item)
    } catch (error) {
      console.log(error);
    }
  };

  //上传图片
  const uploadPhoto = async (uri?: string, realPath?: string) => {
    if (!uri || !realPath) return false;
    RNFetchBlob.fetch(
      "PUT",
      uri,
      { "Content-Type": "application/octet-stream" },
      RNFetchBlob.wrap(decodeURIComponent(realPath))
    )
      .uploadProgress({ count: 10, interval: -1 }, (received, total) => {
        console.log(`Received: ${received}, total: ${total}`);
      })
      .progress({ count: 10, interval: -1 }, (received, total) => {
        console.log(`Received: ${received}, total: ${total}`);
      })
      .then((res) => {
        console.log("OSS上传成功", JSON.stringify(res));
        return true;
      })
      .catch((err) => {
        console.log("OSS上传失败", JSON.stringify(err));
        return false;
      });
  };

  //选择考勤规则
  const chooseClockRule = () => {
    //判断是否有考勤规则
    if (!clockRule || clockRule.length === 0) {
      toast.info("温馨提示", {
        description: "未找到考勤规则，请先在金探后台配置",
      });

      return;
    }

    HapticsUtil.triggerHaptic();
    AttendancePopupModal.show({
      data: clockRule,
      chooseRule: clockRuleIndex,
      selectCallBack: () => {
        //@ts-ignore
        //  mapViewRef?.current?.moveCamera({
        //   zoom:10,
        // },100)
      },
      callBack: (value) => {
        //如果考勤规则为空
        if (!clockRule[value]) return;

        setClockRuleIndex(value);
        //进行考勤班次的赋值
        setShifts(clockRule[value]?.frequency || []);
        setShiftIndex(0);
        //进行打卡点的赋值
        setClockInCoord(clockRule[value]?.rulePoints || []);
        //进行打卡范围的赋值
        setClockRange(clockRule[value]?.clockRange || 0);
        getClockInShow({
          userId: userInfo?.id,
          ruleId: clockRule[value]?.id,
          clockSeq: 1,
        });
        setIsSupportOutWork(clockRule[value]?.isFieldworkClockIn || false);
        //@ts-ignore
        // mapViewRef?.current?.moveCamera(
        //   {
        //     zoom: 16,
        //   },
        //   100
        // );
        moveToCurrentLocation()
      },
    });
  };

  //选择班次
  const chooseShift = () => {
    //先判断是否选择了考勤规则
    if (!clockRule || clockRule.length === 0) {
      toast.info("温馨提示", {
        description: "未找到考勤规则，请先在金探后台配置",
      });

      return;
    }

    HapticsUtil.triggerHaptic();
    AttendanceShiftPopupModal.show({
      data: shifts,
      chooseShift: shiftIndex,
      callBack: (value) => {
        //如果班次为空
        if (!shifts[value]) return;

        setShiftIndex(value);
        getClockInShow({
          userId: userInfo?.id,
          ruleId: clockRule[clockRuleIndex]?.id,
          clockSeq: value + 1,
        });
      },
    });
  };

  //补卡申请选择考勤规则
  const applyForClockRule = () => {
    //判断是否有考勤规则
    if (!clockRule || clockRule.length === 0) {
      toast.info("温馨提示", {
        description: "未找到考勤规则，请先在金探后台配置",
      });

      return;
    }

    HapticsUtil.triggerHaptic();
    AttendancePopupModal.show({
      data: clockRule,
      chooseRule: clockRuleIndex,
      selectCallBack: () => { },
      callBack: (value) => {
        //如果考勤规则为空
        if (!clockRule[value]) return;
        setClockRuleIndex(value);
        setClockRuleName(clockRule[value]?.ruleName || "");
      },
    });
  };

  //补卡申请类型选择
  const applyForType = () => {
    HapticsUtil.triggerHaptic();
    ShowNormalPicker({
      title: "请选择申请类型",
      array: CommonConstants.applyType,
      selectItem: replaceTypeSelectItem,
    }).then((value) => {
      if (!value) return;
      setReplaceTypeSelectItem(value as { label: string; value: string });
    });
  };

  //补卡时间的选择
  const applyForTypeTime = () => {
    HapticsUtil.triggerHaptic();

    let chooseTime = {
      startId: "",
      endId: "",
    };

    if (replaceTime?.includes("-")) {
      const arr = replaceTime.split("-");
      chooseTime = {
        startId: arr[0].replaceAll("/", "-"),
        endId: arr[1].replaceAll("/", "-"),
      };
    } else {
      chooseTime = {
        startId: replaceTime?.replaceAll("/", "-") ?? "",
        endId: replaceTime?.replaceAll("/", "-") ?? "",
      };
    }

    CommonDatePopupModal.show({
      title: applyforTime(),
      chooseProject: chooseTime,
      maxDateIsToday: true,
      callBack: (value) => {
        if (!value) return;
        setReplaceTime(value);
      },
      normalCallBack: (value) => {
        if (!value) return;
        let firstDay = value[0].startId;
        let lastDay = value[0].endId;
        if (lastDay) {
          const day = dayjs(lastDay).diff(dayjs(firstDay), "day");
          setReplaceDay(day + 1);
        } else {
          setReplaceDay(1);
        }
      },
    });
  };

  //申请时间的不同展示
  const applyforTime = () => {
    if (replaceTypeSelectItem?.value == "") {
      return "请选择申请时间";
    } else if (replaceTypeSelectItem?.value === "101") {
      return "请选择补卡时间";
    } else {
      return "请选择请假时间";
    }
  };

  //不同时间名称的显示
  const applyforTimeName = () => {
    if (replaceTypeSelectItem?.value == "") {
      return "申请";
    } else if (replaceTypeSelectItem?.value === "101") {
      return "补卡";
    } else {
      return "请假";
    }
  };

  useEffectSkipFirst(() => {
    if (applyForPreviewList) {
      setApplyReason(applyForPreviewList?.applyReson || "");
      setReplaceTypeSelectItem({
        label: applyForPreviewList?.applyTypeStr || "",
        value: "",
      });
      if (applyForPreviewList?.applyTimeEnd) {
        setReplaceTime(
          formatTimeClockYMD(applyForPreviewList?.applyTime) +
          "-" +
          formatTimeClockYMD(applyForPreviewList?.applyTimeEnd)
        );
        setReplaceDay(
          dayjs(applyForPreviewList?.applyTimeEnd).diff(
            dayjs(applyForPreviewList?.applyTime),
            "day"
          ) + 1
        );
      } else {
        setReplaceTime(
          formatTimeClockYMD(applyForPreviewList?.applyTime) || ""
        );
        setReplaceDay(1);
      }

      setClockRuleName(applyForPreviewList?.clockRuleName || "");
    }
  }, [applyForPreviewList]);

  //补卡预览页数据获取
  const applyForPreview = async () => {
    CoustomLoad.show("加载中...");

    try {
      if (id) {
        const result = await GetApprovalDetail(id);
        if (result.ok && result.data) {
          setApplyForPreviewList(result.data);
        }
      }
    } catch (error) {
      console.log("applyForPreview error", error);
    }
     CoustomLoad.hide();
  };

  //获取当前登录人某一天的打卡记录
  const getClockRecord = async (dtDay?: string) => {
    CoustomLoad.show("加载中...");

    try {
      const result = await GetClockRecord({
        dtDay: dtDay ?? formatTimeYMD(new Date()),
      });
      if (result.ok && result.data) {
        setClockRecordList(result.data);
      } else {
        setClockRecordList([]);
      }
    } catch (error) {
      console.log("getClockRecord error", error);
    } 
     CoustomLoad.hide();
  };

  //获取打卡日历
  const getClockCalendar = async (
    year: number,
    month: number
  ) => {
    let yearNow = year  ?? new Date().getFullYear();
    let monthNow = month ?? new Date().getMonth() + 1;
    CoustomLoad.show("加载中...");
     const result = await GetClockCalendar({ year:yearNow, month:monthNow });
      if (result.ok && result.data) {
        //对打卡日历进行格式化
        const newData = result.data.map((item: string) => {
          return formatTimeYMD(item);
        });
        setClockDayList(newData);
      } else {
        setClockDayList([]);
      }
     CoustomLoad.hide();
  };

  //补卡请假审批日期筛选
  const applyForListTime = () => {
    HapticsUtil.triggerHaptic();
    ShowTimePicker({
      title: "请选择申请时间",
      pattern: "yyyy-MM-dd",
      selectDate: applyForDate,
    }).then((value) => {
      if (!value) return;
      setApplyForDate(value);
    });
  };

  //补卡请假审批审核状态筛选
  const applyForApprove = () => {
    HapticsUtil.triggerHaptic();
    ShowNormalPicker({
      title: "请选择审核状态",
      array: CommonConstants.approveStatus,
      selectItem: applyForStatus,
    }).then((value) => {
      if (!value) return;
      setApplyForStatus(value as { label: string; value: string });
    });
  };

  //补卡申请提交
  const applyForSubmit = async () => {
    //检查选项是否填写完整
    //1.考勤规则是否已选

    if (!isNotEmpty(clockRuleName)) {
      toast.info("补卡提示", {
        description: "请选择考勤规则",
      });

      return;
    }

    //2.补卡类型是否已选
    if (!replaceTypeSelectItem?.value) {
      toast.info("补卡提示", {
        description: "请选择申请类型",
      });

      return;
    }
    //3.补卡时间是否已选
    if (!replaceTime) {
      toast.info("补卡提示", {
        description: applyforTime(),
      });

      return;
    }

    //4.补卡原因是否已填
    if (!applyReason) {
      toast.info("补卡提示", {
        description: `请填写${applyforTimeName()}原因`,
      });

      return;
    }

    HapticsUtil.triggerHaptic();
    CoustomLoad.show("正在提交申请...");
    try {
      let params: SubmitForLeaveRequest = {
        applyReson: applyReason,
        applyTime: applyTime,
        applyType: Number(replaceTypeSelectItem?.value),
        clockRuleId: clockRule[clockRuleIndex].id,
        teamId: currentTeam?.id || "",
      };

      //对replaceTime进行处理,他的格式是 2022/11/11-2022/11/11 或者是 2022/11/11
      if (replaceTime) {
        //处理两个时间段的情况，默认的格式是 2024-08-01
        if (replaceTime.includes("-")) {
          const [start, end] = replaceTime.split("-");
          params.applyTime = start;
          params.applyTimeEnd = end;
        } else {
          params.applyTime = replaceTime;
        }
      }

      const result = await SubmitForLeave(params);

      if (result.ok) {
        toast.success("补卡提示", {
          description: "提交成功",
          onAutoClose: () => {
            router.back();
            // navigation.goBack();
          },
        });
      }
    } catch (error) {
      console.log("applyForSubmit error", error);
    } 
     CoustomLoad.hide();
  };

  //外勤驳回后的重新申请
  const applyForResubmit = async (clockRecordId: string) => {
    CoustomLoad.show("正在重新提交...");
    try {
    //  let params: SubmitForLeaveRequest = {
    //     applyReson: '外勤打卡',
    //     applyTime: clockTime,
    //     applyType: 110,
    //     clockRuleId: clockRuleId,
    //     clockRecordId: clockRecordId,
    //     teamId: currentTeam?.id || "",
    //   };
    //   console.log('params',params)
      const result = await FieldworkClockInReSubmit(clockRecordId);

      if (result.ok) {
        toast.success("提示", {
          description: "提交成功",
          onAutoClose: () => {
            //刷新当前页
            getApplyForListRefresh();
          },
        });
      }
    } catch (error) {
      console.log("applyForResubmit error", error);
    } 
     CoustomLoad.hide();
  };

  //补卡请假审批列表下拉刷新
  const getApplyForListRefresh = async () => {
    CoustomLoad.show("加载中...");
    setCurrentPage(1);
    getApplyForList(1);
  };

  useEffectSkipFirst(() => {
    getApplyForListRefresh();
  }, [applyForStatus?.value, applyForDate]);

  //补卡请假审批列表(发起人)
  const getApplyForList = async (page: number = 1) => {
    try {
      let params: GetListForAppAndStartRequest = {
        pageIndex: page,
        pageSize: 20,
      };
      if (Number(applyForStatus?.value)) {
        params.applyStatus = Number(applyForStatus?.value);
      }
      if (applyForDate) {
        params.applyTime = applyForDate;
      }
      let result: ApiResponse<GetListForAppAndStartResponse>;
      if (appPositions[0] === CommonConstants.role_name_attache) {
        result = await GetListForAppAndStart(params);
      } else {
        result = await GetListForAppAndApprove(params);
      }

      const newData = result.data?.items;
      const totalCount = result.data?.totalCount;
      if (result.ok && newData) {
        setHasMoreData(false);
        setTotalCount(totalCount || 0);
        if (newData && newData?.length < pageSize) {
          setIsLoadingMore(true);
          setHasMoreData(true);
        } else {
          setIsLoadingMore(false);
        }
        if (page === 1) {
          setApplyForList(newData);
        } else {
          setApplyForList((prevData) => [
            ...(prevData || []),
            ...(newData || []),
          ]);
        }
      } else {
        setIsLoadingMore(true);
        setHasMoreData(false);
      }
    } catch (error) {
      console.log("getApplyForList error", error);
    } 
     CoustomLoad.hide();
  };

  //补卡请假审批列表(审批人)
  const getApplyForListForApp = async (page: number = 1) => { };

  //补卡请假审批列表加载更多
  const fetchMoreData = async () => {
    let page = currentPage + 1;
    setCurrentPage(page);
    getApplyForList(page);
  };

  //获取补卡请假审批的流水
  const getApplyForWater = async () => { };

  //申请驳回
  const applyForReject = async (id: string) => {
    HapticsUtil.triggerHaptic();
    ApplyForDialog.show({
      title: "请填写驳回原因",
      callBack(value) {
        if (!value) return;
        approveReject(id, value);
      },
    });
  };

  //申请撤销(换成了重新申请)
  const applyForCancel = async (id: string) => {
    HapticsUtil.triggerHaptic();
    ConfirmDialog.show({
      title: "提示",
      message: "确定撤销申请?",
      onConfirm: () => {
        if (id) approveResubmit(id);
      },
    });
  };

  //申请同意
  const applyForAgree = async (id: string) => {
    HapticsUtil.triggerHaptic();
    ConfirmDialog.show({
      title: "提示",
      message: "确定同意申请?",
      onConfirm: () => {
        if (id) approvePass(id);
      },
    });
  };

  //审批通过
  const approvePass = async (id: string) => {
    CoustomLoad.show("正在提交...");
    try {
      const result = await ApprovePass(id);
      if (result.ok) {
        toast.success("审核通过", {
          onAutoClose: () => {
            //刷新列表
            getApplyForListRefresh();
            //刷新界面
            applyForPreview()
          },
        });
      }
    } catch (error) {
      console.log("approvePass error", error);
    } 
     CoustomLoad.hide();
  };

  //审核驳回
  const approveReject = async (id: string, reason?: string) => {
    CoustomLoad.show("正在驳回...");
    try {
      let params = {
        id: id,
        content: reason,
      };
      const result = await ApproveReject(params);
      if (result.ok) {
        toast.success("驳回成功", {
          onAutoClose: () => {
            //刷新列表
            getApplyForListRefresh();
            //刷新界面
            applyForPreview();
          },
        });
      }
    } catch (error) {
      console.log("approveReject error", error);
    } 
     CoustomLoad.hide();
  };

  //审批撤回
  const approveWithdraw = async (id: string) => {
    CoustomLoad.show("正在撤回...");
    try {
      const result = await CancelApproval(id);
      if (result.ok) {
      } else {
      }
    } catch (error) {
      console.log("approveWithdraw error", error);
    } 
     CoustomLoad.hide();
  };

  //审批重新提交
  const approveResubmit = async (id: string) => {
    CoustomLoad.show("正在重新提交...");
    try {
      const result = await ReSubmitApproval(id);
      if (result.ok) {
        toast.success("重新提交成功", {
          onAutoClose: () => {
            //刷新列表
            getApplyForListRefresh();
          },
        });
      }
    } catch (error) {
      console.log("approveResubmit error", error);
    } 
     CoustomLoad.hide();
  };

  // 获取当前登录人异常规则判定
  const getClockEx = async (dtDay?: string) => {
    try {
      const result = await GetClockEx({
        dtDay: dtDay ?? formatTimeYMD(new Date()),
      });
      if (result.data) {
        setAbnormalRule(result.data);
        if (result.data.length > 0) {
          for (let index = 0; index < result.data.length; index++) {
            const item = result.data[index];
            if (item.isException) {
              setClockRuleIndex(index);
              setClockRuleName(item.ruleName || "");
              break; // 找到第一个异常规则后结束循环
            }
          }
        }
      }
    } catch (error) {
      console.log("getClockEx error", error);
    }
  };

  return {
    mapViewRef,
    data,
    takePhoto,
    ClockIn,
    moveToCurrentLocation,
    generatePresignedUri,
    clockInCoord,
    isWithinRange,
    chooseClockRule,
    clockRuleIndex,
    clockRule,
    chooseShift,
    shifts,
    shiftIndex,
    clockRange,
    getClockInRule,
    getDistance,
    setIsWithinRange,
    applyForClockRule,
    replaceClockRuleIndex,
    setReplaceClockRuleIndex,
    applyForType,
    replaceTypeSelectItem,
    applyForTypeTime,
    replaceTime,
    isReplaceEnable,
    isApprove,
    setApplyReason,
    applyReason,
    applyForPreview,
    getClockRecord,
    clockRecordList,
    getClockCalendar,
    clockDayList,
    applyForListTime,
    applyForDate,
    applyForApprove,
    applyForStatus,
    getApplyForList,
    applyForList,
    hasMoreData,
    isLoadingMore,
    fetchMoreData,
    getApplyForWater,
    applyForPreviewList,
    applyForReject,
    applyForCancel,
    applyForAgree,
    applyForSubmit,
    applyforTime,
    getApplyForListForApp,
    getApplyForListRefresh,
    approvePass,
    clockRuleName,
    approveResubmit,
    getClockEx,
    abnormalRule,
    applyforTimeName,
    replaceDay,
    mapState,
    setMapState,
    isSupportOutWork,
    applyForResubmit,
    initialPosition
  };
}
