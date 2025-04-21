export interface ListItem {
    id: string;
    title: string;
    itemCount: number;
    color?: string;
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
  }

export interface WishlistData {
  id: string;
  title: string;
  itemCount: number;
  color: string;
}

export interface WishlistFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    color?: string;
    isPublic?: boolean;
  };
  onSubmit: (values: {
    title: string;
    description: string;
    color: string;
    is_public: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export default function lists() {
}