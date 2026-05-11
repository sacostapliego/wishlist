import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { COLORS, SPACING } from '@/app/styles/theme';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  title?: string;
}

export default function ImageCropModal({
  visible,
  imageUri,
  onConfirm,
  onCancel,
  aspectRatio = 1,
  title = 'Crop Image',
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = async (): Promise<string | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate the scale between the image's natural size and displayed size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Draw the cropped portion
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Return PNG with maximum quality (no compression)
    return canvas.toDataURL('image/png');
  };

  const handleConfirm = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onConfirm(croppedImage);
    }
  };

  const handleCancel = () => {
    // Reset crop state
    setCrop({ unit: '%', width: 50, x: 25, y: 25, height: 50 });
    setCompletedCrop(null);
    onCancel();
  };

  // Only render on web
  if (Platform.OS !== 'web') return null;

  const windowHeight = Dimensions.get('window').height;
  const maxImageHeight = windowHeight * 0.6;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.cropModalOverlay}>
        <View style={styles.cropModalContainer}>
          <View style={styles.cropModalHeader}>
            <Text style={styles.cropModalTitle}>{title}</Text>
          </View>
          <View style={[styles.cropImageContainer, { maxHeight: maxImageHeight }]}>
            {imageUri && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                <img
                  ref={imgRef}
                  src={imageUri}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: maxImageHeight - 32,
                    width: 'auto',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                  alt="Crop preview"
                  onLoad={() => {
                    if (imgRef.current) {
                      const { width, height } = imgRef.current;
                      const size = Math.min(width, height) * 0.5;
                      setCrop({
                        unit: 'px',
                        width: size,
                        height: size,
                        x: (width - size) / 2,
                        y: (height - size) / 2,
                      });
                    }
                  }}
                />
              </ReactCrop>
            )}
          </View>
          <View style={styles.cropModalActions}>
            <TouchableOpacity style={styles.cropCancelButton} onPress={handleCancel}>
              <Text style={styles.cropCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cropConfirmButton} onPress={handleConfirm}>
              <Text style={styles.cropConfirmButtonText}>Apply Crop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cropModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  cropModalContainer: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cropModalHeader: {
    padding: SPACING.lg,
  },
  cropModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  cropImageContainer: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    minHeight: 300,
  },
  cropModalActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  cropCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  cropCancelButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  cropConfirmButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  cropConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});