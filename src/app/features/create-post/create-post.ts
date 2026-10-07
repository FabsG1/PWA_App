import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="create-post-container">
      <header>
        <h1>Crear nueva publicación</h1>
        <p>Inicia un debate, comparte código o sube recursos técnicos.</p>
      </header>

      <form (submit)="onSubmit($event)" class="post-form">
        <div class="form-group">
          <input type="text" class="input-title" placeholder="Título de tu publicación..." [(ngModel)]="title" name="title" required>
        </div>

        <div class="form-row">
          <select class="input-select" [(ngModel)]="category" name="category" required>
            <option value="">Selecciona una categoría...</option>
            <option>Desarrollo Móvil</option>
            <option>Game Dev</option>
            <option>Hardware & Modding</option>
          </select>
          <input type="text" class="input-tags" placeholder="Etiquetas (ej. Kotlin, Unity, Scripts)" [(ngModel)]="tags" name="tags">
        </div>

        <div class="editor-toolbar">
          <button type="button"><b>B</b></button>
          <button type="button"><i>I</i></button>
          <button type="button">&lt;/&gt;</button>
          <button type="button">🔗</button>
        </div>
        <textarea class="input-body" placeholder="Escribe tu publicación aquí... (Soporta Markdown)" [(ngModel)]="body" name="body" required></textarea>

        <!-- Zona de Archivos -->
        <div class="upload-zone" (click)="fileInput.click()">
          <div class="upload-icon">📂</div>
          <h3>{{ selectedFile ? 'Archivo seleccionado' : 'Adjuntar recurso' }}</h3>
          <p>
            @if (selectedFile) {
              <span style="color: var(--text-main);">{{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
            } @else {
              Arrastra y suelta o <span>explora en tu equipo</span>
            }
          </p>
          <input type="file" #fileInput (change)="onFileSelected($event)" style="display:none" accept="image/*,.pdf">
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/foro">Cancelar</button>
          <button type="submit" class="btn-submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Publicando...' : 'Publicar en el foro' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-post-container { max-width: 900px; margin: 0 auto; animation: fadeIn 0.4s ease; }
    header { margin-bottom: 2rem; h1 { color: var(--text-main); } p { color: var(--text-muted); } }
    .post-form { display: flex; flex-direction: column; gap: 1.5rem; }
    
    input, select, textarea { width: 100%; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); padding: 1rem; border-radius: 6px; font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent-color); }
    
    .input-title { font-size: 1.2rem; font-weight: bold; background: var(--bg-card); }
    .form-row { display: flex; gap: 1rem; }
    
    .editor-toolbar { display: flex; gap: 0.5rem; padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-bottom: none; border-radius: 6px 6px 0 0; }
    .editor-toolbar button { background: none; border: none; color: var(--text-main); padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; &:hover { background: var(--bg-hover); } }
    .input-body { min-height: 250px; border-radius: 0 0 6px 6px; resize: vertical; }
    
    .upload-zone { border: 2px dashed var(--border-color); border-radius: 8px; padding: 3rem 1rem; text-align: center; background: var(--bg-card); transition: border-color 0.2s; cursor: pointer; &:hover { border-color: var(--accent-color); } }
    .upload-icon { font-size: 3rem; margin-bottom: 1rem; }
    .upload-zone h3 { color: var(--text-main); margin-bottom: 0.5rem; }
    .upload-zone p { color: var(--text-muted); span { color: var(--accent-color); text-decoration: underline; } }
    .upload-limits { margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-cancel { padding: 0.8rem 1.5rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-main); border-radius: 6px; cursor: pointer; &:hover { background: var(--bg-hover); } }
    .btn-submit { padding: 0.8rem 2rem; background: var(--accent-gradient); color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; &:hover { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
  `]
})
export class CreatePostComponent {
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  isLoading = signal(false);

  title = '';
  category = '';
  tags = '';
  body = '';
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.title || !this.body || !this.category) {
      alert('Por favor, completa el título, la categoría y el contenido.');
      return;
    }
    if (!this.firebase.currentUser()) {
      alert('Debes iniciar sesión para publicar.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    try {
      let fileUrl = '';
      let fileName = '';
      
      // Si hay archivo, súbelo primero a Firebase Storage
      if (this.selectedFile) {
        fileUrl = await this.firebase.uploadFile(this.selectedFile, 'posts_files');
        fileName = this.selectedFile.name;
      }

      const tagArray = this.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const postId = await this.firebase.createPost({
        title: this.title,
        body: this.body,
        category: this.category,
        tags: tagArray,
        ...(fileUrl ? { fileUrl, fileName } : {})
      });

      this.router.navigate(['/post', postId]);
    } catch (err) {
      console.error('Error al publicar:', err);
      alert('Hubo un error al publicar. Verifica tu conexión.');
    } finally {
      this.isLoading.set(false);
    }
  }
}