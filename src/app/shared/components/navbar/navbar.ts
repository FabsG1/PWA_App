import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';
import { ThemeService } from '../../../core/services/theme.service';
import { FirebaseService } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  protected readonly pwa = inject(PwaService);
  protected readonly theme = inject(ThemeService);
  protected readonly firebase = inject(FirebaseService);
}