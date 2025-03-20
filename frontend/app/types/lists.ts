/**
 * Common interface for list items across components
 */
export interface ListItem {
    id: string;
    title: string;
    itemCount: number;
    color?: string;
  }
  
  /**
   * Props for components that display lists
   */
  export interface ListDisplayProps {
    title: string;
    lists: ListItem[];
  }