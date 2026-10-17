import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Post } from './firebase.service';

export interface CacheStats {
  name: string;
  entriesCount: number;
  urls: string[];
}

/**
 * Servicio dedicado a exponer y utilizar todos los métodos de la Cache Storage API:
 * - caches.open(), caches.keys(), caches.has(), caches.delete(), caches.match()
 * - cache.add(), cache.addAll(), cache.put(), cache.match(), cache.matchAll(), cache.keys(), cache.delete()
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Caché dedicada para que el usuario guarde publicaciones y archivos para lectura offline. */
  private readonly SAVED_POSTS_CACHE = 'thinkerlog-saved-posts-v1';
  /** Caché dedicada a almacenar la copia de las respuestas de datos JSON (como el feed). */
  private readonly DATA_CACHE = 'thinkerlog-data-v1';

  /** Señal reactiva con los IDs de las publicaciones guardadas en caché para lectura offline. */
  readonly savedPostIds = signal<string[]>([]);
  /** Señal reactiva con las estadísticas actuales de todas las cachés del navegador. */
  readonly cacheStats = signal<CacheStats[]>([]);

  constructor() {
    if (this.isBrowser && this.isSupported()) {
      this.refreshSavedPostsIndex();
      this.inspectAllCaches();
    }
  }

  /** Verifica si el navegador soporta la API Cache Storage. */
  isSupported(): boolean {
    return this.isBrowser && 'caches' in window;
  }

  /* ========================================================================
   * 1. MÉTODOS DE CacheStorage (window.caches)
   *    open() · has() · keys() · delete() · match()
   * ======================================================================== */

  /**
   * Usa `caches.has(cacheName)` para comprobar si existe una caché específica.
   */
  async hasCache(cacheName: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    return await caches.has(cacheName);
  }

  /**
   * Usa `caches.keys()` y `cache.keys()` para listar todas las cachés activas y sus entradas.
   */
  async inspectAllCaches(): Promise<CacheStats[]> {
    if (!this.isSupported()) return [];

    const cacheNames = await caches.keys();
    const stats: CacheStats[] = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      stats.push({
        name,
        entriesCount: requests.length,
        urls: requests.map((req) => req.url),
      });
    }

    this.cacheStats.set(stats);
    return stats;
  }

  /**
   * Usa `caches.delete(cacheName)` para eliminar una caché completa por nombre.
   */
  async deleteCacheBucket(cacheName: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    const deleted = await caches.delete(cacheName);
    await this.inspectAllCaches();
    await this.refreshSavedPostsIndex();
    return deleted;
  }

  /**
   * Usa `caches.match(request)` para buscar un recurso en cualquiera de las cachés abiertas.
   */
  async matchInAnyCache(url: string): Promise<Response | undefined> {
    if (!this.isSupported()) return undefined;
    return await caches.match(url, { ignoreSearch: true });
  }

  /* ========================================================================
   * 2. MÉTODOS DE Cache INDIVIDUAL (cache.*)
   *    put() · match() · matchAll() · add() · addAll() · delete() · keys()
   * ======================================================================== */

  /**
   * Usa `caches.open()` y `cache.add(url)` para descargar un recurso de la red y guardarlo en caché.
   */
  async cacheSingleUrl(url: string, cacheName: string = this.SAVED_POSTS_CACHE): Promise<void> {
    if (!this.isSupported()) return;
    const cache = await caches.open(cacheName);
    await cache.add(url);
    await this.inspectAllCaches();
  }

  /**
   * Usa `caches.open()` y `cache.addAll(urls)` para pre-cachear un conjunto de URLs de forma atómica.
   */
  async precacheUrls(urls: string[], cacheName: string = this.SAVED_POSTS_CACHE): Promise<void> {
    if (!this.isSupported()) return;
    const cache = await caches.open(cacheName);
    await cache.addAll(urls);
    await this.inspectAllCaches();
  }

  /**
   * Usa `cache.put(request, response)` para guardar un objeto JSON (como una publicación o lista de posts)
   * construyendo un objeto `Response` sintético en la Cache API.
   */
  async putJsonData<T>(virtualUrl: string, data: T, cacheName: string = this.DATA_CACHE): Promise<void> {
    if (!this.isSupported()) return;
    const cache = await caches.open(cacheName);
    const body = JSON.stringify({
      cachedAt: new Date().toISOString(),
      payload: data,
    });

    const response = new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Cache-Source': 'ThinkerLog-CacheAPI',
      },
    });

    await cache.put(new Request(virtualUrl), response);
    await this.inspectAllCaches();
  }

  /**
   * Usa `cache.match(request)` para recuperar un JSON previamente almacenado con `cache.put()`.
   */
  async getJsonData<T>(virtualUrl: string, cacheName: string = this.DATA_CACHE): Promise<{ cachedAt: string; payload: T } | null> {
    if (!this.isSupported()) return null;
    const cache = await caches.open(cacheName);
    const response = await cache.match(new Request(virtualUrl));
    if (!response) return null;
    return await response.json();
  }

  /**
   * Usa `cache.delete(request)` para borrar una entrada específica dentro de una caché.
   */
  async deleteEntryFromCache(url: string, cacheName: string = this.SAVED_POSTS_CACHE): Promise<boolean> {
    if (!this.isSupported()) return false;
    const cache = await caches.open(cacheName);
    const result = await cache.delete(url);
    await this.inspectAllCaches();
    return result;
  }

  /* ========================================================================
   * 3. FUNCIONALIDAD DE ALTO NIVEL: GUARDAR PUBLICACIONES OFFLINE Y FEED
   * ======================================================================== */

  /** Guarda el listado de publicaciones del foro en la Cache API como respaldo offline. */
  async cacheFeedPosts(posts: Post[]): Promise<void> {
    await this.putJsonData('/api-cache/forum-feed.json', posts, this.DATA_CACHE);
  }

  /** Obtiene el listado de publicaciones desde la Cache API si estamos sin conexión. */
  async getCachedFeedPosts(): Promise<Post[]> {
    const cached = await this.getJsonData<Post[]>('/api-cache/forum-feed.json', this.DATA_CACHE);
    return cached?.payload ?? [];
  }

  /**
   * Guarda una publicación completa en `SAVED_POSTS_CACHE` usando `cache.put()`
   * y si tiene un archivo adjunto del mismo origen o accesible, intenta precachearlo.
   */
  async savePostForOffline(post: Post): Promise<void> {
    if (!this.isSupported() || !post.id) return;

    const virtualUrl = `/offline-posts/${post.id}.json`;
    await this.putJsonData(virtualUrl, post, this.SAVED_POSTS_CACHE);

    await this.refreshSavedPostsIndex();
    await this.inspectAllCaches();
  }

  /**
   * Elimina una publicación guardada de la caché usando `cache.delete()`.
   */
  async removeSavedPost(postId: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    const virtualUrl = `/offline-posts/${postId}.json`;
    const deleted = await this.deleteEntryFromCache(virtualUrl, this.SAVED_POSTS_CACHE);
    await this.refreshSavedPostsIndex();
    return deleted;
  }

  /**
   * Verifica si un post está en la caché de guardados.
   */
  isPostSaved(postId?: string): boolean {
    if (!postId) return false;
    return this.savedPostIds().includes(postId);
  }

  /**
   * Usa `cache.keys()` y `cache.matchAll()` sobre `SAVED_POSTS_CACHE` para recuperar
   * todas las publicaciones guardadas para lectura offline.
   */
  async getAllSavedPosts(): Promise<{ cachedAt: string; payload: Post }[]> {
    if (!this.isSupported()) return [];
    const exists = await this.hasCache(this.SAVED_POSTS_CACHE);
    if (!exists) return [];

    const cache = await caches.open(this.SAVED_POSTS_CACHE);
    const responses = await cache.matchAll(); // Método cache.matchAll() de la API Cache
    const results: { cachedAt: string; payload: Post }[] = [];

    for (const res of responses) {
      if (res.headers.get('Content-Type')?.includes('application/json')) {
        try {
          const data = await res.clone().json();
          if (data?.payload?.id) {
            results.push(data);
          }
        } catch {
          // Ignorar respuestas que no sean JSON de posts
        }
      }
    }
    return results;
  }

  /**
   * Recupera un post específico desde la caché (ya sea de guardados o del feed en caché).
   */
  async getCachedPostById(postId: string): Promise<Post | null> {
    const saved = await this.getJsonData<Post>(`/offline-posts/${postId}.json`, this.SAVED_POSTS_CACHE);
    if (saved?.payload) return saved.payload;

    const feed = await this.getCachedFeedPosts();
    return feed.find((p) => p.id === postId) ?? null;
  }

  /**
   * Actualiza la señal `savedPostIds` inspeccionando las llaves con `cache.keys()`.
   */
  async refreshSavedPostsIndex(): Promise<void> {
    if (!this.isSupported()) return;
    const exists = await caches.has(this.SAVED_POSTS_CACHE);
    if (!exists) {
      this.savedPostIds.set([]);
      return;
    }

    const cache = await caches.open(this.SAVED_POSTS_CACHE);
    const keys = await cache.keys();
    const ids = keys
      .map((req) => {
        const match = new URL(req.url).pathname.match(/\/offline-posts\/(.+)\.json$/);
        return match ? match[1] : null;
      })
      .filter((id): id is string => !!id);

    this.savedPostIds.set(ids);
  }

  /**
   * Limpia todas las cachés de tiempo de ejecución o todas las cachés si el usuario lo solicita.
   */
  async clearAllCaches(): Promise<void> {
    if (!this.isSupported()) return;
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    this.savedPostIds.set([]);
    await this.inspectAllCaches();
  }
}
