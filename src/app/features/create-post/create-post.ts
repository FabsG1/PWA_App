import { Component } from '@angular/core';

@Component({
  selector: 'app-create-post',
  standalone: true,
  template: `
    <div class="create-post-container">
      <header>
        <h1>Crear nueva publicación</h1>
        <p>Inicia un debate, comparte código o sube recursos técnicos.</p>
      </header>

      <form class="post-form">
        <div class="form-group">
          <input type="text" class="input-title" placeholder="Título de tu publicación...">
        </div>

        <div class="form-row">
          <select class="input-select">
            <option value="">Selecciona una categoría...</option>
            <option>Desarrollo Móvil</option>
            <option>Game Dev</option>
            <option>Hardware & Modding</option>
          </select>
          <input type="text" class="input-tags" placeholder="Etiquetas (ej. Kotlin, Unity, Scripts)">
        </div>

        <div class="editor-toolbar">
          <button type="button"><b>B</b></button>
          <button type="button"><i>I</i></button>
          <button type="button">&lt;/&gt;</button>
          <button type="button">🔗</button>
        </div>
        <textarea class="input-body" placeholder="Escribe tu publicación aquí... (Soporta Markdown)"></textarea>

        <!-- Zona de Drag & Drop para Recursos -->
        <div class="upload-zone">
          <div class="upload-icon">📂</div>
          <h3>Adjuntar Recursos Visuales y PDFs</h3>
          <p>Arrastra y suelta archivos aquí o <span>explora en tu equipo</span></p>
          <div class="upload-limits">
            Soporta: JPG, PNG, MP4, PDF (Máx. 50MB)
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/foro">Cancelar</button>
          <button type="submit" class="btn-submit">Publicar en el foro</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-post-container { max-width: 900px; margin: 0 auto; }
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
    .btn-submit { padding: 0.8rem 2rem; background: var(--accent-color); color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; &:hover { opacity: 0.9; } }
  `]
})
export class CreatePostComponent {}