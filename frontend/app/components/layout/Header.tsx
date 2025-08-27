import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';

type HeaderProps = {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  showOptions?: boolean;
  onOptionsPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
};

export const Header = ({
  title,
  onBack,
  showBackButton = true,
  showOptions = false,
  onOptionsPress,
  rightIcon = 'ellipsis-vertical',
  backgroundColor = COLORS.background,
}: HeaderProps) => {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {showOptions ? (
        <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}>
          <Ionicons name={rightIcon as keyof typeof Ionicons.glyphMap} size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  optionsButton: {
    padding: SPACING.xs,
  },
  placeholder: {
    width: 40,
    padding: SPACING.xs,
  },
});