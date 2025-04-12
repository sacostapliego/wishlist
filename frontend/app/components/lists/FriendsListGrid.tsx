import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../layout/Section';
import { Card } from '../ui/Card';
import { COLORS, ITEM_WIDTH, SPACING, TYPOGRAPHY } from '../../styles/theme';
import { ListItem as ListItemType } from '../../types/lists';
import { commonStyles } from '../../styles/common';
import { useRouter } from 'expo-router';

interface ListItemProps {
  title: string;
  color?: string;
  onPress: () => void;
  username?: string; // Added username prop
}

export function ListItem({ title, onPress, username = "Friend" }: ListItemProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={styles.listItemWrapper}
    >
      <Card style={StyleSheet.flatten([styles.listItem, { backgroundColor: COLORS.cardDark }])}>
        <View style={styles.listItemContent}>
          {/* Icon container with circular background */}
          <View style={styles.iconContainer}>
            <Ionicons name="gift-outline" size={24} color="white" />
          </View>

          {/* Text content container */}
          <View style={styles.textContainer}>
            <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.username} numberOfLines={1}>{username}'s List</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

interface ListGridProps {
  title: string;
  lists: ListItemType[];
  maxItems?: number;
}

export default function FriendsListGrid({ title, lists, maxItems = 8 }: ListGridProps) {
  const router = useRouter();
  
  // Ensure lists is always an array
  const safeListsArray = Array.isArray(lists) ? lists : [];
  const displayedLists = safeListsArray.slice(0, maxItems);
  
  const handleSeeAllPress = () => {
    router.push('/home/friends');
  };

  // Create rows with 2 items each
  const createRows = () => {
    const rows = [];
    for (let i = 0; i < displayedLists.length; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          <View style={styles.column}>
            <ListItem
              title={displayedLists[i].title}
              username={`User${displayedLists[i].id}`} // dummy username
              onPress={() => {}}
            />
          </View>
          
          {i + 1 < displayedLists.length && (
            <View style={styles.column}>
              <ListItem
                title={displayedLists[i + 1].title}
                username={`User${displayedLists[i + 1].id}`} // dummy username
                onPress={() => {}}
              />
            </View>
          )}
        </View>
      );
    }
    return rows;
  };

  // See All Link
  const renderSectionHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[commonStyles.sectionTitle, styles.mainTitle]}>{title}</Text>
      {safeListsArray.length > 0 && (
        <TouchableOpacity onPress={handleSeeAllPress}>
          <Text style={styles.seeAllText}>Show all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <Section title={title} titleStyle={styles.mainTitle} showTitle={false}>
      {renderSectionHeader()}
      <View style={styles.gridContainer}>
        {safeListsArray.length > 0 ? (
          createRows()
        ) : (
          <Text style={commonStyles.emptyText}>No friends found</Text>
        )}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  mainTitle: {
    fontSize: TYPOGRAPHY.sectionTitle.fontSize,
    marginBottom: 0,
  },
  sectionContainer: {
    marginBottom: 0,
  },
  gridContainer: {
    paddingVertical: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  column: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  listItemWrapper: {
    flex: 1,
  },
  listItem: {
    borderRadius: 8,
    padding: 14,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    marginLeft: -4,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  username: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
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