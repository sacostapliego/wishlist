import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { wishlistAPI } from '../../services/wishlist';
import { COLORS, SPACING } from '../../styles/theme';
import { ItemFormData } from './ItemForm';

interface ScrapeUrlFormProps {
  onScrapeSuccess: (data: Partial<ItemFormData>) => void;
}

export const ScrapeUrlForm = ({ onScrapeSuccess }: ScrapeUrlFormProps) => {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) {
      Alert.alert("No URL", "Please enter a URL to scrape.");
      return;
    }
    setIsScraping(true);
    try {
      const result = await wishlistAPI.scrapeUrl(scrapeUrl);
      onScrapeSuccess({
        name: result.name || '',
        price: result.price ? String(result.price) : '',
        url: result.url || scrapeUrl,
        newImageUri: result.image_url || undefined,
        description: '',
        priority: 0,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Failed to scrape the URL. The site may be unsupported.';
      Alert.alert("Scraping Error", errorMessage);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Product URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://www.amazon.com/..."
        placeholderTextColor={'rgba(255, 255, 255, 0.3)'}
        value={scrapeUrl}
        onChangeText={setScrapeUrl}
        keyboardType="url"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.submitButton, (isScraping || !scrapeUrl) && styles.disabledButton]}
        onPress={handleScrapeUrl}
        disabled={isScraping || !scrapeUrl}
      >
        {isScraping ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Get Item Info</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.infoText}>
        Enter a link from a supported store (e.g., Amazon) to automatically fill in the details.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  input: {
    borderRadius: 15,
    borderColor: '#fff',
    borderWidth: 1,
    padding: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontSize: 12,
    paddingHorizontal: SPACING.md,
  },
});