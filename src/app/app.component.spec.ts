import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();

    localStorage.removeItem('navigation');
  });

  afterEach(() => {
    localStorage.removeItem('navigation');
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne(environment.navAPI).flush({
      searchEngine: 'https://www.google.com/search?q=[VEDA]',
      categories: []
    });

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navigation after data loads', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne(environment.navAPI).flush({
      searchEngine: 'https://www.google.com/search?q=[VEDA]',
      categories: []
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
  });
});
