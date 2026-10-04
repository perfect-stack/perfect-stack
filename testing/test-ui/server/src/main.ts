import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { VetClinicServerModule } from "./vet-clinic-server.module";
import { MetaEntityService, OrmService } from "@perfect-stack/nestjs-server";
import { AllExceptionsFilter } from "./all-exceptions.filter";
import { seedDatabase } from "./seed-data";

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

  // OpenAPI documentation
  // Localhost:
  //   - http://localhost:3080/api/api-docs
  //   - http://localhost:3080/api/api-json
  const config = new DocumentBuilder()
    .setTitle("Web API documentation")
    .setDescription("The API documentation for the web services interface")
    .setVersion("1.x")
    .addTag("TAG")
    .addBearerAuth()
    .addSecurityRequirements("bearer")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/api-docs", app, document, {
    jsonDocumentUrl: "/api/api-json",
  });

  // Synchronize dynamic Sequelize models with database without alter constraints
  const metaEntityService = app.get(MetaEntityService);
  const ormService = app.get(OrmService);
  await metaEntityService.syncMetaModelWithDatabase(false);
  await ormService.sequelize.sync();
  logger.log("Database schema synchronized and dynamic models initialized");

  // Ensure initial seed data exists for casual manual testing
  try {
    await seedDatabase(app);
  } catch (seedErr) {
    logger.error("Error during initial database seeding:", seedErr);
  }

  const port = process.env.PORT || 3080;
  await app.listen(port, "0.0.0.0");
  logger.log(`Vet Clinic Server is running on http://127.0.0.1:${port}`);
  logger.log(`OpenAPI documentation is available at http://127.0.0.1:${port}/api/api-docs`);
}

bootstrap();
