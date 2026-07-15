import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * @ClientId() decorator — extracts the clinic's client_id from the request.
 * 
 * Usage in controller:
 *   @Get()
 *   findAll(@ClientId() clientId: string) {
 *     return this.service.findAll(clientId);
 *   }
 * 
 * This enforces multi-tenant isolation by ensuring every query
 * is scoped to the logged-in user's clinic.
 */
export const ClientId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // IMS tokens always have client_id
        if (user.client_id) {
            return user.client_id;
        }

        // Legacy: try to find client_id via email from ImsUser
        // This shouldn't happen in normal flow, but just in case
        throw new ForbiddenException('Unable to determine clinic identity. Please re-login.');
    },
);
