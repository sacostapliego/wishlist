import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { COLORS, SPACING } from '../../styles/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                isDestructive ? styles.destructiveButton : styles.confirmButton
              ]}
              onPress={onConfirm}
            >
              <Text style={[
                styles.buttonText,
                isDestructive ? styles.destructiveButtonText : styles.confirmButtonText
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '80%',
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginLeft: SPACING.md,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  destructiveButton: {
    backgroundColor: '#ff4040',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
  },
  destructiveButtonText: {
    color: '#fff',
  },
});