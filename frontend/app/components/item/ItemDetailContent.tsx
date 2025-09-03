import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import getLightColor from '../ui/LightColor';
import { WishlistItemDetails } from '../../types/wishlist';
import { ItemDetailContentProps } from '@/app/types/items';

const screenHeight = Dimensions.get('window').height;

export const ItemDetailContent: React.FC<ItemDetailContentProps> = ({
    item,
    wishlistColor,
    onOpenUrl,
    onCopyUrl,
}) => {
    const itemImageUri = item.image ? `${API_URL}wishlist/${item.id}/image` : null;
    
    const dynamicImageHeight = screenHeight * 0.40;
    const imageContainerBackgroundColor = getLightColor(wishlistColor || COLORS.cardDark);

    const imageContainerDynamicStyle = {
        ...styles.imageContainer,
        backgroundColor: imageContainerBackgroundColor,
        height: dynamicImageHeight,
    };

    const fixedUrlContainerHeight = item.url ? (SPACING.sm * 2) + 24 + SPACING.md : 0;
    const scrollPaddingBottom = (styles.scrollContent.paddingBottom || 0) + fixedUrlContainerHeight;

    return (
        <>
            <ScrollView
                style={{...styles.scrollView, backgroundColor: imageContainerBackgroundColor}}
                contentContainerStyle={{ ...styles.scrollContent, paddingBottom: scrollPaddingBottom }}
            >
                {itemImageUri && (
                    <View style={imageContainerDynamicStyle}>
                        <Image source={{ uri: itemImageUri }} style={styles.image} resizeMode='contain' />
                    </View>
                )}
                <View style={styles.detailsContainer}>
                    <View style={styles.namePriceContainer}>
                        <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                        {item.price !== undefined && item.price !== null && (
                            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                        )}
                    </View>
                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}
                </View>
            </ScrollView>

            {item.url && (
                <View style={styles.fixedUrlDisplayContainer}>
                    <TouchableOpacity onPress={onOpenUrl} style={styles.urlLinkTouchable}>
                        <Text style={styles.urlLinkText} numberOfLines={1} ellipsizeMode="middle">
                            {item.url}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCopyUrl} style={styles.copyIconTouchable}>
                        <Ionicons name="copy-outline" size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.lg,
    },
    imageContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        paddingBottom: SPACING.xxl,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    detailsContainer: {
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.sm,
        paddingTop: SPACING.md,
        backgroundColor: COLORS.background,
    },
    namePriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    itemName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        flex: 1,
        marginRight: SPACING.sm,
    },
    price: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.text.primary,
        textAlign: 'right',
    },
    description: {
        fontSize: 16,
        color: COLORS.text.secondary,
        marginBottom: SPACING.md,
        lineHeight: 22,
        minHeight: 100,
    },
    fixedUrlDisplayContainer: {
        position: 'absolute',
        bottom: SPACING.md,
        left: SPACING.md,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardDark, // Or another appropriate background
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Example border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.00,
        elevation: 5,
    },
    urlLinkTouchable: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    urlLinkText: {
        fontSize: 15,
        color: COLORS.text.primary,
    },
    copyIconTouchable: {
        padding: SPACING.xs,
    },
});

export default ItemDetailContent;