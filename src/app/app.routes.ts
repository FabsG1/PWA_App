import { Routes } from '@angular/router';
import { ForumFeedComponent } from './features/forum-feed/forum-feed';
import { CreatePostComponent } from './features/create-post/create-post';
import { PostDetailComponent } from './features/post-detail/post-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'foro', pathMatch: 'full' },
  { path: 'foro', component: ForumFeedComponent },
  { path: 'nueva-publicacion', component: CreatePostComponent },
  { path: 'post/:id', component: PostDetailComponent }
];