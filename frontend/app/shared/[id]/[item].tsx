import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, Alert, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../styles/theme'; // Adjust path
import { Header } from '../../components/layout/Header'; // Adjust path
import { LoadingState } from '../../components/common/LoadingState'; // Adjust path
import getLightColor from '../../components/ui/LightColor'; // Adjust path
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useItemDetail } from '../../hooks/useItemDetail'; // Reusing the same hook
import ItemDetailContent from '../../components/item/ItemDetailContent'; // Reusing the same component

//TODO:
// 1. Remove scrolling form description

export default function SharedWishlistItemScreen() {
    const router = useRouter();
    const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
    const { item, wishlistColor, isLoading, error } = useItemDetail(itemId, wishlistId, 0, true);


    const handleCustomBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else if (wishlistId) {
            router.push(`/shared/${wishlistId}`);
        } else {
            router.push('/'); // Fallback to a generic public page
        }
    };

    const handleCopyUrl = async () => {
        if (item?.url) {
            await Clipboard.setStringAsync(item.url);
            Alert.alert("Copied", "URL copied to clipboard!");
        }
    };

    const handleOpenUrl = () => {
        if (item?.url) {
            Linking.openURL(item.url).catch(err => {
                console.error("Couldn't load page", err);
                Toast.show({ type: 'error', text1: 'Error', text2: "Could not open URL."});
            });
        }
    };

    const pageBackgroundColor = wishlistColor || COLORS.background;
    const headerBackgroundColor = getLightColor(wishlistColor || COLORS.background);
    const statusBarTextColor = Platform.OS === 'ios' ? 'dark' : (wishlistColor && wishlistColor !== COLORS.background ? 'dark' : 'light');

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: COLORS.background }]}>
                 <Header title="Loading..." onBack={handleCustomBack} backgroundColor={getLightColor(COLORS.background)} />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (error || !item) {
        return (
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: pageBackgroundColor }]}>
                <Header title={!item ? "Item Not Found" : "Error"} onBack={handleCustomBack} backgroundColor={headerBackgroundColor} />
                <View style={styles.centeredMessageContainer}>
                    <Text style={styles.errorText}>{error || "The requested item could not be found."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.screenContainer, { backgroundColor: pageBackgroundColor }]}>
            <StatusBar
                style={statusBarTextColor}
                backgroundColor={headerBackgroundColor}
                translucent={false}
            />
            <Header
                title=""
                onBack={handleCustomBack}
                backgroundColor={headerBackgroundColor}
                showOptions={false} // No options menu for shared items
            />
            <ItemDetailContent
                item={item}
                wishlistColor={wishlistColor}
                onOpenUrl={handleOpenUrl}
                onCopyUrl={handleCopyUrl}
            />
            {/* No ItemActionsMenu for shared view */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
    centeredMessageContainer: {
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