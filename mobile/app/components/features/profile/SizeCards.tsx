import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '@/app/styles/theme';

type SizeKey =
  | 'shoe_size'
  | 'shirt_size'
  | 'pants_size'
  | 'hat_size'
  | 'ring_size'
  | 'dress_size'
  | 'jacket_size';

type SizeValues = Partial<Record<SizeKey, string | null | undefined>>;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SIZE_FIELDS: { key: SizeKey; label: string }[] = [
  { key: 'shoe_size', label: 'Shoe' },
  { key: 'shirt_size', label: 'Shirt' },
  { key: 'pants_size', label: 'Pants' },
  { key: 'hat_size', label: 'Hat' },
  { key: 'ring_size', label: 'Ring' },
  { key: 'dress_size', label: 'Dress' },
  { key: 'jacket_size', label: 'Jacket' },
];

const ICON_MAP: Record<SizeKey, IoniconName> = {
  shoe_size: 'walk-outline', // overridden below with MaterialCommunityIcons
  shirt_size: 'shirt-outline',
  pants_size: 'body-outline',
  hat_size: 'happy-outline',
  ring_size: 'diamond-outline',
  dress_size: 'woman-outline',
  jacket_size: 'snow-outline',
};

export function SizeCards({ values }: { values: SizeValues }) {
  const visibleSizeItems = SIZE_FIELDS
    .map(sizeField => ({ ...sizeField, value: values[sizeField.key] }))
    .filter(
      (sizeEntry): sizeEntry is { key: SizeKey; label: string; value: string } =>
        typeof sizeEntry.value === 'string' && sizeEntry.value.trim().length > 0
    );

  if (visibleSizeItems.length === 0) return null;

  return (
    <View style={styles.grid}>
      {visibleSizeItems.map(sizeItem => (
        <View key={sizeItem.key} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.cardLabel}>{sizeItem.label}</Text>
            {sizeItem.key === 'shoe_size' ? (
              <MaterialCommunityIcons
                name="shoe-sneaker"
                size={18}
                color={COLORS.text.secondary}
              />
            ) : (
              <Ionicons name={ICON_MAP[sizeItem.key]} size={18} color={COLORS.text.secondary} />
            )}
          </View>
          <Text style={styles.cardValue}>{sizeItem.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.cardDarkLight,
    borderRadius: 12,
    padding: SPACING.md,
    flexBasis: '48%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    color: COLORS.text.secondary,
  },
  cardValue: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SizeCards;