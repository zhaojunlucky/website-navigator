import { Component } from '@angular/core';
import { NAVIGATION_DATA } from './navigation.config';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
    MatAutocompleteModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  navigation = NAVIGATION_DATA;
  searchQuery = '';
  filteredItems: any[] = [];

  constructor() {
    this.updateFilteredItems();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      const url = this.navigation.searchEngine.replace('[VEDA]', encodeURIComponent(this.searchQuery));
      window.location.href = url;
    }
  }

  getFaviconUrl(item: any) {
    return item.favicon || `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.url}&size=32`;
  }

  updateFilteredItems() {
    if (!this.searchQuery.trim()) {
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
