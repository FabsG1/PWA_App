import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'thinkerlog-theme';
const THEME_COLORS = { dark: '#09090b', light: '#f8fafc' } as const;

export type Theme = keyof typeof THEME_COLORS;

/** Tema claro/oscuro persistente; también actualiza <meta name="theme-color"> (barra del SO). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>('dark');

  constructor() {
    if (!this.isBrowser) return;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred: Theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    this.apply(saved ?? preferred);
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    this.document.body.classList.toggle('light-theme', theme === 'light');
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, theme);
  }
}

