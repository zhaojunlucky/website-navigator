import { Component, HostListener, OnInit } from '@angular/core';
import {NAVIGATION_DATA, NavigationData} from './navigation.config';
import { CommonModule } from '@angular/common';
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
import {HttpClient} from '@angular/common/http';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  navigation:NavigationData | null = null;
  searchQuery = '';
  filteredItems: any[] = [];
  navAPI = "http://localhost:8080/api/bookmark/collection/instances/2"
  showBackToTopButton = false;

  constructor(private http: HttpClient) {
    this.loadNavigation();
  }

  ngOnInit() {
    // Initial check for scroll position
    this.checkScroll();
  }

  @HostListener('window:scroll', [])
  checkScroll() {
    // Show button when page is scrolled down more than 300px
    this.showBackToTopButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.showBackToTopButton = false;
  }

  loadNavigation() {
    let cache = localStorage.getItem('navigation')
    if (cache) {
      let data = JSON.parse(cache);
      this.navigation = data.data;
      if (new Date().getTime() - data.time > 3600 * 4 * 1000) {
        this.refreshNavigation()
      }
      this.updateFilteredItems();

    } else {
      this.refreshNavigation()
    }
  }

  refreshNavigation() {
    this.http.get(this.navAPI).subscribe((data: any) => {
      this.navigation = data;
      localStorage.setItem('navigation', JSON.stringify({data: this.navigation, time: new Date().getTime()}));
      this.updateFilteredItems();

    })
  }

  onSearch() {
    if (this.searchQuery.trim() && this.navigation !== null) {
      const url = this.navigation.searchEngine.replace('[VEDA]', encodeURIComponent(this.searchQuery));
      window.location.href = url;
    }
  }

  getFaviconUrl(item: any) {
    return item.favicon || `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.url}&size=32`;
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
        if (item.name.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query)) {
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

  selectItem(item: any) {
    window.location.href = item.url;
  }
}
