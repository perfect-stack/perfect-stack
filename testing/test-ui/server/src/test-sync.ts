import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { VetClinicServerModule } from "./vet-clinic-server.module";
import { MetaEntityService, OrmService } from "@perfect-stack/nestjs-server";

async function run() {
  const app = await NestFactory.create(VetClinicServerModule, { logger: false });
  const metaEntityService = app.get(MetaEntityService);
  const ormService = app.get(OrmService);
  
  try {
    console.log("Starting syncMetaModelWithDatabase(true) with PRAGMA foreign_keys = OFF...");
    await ormService.sequelize.query("PRAGMA foreign_keys = OFF;");
    await metaEntityService.syncMetaModelWithDatabase(true);
    await ormService.sequelize.query("PRAGMA foreign_keys = ON;");
    console.log("SYNC SUCCESS!");

    const [fkViolations] = await ormService.sequelize.query("PRAGMA foreign_key_check;");
    console.log("FK Violations after sync:", JSON.stringify(fkViolations));
  } catch (err: any) {
    console.error("CAUGHT ERROR:", err);
    console.error("NAME:", err.name);
    console.error("MESSAGE:", err.message);
  }
  await app.close();
  process.exit(0);
}
run();
