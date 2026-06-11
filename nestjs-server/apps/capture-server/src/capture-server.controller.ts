import { Controller, Get } from '@nestjs/common';
import { CaptureServerService } from './capture-server.service';
import {PublicApi} from "@perfect-stack/nestjs-server/authentication/public-api";
import {ApiOperation} from "@nestjs/swagger";

@Controller()
export class CaptureServerController {

  constructor(private readonly captureServerService: CaptureServerService) {}

    @PublicApi()
    @ApiOperation({
        summary: 'Return a Health Check message',
    })
    @Get()
    get(): string {
        return this.captureServerService.getHealth();
    }

    @PublicApi()
    @ApiOperation({
        summary: 'Return a Health Check message',
    })
    @Get('/health')
    getHealth(): string {
        return this.captureServerService.getHealth();
    }
}
