import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Evento no estándar que Chrome/Edge disparan cuando la app es instalable. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SW_URL = '/sw.js';
const MANIFEST_URL = '/manifest.webmanifest';

/**
 * Centraliza todas las capacidades PWA de ThinkerLog:
 *  - Registro del Service Worker y detección de nuevas versiones
 *  - Botón de instalación (beforeinstallprompt / iOS)
 *  - Estado de conexión online/offline
 *  - Reporte del Manifest y del Service Worker en la consola del navegador
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  /** true cuando el navegador ofrece instalar la app. */
  readonly canInstall = signal(false);
  /** true si la app ya se está ejecutando instalada (ventana standalone). */
  readonly isInstalled = signal(false);
  /** Estado de la red. */
  readonly isOnline = signal(true);
  /** Hay una nueva versión del SW esperando a activarse. */
  readonly updateAvailable = signal(false);
  /** iOS Safari no soporta beforeinstallprompt: se muestran instrucciones. */
  readonly isIos = signal(false);

  readonly showInstallButton = computed(
    () => !this.isInstalled() && (this.canInstall() || this.isIos()),
  );

  constructor() {
    if (!this.isBrowser) return; // Durante el prerender (SSR) no existe window

    this.isOnline.set(navigator.onLine);
    this.isInstalled.set(this.detectStandalone());
    this.isIos.set(/iphone|ipad|ipod/i.test(navigator.userAgent) && !this.isInstalled());

    this.listenInstallEvents();
    this.listenNetwork();

    if (document.readyState === 'complete') {
      this.registerServiceWorker();
    } else {
      window.addEventListener('load', () => this.registerServiceWorker(), { once: true });
    }
  }

  /* ---------------------------- Instalación ---------------------------- */

  async install(): Promise<void> {
    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.info(`[PWA] Instalación ${outcome === 'accepted' ? 'aceptada ✅' : 'cancelada ❌'}`);
      this.deferredPrompt = null;
      this.canInstall.set(false);
      return;
    }
    if (this.isIos()) {
      alert('Para instalar ThinkerLog en iOS:\n\n1. Toca el botón Compartir (⬆️)\n2. Elige "Añadir a pantalla de inicio"');
    }
  }

  private listenInstallEvents(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault(); // Evita el mini-infobar y usamos nuestro botón
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
      console.info('[PWA] La app es instalable 📲 (beforeinstallprompt)');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
      console.info('[PWA] ThinkerLog se instaló correctamente 🎉');
    });

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) =>
      this.isInstalled.set(e.matches),
    );
  }

  private detectStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  /* ------------------------------- Red --------------------------------- */

  private listenNetwork(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      console.info('[PWA] Conexión restablecida 🟢');
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      console.warn('[PWA] Sin conexión 🔴 — usando la caché del Service Worker');
    });
  }

  /* ------------------------- Service Worker ---------------------------- */

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Este navegador no soporta Service Workers');
      return;
    }
    try {
      this.registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
      this.watchForUpdates(this.registration);
      await navigator.serviceWorker.ready;
      await this.logPwaReport();
    } catch (error) {
      console.error('[PWA] Error al registrar el Service Worker:', error);
    }
  }

  private watchForUpdates(reg: ServiceWorkerRegistration): void {
    if (reg.waiting && navigator.serviceWorker.controller) this.updateAvailable.set(true);

    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          console.info('[PWA] Nueva versión disponible 🔄');
          this.updateAvailable.set(true);
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!this.userAcceptedUpdate) return; // 1ª instalación (clients.claim): no recargar
      window.location.reload();
    });

    // Busca actualizaciones cada hora mientras la app esté abierta
    setInterval(() => reg.update(), 60 * 60 * 1000);
  }

  private userAcceptedUpdate = false;

  /** Activa la versión nueva del SW y recarga la página. */
  applyUpdate(): void {
    this.userAcceptedUpdate = true;
    this.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  /* ---------------------- Reporte en la consola ------------------------ */

  private async logPwaReport(): Promise<void> {
    const title = 'color:#fff;background:linear-gradient(90deg,#58a6ff,#a371f7);padding:4px 10px;border-radius:4px;font-weight:bold';
    const reg = this.registration!;
    const sw = reg.active ?? reg.waiting ?? reg.installing;

    console.groupCollapsed('%c ThinkerLog · PWA ', title);

    console.group('⚙️ Service Worker');
    console.log('Script :', sw?.scriptURL);
    console.log('Scope  :', reg.scope);
    console.log('Estado :', sw?.state);
    console.log('Controla esta página:', !!navigator.serviceWorker.controller);
    console.log('Registro:', reg);
    console.groupEnd();

    try {
      const manifestHref = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? MANIFEST_URL;
      const manifest = await (await fetch(manifestHref)).json();
      console.group('📄 Web App Manifest');
      console.log('URL:', manifestHref);
      console.log(manifest);
      console.table(manifest.icons);
      console.groupEnd();
    } catch (error) {
      console.error('No se pudo leer el manifest:', error);
    }

    const cacheNames = await caches.keys();
    console.log('🗄️ Cachés:', cacheNames);
    console.log('📲 Instalada:', this.isInstalled(), '| 🌐 Online:', this.isOnline());
    console.info('Tip: abre DevTools → Application → Manifest / Service Workers');
    console.groupEnd();
  }
}

