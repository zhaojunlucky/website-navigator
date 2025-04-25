import { Component } from '@angular/core';
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
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  navigation:NavigationData | null = null;
  searchQuery = '';
  filteredItems: any[] = [];
  navAPI = "http://localhost:8080/api/bookmark/collection/instances/2"

  constructor(private http: HttpClient) {
    this.loadNavigation();
  }

  loadNavigation() {
    let cache = localStorage.getItem('navigation')
    if (cache) {
      this.navigation = JSON.parse(cache);
      this.updateFilteredItems();

    }
    this.http.get(this.navAPI).subscribe((data: any) => {
      this.navigation = data;
      localStorage.setItem('navigation', JSON.stringify(this.navigation));
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
            item.url.toLowerCase().includes(query)) {
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
