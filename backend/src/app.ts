import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import sorteoRoutes from './routes/sorteoRoutes';
import publicRoutes from './routes/publicRoutes';

dotenv.config();

const app = express();

// En producción detrás de proxy reverso (Render, Railway, Nginx, Cloudflare), confiar en X-Forwarded-For y redirigir a HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
      return;
    }
    next();
  });
}

// Cabeceras de seguridad HTTP
app.use(helmet());

// Configuración de CORS restringida al frontend autorizado
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como supertest o healthchecks) o desde orígenes autorizados
      if (!origin) {
        callback(null, true);
        return;
      }
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(cleanOrigin) ||
        (process.env.NODE_ENV !== 'production' && cleanOrigin.startsWith('http://localhost:'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por la política CORS del servidor.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));

// Endpoint de estado del servidor
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    servicio: 'Amigo Secreto API',
    timestamp: new Date().toISOString(),
  });
});

// Rutas principales de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/sorteos', sorteoRoutes);
app.use('/api/public', publicRoutes);

// Manejador de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'La ruta solicitada no existe en la API.',
  });
});

// Manejador centralizado de errores del servidor
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message.includes('CORS')) {
    res.status(403).json({ error: err.message });
    return;
  }
  console.error('Error no controlado en el servidor:', err);
  res.status(500).json({
    error: 'Ocurrió un error inesperado en el servidor. Inténtalo nuevamente.',
  });
});

export default app;

