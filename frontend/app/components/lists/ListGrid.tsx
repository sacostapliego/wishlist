import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListItemProps {
  title: string;
  itemCount: number;
  onPress: () => void;
}

export function ListItem({ title, itemCount, onPress }: ListItemProps) {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemContent}>
        <Ionicons name="gift-outline" size={24} color="#0891b2" />
        <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.itemCount}>{itemCount} items</Text>
      </View>
    </TouchableOpacity>
  );
}

interface ListGridProps {
  title: string;
  lists: Array<{ id: string; title: string; itemCount: number; }>;
  maxItems?: number;
}

export default function ListGrid({ title, lists, maxItems = 6 }: ListGridProps) {
  const displayedLists = lists.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {displayedLists.map((list) => (
          <ListItem
            key={list.id}
            title={list.title}
            itemCount={list.itemCount}
            onPress={() => {}}
          />
        ))}
      </View>
    </View>
  );
}
const { width } = Dimensions.get('window');
const itemWidth = (width - 38) / 2;


const styles = StyleSheet.create({
  container: {
    padding: 10,

  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listItem: {
    width: itemWidth,
    aspectRatio: 1,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    backgroundColor: '#7358e0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});