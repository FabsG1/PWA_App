import { Routes } from '@angular/router';
import { ForumFeedComponent } from './features/forum-feed/forum-feed';
import { CreatePostComponent } from './features/create-post/create-post';
import { PostDetailComponent } from './features/post-detail/post-detail';
import { LoginComponent } from './features/login/login';

import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'foro', pathMatch: 'full' },
  { path: 'foro', component: ForumFeedComponent },
  { path: 'login', component: LoginComponent },
  { path: 'nueva-publicacion', component: CreatePostComponent },
  { path: 'post/:id', component: PostDetailComponent },
  { path: 'perfil', component: ProfileComponent }
];