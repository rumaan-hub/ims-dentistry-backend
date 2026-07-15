import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. If endpoint is marked @Public(), skip auth entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. If no Authorization header, let request through without user
    //    Endpoints with @Roles() will still be blocked by RolesGuard
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      return true;
    }

    // 3. Placeholder bearer tokens should be treated as no token.
    //    This prevents Passport from throwing "jwt malformed" for values
    //    like "Bearer undefined" coming from client-side stale auth state.
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader;

    if (!token || ['undefined', 'null', 'nan'].includes(String(token).toLowerCase())) {
      return true;
    }

    // Old behavior:
    // return super.canActivate(context);

    // 4. Real token is present — validate it normally
    return super.canActivate(context);
  }

  handleRequest(err, user, info?: Error) {
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Access Denied');
    }
    return user;
  }
}
