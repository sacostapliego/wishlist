import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Alert, Platform, Linking } from 'react-native';
import Head from "expo-router/head";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '@/app/styles/theme';
import { Header } from '@/app/components/layout/Header';
import { LoadingState } from '@/app/components/common/LoadingState';
import getLightColor from '@/app/components/common/LightColor';
import * as Clipboard from 'expo-clipboard';
import ItemActionsMenu from '@/app/components/features/item/ItemActionsMenu';
import Toast from 'react-native-toast-message';
import { useRefresh } from '@/app/context/RefreshContext';
import { StatusBar } from 'expo-status-bar';
import { useItemDetail } from '@/app/hooks/useItemDetail';
import { useAppNavigation } from '@/app/hooks/useAppNavigation';
import ItemDetailContent from '@/app/components/features/item/ItemDetailContent';

export default function WishlistItemScreen() {
    const router = useRouter();
    const { navigateBack } = useAppNavigation();
    const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
    const { triggerRefresh, refreshTimestamp } = useRefresh();
    const [menuVisible, setMenuVisible] = useState(false);

    const { item, wishlistColor, isLoading, error } = useItemDetail(itemId, wishlistId, 0, false);

    const handleCustomBack = () => {
        const fallbackPath = wishlistId ? `/home/lists/${wishlistId}` : '/home';
        navigateBack(fallbackPath);
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

    const pageBackgroundColor = getLightColor(wishlistColor || COLORS.background);
    const headerBackgroundColor = getLightColor(wishlistColor || COLORS.background);
    const statusBarTextColor = Platform.OS === 'ios' ? 'dark' : (wishlistColor && wishlistColor !== COLORS.background ? 'dark' : 'dark');

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: COLORS.background }]}>
                <Head>
                    <meta name="theme-color" content={getLightColor(COLORS.background)} />
                </Head>
                <Header title="Loading..." onBack={handleCustomBack} backgroundColor={getLightColor(COLORS.background)} />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (error || !item) {
        return (
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: pageBackgroundColor }]}>
                <Head>
                    <meta name="theme-color" content={headerBackgroundColor} />
                </Head>
                <Header title={!item ? "Item Not Found" : "Error"} onBack={handleCustomBack} backgroundColor={headerBackgroundColor} />
                <View style={styles.centeredMessageContainer}>
                    <Text style={styles.errorText}>{error || "The requested item could not be found."}</Text>
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={[styles.screenContainer, { backgroundColor: pageBackgroundColor }]}>
               <Head>
                 <style>{`body { background: ${headerBackgroundColor} !important; }`}</style>
                 <meta name="color-scheme" content="dark" />
                 <meta name="theme-color" content={headerBackgroundColor} />
               </Head>
            <StatusBar
                style={statusBarTextColor}
                backgroundColor={headerBackgroundColor}
                translucent={false}
            />
            <Header
                title=""
                onBack={handleCustomBack}
                backgroundColor={headerBackgroundColor}
                showOptions={true}
                onOptionsPress={() => setMenuVisible(true)}
            />
            <ItemDetailContent
                item={item}
                wishlistColor={wishlistColor}
                onOpenUrl={handleOpenUrl}
                onCopyUrl={handleCopyUrl}
            />
            {itemId && wishlistId && item && (
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
    screenContainer: {
        flex: 1,
        backgroundColor: 'transparent',
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