// navigation.config.ts


export interface NavigationItem {
  name: string;
  content?: string;
  url?: string;
  icon?: string;
  favicon?: string;
}

export interface NavigationCategory {
  name: string;
  icon?: string;
  items: NavigationItem[];
}
export interface NavigationData {
  searchEngine: string;
  categories: NavigationCategory[];
}
