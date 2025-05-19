import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, SafeAreaView, Alert, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../styles/theme';
import { API_URL } from '../../../services/api';
import { Header } from '../../../components/layout/Header';
import wishlistAPI from '@/app/services/wishlist';
import { LoadingState } from '../../../components/common/LoadingState';
import getLightColor from '@/app/components/ui/LightColor';
import * as Clipboard from 'expo-clipboard';
import { ItemActionsMenu } from '@/app/components/item/ItemActionsMenu';
import Toast from 'react-native-toast-message';
import { useRefresh } from '@/app/context/RefreshContext';
import { StatusBar } from 'expo-status-bar';

const screenHeight = Dimensions.get('window').height;

interface WishlistItemDetails {
    id: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    image?: string;
}

export default function WishlistItemScreen() {
    const router = useRouter();
    const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
    const [item, setItem] = useState<WishlistItemDetails | null>(null);
    const [wishlistColor, setWishlistColor] = useState<string | undefined>(COLORS.background);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const { triggerRefresh, refreshTimestamp } = useRefresh(); 

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
            // console.log(`Fetching item details for ${itemId}, refresh: ${refreshTimestamp}`); // For debugging
            setIsLoading(true);
            try {
                const fetchedItem = await wishlistAPI.getWisihlistItem(itemId as string);
                if (fetchedItem) {
                    setItem(fetchedItem);
                } else {
                    setError("Item not found.");
                }

                const fetchedWishlist = await wishlistAPI.getWishlist(wishlistId as string);
                if (fetchedWishlist && fetchedWishlist.color) {
                    setWishlistColor(fetchedWishlist.color);
                }
            } catch (err) {
                console.error("Failed to fetch item details:", err);
                setError("Failed to load item details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [itemId, wishlistId, refreshTimestamp]);

    const handleOpenUrl = () => {
        if (item?.url) {
            Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err));
        }
    };


    const dynamicPageStyle = {
        ...styles.container,
        backgroundColor: wishlistColor || COLORS.background,
    };

    const dynamicImageHeight = screenHeight * 0.35;

    const imageContainerDynamicStyle = {
        ...styles.imageContainer,
        backgroundColor: getLightColor(wishlistColor || COLORS.cardDark),
        height: dynamicImageHeight,
    };

    const handleItemDeleted = () => {
        Toast.show({
            type: 'success',
            text1: 'Item Deleted',
            text2: `${item?.name || 'The item'} has been deleted.`,
        });
        triggerRefresh();
        if (wishlistId) {
            router.replace(`/home/lists/${wishlistId}`);
        } else {
            router.replace('/home/lists');
        }
    };


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
    const headerBackgroundColor = getLightColor(wishlistColor || COLORS.background);
    
    const fixedUrlContainerHeight = (SPACING.sm * 2) + 24 + SPACING.md;
    const scrollPaddingBottom = (styles.scrollContent.paddingBottom || 0) + fixedUrlContainerHeight;


    return (
        <SafeAreaView style={dynamicPageStyle}>
            <StatusBar 
                style={Platform.OS === 'ios' ? 'dark' : (wishlistColor && wishlistColor !== COLORS.background ? 'dark' : 'light')} // Heuristic for text color
                backgroundColor={headerBackgroundColor} 
                translucent={false}
            />
            <Header 
                title=''
                onBack={handleCustomBack} 
                backgroundColor={headerBackgroundColor} 
                showOptions={true} 
                onOptionsPress={() => setMenuVisible(true)}
            />
            <ScrollView  
                style={dynamicPageStyle} 
                contentContainerStyle={{ ...styles.scrollContent, paddingBottom: scrollPaddingBottom }}
            >
                {itemImageUri && (
                    <View style={imageContainerDynamicStyle}>
                        <Image source={{ uri: itemImageUri }} style={styles.image} resizeMode='contain'/>
                    </View>
                )}
                <View style={styles.detailsContainer}>
                    <View style={styles.namePriceContainer}>
                        <Text style={styles.itemName}>{item.name}</Text>
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

            {itemId && wishlistId && (
                <ItemActionsMenu
                    itemId={itemId}
                    wishlistId={wishlistId}
                    itemName={item.name}
                    menuVisible={menuVisible}
                    onMenuClose={() => setMenuVisible(false)}
                    onItemDeleted={handleItemDeleted}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.lg, // Base padding
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
        marginTop: SPACING.lg, 
    },
    namePriceContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center', 
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
        backgroundColor: COLORS.cardDark,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
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
});