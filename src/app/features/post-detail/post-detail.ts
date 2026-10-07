import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightModule } from 'ngx-highlightjs';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService, Post, Comment } from '../../core/services/firebase.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [HighlightModule, RouterLink, CommonModule, FormsModule],
  template: `
    @if (isLoading()) {
      <p style="text-align: center; color: var(--text-muted); padding: 3rem;">Cargando publicación...</p>
    } @else if (!post()) {
      <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 8px;">
        <h2>Publicación no encontrada</h2>
        <a routerLink="/foro" class="btn-primary" style="display: inline-block; padding: 0.8rem 1.5rem; text-decoration: none; margin-top: 1rem;">Volver al foro</a>
      </div>
    } @else {
      <article class="post-view">
        <a routerLink="/foro" class="back-link">← Volver al Foro</a>

        <header class="thread-header">
          <div class="author-block">
            <div class="author-avatar">{{ post()?.author?.charAt(0) | uppercase }}</div>
            <div class="author-info">
              <span class="name">{{ post()?.author }}</span>
              <span class="date">Publicado hace {{ getTimeAgo(post()?.createdAt) }} en <strong>{{ post()?.category }}</strong></span>
            </div>
          </div>
          <h1>{{ post()?.title }}</h1>
          <div class="tags">
            @for (tag of post()?.tags; track tag) { <span class="tag">{{ tag }}</span> }
          </div>
        </header>

        <section class="thread-body">
          <p style="white-space: pre-wrap;">{{ post()?.body }}</p>
          
          <div class="post-votes-detail">
            <button (click)="vote('up')">▲</button>
            <span>{{ post()?.votes || 0 }}</span>
            <button (click)="vote('down')">▼</button>
          </div>
        </section>

        @if (post()?.fileUrl) {
          <section class="attachments-section">
            <h3>Archivos Adjuntos</h3>
            <div class="attachment-card">
              <div class="icon">📄</div>
              <div class="file-info">
                <span class="filename">{{ post()?.fileName || 'Archivo adjunto' }}</span>
              </div>
              <a [href]="post()?.fileUrl" target="_blank" rel="noopener noreferrer" class="btn-download" style="text-decoration:none">Ver/Descargar</a>
            </div>
          </section>
        }
        
        <hr class="divider">
        
        <section class="comments-section">
          <h3>Comentarios ({{ comments().length }})</h3>
          
          <div class="comments-list">
            @for (c of comments(); track c.id) {
              <div class="comment-item">
                <div class="c-avatar">{{ c.author.charAt(0) | uppercase }}</div>
                <div class="c-content">
                  <div class="c-meta"><span class="c-author">{{ c.author }}</span> <span class="c-time">{{ getTimeAgo(c.createdAt) }}</span></div>
                  <div class="c-text">{{ c.text }}</div>
                </div>
              </div>
            }
          </div>

          @if (firebase.currentUser()) {
            <form (submit)="addComment($event)">
              <textarea placeholder="Añadir un comentario a la discusión..." [(ngModel)]="newComment" name="comment" required></textarea>
              <button type="submit" class="btn-primary" [disabled]="isCommenting()">
                {{ isCommenting() ? 'Enviando...' : 'Comentar' }}
              </button>
            </form>
          } @else {
            <p style="padding: 1rem; background: var(--bg-card); border-radius: 8px; text-align: center;">
              <a routerLink="/login" style="color: var(--accent-color);">Inicia sesión</a> para comentar.
            </p>
          }
        </section>
      </article>
    }
  `,
  styles: [`
    .post-view { background: var(--bg-main); color: var(--text-main); animation: fadeIn 0.4s ease; padding-bottom: 2rem; }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: var(--accent-color); text-decoration: none; font-weight: bold; &:hover { text-decoration: underline; } }
    
    .thread-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; h1 { font-size: 2rem; margin-bottom: 1rem; } }
    .author-block { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--accent-gradient); color: white; display: grid; place-items: center; font-weight: bold; font-size: 1.5rem; }
    .author-info { display: flex; flex-direction: column; .name { font-weight: bold; font-size: 1.1rem; } .date { font-size: 0.85rem; color: var(--text-muted); } }
    
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; .tag { background: var(--accent-bg); color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; } }
    
    .thread-body p { line-height: 1.7; font-size: 1.05rem; margin-bottom: 2rem; color: var(--text-main); }
    .post-votes-detail { display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 8px; width: fit-content; margin-top: 1rem; margin-bottom: 2rem; background: var(--bg-card); button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 0.5rem; transition: color 0.2s; &:hover { color: var(--accent-color); } } span { font-weight: bold; font-size: 1.2rem; color: var(--text-main); } }
    
    
    .attachments-section { margin-bottom: 3rem; h3 { margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; } }
    .attachment-card { display: flex; align-items: center; gap: 1rem; background: var(--bg-card); padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; .icon { font-size: 2rem; } .file-info { flex: 1; display: flex; flex-direction: column; .filename { font-weight: bold; } } .btn-download { background: var(--accent-bg); color: var(--accent-color); padding: 0.5rem 1rem; border: 1px solid var(--accent-color); border-radius: 4px; cursor: pointer; font-weight: bold; &:hover { background: var(--accent-color); color: #fff; } } }
    
    .divider { border: 0; border-top: 1px solid var(--border-color); margin: 2rem 0; }
    
    .comments-section { h3 { margin-bottom: 1rem; } textarea { width: 100%; min-height: 100px; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 8px; margin-bottom: 1rem; resize: vertical; &:focus{ outline:none; border-color: var(--accent-color); } } .btn-primary { background: var(--accent-gradient); color: #fff; padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; float: right; &:disabled{ opacity:0.5; } } }
    
    .comments-list { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
    .comment-item { display: flex; gap: 1rem; }
    .c-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-hover); border: 1px solid var(--border-color); display: grid; place-items: center; font-weight: bold; flex-shrink: 0; }
    .c-content { flex: 1; background: var(--bg-card); padding: 1rem; border-radius: 0 8px 8px 8px; border: 1px solid var(--border-color); }
    .c-meta { margin-bottom: 0.5rem; .c-author { font-weight: bold; margin-right: 0.5rem; } .c-time { font-size: 0.8rem; color: var(--text-muted); } }
    .c-text { white-space: pre-wrap; line-height: 1.5; font-size: 0.95rem; }
  `]
})
export class PostDetailComponent implements OnInit {
  protected readonly firebase = inject(FirebaseService);
  private readonly route = inject(ActivatedRoute);

  post = signal<Post | null>(null);
  comments = signal<Comment[]>([]);
  isLoading = signal(true);
  
  newComment = '';
  isCommenting = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        await this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    this.isLoading.set(true);
    try {
      const [p, c] = await Promise.all([
        this.firebase.getPost(id),
        this.firebase.getComments(id)
      ]);
      this.post.set(p);
      this.comments.set(c);
    } catch (e) {
      console.error('Error loading post details', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addComment(e: Event) {
    e.preventDefault();
    if (!this.newComment.trim() || !this.post()) return;
    
    this.isCommenting.set(true);
    try {
      await this.firebase.addComment(this.post()!.id!, this.newComment);
      this.newComment = '';
      // Reload comments
      this.comments.set(await this.firebase.getComments(this.post()!.id!));
    } catch (err) {
      console.error(err);
      alert('Error al enviar el comentario.');
    } finally {
      this.isCommenting.set(false);
    }
  }

  async vote(value: 'up' | 'down') {
    if (!this.firebase.currentUser()) {
      alert('Inicia sesión para votar');
      return;
    }
    if (!this.post()?.id) return;
    try {
      await this.firebase.votePost(this.post()!.id!, value);
      await this.loadData(this.post()!.id!);
    } catch (e) {
      console.error('Error al votar', e);
      alert('Error al votar');
    }
  }

  getTimeAgo(date: any): string {
    if (!date) return 'ahora';
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