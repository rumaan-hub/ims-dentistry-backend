import { IsNotEmpty, IsString, Matches } from "@nestjs/class-validator";

export class ResetPasswordDto {
	@IsNotEmpty()
	@IsString()
	oldPassword: string;

	@IsNotEmpty()
	@IsString()
	newPassword: string;

	@IsNotEmpty()
	@IsString()
	@Matches(
		/^(?=[A-Za-z0-9@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]+$)(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]).{8,}$/,
		{
			message:
				"Password should contain at least 8 characters with 1 special character and 1 number",
		}
	)
	confirmNewPassword: string;
}
