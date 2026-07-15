import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateOfficeDto {
    @IsString() @IsNotEmpty() office_name: string;
    @IsString() @IsNotEmpty() address: string;

    /**
     * The IMS User (client) who owns this office.
     *
     * Sent explicitly by the frontend via useImsUser() — never typed manually.
     * Optional here so the service can still fall back to findFirst() during
     * development before JWT is connected (belt-and-suspenders safety).
     *
     * Once JWT is active: this will be populated from req.user.client_id and
     * the frontend can stop sending it (or keep sending it — it's validated either way).
     */
    @IsOptional() @IsUUID() client_id?: string;
}