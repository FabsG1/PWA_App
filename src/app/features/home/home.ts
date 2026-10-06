import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="landing-container fade-in">
      <div class="hero-section">
        <div class="badge">🚀 PWA de Alto Rendimiento</div>
        <h1 class="gradient-text">Bienvenido a TinkerLog</h1>
        <p class="subtitle">
          La bitácora definitiva para desarrolladores, modders y creadores de hardware. 
          Documenta tu código, guarda tus diagramas en PDF y comparte tus avances en una plataforma offline-first.
        </p>
        
        <div class="hero-actions">
          <!-- Este botón solo aparece si la app se puede instalar -->
          @if (showInstallButton) {
            <button class="btn-install glow-effect" (click)="installPwa()">
              <span class="icon">⬇️</span> Instalar Aplicación
            </button>
          }
          <a routerLink="/foro" class="btn-outline">Explorar el Foro →</a>
        </div>
      </div>

      <div class="features-grid">
        <div class="feature-card glass-panel">
          <div class="feature-icon">⚡</div>
          <h3>Offline First</h3>
          <p>Tus diagramas y código cacheados. Funciona perfectamente sin internet en tu taller.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon">💻</div>
          <h3>Sintaxis Nativa</h3>
          <p>Bloques de código integrados para C++, PowerShell, Kotlin y más, listos para copiar.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon">📄</div>
          <h3>Gestión de Recursos</h3>
          <p>Sube y previsualiza esquemas en PDF, diagramas de arquitectura y videos de prueba.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; text-align: center; padding: 2rem 1rem; }
    .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent-bg); color: var(--accent-color); border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-bottom: 1.5rem; border: 1px solid rgba(88, 166, 255, 0.2); }
    .hero-section { max-width: 800px; margin-bottom: 4rem; }
    .gradient-text { font-size: 4rem; font-weight: 900; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; letter-spacing: -1px; }
    .subtitle { font-size: 1.25rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; }
    
    .hero-actions { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }
    .btn-install { background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white; border: none; padding: 1rem 2rem; font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.2s, box-shadow 0.2s; }
    .btn-install:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(46, 160, 67, 0.4); }
    .btn-outline { background: transparent; color: var(--text-main); border: 2px solid var(--border-color); padding: 1rem 2rem; font-size: 1.1rem; font-weight: bold; border-radius: 8px; text-decoration: none; transition: all 0.2s; }
    .btn-outline:hover { border-color: var(--text-main); background: var(--bg-hover); }

    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; width: 100%; max-width: 1000px; }
    .feature-card { padding: 2rem; text-align: left; border-radius: 16px; transition: transform 0.3s; }
    .feature-card:hover { transform: translateY(-5px); }
    .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .feature-card h3 { color: var(--text-main); margin-bottom: 0.5rem; font-size: 1.3rem; }
    .feature-card p { color: var(--text-muted); line-height: 1.5; }
    
    @media (max-width: 768px) { .gradient-text { font-size: 2.8rem; } }
  `]
})
export class HomeComponent implements OnInit {
  deferredPrompt: any;
  showInstallButton = false;

  ngOnInit() {}

  // Escucha el evento del navegador que permite instalar la PWA
  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallButton = true; // Muestra el botón de instalación
  }

  installPwa() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó instalar la PWA');
        }
        this.deferredPrompt = null;
        this.showInstallButton = false;
      });
    }
  }
}