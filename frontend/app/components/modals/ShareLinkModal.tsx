import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'; // Removed Pressable if not used elsewhere
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { CARD_WIDTH, COLORS, SPACING } from '../../styles/theme';
import * as Clipboard from 'expo-clipboard';

interface ShareLinkModalProps {
  visible: boolean;
  shareUrl: string | null;
  onClose: () => void;
}

export default function ShareLinkModal({
    visible,
    shareUrl,
    onClose,
  }: ShareLinkModalProps) {
    const handleCopyLink = async () => {
      if (shareUrl) {
        await Clipboard.setStringAsync(shareUrl);
        console.log("Link copy functionality to be implemented.");
      }
    };

    if (!visible) {
        return null;
      }
  
    return (
      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      > 
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.title}>Created New Link</Text>
            {shareUrl ? (
              <>
                <View style={styles.urlContainer}>
                  <Text style={styles.urlText} selectable={true}>{shareUrl}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyLink}
                >
                  <Ionicons name="copy-outline" size={20} color={COLORS.white} />
                  <Text style={styles.copyButtonText}>Copy Link</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.message}>Could not generate share link. Please try again.</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: CARD_WIDTH,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardDark,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  urlContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  urlText: {
    fontSize: 14,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  copyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  closeButton: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.text.secondary,
  },
  closeButtonText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text.secondary,
  }
});