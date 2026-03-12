import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type RoleName = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'DELIVERY' | 'CUSTOMER';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

