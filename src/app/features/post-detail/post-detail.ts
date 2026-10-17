import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightModule } from 'ngx-highlightjs';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FirebaseService, Post, Comment } from '../../core/services/firebase.service';
import { CacheService } from '../../core/services/cache.service';

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
        <div class="top-nav-bar">
          <a routerLink="/foro" class="back-link">← Volver al Foro</a>

          <div class="top-actions">
            @if (isAuthor() && !isEditing()) {
              <button type="button" class="btn-edit" (click)="startEditing()">
                ✏️ Editar publicación
              </button>
            }
            <button
              type="button"
              class="btn-cache"
              [class.saved]="cacheService.isPostSaved(post()?.id)"
              (click)="toggleCachePost()">
              {{ cacheService.isPostSaved(post()?.id) ? '🔖 Guardado en API Caché (Eliminar)' : '📥 Guardar en API Caché (Offline)' }}
            </button>
          </div>
        </div>

        @if (isFromCache()) {
          <div class="cache-banner">
            📦 Estás leyendo la copia almacenada en la <strong>API Caché</strong> de tu navegador.
          </div>
        }

        @if (isEditing()) {
          <!-- MODO EDICIÓN PARA EL AUTOR -->
          <section class="edit-box">
            <h2>✏️ Editar tu publicación</h2>
            <form (submit)="saveEdit($event)" class="edit-form">
              <div class="form-group">
                <label>Título</label>
                <input type="text" [(ngModel)]="editTitle" name="editTitle" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Categoría</label>
                  <select [(ngModel)]="editCategory" name="editCategory" required>
                    <option>Desarrollo Móvil</option>
                    <option>Game Dev</option>
                    <option>Hardware & Modding</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Etiquetas (separadas por coma)</label>
                  <input type="text" [(ngModel)]="editTags" name="editTags" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>URL de Imagen (Opcional)</label>
                  <input type="url" [(ngModel)]="editImageUrl" name="editImageUrl" placeholder="https://ejemplo.com/imagen.png" />
                </div>
                <div class="form-group">
                  <label>URL de Video (YouTube, Vimeo o .mp4)</label>
                  <input type="url" [(ngModel)]="editVideoUrl" name="editVideoUrl" placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              </div>

              <div class="form-group">
                <label>Contenido</label>
                <textarea [(ngModel)]="editBody" name="editBody" rows="8" required></textarea>
              </div>

              <div class="edit-actions">
                <button type="button" class="btn-cancel" (click)="cancelEditing()">Cancelar</button>
                <button type="submit" class="btn-primary-inline" [disabled]="isSavingEdit()">
                  {{ isSavingEdit() ? 'Guardando...' : '💾 Guardar cambios' }}
                </button>
              </div>
            </form>
          </section>
        } @else {
          <!-- VISTA DE LECTURA DEL POST -->
          <header class="thread-header">
            <div class="author-block">
              <div class="author-avatar">{{ post()?.author?.charAt(0) | uppercase }}</div>
              <div class="author-info">
                <span class="name">{{ post()?.author }}</span>
                <span class="date">
                  Publicado hace {{ getTimeAgo(post()?.createdAt) }} en <strong>{{ post()?.category }}</strong>
                  @if (post()?.updatedAt) { <em> · (Editado)</em> }
                </span>
              </div>
            </div>
            <h1>{{ post()?.title }}</h1>
            <div class="tags">
              @for (tag of post()?.tags; track tag) { <span class="tag">{{ tag }}</span> }
            </div>
          </header>

          <section class="thread-body">
            <p style="white-space: pre-wrap;">{{ post()?.body }}</p>

            <!-- Previsualización de Imagen por URL -->
            @if (post()?.imageUrl) {
              <div class="media-section">
                <h3>🖼️ Imagen de la publicación</h3>
                <div class="image-showcase">
                  <img [src]="post()!.imageUrl" [alt]="post()!.title" />
                </div>
              </div>
            }

            <!-- Previsualización de Video por URL -->
            @if (post()?.videoUrl) {
              <div class="media-section">
                <h3>🎬 Previsualización de Video</h3>
                @if (getEmbedVideoUrl(post()!.videoUrl!); as embedUrl) {
                  <div class="video-container">
                    <iframe
                      [src]="embedUrl"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen>
                    </iframe>
                  </div>
                } @else {
                  <div class="video-container direct">
                    <video [src]="post()!.videoUrl" controls preload="metadata"></video>
                  </div>
                }
                <p class="video-source-link">
                  🔗 Enlace original: <a [href]="post()!.videoUrl" target="_blank" rel="noopener noreferrer">{{ post()!.videoUrl }}</a>
                </p>
              </div>
            }

            <!-- Barra de Reacciones (Like / Dislike) y Contador de Comentarios -->
            <div class="engagement-bar">
              <div class="reaction-buttons">
                <button
                  type="button"
                  class="btn-reaction like"
                  [class.active]="hasUserLiked()"
                  (click)="vote('up')">
                  👍 Me gusta <span>({{ post()?.upvotes?.length || 0 }})</span>
                </button>
                <button
                  type="button"
                  class="btn-reaction dislike"
                  [class.active]="hasUserDisliked()"
                  (click)="vote('down')">
                  👎 No me gusta <span>({{ post()?.downvotes?.length || 0 }})</span>
                </button>
              </div>

              <div class="engagement-stats">
                <span class="score-pill">⭐ Puntuación neta: <strong>{{ post()?.votes || 0 }}</strong></span>
                <span class="comments-pill">💬 <strong>{{ comments().length }}</strong> {{ comments().length === 1 ? 'comentario' : 'comentarios' }}</span>
              </div>
            </div>
          </section>
        }

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
          <h3>💬 Comentarios ({{ comments().length }})</h3>
          
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
    .top-nav-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
    .top-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .back-link { color: var(--accent-color); text-decoration: none; font-weight: bold; &:hover { text-decoration: underline; } }
    .btn-edit { background: var(--bg-card); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; &:hover { background: var(--accent-bg); } }
    .btn-cache { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; &:hover { border-color: var(--accent-color); color: var(--accent-color); } &.saved { background: var(--accent-bg); border-color: var(--accent-color); color: var(--accent-color); font-weight: 600; } }
    .cache-banner { background: var(--accent-bg); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; }
    
    /* Formulario de edición */
    .edit-box { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; h2 { margin-bottom: 1rem; font-size: 1.35rem; } }
    .edit-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; > * { flex: 1; min-width: 240px; } }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; label { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; } input, select, textarea { width: 100%; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.75rem; border-radius: 6px; font-family: inherit; &:focus { outline: none; border-color: var(--accent-color); } } }
    .edit-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); padding: 0.65rem 1.2rem; border-radius: 6px; cursor: pointer; }
    .btn-primary-inline { background: var(--accent-gradient); color: #fff; border: none; padding: 0.65rem 1.4rem; border-radius: 6px; font-weight: bold; cursor: pointer; &:disabled { opacity: 0.6; } }

    .thread-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; h1 { font-size: 2rem; margin-bottom: 1rem; } }
    .author-block { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--accent-gradient); color: white; display: grid; place-items: center; font-weight: bold; font-size: 1.5rem; }
    .author-info { display: flex; flex-direction: column; .name { font-weight: bold; font-size: 1.1rem; } .date { font-size: 0.85rem; color: var(--text-muted); } }
    
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; .tag { background: var(--accent-bg); color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; } }
    
    .thread-body p { line-height: 1.7; font-size: 1.05rem; margin-bottom: 2rem; color: var(--text-main); }

    /* Multimedia en detalle */
    .media-section { margin: 1.5rem 0 2rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; h3 { font-size: 1.05rem; margin-bottom: 0.9rem; color: var(--text-main); } }
    .image-showcase { border-radius: 8px; overflow: hidden; background: #000; text-align: center; img { max-width: 100%; max-height: 520px; object-fit: contain; display: block; margin: 0 auto; } }
    .video-container { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: #000; iframe, video { width: 100%; height: 100%; border: 0; } &.direct { aspect-ratio: auto; video { max-height: 500px; } } }
    .video-source-link { margin-top: 0.75rem; margin-bottom: 0 !important; font-size: 0.85rem !important; color: var(--text-muted) !important; a { color: var(--accent-color); word-break: break-all; } }

    /* Barra Like / Dislike */
    .engagement-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.9rem 1.25rem; margin-top: 1.5rem; margin-bottom: 2rem; }
    .reaction-buttons { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .btn-reaction { background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s; &:hover { border-color: var(--accent-color); } &.like.active { background: rgba(61, 220, 132, 0.15); border-color: #3ddc84; color: #3ddc84; } &.dislike.active { background: rgba(248, 113, 113, 0.15); border-color: #f87171; color: #f87171; } }
    .engagement-stats { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.9rem; color: var(--text-muted); strong { color: var(--text-main); } }
    
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
  protected readonly cacheService = inject(CacheService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  post = signal<Post | null>(null);
  comments = signal<Comment[]>([]);
  isLoading = signal(true);
  isFromCache = signal(false);

  // Estado de edición
  isEditing = signal(false);
  isSavingEdit = signal(false);
  editTitle = '';
  editCategory = '';
  editTags = '';
  editBody = '';
  editImageUrl = '';
  editVideoUrl = '';
  
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
    this.isFromCache.set(false);
    try {
      const [p, c] = await Promise.all([
        this.firebase.getPost(id),
        this.firebase.getComments(id)
      ]);
      if (p) {
        this.post.set(p);
        this.comments.set(c);
      } else {
        const cachedPost = await this.cacheService.getCachedPostById(id);
        if (cachedPost) {
          this.post.set(cachedPost);
          this.isFromCache.set(true);
        }
      }
    } catch (e) {
      console.warn('Error cargando detalles desde red, buscando en Cache API:', e);
      const cachedPost = await this.cacheService.getCachedPostById(id);
      if (cachedPost) {
        this.post.set(cachedPost);
        this.isFromCache.set(true);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  isAuthor(): boolean {
    const uid = this.firebase.currentUser()?.uid;
    return !!uid && uid === this.post()?.authorId;
  }

  hasUserLiked(): boolean {
    const uid = this.firebase.currentUser()?.uid;
    return !!uid && !!this.post()?.upvotes?.includes(uid);
  }

  hasUserDisliked(): boolean {
    const uid = this.firebase.currentUser()?.uid;
    return !!uid && !!this.post()?.downvotes?.includes(uid);
  }

  startEditing() {
    const current = this.post();
    if (!current) return;
    this.editTitle = current.title;
    this.editCategory = current.category;
    this.editTags = (current.tags || []).join(', ');
    this.editBody = current.body;
    this.editImageUrl = current.imageUrl || '';
    this.editVideoUrl = current.videoUrl || '';
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.isEditing.set(false);
  }

  async saveEdit(event: Event) {
    event.preventDefault();
    const current = this.post();
    if (!current?.id) return;

    this.isSavingEdit.set(true);
    try {
      const tagArray = this.editTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await this.firebase.updatePost(current.id, {
        title: this.editTitle.trim(),
        category: this.editCategory,
        tags: tagArray,
        body: this.editBody,
        imageUrl: this.editImageUrl.trim(),
        videoUrl: this.editVideoUrl.trim()
      });

      this.isEditing.set(false);
      await this.loadData(current.id);
    } catch (err) {
      console.error('Error al actualizar la publicación:', err);
      alert('No se pudo actualizar la publicación.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  getEmbedVideoUrl(rawUrl: string): SafeResourceUrl | null {
    const url = rawUrl.trim();
    if (!url) return null;

    // YouTube (watch?v=, youtu.be/, shorts/, embed/)
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (ytMatch && ytMatch[1]) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${ytMatch[1]}`);
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
    }

    return null;
  }

  async toggleCachePost() {
    const current = this.post();
    if (!current?.id) return;
    if (this.cacheService.isPostSaved(current.id)) {
      await this.cacheService.removeSavedPost(current.id);
    } else {
      await this.cacheService.savePostForOffline(current);
    }
  }

  async addComment(e: Event) {
    e.preventDefault();
    if (!this.newComment.trim() || !this.post()) return;
    
    this.isCommenting.set(true);
    try {
      await this.firebase.addComment(this.post()!.id!, this.newComment);
      this.newComment = '';
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
      alert('Inicia sesión para dar Like o Dislike');
      return;
    }
    if (!this.post()?.id) return;
    try {
      await this.firebase.votePost(this.post()!.id!, value);
      await this.loadData(this.post()!.id!);
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