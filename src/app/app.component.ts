import { Component, HostListener, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationData, NavigationItem } from './navigation.config';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
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
    MatSnackBarModule,
    NgOptimizedImage
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  navigation:NavigationData | null = null;
  searchQuery = '';
  filteredItems: any[] = [];
  navAPI = environment.navAPI;
  showBackToTopButton = false;
  data : any = null
  currentYear = new Date().getFullYear();

  constructor(
    private http: HttpClient, 
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadNavigation();
  }

  ngOnInit() {
    // Initial check for scroll position
    this.checkScroll();
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
    if (isPlatformBrowser(this.platformId)) {
      let cache = localStorage.getItem('navigation')
      if (cache) {
        try {
          this.data = JSON.parse(cache);
          this.navigation = this.data.data;
          if (new Date().getTime() - this.data.time > 3600 * 4 * 1000) {
            this.refreshNavigation()
          }
          this.updateFilteredItems();
        } catch (e) {
          console.error('Error parsing navigation cache:', e);
          this.refreshNavigation();
        }
      } else {
        this.refreshNavigation()
      }
    } else {
      // Server-side rendering case - use empty navigation structure
      this.navigation = {
        searchEngine: "https://www.google.com/search?q=[VEDA]",
        categories: []
      };
      this.updateFilteredItems();
    }
  }

  refreshNavigation() {
    this.http.get<NavigationData>(this.navAPI).subscribe({
      next: (data) => {
        this.navigation = data;
        if (isPlatformBrowser(this.platformId)) {
          this.data = {data: data, time: new Date().getTime()}
          try {
            localStorage.setItem('navigation', JSON.stringify(this.data));
          } catch (e) {
            console.error('Error saving navigation to localStorage:', e);
          }
        }
        this.updateFilteredItems();
      },
      error: (error) => {
        console.error('Error fetching navigation data:', error);
        // Fallback to empty navigation if API fails
        if (!this.navigation) {
          this.navigation = {
            searchEngine: "https://www.google.com/search?q=[VEDA]",
            categories: []
          };
          this.updateFilteredItems();
        }
        this.snackBar.open(`Error refreshing navigation data: ${error.message || JSON.stringify(error)}`, 'Dismiss', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    })
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
