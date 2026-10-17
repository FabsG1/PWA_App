import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CacheService } from '../../core/services/cache.service';
import { Post } from '../../core/services/firebase.service';

@Component({
  selector: 'app-cache-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="cache-page">
      <header class="page-header">
        <div>
          <h1>🔖 Guardados &amp; Gestor de API Caché</h1>
          <p class="subtitle">
            Administra las publicaciones almacenadas para lectura sin conexión y explora en vivo los métodos de la <strong>Cache Storage API</strong>.
          </p>
        </div>
        <button class="btn-secondary" (click)="refreshAll()">🔄 Actualizar estado</button>
      </header>

      <!-- SECCIÓN 1: Publicaciones guardadas en la Cache API -->
      <section class="panel">
        <div class="panel-header">
          <h2>📥 Publicaciones guardadas en caché ({{ savedPosts().length }})</h2>
          <span class="badge">cache.put() · cache.matchAll() · cache.delete()</span>
        </div>

        @if (savedPosts().length === 0) {
          <div class="empty-box">
            <p>Aún no has guardado publicaciones en la caché para lectura offline.</p>
            <a routerLink="/foro" class="btn-primary">Ir al Foro y guardar publicaciones</a>
          </div>
        } @else {
          <div class="saved-grid">
            @for (item of savedPosts(); track item.payload.id) {
              <article class="saved-card">
                <div class="saved-info" [routerLink]="['/post', item.payload.id]">
                  <span class="cat">{{ item.payload.category }}</span>
                  <h3>{{ item.payload.title }}</h3>
                  <p>{{ item.payload.body | slice:0:120 }}...</p>
                  <small>Guardado en caché: {{ item.cachedAt | date:'short' }}</small>
                </div>
                <div class="saved-actions">
                  <a [routerLink]="['/post', item.payload.id]" class="btn-link">Leer</a>
                  <button class="btn-delete" (click)="removePost(item.payload.id!)">🗑️ Quitar de caché</button>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <!-- SECCIÓN 2: Laboratorio interactivo de métodos de la Cache API -->
      <section class="panel">
        <div class="panel-header">
          <h2>🧪 Laboratorio de Métodos de la API Caché</h2>
          <span class="badge">caches.has() · caches.match() · cache.add() · cache.addAll()</span>
        </div>

        <div class="actions-row">
          <div class="action-box">
            <h4>Pre-cachear recursos estáticos (<code>cache.addAll</code>)</h4>
            <p>Guarda de golpe los recursos principales del App Shell en la caché de usuario.</p>
            <button class="btn-primary" (click)="runAddAllDemo()">Ejecutar cache.addAll()</button>
          </div>

          <div class="action-box">
            <h4>Añadir URL o consultar en caché (<code>cache.add</code> / <code>caches.match</code>)</h4>
            <div class="input-group">
              <input type="text" [(ngModel)]="customUrl" placeholder="/manifest.webmanifest o /offline.html" />
              <button class="btn-secondary" (click)="runCacheAdd()">cache.add()</button>
              <button class="btn-secondary" (click)="runCacheMatch()">caches.match()</button>
            </div>
            @if (statusMessage()) {
              <p class="status-msg">{{ statusMessage() }}</p>
            }
          </div>
        </div>
      </section>

      <!-- SECCIÓN 3: Inspector de Caches (caches.keys, cache.keys, caches.delete) -->
      <section class="panel">
        <div class="panel-header">
          <h2>🗄️ Inspector de Almacenamiento Caché ({{ cacheService.cacheStats().length }} contenedores)</h2>
          <button class="btn-danger-outline" (click)="clearAll()">🧹 Vaciar todas las cachés</button>
        </div>

        <div class="buckets-list">
          @for (bucket of cacheService.cacheStats(); track bucket.name) {
            <div class="bucket-card">
              <div class="bucket-title">
                <div>
                  <strong>📦 {{ bucket.name }}</strong>
                  <span class="count">{{ bucket.entriesCount }} entradas</span>
                </div>
                <button class="btn-delete" (click)="deleteBucket(bucket.name)">
                  Eliminar caché (caches.delete)
                </button>
              </div>
              <ul class="url-list">
                @for (url of bucket.urls; track url) {
                  <li>
                    <code>{{ url }}</code>
                    <button class="btn-mini" (click)="deleteSingleEntry(url, bucket.name)" title="cache.delete(request)">✕</button>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .cache-page { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; h1 { font-size: 1.6rem; margin-bottom: 0.3rem; color: var(--text-main); } .subtitle { color: var(--text-muted); font-size: 0.95rem; } }
    .panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; h2 { font-size: 1.15rem; color: var(--text-main); } }
    .badge { background: var(--accent-bg); color: var(--accent-color); padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-family: monospace; }
    .empty-box { text-align: center; padding: 2rem; color: var(--text-muted); p { margin-bottom: 1rem; } }
    .saved-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .saved-card { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; flex-wrap: wrap; }
    .saved-info { flex: 1; cursor: pointer; .cat { font-size: 0.75rem; color: var(--accent-color); font-weight: bold; } h3 { margin: 0.25rem 0; color: var(--text-main); } p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.3rem; } small { color: var(--text-muted); font-size: 0.75rem; } }
    .saved-actions { display: flex; gap: 0.5rem; align-items: center; }
    .actions-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .action-box { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; h4 { margin-bottom: 0.4rem; color: var(--text-main); } p { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.75rem; } }
    .input-group { display: flex; gap: 0.5rem; flex-wrap: wrap; input { flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); } }
    .status-msg { margin-top: 0.6rem; font-size: 0.85rem; color: var(--accent-color); font-weight: 500; }
    .buckets-list { display: flex; flex-direction: column; gap: 1rem; }
    .bucket-card { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; }
    .bucket-title { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; .count { margin-left: 0.5rem; font-size: 0.8rem; color: var(--text-muted); } }
    .url-list { list-style: none; padding: 0; margin: 0; max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.35rem; li { display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 0.35rem 0.6rem; border-radius: 4px; font-size: 0.8rem; code { word-break: break-all; color: var(--text-muted); } } }
    .btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; cursor: pointer; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: inline-block; }
    .btn-secondary { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.5rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; &:hover { border-color: var(--accent-color); } }
    .btn-link { color: var(--accent-color); text-decoration: none; font-weight: 600; font-size: 0.85rem; padding: 0.4rem 0.75rem; }
    .btn-delete { background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.4); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; &:hover { background: rgba(248,113,113,0.15); } }
    .btn-danger-outline { background: transparent; color: #f87171; border: 1px solid #f87171; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
    .btn-mini { background: transparent; border: none; color: #f87171; cursor: pointer; font-weight: bold; padding: 0 0.4rem; }
  `]
})
export class CacheManagerComponent implements OnInit {
  protected readonly cacheService = inject(CacheService);

  savedPosts = signal<{ cachedAt: string; payload: Post }[]>([]);
  customUrl = '/manifest.webmanifest';
  statusMessage = signal('');

  ngOnInit() {
    this.refreshAll();
  }

  async refreshAll() {
    await this.cacheService.inspectAllCaches();
    await this.cacheService.refreshSavedPostsIndex();
    const saved = await this.cacheService.getAllSavedPosts();
    this.savedPosts.set(saved);
  }

  async removePost(postId: string) {
    await this.cacheService.removeSavedPost(postId);
    await this.refreshAll();
  }

  async runAddAllDemo() {
    try {
      await this.cacheService.precacheUrls([
        '/offline.html',
        '/manifest.webmanifest',
        '/icons/icon-192x192.png'
      ]);
      this.statusMessage.set('✅ Recursos pre-cacheados exitosamente con cache.addAll()');
      await this.refreshAll();
    } catch (e) {
      this.statusMessage.set('❌ Error al ejecutar cache.addAll()');
    }
  }

  async runCacheAdd() {
    if (!this.customUrl.trim()) return;
    try {
      await this.cacheService.cacheSingleUrl(this.customUrl.trim());
      this.statusMessage.set(`✅ Recurso "${this.customUrl}" añadido con cache.add()`);
      await this.refreshAll();
    } catch {
      this.statusMessage.set(`❌ No se pudo guardar "${this.customUrl}" con cache.add()`);
    }
  }

  async runCacheMatch() {
    if (!this.customUrl.trim()) return;
    const match = await this.cacheService.matchInAnyCache(this.customUrl.trim());
    if (match) {
      this.statusMessage.set(`✅ Encontrado con caches.match() — Status: ${match.status} (${match.headers.get('content-type') || 'recurso'})`);
    } else {
      this.statusMessage.set(`⚠️ No se encontró "${this.customUrl}" en ninguna caché.`);
    }
  }

  async deleteBucket(name: string) {
    await this.cacheService.deleteCacheBucket(name);
    await this.refreshAll();
  }

  async deleteSingleEntry(url: string, cacheName: string) {
    await this.cacheService.deleteEntryFromCache(url, cacheName);
    await this.refreshAll();
  }

  async clearAll() {
    await this.cacheService.clearAllCaches();
    await this.refreshAll();
    this.statusMessage.set('🧹 Todas las cachés fueron eliminadas con caches.delete()');
  }
}
