import { Logger } from "@nestjs/common";
import { SchemaListener } from "@perfect-stack/nestjs-server/event/event.service";


export class CaptureSchemaListener implements SchemaListener {

    private readonly logger = new Logger(CaptureSchemaListener.name);
    
    onSchemaUpdate() : Promise<void> {
        this.logger.log('XXXXXXXX onSchemaUpdate');
        return this.updateSchema();
    }

    private async updateSchema() {
        // TODO: schema updates and data seeding go here
    }

 
}