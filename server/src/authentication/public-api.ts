import { SetMetadata } from '@nestjs/common';

export const PUBLIC_API_KEY = 'PUBLIC_API_KEY';
export const PublicApi = () => SetMetadata(PUBLIC_API_KEY, true);
