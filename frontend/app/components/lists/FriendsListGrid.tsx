import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../layout/Section';
import { Card } from '../ui/Card';
import { COLORS, ITEM_WIDTH, ITEM_GAP, GRID_WIDTH } from '../../styles/theme';
import { ListItem as ListItemType } from '../../types/lists';
import { commonStyles } from '../../styles/common';

interface ListItemProps {
  title: string;
  itemCount: number;
  color?: string;
  onPress: () => void;
}

export function ListItem({ title, itemCount, color = COLORS.secondary, onPress }: ListItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.listItem} color={color}>
        <View style={styles.listItemContent}>
          <Ionicons name="gift-outline" size={24} color="white" />
          <View style={styles.textContainer}>
            <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.itemCount}>{itemCount} items</Text>
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

export default function ListGrid({ title, lists, maxItems = 6 }: ListGridProps) {
  const displayedLists = lists.slice(0, maxItems);
  
  // Create pairs of lists for 2-column layout
  const listPairs = [];
  for (let i = 0; i < displayedLists.length; i += 2) {
    listPairs.push(displayedLists.slice(i, i + 2));
  }

  return (
    <Section title={title}>
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {listPairs.map((pair, pairIndex) => (
            <View key={`pair-${pairIndex}`} style={styles.row}>
              {pair.map((list) => (
                <ListItem
                  key={list.id}
                  title={list.title}
                  itemCount={list.itemCount}
                  color={list.color}
                  onPress={() => {}}
                />
              ))}
              {pair.length === 1 && <View style={styles.emptyItem} />}
            </View>
          ))}
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    alignItems: 'center',
  },
  grid: {
    width: GRID_WIDTH,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 0,  // Override Card padding
  },
  listItemContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  emptyItem: {
    width: ITEM_WIDTH,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    color: 'white',
  },
  itemCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});