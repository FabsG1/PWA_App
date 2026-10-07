import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService, Post } from '../../core/services/firebase.service';

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
            <div class="post-votes">
              <button (click)="$event.stopPropagation(); vote(post.id!, 'up')">▲</button>
              <span>{{ post.votes || 0 }}</span>
              <button (click)="$event.stopPropagation(); vote(post.id!, 'down')">▼</button>
            </div>
            
            <div class="post-content">
              <div class="post-meta">
                <span class="category" [class]="getCatClass(post.category)">{{ post.category }}</span>
                <span class="author">Publicado por {{ post.author }} hace {{ getTimeAgo(post.createdAt) }}</span>
              </div>
              <h2 class="post-title">{{ post.title }}</h2>
              <p class="post-excerpt">{{ post.body | slice:0:150 }}{{ post.body.length > 150 ? '...' : '' }}</p>
              
              <div class="post-footer">
                <div class="tags">
                  @for (tag of post.tags; track tag) { <span class="tag">{{ tag }}</span> }
                </div>
                <div class="post-actions">
                  <span class="comments">💬 0 comentarios</span>
                </div>
              </div>
            </div>
          </article>
        }
      }
    </div>
  `,
  // Los estilos (styles) se mantienen igual que en la versión anterior...
  styles: [`
    .forum-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; h1 { color: var(--text-main); } }
    .forum-filters select { background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 6px; }
    .post-list { display: flex; flex-direction: column; gap: 1rem; }
    .post-card { display: flex; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; transition: border-color 0.2s; cursor: pointer; &:hover { border-color: var(--accent-color); } }
    .post-votes { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; margin-right: 1.5rem; color: var(--text-muted); button { background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; &:hover { color: var(--accent-color); } } span { font-weight: bold; color: var(--text-main); } }
    .post-content { flex: 1; }
    .post-meta { display: flex; gap: 1rem; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-muted); }
    .category { font-weight: bold; } .cat-mobile { color: #3ddc84; } .cat-game { color: #f34b7d; } .cat-mod { color: #107c10; }
    .post-title { font-size: 1.2rem; color: var(--text-main); margin-bottom: 0.5rem; }
    .post-excerpt { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem; line-height: 1.5; }
    .post-footer { display: flex; justify-content: space-between; align-items: center; }
    .tags { display: flex; gap: 0.5rem; .tag { background: var(--bg-main); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; border: 1px solid var(--border-color); } }
    .post-actions { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-muted); .attachment { color: #e34f26; } }
  `]
})
export class ForumFeedComponent {
  private readonly firebase = inject(FirebaseService);

  posts = signal<Post[]>([]);
  isLoading = signal(true);

  constructor() {
    this.loadPosts();
  }

  async loadPosts() {
    this.isLoading.set(true);
    try {
      const data = await this.firebase.getPosts();
      this.posts.set(data);
    } catch (err) {
      console.error('Error cargando posts:', err);
    } finally {
      this.isLoading.set(false);
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
      alert('Inicia sesión para votar');
      return;
    }
    try {
      await this.firebase.votePost(postId, value);
      await this.loadPosts();
    } catch (e) {
      console.error('Error al votar', e);
      alert('Error al votar');
    }
  }

  getTimeAgo(date: any): string {
    if (!date) return 'ahora';
    // date es un Timestamp de Firestore
    const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
    
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
    return Math.floor(seconds) + 's';
  }
}