import app from './app';
import { prisma } from './config/prisma';

const PORT = Number(process.env.PORT) || 4000;

async function iniciarServidor() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a MySQL establecida correctamente mediante Prisma.');

    app.listen(PORT, () => {
      console.log(`🎁 Servidor backend de Amigo Secreto ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos MySQL:', error);
    process.exit(1);
  }
}

iniciarServidor();

