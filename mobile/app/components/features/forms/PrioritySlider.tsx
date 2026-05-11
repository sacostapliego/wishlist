import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING } from '@/app/styles/theme';

type PrioritySliderProps = {
  value: number;
  onValueChange: (value: number) => void;
};

export default function PrioritySlider({ value, onValueChange }: PrioritySliderProps) {
  const getPriorityLabel = (val: number) => {
    switch(val) {
      case 0: return "Low";
      case 2: return "Medium";
      case 4: return "High";
      default: return "";
    }
  };
  
  const getPriorityColor = (val: number) => {
    switch(val) {
      case 0: return "#88C0D0"; // cool blue
      case 1: return "#8FBCBB"; // muted teal
      case 2: return "#81A1C1"; // steel blue
      case 3: return "#A3BE8C"; // soft green
      case 4: return "#EBCB8B"; // warm yellow
      default: return "#88C0D0";
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Priority: {value + 1}</Text>
        <Text style={[styles.priorityLabel, {color: 'white'}]}>
          {getPriorityLabel(value)}
        </Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={4}
          step={1}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor={getPriorityColor(value)}
          maximumTrackTintColor="#ffffff30"
          thumbTintColor={getPriorityColor(value)}
        />
      </View>
      
      <View style={styles.markers}>
        {[0, 1, 2, 3, 4].map(mark => (
          <View 
            key={mark} 
            style={[
              styles.marker, 
              mark <= value ? {backgroundColor: getPriorityColor(value)} : {backgroundColor: '#ffffff30'}
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.sm,
  },
  sliderEndLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    width: 30,
    textAlign: 'center',
  },
  markers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xs,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff30',
  },
});