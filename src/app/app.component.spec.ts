import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

const bindingKey = `navigator:${environment.apiServer}:userId`;
const cacheKey = (id: string) => `navigator:${environment.apiServer}:${id}:navigation`;
const endpoint = (id: string) => `${environment.apiServer}/api/bookmark/collection/instances/${id}`;
const data = { searchEngine: 'https://www.google.com/search?q=[VEDA]', categories: [] };

describe('AppComponent bookmark binding', () => {
  let http: HttpTestingController;
  let originalUrl: string;
  let savedStorage: Record<string, string>;

  function url(query = '') {
    history.replaceState(null, '', location.pathname + query);
  }

  function create() {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    originalUrl = location.href;
    savedStorage = {...localStorage};
    localStorage.clear();
    url();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    Object.entries(savedStorage).forEach(([key, value]) => localStorage.setItem(key, value));
    history.replaceState(null, '', originalUrl);
  });

  it('shows binding instructions without requesting data when unbound', () => {
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('Bind your bookmarks');
    expect(fixture.nativeElement.querySelector('a').href).toBe(environment.bookmarkUiUrl);
    http.expectNone(() => true);
  });

  it('uses and persists the URL user ID over a saved binding and ignores legacy cache', () => {
    localStorage.setItem(bindingKey, '9');
    localStorage.setItem('navigation', JSON.stringify({data, time: Date.now()}));
    url('?userId=123');
    const fixture = create();
    expect(localStorage.getItem(bindingKey)).toBe('123');
    http.expectOne(endpoint('123')).flush(data);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-toolbar')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(cacheKey('123'))!).data).toEqual(data);
  });

  it('restores the saved binding on a visit without parameters', () => {
    localStorage.setItem(bindingKey, '123');
    const fixture = create();
    http.expectOne(endpoint('123')).flush(data);
    expect(fixture.componentInstance.navigation).toEqual(data);
  });

  for (const query of ['?userId=', '?userId=0', '?userId=-1', '?userId=1.5', '?userId=abc', '?userId=1&userId=2', '?userId=9007199254740992']) {
    it(`rejects ${query} without changing or using the saved binding`, () => {
      localStorage.setItem(bindingKey, '9');
      url(query);
      const fixture = create();
      expect(fixture.nativeElement.textContent).toContain('invalid user ID');
      expect(localStorage.getItem(bindingKey)).toBe('9');
      http.expectNone(() => true);
    });
  }

  it('does not reuse another user or environment cache or expansion state', () => {
    localStorage.setItem(cacheKey('9'), JSON.stringify({data, time: Date.now()}));
    localStorage.setItem('navigator:https://other.example:123:navigation', JSON.stringify({data, time: Date.now()}));
    localStorage.setItem(`navigator:${environment.apiServer}:9:expandedCategory`, 'Other');
    url('?userId=123');
    const fixture = create();
    http.expectOne(endpoint('123')).flush({...data, categories: [{name: 'First', items: []}]});
    expect(fixture.componentInstance.isCategoryExpanded({name: 'First', items: []})).toBeTrue();
  });

  it('uses a fresh cache for the same user without fetching', () => {
    localStorage.setItem(bindingKey, '123');
    localStorage.setItem(cacheKey('123'), JSON.stringify({data, time: Date.now()}));
    expect(create().componentInstance.state).toBe('loaded');
    http.expectNone(() => true);
  });

  it('refreshes stale data and retains it when the request fails', () => {
    localStorage.setItem(bindingKey, '123');
    localStorage.setItem(cacheKey('123'), JSON.stringify({data, time: Date.now() - 5 * 3600 * 1000}));
    const fixture = create();
    http.expectOne(endpoint('123')).flush({}, {status: 500, statusText: 'Failure'});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Showing saved data');
    expect(fixture.componentInstance.navigation).toEqual(data);
  });

  it('loads despite inaccessible storage and asks the user to bookmark the URL', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('Blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('Blocked');
    url('?userId=123');
    const fixture = create();
    http.expectOne(endpoint('123')).flush(data);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bookmark this URL');
    expect(fixture.componentInstance.state).toBe('loaded');
  });

  it('recovers from malformed cached data', () => {
    localStorage.setItem(bindingKey, '123');
    localStorage.setItem(cacheKey('123'), '{');
    const fixture = create();
    http.expectOne(endpoint('123')).flush(data);
    expect(fixture.componentInstance.navigation).toEqual(data);
  });

  it('shows a persistent failure state and retries the same user', () => {
    url('?userId=123');
    const fixture = create();
    http.expectOne(endpoint('123')).flush({}, {status: 500, statusText: 'Failure'});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to load bookmarks');
    fixture.componentInstance.refreshNavigation();
    http.expectOne(endpoint('123')).flush(data);
    expect(fixture.componentInstance.state).toBe('loaded');
  });

  it('clears the binding and URL parameter and cancels pending requests', () => {
    url('?userId=123&other=value');
    const fixture = create();
    const request = http.expectOne(endpoint('123'));
    fixture.componentInstance.changeBinding();
    fixture.detectChanges();
    expect(request.cancelled).toBeTrue();
    expect(localStorage.getItem(bindingKey)).toBeNull();
    expect(location.search).toBe('?other=value');
    expect(fixture.componentInstance.userId).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Bind your bookmarks');
    fixture.componentInstance.refreshNavigation();
    http.expectNone(() => true);
  });
});
