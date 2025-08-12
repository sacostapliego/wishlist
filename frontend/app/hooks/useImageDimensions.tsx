import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { API_URL } from '../services/api';
import { WishlistItem } from '@/app/types/wishlist';

type Dim = { width: number; height: number; aspect: number };
type MapType = Record<string, Dim>;

export function useImageDimensions(items: WishlistItem[]) {
  const [dims, setDims] = useState<MapType>({});
  const loadingIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    items.forEach((it) => {
      if (!it?.id) return;
      if (dims[it.id] || loadingIds.current.has(it.id)) return;
      if (!it.image) {
        // No image, mark square by default
        setDims((m) => ({ ...m, [it.id]: { width: 1, height: 1, aspect: 1 } }));
        return;
      }
      loadingIds.current.add(it.id);
      const uri = `${API_URL}wishlist/${it.id}/image`;
      Image.getSize(
        uri,
        (w, h) => {
          setDims((m) => ({ ...m, [it.id]: { width: w, height: h, aspect: h > 0 ? h / w : 1 } }));
          loadingIds.current.delete(it.id);
        },
        () => {
          // Fallback to square on failure
          setDims((m) => ({ ...m, [it.id]: { width: 1, height: 1, aspect: 1 } }));
          loadingIds.current.delete(it.id);
        }
      );
    });
  }, [items, dims]);

  return dims;
}