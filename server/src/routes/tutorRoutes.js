import { Router } from 'express';

export function createTutorRouter(controller, rateLimit) {
  const router = Router();
  router.get('/status', controller.status);
  router.post('/chat', rateLimit, controller.chat);
  return router;
}
