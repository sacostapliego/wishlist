import React from 'react';
import Head from 'expo-router/head';

export interface SharedWishlistHeadProps {
  id: string;
  title?: string | null;
  description?: string | null;
  wishlistImage?: string | null;
  profileImageUrl?: string | null;
  ownerName?: string | null;
}

export const SharedWishlistHead: React.FC<SharedWishlistHeadProps> = ({ 
  id, 
  title, 
  description, 
  wishlistImage,
  profileImageUrl,
  ownerName 
}) => {
  const safeTitle = title ?? 'Shared Wishlist';
  const safeDescription = description ?? `${ownerName ?? 'User'}'s wishlist`;
  
  const ogImage = wishlistImage ?? profileImageUrl ?? 'https://cardinal-wishlist.onrender.com/favicon.ico';
  
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081';
  const url = `${appUrl}/shared/${id}`;

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

export default SharedWishlistHead;