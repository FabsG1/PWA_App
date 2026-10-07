import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// El Service Worker (/sw.js) se registra desde PwaService
// (src/app/core/services/pwa.service.ts), que se crea al iniciar el componente raíz.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));