import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container fade-in">
      <div class="auth-card glass-panel">
        <div class="auth-header">
          <img src="icons/icon-96x96.png" alt="ThinkerLog Logo" width="64" height="64">
          <h1>{{ isRegistering() ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
          <p>Únete a la comunidad de makers y desarrolladores.</p>
        </div>

        <form (submit)="onSubmit($event)" class="auth-form">
          @if (errorMsg()) {
            <div class="error-banner">{{ errorMsg() }}</div>
          }

          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" id="email" [(ngModel)]="email" name="email" required placeholder="tu@correo.com">
          </div>

          <div class="form-group">
            <label for="pass">Contraseña</label>
            <input type="password" id="pass" [(ngModel)]="pass" name="pass" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn-primary" [disabled]="isLoading()">
            {{ isLoading() ? 'Procesando...' : (isRegistering() ? 'Registrarse' : 'Entrar') }}
          </button>
        </form>

        <div class="auth-footer">
          <button class="btn-text" (click)="toggleMode()">
            {{ isRegistering() ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: grid; place-items: center; min-height: 80vh; }
    .auth-card { width: 100%; max-width: 420px; padding: 2.5rem 2rem; border-radius: 16px; }
    .auth-header { text-align: center; margin-bottom: 2rem; img { border-radius: 12px; margin-bottom: 1rem; } h1 { font-size: 1.8rem; margin-bottom: 0.5rem; } p { color: var(--text-muted); font-size: 0.95rem; } }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.9rem; font-weight: 600; color: var(--text-main); } input { background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); padding: 0.8rem 1rem; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; &:focus { outline: none; border-color: var(--accent-color); } } }
    .btn-primary { padding: 0.9rem; border: none; border-radius: 8px; background: var(--accent-gradient); color: white; font-weight: bold; font-size: 1rem; cursor: pointer; transition: opacity 0.2s; &:hover { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .error-banner { background: rgba(248, 81, 73, 0.1); border: 1px solid #f85149; color: #ff7b72; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; text-align: center; }
    .auth-footer { margin-top: 1.5rem; text-align: center; }
    .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; &:hover { color: var(--accent-color); text-decoration: underline; } }
  `]
})
export class LoginComponent {
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  isRegistering = signal(false);
  isLoading = signal(false);
  errorMsg = signal('');

  email = '';
  pass = '';

  toggleMode() {
    this.isRegistering.set(!this.isRegistering());
    this.errorMsg.set('');
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.email || !this.pass) return;

    this.isLoading.set(true);
    this.errorMsg.set('');

    try {
      if (this.isRegistering()) {
        await this.firebase.register(this.email, this.pass);
      } else {
        await this.firebase.login(this.email, this.pass);
      }
      // Pide permisos para notificaciones al hacer login/registro exitoso
      await this.firebase.requestNotificationPermission();
      this.router.navigate(['/foro']);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') this.errorMsg.set('El correo ya está registrado.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') this.errorMsg.set('Credenciales incorrectas.');
      else if (err.code === 'auth/weak-password') this.errorMsg.set('La contraseña debe tener al menos 6 caracteres.');
      else this.errorMsg.set('Error en la autenticación. Revisa tu conexión y la configuración de Firebase.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
