import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public - no JWT authentication required.
 * Use on login, register, health check, etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
