import { Controller, Get } from '@nestjs/common';
import { KimsServerService } from './kims-server.service';
import {PublicApi} from "@perfect-stack/nestjs-server/authentication/public-api";
import {ApiOperation} from "@nestjs/swagger";

@Controller()
export class KimsServerController {

  constructor(private readonly kimsServerService: KimsServerService) {}

    @PublicApi()
    @ApiOperation({
        summary: 'Return a Health Check message',
    })
    @Get()
    get(): string {
        return this.kimsServerService.getHealth();
    }

    @PublicApi()
    @ApiOperation({
        summary: 'Return a Health Check message',
    })
    @Get('/health')
    getHealth(): string {
        return this.kimsServerService.getHealth();
    }
}
