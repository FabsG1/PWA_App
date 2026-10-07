import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'post/:id',
    renderMode: RenderMode.Client // Obliga a que esta ruta dinámica cargue en el navegador
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender // Mantiene el pre-render para el Inicio y el Foro
  }
];