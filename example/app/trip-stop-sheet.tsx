import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TRIP_DAYS,
  formatKm,
  type TripStop,
  withAlpha,
} from '../MayDayFiveDayTripExample';
import { emitTripSheetCommand } from '../tripSheetBus';
import {
  buildFallbackTripDayRoutePlan,
  formatDuration,
  getCachedTripDayRoutePlan,
  getTripDayRoutePlan,
  type TripDayRoutePlan,
  type TripTravelMode,
} from '../tripRoutePlanning';

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getModeColor(mode: TripTravelMode): string {
  if (mode === 'walking') return '#10b981';
  if (mode === 'bicycling') return '#0ea5e9';
  return '#f59e0b';
}

export default function TripStopSheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dayIndex?: string | string[]; stopId?: string | string[] }>();

  const initialDayIndexRaw = Number.parseInt(readParam(params.dayIndex) ?? '0', 10);
  const initialDayIndex = Number.isFinite(initialDayIndexRaw)
    ? Math.max(0, Math.min(TRIP_DAYS.length - 1, initialDayIndexRaw))
    : 0;

  const [activeDayIndex, setActiveDayIndex] = React.useState(initialDayIndex);
  const [activeStopId, setActiveStopId] = React.useState(
    readParam(params.stopId) ?? TRIP_DAYS[initialDayIndex].stops[0].id
  );
  const [dayRoutePlans, setDayRoutePlans] = React.useState<Record<number, TripDayRoutePlan>>(() => {
    const initialPlans: Record<number, TripDayRoutePlan> = {};
    TRIP_DAYS.forEach((day, dayIndex) => {
      const cached = getCachedTripDayRoutePlan(dayIndex, day.stops);
      if (cached) {
        initialPlans[dayIndex] = cached;
      }
    });
    return initialPlans;
  });
  const [isRouteLoading, setIsRouteLoading] = React.useState(false);

  React.useEffect(() => {
    setActiveDayIndex(initialDayIndex);
    setActiveStopId(readParam(params.stopId) ?? TRIP_DAYS[initialDayIndex].stops[0].id);
  }, [initialDayIndex, params.stopId]);

  const fallbackDayPlans = React.useMemo(
    () => TRIP_DAYS.map((day, dayIndex) => buildFallbackTripDayRoutePlan(dayIndex, day.stops)),
    []
  );

  const activeDay = TRIP_DAYS[activeDayIndex];
  const activeDayStops = activeDay.stops;
  const activeDayRoutePlan = React.useMemo(() => {
    return dayRoutePlans[activeDayIndex] ?? fallbackDayPlans[activeDayIndex];
  }, [activeDayIndex, dayRoutePlans, fallbackDayPlans]);
  const activeStop = React.useMemo(() => {
    return activeDayStops.find((stop) => stop.id === activeStopId) ?? activeDayStops[0];
  }, [activeDayStops, activeStopId]);
  const stopNameMap = React.useMemo(() => {
    return Object.fromEntries(activeDayStops.map((stop) => [stop.id, stop.name]));
  }, [activeDayStops]);

  const activeStopIndex = React.useMemo(() => {
    return Math.max(0, activeDayStops.findIndex((stop) => stop.id === activeStop.id));
  }, [activeDayStops, activeStop.id]);

  const visitedCount = activeStopIndex + 1;

  React.useEffect(() => {
    let cancelled = false;
    setIsRouteLoading(true);

    void getTripDayRoutePlan(activeDayIndex, activeDayStops)
      .then((plan) => {
        if (cancelled) return;
        setDayRoutePlans((current) => {
          if (current[activeDayIndex] === plan) {
            return current;
          }
          return {
            ...current,
            [activeDayIndex]: plan,
          };
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsRouteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDayIndex, activeDayStops]);

  const handleSwitchDay = React.useCallback((nextDayIndex: number) => {
    const firstStop = TRIP_DAYS[nextDayIndex].stops[0];
    setActiveDayIndex(nextDayIndex);
    setActiveStopId(firstStop.id);
    emitTripSheetCommand({
      type: 'selectStop',
      dayIndex: nextDayIndex,
      stopId: firstStop.id,
    });
  }, []);

  const handleSelectStop = React.useCallback(
    (stop: TripStop) => {
      setActiveStopId(stop.id);
      emitTripSheetCommand({
        type: 'selectStop',
        dayIndex: activeDayIndex,
        stopId: stop.id,
      });
    },
    [activeDayIndex]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.containerContent, { paddingBottom: insets.bottom + 12 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
       <View style={styles.handle} />
     

      <View
        style={[
          styles.selectedStopSheet,
          {
            borderColor: withAlpha(activeDay.color, '40'),
            backgroundColor: withAlpha(activeDay.color, '12'),
          },
        ]}
      >
        <Image source={activeStop.image} style={styles.selectedStopImage} />
        <View style={styles.selectedStopBody}>
          <View style={styles.selectedStopHeader}>
            <View style={[styles.selectedStopBadge, { backgroundColor: activeDay.color }]}>
              <Text style={styles.selectedStopBadgeText}>Day {activeDay.day}</Text>
            </View>
            <Text style={styles.selectedStopTime}>{activeStop.time}</Text>
          </View>
          <Text style={styles.selectedStopName}>{activeStop.name}</Text>
          <Text style={styles.selectedStopSubtitle}>{activeStop.subtitle}</Text>
          <Text style={styles.selectedStopMeta}>{activeDay.title}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            emitTripSheetCommand({ type: 'fitAllDays' });
            router.back();
          }}
        >
          <Text style={styles.actionButtonText}>全部总览</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            emitTripSheetCommand({ type: 'fitActiveDay' });
            router.back();
          }}
        >
          <Text style={styles.actionButtonText}>当日总览</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            emitTripSheetCommand({ type: 'focusActiveStop' });
            router.back();
          }}
        >
          <Text style={styles.actionButtonText}>当前站点</Text>
        </Pressable>
      </View>

      <View style={styles.daySummaryRow}>
        <Text style={styles.daySummaryTitle}>{activeDay.title}</Text>
        <Text style={styles.daySummaryMeta}>
          {activeDayStops.length} 站 · {formatKm(activeDayRoutePlan.totalDistanceMeters)} ·{' '}
          {formatDuration(activeDayRoutePlan.totalDurationSeconds)} · 已完成{' '}
          {visitedCount}/{activeDayStops.length}
        </Text>
      </View>

      {/* <ScrollView
        horizontal
        style={styles.dayTabsScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabsContent}
        nestedScrollEnabled
      >
        {TRIP_DAYS.map((day, dayIndex) => {
          const isActive = dayIndex === activeDayIndex;
          return (
            <Pressable
              key={day.day}
              onPress={() => handleSwitchDay(dayIndex)}
              style={[
                styles.dayTab,
                {
                  borderColor: day.color,
                  backgroundColor: isActive ? withAlpha(day.color, '24') : '#ffffff',
                },
              ]}
            >
              <Text style={[styles.dayTabTitle, { color: day.color }]}>Day {day.day}</Text>
              <Text style={styles.dayTabText} numberOfLines={1}>
                {day.title}
              </Text>
              <Text style={styles.dayTabMood}>{day.mood}</Text>
            </Pressable>
          );
        })}
      </ScrollView> */}

      <View style={styles.routeSection}>
        <View style={styles.routeSectionHeader}>
          <Text style={styles.routeSectionTitle}>当日路线规划</Text>
          <Text style={styles.routeSectionMeta}>
            {isRouteLoading
              ? '规划中...'
              : activeDayRoutePlan.source === 'fallback'
                ? '直线预估'
                : activeDayRoutePlan.source === 'mixed'
                  ? '部分已规划'
                  : 'API 已规划'}
          </Text>
        </View>
        {activeDayRoutePlan.segments.map((segment, index) => (
          <View key={segment.id} style={styles.routeCard}>
            <View style={[styles.routeDot, { backgroundColor: getModeColor(segment.mode) }]} />
            <View style={styles.routeCardBody}>
              <Text style={styles.routeCardTitle} numberOfLines={1}>
                {index + 1}. {stopNameMap[segment.fromStopId] ?? `站点 ${index + 1}`} →{' '}
                {stopNameMap[segment.toStopId] ?? `站点 ${index + 2}`}
              </Text>
              <Text style={styles.routeCardMeta}>
                {segment.modeLabel} · {formatKm(segment.distanceMeters)} ·{' '}
                {formatDuration(segment.durationSeconds)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.stopList}>
        {activeDayStops.map((stop, index) => {
          const isActive = stop.id === activeStop.id;
          return (
            <Pressable
              key={stop.id}
              onPress={() => handleSelectStop(stop)}
              style={[
                styles.stopCard,
                isActive && {
                  borderColor: activeDay.color,
                  backgroundColor: withAlpha(activeDay.color, '14'),
                },
              ]}
            >
              <View style={[styles.stopIndex, { backgroundColor: activeDay.color }]}>
                <Text style={styles.stopIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.stopBody}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopSubtitle} numberOfLines={1}>
                  {stop.subtitle}
                </Text>
              </View>
              <Text style={styles.stopTime}>{stop.time}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  containerContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    marginBottom: 10,
  },
  selectedStopSheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedStopImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#dbe4f0',
  },
  selectedStopBody: {
    flex: 1,
    gap: 3,
  },
  selectedStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectedStopBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectedStopBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  selectedStopTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  selectedStopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  selectedStopSubtitle: {
    fontSize: 12,
    color: '#334155',
  },
  selectedStopMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  daySummaryRow: {
    marginTop: 10,
    marginBottom: 8,
  },
  daySummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  daySummaryMeta: {
    marginTop: 1,
    fontSize: 11,
    color: '#475569',
  },
  dayTabsScroll: {
    height: Platform.select({
      ios: 114,
      android: 102,
      default: 108,
    }),
  },
  dayTabsContent: {
    gap: 6,
    alignItems: 'flex-start',
    paddingBottom: 4,
    paddingRight: 4,
  },
  dayTab: {
    width: Platform.select({
      ios: 122,
      android: 108,
      default: 118,
    }),
    height: Platform.select({
      ios: 94,
      android: 86,
      default: 90,
    }),
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
  },
  dayTabTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayTabText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  dayTabMood: {
    marginTop: 2,
    fontSize: 10,
    color: '#64748b',
  },
  routeSection: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 8,
  },
  routeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeSectionTitle: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },
  routeSectionMeta: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  routeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    flexShrink: 0,
  },
  routeCardBody: {
    flex: 1,
    gap: 2,
  },
  routeCardTitle: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
  },
  routeCardMeta: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  stopList: {
    marginTop: 10,
    gap: 10,
  },
  stopCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stopIndexText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  stopBody: {
    flex: 1,
    paddingRight: 6,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  stopSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: '#64748b',
  },
  stopTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
