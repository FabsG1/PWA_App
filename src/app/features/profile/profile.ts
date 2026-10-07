import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <h2>Perfil de Usuario</h2>
      
      @if (firebase.currentUser()) {
        <div class="profile-card">
          <div class="avatar-section">
            <div class="avatar">
              @if (photoURL) {
                <img [src]="photoURL" alt="Avatar" />
              } @else {
                <span>{{ displayName?.charAt(0) | uppercase }}</span>
              }
            </div>
          </div>
          
          <form (submit)="updateProfile($event)" class="profile-form">
            <div class="form-group">
              <label for="displayName">Nombre de Usuario</label>
              <input type="text" id="displayName" name="displayName" [(ngModel)]="displayName" required>
            </div>
            
            <div class="form-group">
              <label for="photoURL">URL de la foto de perfil (Opcional)</label>
              <input type="url" id="photoURL" name="photoURL" [(ngModel)]="photoURL" placeholder="https://ejemplo.com/mifoto.jpg">
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="isUpdating()">
                {{ isUpdating() ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
          
          <hr>
          
          <button (click)="logout()" class="btn-danger">Cerrar Sesión</button>
        </div>
      } @else {
        <p style="text-align:center;">Debes <a routerLink="/login" style="color:var(--accent-color);">iniciar sesión</a> para ver tu perfil.</p>
      }
    </div>
  `,
  styles: [`
    .profile-container { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
    h2 { text-align: center; margin-bottom: 2rem; color: var(--text-main); }
    .profile-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; }
    .avatar-section { display: flex; justify-content: center; margin-bottom: 2rem; }
    .avatar { width: 100px; height: 100px; border-radius: 50%; background: var(--accent-gradient); color: white; display: grid; place-items: center; font-size: 3rem; font-weight: bold; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
    .profile-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-weight: bold; color: var(--text-muted); } input { padding: 0.8rem; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 6px; &:focus { outline: none; border-color: var(--accent-color); } } }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
    .btn-primary { background: var(--accent-gradient); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: bold; &:disabled { opacity: 0.7; cursor: not-allowed; } }
    hr { border: 0; border-top: 1px solid var(--border-color); margin: 2rem 0; }
    .btn-danger { background: transparent; color: #f44336; border: 1px solid #f44336; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; &:hover { background: #f44336; color: white; } }
  `]
})
export class ProfileComponent implements OnInit {
  protected readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  displayName = '';
  photoURL = '';
  isUpdating = signal(false);

  ngOnInit() {
    const user = this.firebase.currentUser();
    if (user) {
      this.displayName = user.displayName || user.email?.split('@')[0] || '';
      this.photoURL = user.photoURL || '';
    } else {
      this.router.navigate(['/login']);
    }
  }

  async updateProfile(e: Event) {
    e.preventDefault();
    this.isUpdating.set(true);
    try {
      await this.firebase.updateUserProfile(this.displayName, this.photoURL);
      alert('Perfil actualizado correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el perfil');
    } finally {
      this.isUpdating.set(false);
    }
  }

  async logout() {
    try {
      await this.firebase.logout();
      this.router.navigate(['/foro']);
    } catch (err) {
      console.error(err);
    }
  }
}
