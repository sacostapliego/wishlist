import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../styles/theme'; // Adjust path as needed
import { API_URL } from '../../../services/api'; // Adjust path as needed
import { Header } from '../../../components/layout/Header'; // Adjust path as needed
import wishlistAPI from '@/app/services/wishlist';
import { LoadingState } from '../../../components/common/LoadingState'; // Adjust path as needed
import getLightColor from '@/app/components/ui/LightColor';
import * as Clipboard from 'expo-clipboard';


interface WishlistItemDetails {
    id: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    image?: string;
    // Add any other relevant fields like is_purchased, priority, etc.
}

interface WishlistDetails { // Added interface for wishlist details
    id: string;
    title: string;
    color?: string;
    // other wishlist properties
}

export default function WishlistItemScreen() {
    const router = useRouter();
    const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
    const [item, setItem] = useState<WishlistItemDetails | null>(null);
    const [wishlistColor, setWishlistColor] = useState<string | undefined>(COLORS.background); // State for wishlist color
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleCustomBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else if (wishlistId) {
            router.push(`/home/lists/${wishlistId}`);
        } else {
            router.push('/home');
        }
    };

    const handleCopyUrl = async () => {
        if (item?.url) {
            await Clipboard.setStringAsync(item.url);
            Alert.alert("Copied", "URL copied to clipboard!");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!itemId || !wishlistId) {
                setError("Item ID or Wishlist ID is missing.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Fetch item details
                const fetchedItem = await wishlistAPI.getWisihlistItem(itemId as string);
                if (fetchedItem) {
                    setItem(fetchedItem);
                } else {
                    setError("Item not found.");
                    // Still try to fetch wishlist details for color if item not found but wishlistId exists
                }

                // Fetch wishlist details for color
                try {
                    const fetchedWishlist = await wishlistAPI.getWishlist(wishlistId as string);
                    if (fetchedWishlist && fetchedWishlist.color) {
                        setWishlistColor(fetchedWishlist.color);
                    }
                } catch (wishlistError) {
                    console.error("Failed to fetch wishlist details for color:", wishlistError);
                    // Keep default background color if wishlist fetch fails
                }

            } catch (err) {
                console.error("Failed to fetch item details:", err);
                setError("Failed to load item details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [itemId, wishlistId]);

    const handleOpenUrl = () => {
        if (item?.url) {
            Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const dynamicPageStyle = {
        ...styles.container,
        backgroundColor: wishlistColor || COLORS.background,
    };

    const imageContainerDynamicStyle = {
        ...styles.imageContainer,
        backgroundColor: getLightColor(wishlistColor || COLORS.cardDark), // Use cardDark as fallback
    };


    // TODO: Check
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (error && !item) {
        return (
            <SafeAreaView style={dynamicPageStyle}>
                <Header title="Error" onBack={() => router.back()} />
                <View style={styles.centeredMessage}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={dynamicPageStyle}>
                <Header title="Item Not Found" onBack={() => router.back()} />
                <View style={styles.centeredMessage}>
                    <Text style={styles.errorText}>The requested item could not be found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const itemImageUri = item.image ? `${API_URL}wishlist/${item.id}/image` : null;

    return (
        <SafeAreaView style={styles.container}>
            <Header title='' onBack={handleCustomBack} />
            <ScrollView  style={dynamicPageStyle} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                    {error && <Text style={styles.errorTextSmall}>{error}</Text>}

                {itemImageUri && (
                    <View style={imageContainerDynamicStyle}>
                        <Image source={{ uri: itemImageUri }} style={styles.image} resizeMode='contain'/>
                    </View>
                )}

                <View style={styles.detailsContainer}>

                    {item.price !== undefined && item.price !== null && (
                        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    )}

                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}

                    {item.url && (
                         <View style={styles.urlDisplayContainer}>
                            <TouchableOpacity onPress={handleOpenUrl} style={styles.urlLinkTouchable}>
                                <Text style={styles.urlLinkText} numberOfLines={1} ellipsizeMode="middle">
                                    {item.url}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCopyUrl} style={styles.copyIconTouchable}>
                                <Ionicons name="copy-outline" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: SPACING.lg,
    },
    imageContainer: { // Added a container for the image/placeholder
        width: '90%',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderRadius: 8,
        borderColor: COLORS.background,
        borderWidth: 4,
        marginTop: SPACING.sm,
        alignSelf: 'center',
    },
    image: {
        width: '100%', 
        height: '100%', 
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        color: COLORS.inactive,
        marginTop: SPACING.sm,
    },
    detailsContainer: {
        paddingHorizontal: SPACING.md, // Only horizontal padding, vertical spacing handled by elements
    },
    itemName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
        margin: SPACING.lg,
    },
    description: {
        fontSize: 16,
        minHeight: 200,
        color: COLORS.text.secondary,
        marginBottom: SPACING.md,
        lineHeight: 22,
    },
    price: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    urlDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background || COLORS.card, // Use a suitable background color
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.background || COLORS.inactive, // Use a suitable border color
    },
    urlLinkTouchable: {
        flex: 1, 
        marginRight: SPACING.sm, 
    },
    urlLinkText: {
        fontSize: 15,
        color: COLORS.text.primary, 
        // textDecorationLine: 'underline', // Optional: if you want underline
    },
    copyIconTouchable: {
        padding: SPACING.xs, 
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.error,
        textAlign: 'center',
    },
    errorTextSmall: { // For less critical errors shown within content
        fontSize: 14,
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
});