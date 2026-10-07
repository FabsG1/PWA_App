import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { PwaService } from './core/services/pwa.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Inyectarlo aquí arranca el registro del Service Worker desde el inicio. */
  protected readonly pwa = inject(PwaService);
  private readonly theme = inject(ThemeService);
}