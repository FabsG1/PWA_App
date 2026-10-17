import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService, Post } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';

@Component({
  selector: 'app-forum-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="forum-header">
      <h1>Foro Comunitario</h1>
      <div class="forum-filters">
        <select><option>Más recientes</option><option>Más votados</option></select>
      </div>
    </div>

    @if (isFromCache()) {
      <div class="cache-banner">
        📦 Mostrando copia almacenada en la <strong>API Caché</strong> (Modo sin conexión / Respaldo local).
      </div>
    }

    <div class="post-list">
      @if (isLoading()) {
        <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Cargando publicaciones...</p>
      } @else if (posts().length === 0) {
        <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border-color);">
          <h2 style="margin-bottom: 1rem;">No hay publicaciones aún</h2>
          <a routerLink="/nueva-publicacion" class="btn-primary" style="display: inline-block; padding: 0.8rem 1.5rem; text-decoration: none;">Sé el primero en publicar</a>
        </div>
      } @else {
        @for (post of posts(); track post.id) {
          <article class="post-card" [routerLink]="['/post', post.id]">
            <div class="post-content">
              <div class="post-meta">
                <span class="category" [class]="getCatClass(post.category)">{{ post.category }}</span>
                <span class="author">
                  Publicado por <strong>{{ post.author }}</strong> hace {{ getTimeAgo(post.createdAt) }}
                  @if (post.updatedAt) { <em>(editado)</em> }
                </span>
              </div>

              <h2 class="post-title">{{ post.title }}</h2>
              <p class="post-excerpt">{{ post.body | slice:0:180 }}{{ post.body.length > 180 ? '...' : '' }}</p>

              @if (post.imageUrl) {
                <div class="feed-image-preview">
                  <img [src]="post.imageUrl" [alt]="post.title" loading="lazy" />
                </div>
              }

              <div class="media-badges">
                @if (post.videoUrl) {
                  <span class="media-pill video">🎬 Contiene video</span>
                }
                @if (post.imageUrl) {
                  <span class="media-pill image">🖼️ Imagen</span>
                }
                @if (post.fileUrl) {
                  <span class="media-pill file">📎 Archivo adjunto</span>
                }
              </div>
              
              <div class="post-footer">
                <div class="tags">
                  @for (tag of post.tags; track tag) { <span class="tag">{{ tag }}</span> }
                </div>

                <div class="post-actions">
                  <!-- Botones de Like y Dislike -->
                  <div class="reaction-group" (click)="$event.stopPropagation()">
                    <button
                      type="button"
                      class="btn-reaction like"
                      [class.active]="hasUserLiked(post)"
                      (click)="vote(post.id!, 'up')"
                      title="Me gusta">
                      👍 <span>{{ post.upvotes?.length || 0 }}</span>
                    </button>
                    <button
                      type="button"
                      class="btn-reaction dislike"
                      [class.active]="hasUserDisliked(post)"
                      (click)="vote(post.id!, 'down')"
                      title="No me gusta">
                      👎 <span>{{ post.downvotes?.length || 0 }}</span>
                    </button>
                  </div>

                  <!-- Cantidad de comentarios -->
                  <span class="comments-badge">
                    💬 {{ post.commentsCount || 0 }} {{ (post.commentsCount || 0) === 1 ? 'comentario' : 'comentarios' }}
                  </span>

                  <!-- Guardar en API Caché -->
                  <button
                    type="button"
                    class="btn-cache"
                    [class.saved]="cacheService.isPostSaved(post.id)"
                    (click)="$event.stopPropagation(); toggleCachePost(post)">
                    {{ cacheService.isPostSaved(post.id) ? '🔖 En caché' : '📥 Guardar' }}
                  </button>
                </div>
              </div>
            </div>
          </article>
        }
      }
    </div>
  `,
  styles: [`
    .forum-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h1 { color: var(--text-main); } }
    .forum-filters select { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 6px; }
    .cache-banner { background: var(--accent-bg); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .post-list { display: flex; flex-direction: column; gap: 1rem; }
    .post-card { display: flex; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; transition: border-color 0.2s, transform 0.15s; cursor: pointer; &:hover { border-color: var(--accent-color); } }
    .post-content { flex: 1; width: 100%; }
    .post-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.82rem; margin-bottom: 0.5rem; color: var(--text-muted); }
    .category { font-weight: bold; } .cat-mobile { color: #3ddc84; } .cat-game { color: #f34b7d; } .cat-mod { color: #107c10; }
    .post-title { font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.5rem; }
    .post-excerpt { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.9rem; line-height: 1.5; }
    
    .feed-image-preview { margin-bottom: 0.9rem; border-radius: 8px; overflow: hidden; max-height: 260px; background: #000; border: 1px solid var(--border-color); img { width: 100%; max-height: 260px; object-fit: cover; display: block; } }
    .media-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
    .media-pill { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-muted); &.video { color: #f87171; border-color: rgba(248,113,113,0.35); } &.image { color: #38bdf8; border-color: rgba(56,189,248,0.35); } }

    .post-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); }
    .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; .tag { background: var(--bg-main); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; border: 1px solid var(--border-color); } }
    .post-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-muted); }
    
    .reaction-group { display: inline-flex; align-items: center; gap: 0.35rem; background: var(--bg-main); padding: 0.2rem 0.35rem; border-radius: 8px; border: 1px solid var(--border-color); }
    .btn-reaction { background: transparent; border: none; color: var(--text-muted); padding: 0.25rem 0.55rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; transition: all 0.2s; &:hover { background: var(--bg-hover); color: var(--text-main); } &.like.active { background: rgba(61, 220, 132, 0.15); color: #3ddc84; font-weight: 700; } &.dislike.active { background: rgba(248, 113, 113, 0.15); color: #f87171; font-weight: 700; } }
    .comments-badge { background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.35rem 0.7rem; border-radius: 6px; font-weight: 500; color: var(--text-main); }
    .btn-cache { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; &:hover { border-color: var(--accent-color); color: var(--accent-color); } &.saved { background: var(--accent-bg); border-color: var(--accent-color); color: var(--accent-color); font-weight: 600; } }
  `]
})
export class ForumFeedComponent {
  protected readonly firebase = inject(FirebaseService);
  protected readonly cacheService = inject(CacheService);

  posts = signal<Post[]>([]);
  isLoading = signal(true);
  isFromCache = signal(false);

  constructor() {
    this.loadPosts();
  }

  async loadPosts() {
    this.isLoading.set(true);
    this.isFromCache.set(false);
    try {
      const data = await this.firebase.getPosts();
      if (data.length > 0) {
        this.posts.set(data);
        await this.cacheService.cacheFeedPosts(data);
      } else {
        const cached = await this.cacheService.getCachedFeedPosts();
        if (cached.length > 0) {
          this.posts.set(cached);
          this.isFromCache.set(true);
        } else {
          this.posts.set([]);
        }
      }
    } catch (err) {
      console.warn('Error cargando posts desde red, consultando Cache API:', err);
      const cached = await this.cacheService.getCachedFeedPosts();
      this.posts.set(cached);
      this.isFromCache.set(cached.length > 0);
    } finally {
      this.isLoading.set(false);
    }
  }

  hasUserLiked(post: Post): boolean {
    const uid = this.firebase.currentUser()?.uid;
    return !!uid && !!post.upvotes?.includes(uid);
  }

  hasUserDisliked(post: Post): boolean {
    const uid = this.firebase.currentUser()?.uid;
    return !!uid && !!post.downvotes?.includes(uid);
  }

  async toggleCachePost(post: Post) {
    if (!post.id) return;
    if (this.cacheService.isPostSaved(post.id)) {
      await this.cacheService.removeSavedPost(post.id);
    } else {
      await this.cacheService.savePostForOffline(post);
    }
  }

  getCatClass(category: string): string {
    const map: Record<string, string> = {
      'Desarrollo Móvil': 'cat-mobile',
      'Game Dev': 'cat-game',
      'Hardware & Modding': 'cat-mod'
    };
    return map[category] || 'cat-docs';
  }

  async vote(postId: string, value: 'up' | 'down') {
    if (!this.firebase.currentUser()) {
      alert('Inicia sesión para dar Like o Dislike');
      return;
    }
    try {
      await this.firebase.votePost(postId, value);
      await this.loadPosts();
    } catch (e) {
      console.error('Error al votar', e);
      alert('Error al registrar tu reacción');
    }
  }

  getTimeAgo(date: any): string {
    if (!date) return 'ahora';
    const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date.seconds ? date.seconds * 1000 : date);
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' años';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' meses';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' días';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    return Math.max(0, Math.floor(seconds)) + 's';
  }
}