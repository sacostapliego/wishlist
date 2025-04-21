import { StyleSheet, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: "600"

  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.inactive,
    fontSize: TYPOGRAPHY.body.fontSize,
    paddingVertical: SPACING.xl,
  },
  shadow: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});

export default function CommonStyles() {
}