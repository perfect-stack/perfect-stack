import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigrateImagesService } from '../migrate/migrate-images.service';

async function bootstrap() {
  console.log('Starting migration script...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const migrateImagesService = app.get(MigrateImagesService);

  try {
    await migrateImagesService.migrateImages();
  }
  catch (error) {
    console.error('Error during migration:', error);
    process.exit(1); // Exit with an error code if something goes wrong
  } finally {
    console.log('Closing application context...');
    await app.close();
    process.exit(0); // Exit with a success code
  }
}

bootstrap();
