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
    MatRippleModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
[x: string]: any;
  navigation = NAVIGATION_DATA;
  searchQuery = '';

  onSearch() {
    if (this.searchQuery.trim()) {
      const url = this.navigation.searchEngine.replace('[VEDA]', encodeURIComponent(this.searchQuery));
      window.location.href = url;
    }
  }

  getFaviconUrl(item: any) {
    return item.favicon || `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.url}&size=32`;
  }
}
