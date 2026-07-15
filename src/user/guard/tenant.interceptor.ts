import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { als } from '../../prisma/als';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;

    // Detect Super Admin via the boolean OR the old role array mapping
    const isSuperAdmin = user?.is_system_admin === true || user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN' || user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('SYSTEM_ADMIN');

    const store = {
      userId: user?.id || user?.client_id || user?.sub || null, // depends on your JWT structure
      clientId: user?.client_id,
      isSuperAdmin: !!isSuperAdmin,
      ip: req?.ip,
      userAgent: req?.headers ? req.headers['user-agent'] : undefined,
    };

    // Run the entire request inside this secure isolated context scope
    return als.run(store, () => next.handle());
  }
}
