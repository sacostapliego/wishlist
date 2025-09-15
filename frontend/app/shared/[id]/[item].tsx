import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, Alert, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../styles/theme';
import { Header } from '../../components/layout/Header';
import { LoadingState } from '../../components/common/LoadingState';
import getLightColor from '../../components/ui/LightColor';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useItemDetail } from '../../hooks/useItemDetail';
import { useItemClaiming } from '../../hooks/useItemClaiming';
import ItemDetailContent from '../../components/item/ItemDetailContent';
import { ItemClaimingSection } from '../../components/item/ItemClaimingSection';
import Head from 'expo-router/head';

export default function SharedWishlistItemScreen() {
    const router = useRouter();
    const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
    const { item, wishlistColor, isLoading, error, refetchItemData } = useItemDetail(itemId, wishlistId, 0, true);
    
    const {
        showGuestNameModal,
        guestName,
        setGuestName,
        isClaimLoading,
        isItemClaimed,
        canUserUnclaim,
        handleClaimItem,
        handleGuestClaim,
        handleUnclaimItem,
        cancelGuestModal,
    } = useItemClaiming(item, refetchItemData);

    const handleCustomBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else if (wishlistId) {
            router.push(`/shared/${wishlistId}`);
        } else {
            router.push('/');
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
    const activeColor = wishlistColor || COLORS.primary;

    const renderClaimingContent = () => (
        <ItemClaimingSection
            item={item!}
            activeColor={activeColor}
            wishlistColor={wishlistColor}
            isItemClaimed={isItemClaimed}
            canUserUnclaim={canUserUnclaim}
            isClaimLoading={isClaimLoading}
            showGuestNameModal={showGuestNameModal}
            guestName={guestName}
            setGuestName={setGuestName}
            onClaimItem={handleClaimItem}
            onUnclaimItem={handleUnclaimItem}
            onGuestClaim={handleGuestClaim}
            onCancelGuestModal={cancelGuestModal}
        />
    );

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
                showOptions={false}
            />
            
            <ItemDetailContent
                item={item}
                wishlistColor={wishlistColor}
                onOpenUrl={handleOpenUrl}
                onCopyUrl={handleCopyUrl}
                claimingContent={renderClaimingContent()}
            />
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