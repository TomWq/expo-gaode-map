import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  emitAIRouteSheetCommand,
  formatAIRouteCost,
  formatAIRouteDistance,
  formatAIRouteRating,
  getAIRouteSheetSnapshot,
  type AIRouteCandidate,
} from '../aiRouteSheetState';

function MetaChip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <View style={[styles.metaChip, tone === 'accent' && styles.metaChipAccent]}>
      <Text style={[styles.metaChipText, tone === 'accent' && styles.metaChipTextAccent]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function CandidateRow({
  candidate,
  index,
  selected,
  onPress,
}: {
  candidate: AIRouteCandidate;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const rating = formatAIRouteRating(candidate.rating);
  const cost = formatAIRouteCost(candidate.cost);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.candidateRow,
        selected && styles.candidateRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.indexBadge, selected && styles.indexBadgeSelected]}>
        <Text style={[styles.indexText, selected && styles.indexTextSelected]}>{index + 1}</Text>
      </View>
      <View style={styles.candidateBody}>
        <View style={styles.candidateTitleRow}>
          <Text style={styles.candidateName} numberOfLines={1}>
            {candidate.name}
          </Text>
          <Text style={styles.scoreText}>{candidate.score}</Text>
        </View>
        <Text style={styles.addressText} numberOfLines={1}>
          {candidate.address || candidate.type}
        </Text>
        <Text style={styles.reasonText}>{candidate.aiReason || candidate.reason}</Text>
        <View style={styles.metaRow}>
          <MetaChip tone="accent">{candidate.sourceKeyword}</MetaChip>
          <MetaChip>偏离 {formatAIRouteDistance(candidate.routeOffsetMeters)}</MetaChip>
          <MetaChip>行程 {formatAIRouteDistance(candidate.alongMeters)}</MetaChip>
          {rating ? <MetaChip>{rating}</MetaChip> : null}
          {cost ? <MetaChip>{cost}</MetaChip> : null}
        </View>
        {candidate.nearbyAmenities.length ? (
          <Text style={styles.amenityText} numberOfLines={1}>
            附近：{candidate.nearbyAmenities.slice(0, 3).join('、')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function AIRouteSheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snapshot = getAIRouteSheetSnapshot();

  if (!snapshot) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.emptyTitle}>暂无沿途推荐</Text>
        <Text style={styles.emptyCopy}>回到地图页发起一次搜索后，这里会展示候选详情。</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>返回地图</Text>
        </Pressable>
      </View>
    );
  }

  const { candidates, intent, route, selectedCandidateId, summary, recommendationSource } = snapshot;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>沿途候选</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {route
              ? `${route.origin.text} → ${route.destination.text} · ${route.summary}`
              : snapshot.status}
          </Text>
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            router.back();
          }}
        >
          <Text style={styles.closeButtonText}>完成</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>
              {intent ? `${intent.source}解析 / ${recommendationSource}推荐` : '推荐结果'}
            </Text>
            <Text style={styles.countText}>{candidates.length} 个</Text>
          </View>
          {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}
          {intent ? (
            <View style={styles.metaRow}>
              {intent.tags.slice(0, 4).map((tag) => (
                <MetaChip key={tag} tone="accent">{tag}</MetaChip>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              emitAIRouteSheetCommand({ type: 'fitRoute' });
              router.back();
            }}
          >
            <Text style={styles.secondaryButtonText}>路线总览</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              index={index}
              selected={candidate.id === selectedCandidateId}
              onPress={() => {
                emitAIRouteSheetCommand({ type: 'selectCandidate', candidateId: candidate.id });
                router.back();
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#cbd5e1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    minWidth: 56,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#e8eef7',
  },
  closeButtonText: {
    color: '#1f3b63',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingHorizontal: 16,
  },
  summaryCard: {
    gap: 8,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbe4ef',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTitle: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  countText: {
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  summaryText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
  },
  secondaryButton: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#eaf1ff',
  },
  secondaryButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  primaryButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  candidateRow: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  candidateRowSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fbff',
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  indexBadgeSelected: {
    backgroundColor: '#2563eb',
  },
  indexText: {
    color: '#0369a1',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  indexTextSelected: {
    color: '#ffffff',
  },
  candidateBody: {
    flex: 1,
    minWidth: 0,
  },
  candidateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  candidateName: {
    flex: 1,
    minWidth: 0,
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  scoreText: {
    minWidth: 34,
    textAlign: 'right',
    color: '#047857',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  addressText: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  reasonText: {
    marginTop: 6,
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    maxWidth: 132,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
  },
  metaChipAccent: {
    backgroundColor: '#dcfce7',
  },
  metaChipText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  metaChipTextAccent: {
    color: '#047857',
  },
  amenityText: {
    marginTop: 7,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.72,
  },
});
