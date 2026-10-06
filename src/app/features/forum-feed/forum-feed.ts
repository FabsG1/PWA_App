import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
      @for (post of posts; track post.id) {
        <!-- Envolvemos el card con routerLink hacia /post/:id -->
        <article class="post-card" [routerLink]="['/post', post.id]">
          <div class="post-votes">
            <button (click)="$event.stopPropagation()">▲</button>
            <span>{{ post.votes }}</span>
            <button (click)="$event.stopPropagation()">▼</button>
          </div>
          
          <div class="post-content">
            <div class="post-meta">
              <span class="category" [class]="post.catClass">{{ post.category }}</span>
              <span class="author">Publicado por {{ post.author }} hace {{ post.time }}</span>
            </div>
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-excerpt">{{ post.excerpt }}</p>
            
            <div class="post-footer">
              <div class="tags">
                @for (tag of post.tags; track tag) { <span class="tag">{{ tag }}</span> }
              </div>
              <div class="post-actions">
                <span class="comments">💬 {{ post.comments }} comentarios</span>
                @if(post.hasPdf) { <span class="attachment">📎 1 PDF adjunto</span> }
              </div>
            </div>
          </div>
        </article>
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
  posts = [
    { id: 1, votes: 124, category: 'Hardware & Modding', catClass: 'cat-mod', author: 'AudioIng', time: '10 min', title: 'Construcción de DAC de Audio Hi-Res (PCM5102A) con I2S', excerpt: 'Diseño y ensamblaje de un Convertidor Digital a Analógico (DAC) personalizado utilizando el protocolo I2S...', tags: ['C++', 'Hardware', 'I2S'], comments: 45, hasPdf: true },
  ];
}