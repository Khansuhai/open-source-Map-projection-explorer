/**
 * 3D → 2D Dish — Phase 1 entry point
 * Initializes the shelf (projection browser) UI.
 */
import './styles/main.css';
import { initShelf } from './shelf/shelf-ui';

const app = document.getElementById('app');
if (app) {
  initShelf(app);
}
