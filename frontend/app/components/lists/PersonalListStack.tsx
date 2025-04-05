import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../layout/Section';
import { COLORS, CARD_WIDTH, SPACING, TYPOGRAPHY } from '../../styles/theme';
import { ListItem } from '../../types/lists';
import { commonStyles } from '../../styles/common';
import { useSwipe } from '../../hooks/useSwipe';
import { useRouter } from 'expo-router';

interface PersonalListStackProps {
  title: string;
  lists: ListItem[];

  containerStyle?: object;
}



export default function PersonalListStack({ title, lists, containerStyle }: PersonalListStackProps) {
  // router
  const router = useRouter();

  const handleSeeAllPress = () => {
    router.push('/(tabs)/lists');
  };

  // Ensure lists is always an array, even if undefined is passed
  const safeListsArray = Array.isArray(lists) ? lists : [];

  const indexRef = useRef(0);
  
  // Clamp currentIndex within valid bounds
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Immediately correct the index if it's out of bounds
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Setup animation constants
  const thirdCardScale = 0.85;
  const thirdCardOpacity = 0.5;

    
  // Handle swipe left (next card)
const handleSwipeLeft = useCallback(() => {
  if (indexRef.current < safeListsArray.length - 1) {
    // Normal case - go to next card
    setCurrentIndex(prevIndex => prevIndex + 1);
  } else if (safeListsArray.length > 1 || indexRef.current > safeListsArray.length - 1) {
    // Circular navigation - go back to the first card
    setCurrentIndex(0);
  }
}, [currentIndex, safeListsArray.length]);
  
  // Handle swipe right (previous card)
  const handleSwipeRight = useCallback(() => {    
    if (indexRef.current > 0) {
      // Normal behavior - go to previous card
      setCurrentIndex(indexRef.current - 1);
    } else if (safeListsArray.length > 1) {
      // Option 1: Circular behavior - go to last card
      setCurrentIndex(safeListsArray.length - 1);
    }
  }, [safeListsArray.length]);
  
  // Use custom swipe hook with modified settings
  const { position, panHandlers, isAnimating, resetPosition } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    swipeThreshold: CARD_WIDTH * 0.3, // Lower threshold for more sensitivity
    resetAfterSwipe: true
  });
  
  // Reset position when currentIndex changes
  useEffect(() => {
    if (resetPosition) {
      resetPosition();
    }
  }, [currentIndex, resetPosition]);
  
  // Setup rotation and scale animations
  const rotate = position.x.interpolate({
    inputRange: [-CARD_WIDTH, 0, CARD_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-CARD_WIDTH, 0, CARD_WIDTH],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-CARD_WIDTH, 0, CARD_WIDTH],
    outputRange: [1, 0.7, 1],
    extrapolate: 'clamp',
  });

  // If there are no lists, return empty view
  if (safeListsArray.length === 0) {
    return (
      <Section title={title}>
        <Text style={commonStyles.emptyText}>No lists found</Text>
      </Section>
    );
  }

  // Ensure currentIndex is within bounds
  const validIndex = Math.max(0, Math.min(currentIndex, safeListsArray.length - 1));
  
  // Get list data with safeguards
  const currentList = safeListsArray[validIndex];
  const nextList = validIndex < safeListsArray.length - 1 ? safeListsArray[validIndex + 1] : null;
  const thirdList = validIndex < safeListsArray.length - 2 ? safeListsArray[validIndex + 2] : null;
  
  // Get previous list for visual indicator
  const prevList = validIndex > 0 ? safeListsArray[validIndex - 1] : null;

  // Check if currentList exists before accessing its properties
  if (!currentList) {
    return (
      <Section title={title}>
        <Text style={commonStyles.emptyText}>List data error</Text>
      </Section>
    );
  }

  // Get colors with fallbacks
  const currentColor = currentList?.color || COLORS.card;
  const nextColor = nextList?.color || COLORS.card;
  const thirdColor = thirdList?.color || COLORS.card;
  const prevColor = prevList?.color || COLORS.card;

  // See all link
  // See All Link
    const renderSectionHeader = () => (
      <View style={styles.headerContainer}>
        <Text style={[commonStyles.sectionTitle, styles.mainTitle]}>{title}</Text>
        <TouchableOpacity onPress={handleSeeAllPress}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <Section title={title} containerStyle={containerStyle} showTitle={false}>
      {renderSectionHeader()}
      <View style={styles.cardsContainer}>
        {/* Previous card indicator (only when not at first card) */}
        {prevList && (
          <Animated.View 
            style={[
              styles.listCard, 
              { 
                backgroundColor: prevColor,
                width: CARD_WIDTH,
                transform: [{ scale: thirdCardScale }],
                opacity: thirdCardOpacity,
                position: 'absolute',
                zIndex: 0
              }
            ]}
          >
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{prevList.title}</Text>
              <Text style={styles.itemCount}>{prevList.itemCount} items</Text>
            </View>
          </Animated.View>
        )}

        {/* Third card (furthest back) */}
        {thirdList && (
          <Animated.View 
            style={[
              styles.listCard, 
              { 
                backgroundColor: thirdColor,
                width: CARD_WIDTH,
                transform: [{ scale: thirdCardScale }],
                opacity: thirdCardOpacity,
                position: 'absolute',
                zIndex: 1,
              }
            ]}
          >
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{thirdList.title}</Text>
              <Text style={styles.itemCount}>{thirdList.itemCount} items</Text>
            </View>
            
            <View style={styles.listContent}>
              <Ionicons name="gift" size={48} color="white" style={styles.icon} />
            </View>
          </Animated.View>
        )}
        
        {/* Next card (middle) */}
        {nextList && (
          <Animated.View 
            style={[
              styles.listCard, 
              { 
                backgroundColor: nextColor,
                width: CARD_WIDTH,
                transform: [{ scale: nextCardScale }],
                opacity: nextCardOpacity,
                position: 'absolute',
                zIndex: 2
              }
            ]}
          >
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{nextList.title}</Text>
              <Text style={styles.itemCount}>{nextList.itemCount} items</Text>
            </View>
            
            <View style={styles.listContent}>
              <Ionicons name="gift" size={48} color="white" style={styles.icon} />
            </View>
          </Animated.View>
        )}
        
        {/* Current card (front) */}
        <Animated.View 
          style={[
            styles.listCard, 
            { 
              backgroundColor: currentColor,
              width: CARD_WIDTH,
              transform: [
                { translateX: position.x },
                { rotate }
              ],
              zIndex: 3
            }
          ]}
          {...panHandlers}
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{currentList.title}</Text>
            <Text style={styles.itemCount}>{currentList.itemCount} items</Text>
          </View>
          
          <View style={styles.listContent}>
            <Ionicons name="gift" size={48} color="white" style={styles.icon} />
          </View>
        </Animated.View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  mainTitle: {
      fontSize: TYPOGRAPHY.sectionTitle.fontSize,
      marginBottom: 0,
      
    },
  cardsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    borderRadius: 16,
    padding: 20,
    ...commonStyles.shadow,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  listContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  icon: {
    marginBottom: SPACING.md,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    
  },
  seeAllText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});