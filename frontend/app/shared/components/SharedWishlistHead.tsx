import React from 'react';
import Head from 'expo-router/head';

const isAbsoluteUrl = (str: string | null | undefined): str is string => {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
};

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
  const safeDescription = description || `${ownerName || 'User'}'s wishlist`;
  
  // Determine the final image URL, prioritizing valid, absolute URLs.
  let finalOgImage = 'https://cardinal-wishlist.onrender.com/favicon.ico'; // Default fallback
  if (isAbsoluteUrl(wishlistImage)) {
    finalOgImage = wishlistImage;
  } else if (isAbsoluteUrl(profileImageUrl)) {
    finalOgImage = profileImageUrl;
  }

  let webBaseUrl = process.env.EXPO_PUBLIC_APP_URL;
  const url = `${webBaseUrl}/shared/${id}`;

  console.log({
    title: safeTitle,
    description: safeDescription,
    ogImage: finalOgImage,
    url: url,
    props: { id, title, description, wishlistImage, profileImageUrl, ownerName }
  });

  return (
    <Head>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={finalOgImage} />
    </Head>
  );
};

export default SharedWishlistHead;