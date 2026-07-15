import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { ImsAuthService } from './ims-auth.service';
import { Public } from '../user/guard/public.decorator';

@Controller('ims/auth')
export class ImsAuthController {
    constructor(private imsAuthService: ImsAuthService) { }

    /**
     * POST /ims/auth/login
     * IMS-specific login — authenticates against ImsUser table only.
     * This endpoint is Public (no JWT required).
     */
    @Public()
    @Post('login')
    async login(@Body() body: { email: string; password: string }, @Req() req: any) {
        return this.imsAuthService.login(body.email, body.password, req);
    }

    /**
     * POST /ims/auth/register
     * Public registration — creates ImsUser without password.
     * Password is set later during account activation.
     */
    @Public()
    @Post('register')
    async register(@Body() body: {
        email: string;
        first_name: string;
        last_name: string;
        company_name?: string;
        contact_number?: string;
        permanent_address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
    }) {
        return this.imsAuthService.register(body);
    }

    /**
     * GET /ims/auth/me
     * Returns the current IMS user profile.
     * Requires valid JWT token.
     */
    @Get('me')
    async getMe(@Req() req: any) {
        return this.imsAuthService.getMe(req.user);
    }

    /**
     * GET /ims/auth/login-history
     * Returns last 10 login records for the current user.
     */
    @Get('login-history')
    async getLoginHistory(@Req() req: any) {
        return this.imsAuthService.getLoginHistory(req.user.client_id);
    }

    /**
     * POST /ims/auth/forgot-password
     * Sends password reset email. Public endpoint.
     */
    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.imsAuthService.forgotPassword(body.email);
    }

    /**
     * POST /ims/auth/reset-password
     * Resets password using token. Public endpoint.
     */
    @Public()
    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        return this.imsAuthService.resetPassword(body.token, body.newPassword);
    }

    /**
     * POST /ims/auth/change-password
     * Changes password for the logged-in user. Requires JWT.
     */
    @Post('change-password')
    async changePassword(
        @Req() req: any,
        @Body() body: { currentPassword: string; newPassword: string },
    ) {
        return this.imsAuthService.changePassword(req.user.client_id, body.currentPassword, body.newPassword);
    }
}
