import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/app/styles/theme';

export default function EmptyState({ text, sub, children }: { text: string; sub?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="information-circle-outline" size={36} color={COLORS.inactive} />
      <Text style={styles.emptyText}>{text}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: COLORS.text.primary, fontWeight: '700' },
  emptySub: { color: COLORS.text.secondary },
});