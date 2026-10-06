import { Component } from '@angular/core';
import { HighlightModule } from 'ngx-highlightjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [HighlightModule, RouterLink],
  template: `
    <article class="post-view">
      
      <!-- Botón de regreso -->
      <a routerLink="/foro" class="back-link">← Volver al Foro</a>

      <!-- Cabecera del Hilo -->
      <header class="thread-header">
        <div class="author-block">
          <img src="https://ui-avatars.com/api/?name=AudioIng&background=107c10&color=fff" alt="Avatar">
          <div class="author-info">
            <span class="name">AudioIng</span>
            <span class="date">Publicado hace 10 min en <strong>Hardware & Modding</strong></span>
          </div>
        </div>
        <h1>Construcción de DAC de Audio Hi-Res (PCM5102A) con I2S</h1>
        <div class="tags">
          <span class="tag">C++</span> <span class="tag">Hardware</span> <span class="tag">I2S</span>
        </div>
      </header>

      <!-- Cuerpo del Mensaje -->
      <section class="thread-body">
        <p>Hola a todos. Quería compartir mi proceso de diseño y ensamblaje de un Convertidor Digital a Analógico (DAC) personalizado utilizando el protocolo I2S. El objetivo es lograr una salida de audio sin pérdida (Lossless), reduciendo la latencia de sonido. Adjunto abajo el código fuente para la placa base y el diagrama esquemático en PDF.</p>
        
        <!-- Bloque de Código -->
        <div class="code-section">
          <div class="code-header">
            <span>audio_i2s_config.cpp</span>
            <button (click)="copyCode()">Copiar</button>
          </div>
          <pre>[highlight]="codeSnippet" [languages]="['cpp']"</pre>
        </div>
      </section>

      <!-- Zona de Recursos Adjuntos (PDFs y Archivos) -->
      <section class="attachments-section">
        <h3>Archivos Adjuntos</h3>
        <div class="attachment-card">
          <div class="icon">📄</div>
          <div class="file-info">
            <span class="filename">Esquema_Electronico_DAC_v1.pdf</span>
            <span class="filesize">PDF Document • 4.2 MB</span>
          </div>
          <button class="btn-download">Descargar</button>
        </div>
      </section>

      <!-- Multimedia: Imágenes y Video -->
      <section class="media-section">
        <h3>Evidencia de Ensamblaje y Pruebas</h3>
        <div class="media-grid">
          <div class="media-card video-card">
            <video controls poster="https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80">
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
            </video>
            <div class="caption">Prueba de latencia y osciloscopio</div>
          </div>
          
          <div class="media-card">
            <img src="https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=400&q=80" alt="Soldadura del DAC">
            <div class="caption">Soldadura de pines (PCM5102A)</div>
          </div>
          
          <div class="media-card">
            <img src="https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80" alt="Espectro de Audio">
            <div class="caption">Análisis del espectro de ruido</div>
          </div>
        </div>
      </section>
      
      <hr class="divider">
      
      <!-- Zona de Comentarios (Maquetada) -->
      <section class="comments-section">
        <h3>Comentarios (45)</h3>
        <textarea placeholder="Añadir un comentario a la discusión..."></textarea>
        <button class="btn-primary">Comentar</button>
      </section>

    </article>
  `,
  styles: [`
    .post-view { background: var(--bg-main); color: var(--text-main); }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: var(--accent-color); text-decoration: none; font-weight: bold; &:hover { text-decoration: underline; } }
    
    .thread-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; h1 { font-size: 2rem; margin-bottom: 1rem; } }
    .author-block { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; img { width: 48px; border-radius: 50%; } }
    .author-info { display: flex; flex-direction: column; .name { font-weight: bold; font-size: 1.1rem; } .date { font-size: 0.85rem; color: var(--text-muted); } }
    
    .tags { display: flex; gap: 0.5rem; .tag { background: var(--accent-bg); color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; } }
    
    .thread-body p { line-height: 1.7; font-size: 1.05rem; margin-bottom: 2rem; color: var(--text-main); }
    
    .code-section { background: var(--code-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; margin-bottom: 3rem; }
    .code-header { display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-card); border-bottom: 1px solid var(--border-color); font-family: monospace; color: var(--text-muted); button { background: none; border: none; color: var(--accent-color); cursor: pointer; } }
    pre { padding: 1.5rem; margin: 0; overflow-x: auto; font-family: 'Consolas', monospace; font-size: 0.9rem; }
    
    .attachments-section { margin-bottom: 3rem; h3 { margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; } }
    .attachment-card { display: flex; align-items: center; gap: 1rem; background: var(--bg-card); padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; .icon { font-size: 2rem; } .file-info { flex: 1; display: flex; flex-direction: column; .filename { font-weight: bold; } .filesize { font-size: 0.85rem; color: var(--text-muted); } } .btn-download { background: var(--accent-bg); color: var(--accent-color); padding: 0.5rem 1rem; border: 1px solid var(--accent-color); border-radius: 4px; cursor: pointer; font-weight: bold; &:hover { background: var(--accent-color); color: #fff; } } }
    
    .media-section { margin-bottom: 3rem; h3 { margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; } }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .media-card { border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-card); img, video { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; } }
    .video-card { grid-column: 1 / -1; }
    .caption { padding: 1rem; font-size: 0.9rem; color: var(--text-main); text-align: center; }
    
    .divider { border: 0; border-top: 1px solid var(--border-color); margin: 2rem 0; }
    .comments-section { h3 { margin-bottom: 1rem; } textarea { width: 100%; min-height: 100px; padding: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 8px; margin-bottom: 1rem; resize: vertical; } .btn-primary { background: var(--accent-color); color: #fff; padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; float: right; } }
  `]
})
export class PostDetailComponent {
  codeSnippet = `// Configuración I2S para DAC (Ejemplo: PCM5102A con ESP32)
#include "driver/i2s.h"

void setup_i2s() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 48000, // Frecuencia de muestreo (Hi-Res básica)
        .bits_per_sample = I2S_BITS_PER_SAMPLE_24BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64
    };
    
    // Inicializar el driver I2S
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    
    printf("[OK] Interfaz I2S inicializada. DAC listo para recibir stream.\\n");
}`;

  copyCode() {
    navigator.clipboard.writeText(this.codeSnippet);
    alert('Código C++ copiado al portapapeles');
  }
}