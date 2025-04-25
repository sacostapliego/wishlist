export interface ListItem {
    id: string;
    title: string;
    itemCount: number;
    color?: string;
    image?: string;
  }
  
export interface ListDisplayProps {
    title: string;
    lists: ListItem[];
  }

export interface WishlistFormData {
    title: string;
    description: string;
    color: string;
    is_public: boolean;
    image: string;
  }

export interface WishlistApiResponse {
    id: string;
    title: string;
    description?: string;
    color?: string;
    is_public: boolean;
    item_count: number;
    created_at: string;
    updated_at?: string;
    user_id: string;
    image?: string;
  }

export interface WishlistData {
  id: string;
  title: string;
  itemCount: number;
  color: string;
  image: string;
}

export interface WishlistFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    color?: string;
    isPublic?: boolean;
    image?: string;
  };
  onSubmit: (values: {
    title: string;
    description: string;
    color: string;
    is_public: boolean;
    image: string;
  }) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export default function lists() {
}