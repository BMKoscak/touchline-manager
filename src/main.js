import { App } from './ui/app.js';

const app = new App();
window.__tm = app; // handy for debugging in the console
app.init();
