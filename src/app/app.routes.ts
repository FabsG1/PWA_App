import { Routes } from '@angular/router';
import { ProjectDetailComponent } from './features/project-detail/project-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'proyecto', pathMatch: 'full' },
  { path: 'proyecto', component: ProjectDetailComponent }
];