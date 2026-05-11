import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { WishlistItemDetails } from '@/app/types/wishlist';
import getLightColor from '../../common/LightColor';

interface ItemClaimingSectionProps {
    item: WishlistItemDetails;
    activeColor: string;
    wishlistColor?: string;
    isItemClaimed: boolean;
    canUserUnclaim: boolean;
    isClaimLoading: boolean;
    showGuestNameModal: boolean;
    guestName: string;
    setGuestName: (name: string) => void;
    onClaimItem: () => void;
    onUnclaimItem: () => void;
    onGuestClaim: () => void;
    onCancelGuestModal: () => void;
}

export const ItemClaimingSection: React.FC<ItemClaimingSectionProps> = ({
    item,
    activeColor,
    wishlistColor,
    isItemClaimed,
    canUserUnclaim,
    isClaimLoading,
    showGuestNameModal,
    guestName,
    setGuestName,
    onClaimItem,
    onUnclaimItem,
    onGuestClaim,
    onCancelGuestModal,
}) => {
    const baseLightColor = getLightColor(wishlistColor || COLORS.primary);

    const isBlack = wishlistColor?.toLowerCase().includes('rgb(0, 0, 0)') || 
                    wishlistColor?.toLowerCase().includes('rgb(27, 27, 27)');

    const claimedColor = isBlack ? 'rgb(255, 255, 255)' : baseLightColor;

    return (
        <>
            <View style={styles.claimSection}>
                {isItemClaimed ? (
                    <View style={[styles.claimedContainer, { borderColor: claimedColor }]}>
                        <Ionicons name="checkmark-circle" size={20} color={claimedColor} />
                        <Text style={[styles.claimedText, { color: claimedColor }]}>
                            Claimed by {item.claimed_by_display_name || 'someone'}
                        </Text>
                        {canUserUnclaim && (
                            <TouchableOpacity
                                style={styles.unclaimButton}
                                onPress={onUnclaimItem}
                                disabled={isClaimLoading}
                            >
                                <Text style={[styles.unclaimText, { color: claimedColor }]}>Unclaim</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.claimButton, { borderColor: claimedColor }]}
                        onPress={onClaimItem}
                        disabled={isClaimLoading}
                    >
                        <Ionicons 
                            name="checkmark-circle-outline" 
                            size={20} 
                            color={claimedColor} 
                        />
                        <Text style={[styles.claimButtonText, { color: claimedColor }]}>
                            I'm getting this
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Guest Name Modal */}
            <Modal
                visible={showGuestNameModal}
                transparent
                animationType="fade"
                onRequestClose={onCancelGuestModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter your name</Text>
                        <Text style={styles.modalSubtitle}>
                            Let others know you're getting this item
                        </Text>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Your name"
                            value={guestName}
                            onChangeText={setGuestName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancelGuestModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: claimedColor }]}
                                onPress={onGuestClaim}
                                disabled={isClaimLoading}
                            >
                                <Text style={styles.confirmButtonText}>Claim Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default ItemClaimingSection;

const styles = StyleSheet.create({
    claimSection: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderRadius: 8,
        backgroundColor: COLORS.cardDark,
        marginBottom: SPACING.md,
    },
    claimTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderWidth: 2,
        borderRadius: 8,
        backgroundColor: COLORS.cardDark,
    },
    claimButtonText: {
        marginLeft: SPACING.xs,
        fontSize: 18,
        fontWeight: '500',
    },
    claimedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderWidth: 2,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    claimedText: {
        marginLeft: SPACING.xs,
        fontSize: 16,
        color: COLORS.text.secondary,
        flex: 1,
    },
    unclaimButton: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        fontSize: 16,
    },
    unclaimText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
        borderRadius: 12,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    nameInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: 16,
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.text.secondary,
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
    },
});