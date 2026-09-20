import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { VetClinicServerModule } from "./vet-clinic-server.module";
import { MetaEntityService, OrmService } from "@perfect-stack/nestjs-server";
import { AllExceptionsFilter } from "./all-exceptions.filter";

async function bootstrap() {
  const logger = new Logger("VetClinicBootstrap");
  const app = await NestFactory.create(VetClinicServerModule, {
    logger: ["log", "error", "warn"],
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
    credentials: true,
  });

  // Synchronize dynamic Sequelize models with database without alter constraints
  const metaEntityService = app.get(MetaEntityService);
  const ormService = app.get(OrmService);
  await metaEntityService.syncMetaModelWithDatabase(false);
  await ormService.sequelize.sync();
  logger.log("Database schema synchronized and dynamic models initialized");

  const port = process.env.PORT || 3080;
  await app.listen(port, "0.0.0.0");
  logger.log(`Vet Clinic Server is running on http://127.0.0.1:${port}`);
}

bootstrap();
