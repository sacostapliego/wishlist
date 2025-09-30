import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Section from '../../layout/Section';
import { COLORS, CARD_WIDTH, SPACING, TYPOGRAPHY } from '@/app/styles/theme';
import { WishlistData } from '@/app/types/lists';
import { useRouter } from 'expo-router';
import { commonStyles } from '@/app/styles/common';

interface ListItemProps {
  title: string;
  color?: string;
  onPress: () => void;
  username?: string;
  itemCount?: number;
  image?: string | null;
}

export function ListItem({ title, onPress, username = 'Friend', itemCount = 0, color, image }: ListItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.listItemWrapper]}>
      <View style={styles.listItem}>
        <View style={styles.listItemContent}>
          <View style={[styles.colorStrip, { backgroundColor: color || COLORS.cardDark }]}>
            {renderImageOrIcon(image, 24)}
          </View>
          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={styles.listTitle}>{title}</Text>
            <Text numberOfLines={1} style={styles.username}>{username}’s List</Text>
            <Text style={styles.itemCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function renderImageOrIcon(source?: string | null, size = 20) {
  if (!source) return <Ionicons name="gift-outline" size={size} color="#fff" />;
  if (source.startsWith('http')) {
    return <Image source={{ uri: source }} style={{ width: size, height: size, tintColor: '#fff' }} resizeMode="contain" />;
  }
  return <Ionicons name={source as any} size={size} color="#fff" />;
}

interface ListGridProps {
  title: string;
  lists: WishlistData[];
  maxItems?: number;
}

export default function FriendsListGrid({ title, lists, maxItems = 6 }: ListGridProps) {
  const router = useRouter();

  const safeListsArray = Array.isArray(lists) ? lists.slice(0, maxItems) : [];

  const handleSeeAllPress = () => router.push('/home/friends');
  const handleListPress = (wishlistId: string) => router.push(`/shared/${wishlistId}`);

  // Split into rows of 2 (grid), keep gutters inside, but “bleed” the grid past the header padding
  const rows: WishlistData[][] = [];
  for (let i = 0; i < safeListsArray.length; i += 2) {
    rows.push(safeListsArray.slice(i, i + 2));
  }

   return (
    <Section title={title} showTitle={false}>
      <View style={styles.headerContainer}>
        <Text style={[commonStyles.sectionTitle, styles.mainTitle]}>{title}</Text>
        <TouchableOpacity onPress={handleSeeAllPress}>
          <Text style={styles.seeAllText}>Show all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((wishlist, colIndex) => (
              <View key={wishlist.id ?? `col-${colIndex}`} style={styles.column}>
                <ListItem
                  title={wishlist.title}
                  username={wishlist.ownerName || wishlist.ownerUsername || 'Friend'}
                  itemCount={wishlist.itemCount}
                  color={wishlist.color}
                  image={wishlist.image}
                  onPress={() => handleListPress(wishlist.id)}
                />
              </View>
            ))}
            {row.length === 1 && <View style={styles.column} />}
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  mainTitle: {
    fontSize: TYPOGRAPHY.sectionTitle.fontSize,
    marginBottom: 0,
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
  gridContainer: {
    width: CARD_WIDTH + SPACING.sm,
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    minHeight: 200,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  column: {
    flex: 1,
    paddingHorizontal: SPACING.xs, // inner gutters
  },
  listItemWrapper: {
    flex: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
  },
  listItem: {
    borderRadius: 8,
    backgroundColor: COLORS.cardGray,
    overflow: 'hidden',
  },
  colorStrip: {
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10, 
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  username: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});