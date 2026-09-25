import { Component, HostListener, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationCategory, NavigationData, NavigationItem } from './navigation.config';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonModule,
    MatInputModule,
    MatRippleModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    NgOptimizedImage
],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  navigation:NavigationData | null = null;
  searchQuery = '';
  filteredItems: any[] = [];
  readonly bookmarkUiUrl = environment.bookmarkUiUrl;
  readonly bindingKey = `navigator:${environment.apiServer}:userId`;
  userId: string | null = null;
  state: 'binding' | 'loading' | 'loaded' | 'error' = 'binding';
  invalidBinding = false;
  storageNotice = '';
  refreshError = false;
  refreshing = false;
  private request?: Subscription;
  showBackToTopButton = false;
  data : any = null
  isDarkMode = false;
  private expandedCategory: string | null | undefined = undefined;


  private get cacheKey() {
    return `navigator:${environment.apiServer}:${this.userId}:navigation`;
  }

  private get expandedKey() {
    return `navigator:${environment.apiServer}:${this.userId}:expandedCategory`;
  }

  private validUserId(value: string | null): value is string {
    return value !== null && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private initializeBinding() {
    if (!isPlatformBrowser(this.platformId)) return;
    const ids = new URLSearchParams(window.location.search).getAll('userId');
    if (ids.length) {
      if (ids.length !== 1 || !this.validUserId(ids[0])) {
        this.invalidBinding = true;
        return;
      }
      this.userId = ids[0];
      try {
        localStorage.setItem(this.bindingKey, this.userId);
      } catch {
        this.storageNotice = 'Bookmark this URL to keep your bookmarks connected.';
      }
    } else {
      const saved = this.readStorage(this.bindingKey);
      if (this.validUserId(saved)) this.userId = saved;
    }
    if (this.userId) this.loadNavigation();
  }

  changeBinding() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.request?.unsubscribe();
    this.storageNotice = '';
    try {
      localStorage.removeItem(this.bindingKey);
    } catch {
      this.storageNotice = 'Unable to clear the saved binding. Clear this site’s storage in your browser before your next visit.';
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('userId');
    window.history.replaceState(window.history.state, '', url);
    this.userId = null;
    this.navigation = null;
    this.data = null;
    this.searchQuery = '';
    this.filteredItems = [];
    this.expandedCategory = undefined;
    this.invalidBinding = false;
    this.refreshError = false;
    this.refreshing = false;
    this.state = 'binding';
  }

  ngOnDestroy() {
    this.request?.unsubscribe();
  }

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeBinding();
  }

  ngOnInit() {
    // Initial check for scroll position
    this.checkScroll();
    // Initialize dark mode detection
    this.initializeDarkMode();
  }

  initializeDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if browser prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = prefersDark.matches;
      this.applyTheme();

      // Listen for changes in color scheme preference
      prefersDark.addEventListener('change', (e) => {
        this.isDarkMode = e.matches;
        this.applyTheme();
      });
    }
  }

  applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;
      if (this.isDarkMode) {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    }
  }

  @HostListener('window:scroll', [])
  checkScroll() {
    // Show button when page is scrolled down more than 300px
    if (isPlatformBrowser(this.platformId)) {
      this.showBackToTopButton = window.scrollY > 300;
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      this.showBackToTopButton = false;
    }
  }

  loadNavigation() {
    if (!this.userId || !isPlatformBrowser(this.platformId)) return;
    const cache = this.readStorage(this.cacheKey);
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (!Number.isFinite(parsed.time) || !Array.isArray(parsed.data?.categories) ||
            typeof parsed.data?.searchEngine !== 'string') throw new Error('Invalid cache');
        this.data = parsed;
        this.navigation = parsed.data;
        this.state = 'loaded';
        this.updateFilteredItems();
        if (Date.now() - parsed.time > 4 * 3600 * 1000) this.refreshNavigation();
        return;
      } catch {
        // A malformed cache must not prevent fetching the current user's data.
      }
    }
    this.refreshNavigation();
  }

  refreshNavigation() {
    if (!this.userId || !isPlatformBrowser(this.platformId)) return;
    this.request?.unsubscribe();
    this.refreshError = false;
    this.refreshing = true;
    if (!this.navigation) this.state = 'loading';
    this.request = this.http.get<NavigationData>(
      `${environment.apiServer}/api/bookmark/collection/instances/${this.userId}`
    ).subscribe({
      next: (data) => {
        this.navigation = data;
        this.data = {data, time: Date.now()};
        this.state = 'loaded';
        this.refreshing = false;
        try {
          localStorage.setItem(this.cacheKey, JSON.stringify(this.data));
        } catch {
          // Navigation remains usable without an offline cache.
        }
        this.updateFilteredItems();
      },
      error: () => {
        this.refreshing = false;
        this.refreshError = true;
        this.state = this.navigation ? 'loaded' : 'error';
      }
    });
  }

  private initExpandedCategory() {
    if (this.expandedCategory !== undefined) return;

    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(this.expandedKey);
        if (saved !== null) {
          this.expandedCategory = saved;
          return;
        }
      } catch (e) {
        console.error('Error reading expanded category cache:', e);
      }
    }

    // Default: expand only the first category
    this.expandedCategory = this.navigation?.categories[0]?.name ?? null;
  }

  isCategoryExpanded(category: NavigationCategory) {
    this.initExpandedCategory();
    return this.expandedCategory === category.name;
  }

  onCategoryToggle(category: NavigationCategory, expanded: boolean) {
    this.initExpandedCategory();
    if (expanded) {
      this.expandedCategory = category.name;
    } else if (this.expandedCategory === category.name) {
      // Only clear if this category was the one tracked as open — the
      // accordion emits (closed) for the previously-open panel *after*
      // (opened) for the newly-opened one, which would otherwise stomp it.
      this.expandedCategory = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      try {
        if (this.expandedCategory) {
          localStorage.setItem(this.expandedKey, this.expandedCategory);
        } else {
          localStorage.removeItem(this.expandedKey);
        }
      } catch (e) {
        console.error('Error saving expanded category:', e);
      }
    }
  }

  onSearch() {
    if (this.searchQuery.trim() && this.navigation !== null && isPlatformBrowser(this.platformId)) {
      const url = this.navigation.searchEngine.replace('[VEDA]', encodeURIComponent(this.searchQuery));
      window.location.href = url;
    }
  }

  getFaviconUrl(item: NavigationItem) {
    if (item.favicon) return item.favicon;
    if (item.icon) return item.icon;

    const url = item.content || item.url || '';
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=64`;
  }

  updateFilteredItems() {
    if (!this.searchQuery.trim() || this.navigation === null) {
      this.filteredItems = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const results: any[] = [];

    this.navigation.categories.forEach(category => {
      category.items.forEach(item => {
        const itemUrl = (item.content || item.url || '').toLowerCase();
        if (item.name.toLowerCase().includes(query) ||
            itemUrl.includes(query)) {
          results.push({
            ...item,
            category: category.name
          });
        }
      });
    });

    this.filteredItems = results;
  }

  onSearchInputChange() {
    this.updateFilteredItems();
  }

  selectItem(item: NavigationItem) {
    if (isPlatformBrowser(this.platformId)) {
      const url = item.content || item.url || '';
      if (url) {
        window.location.href = url;
      }
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredItems = [];
  }

  protected readonly Date = Date;

  getLastRefreshTime() {
    return this.data ? 'Last refresh: ' + new Date(this.data.time).toLocaleString() : ''
  }

  // TrackBy functions for better rendering performance
  trackByCategory(index: number, category: any) {
    return category.name;
  }

  trackByItem(index: number, item: any) {
    return item.name;
  }

  trackByFilteredItem(index: number, item: any) {
    return item.name;
  }
}
