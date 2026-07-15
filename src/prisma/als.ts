import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId: string;
  clientId?: string;
  isSuperAdmin: boolean;
  ip?: string;
  userAgent?: string;
}

export const als = new AsyncLocalStorage<RequestContext>();
