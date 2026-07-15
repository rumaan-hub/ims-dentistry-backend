export function getSubscriptionPaymentConfirmationTemplate(
  client: any,
  planName: string,
  amount: number | string,
) {
  const fullName =
    `${client?.first_name ?? ''} ${client?.last_name ?? ''}`.trim() || 'there';
  const template = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #111;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="Dentistry99" width="130px" style="padding: 7px 15px;">

        <div style="background-color: #22c55e; text-align: center; border-radius: 10px; padding: 16px 0; margin: 2px 15px;">
          <p style="color: white; margin: 0; font-size: 18px; font-weight: 600;">Payment Confirmed</p>
        </div>

        <div style="padding: 8px 15px;">
          <p style="font-size: 15px;">Hi ${fullName},</p>
          <p style="font-size: 14px;">We&rsquo;ve received your payment &mdash; thank you! Your subscription checkout is complete and your 30-day free trial has started.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; font-weight: 600; color: #374151;">Plan</td>
              <td style="padding: 10px; color: #6b7280;">${planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; font-weight: 600; color: #374151;">Amount</td>
              <td style="padding: 10px; color: #6b7280;">$${amount}/month</td>
            </tr>
          </table>

          <p style="font-size: 14px;">Your account will be activated by an admin shortly. We&rsquo;ll let you know as soon as it&rsquo;s ready to use.</p>
          <p style="font-size: 13px; color: #666;">If you didn&rsquo;t make this purchase, please contact our support team right away.</p>
          <p style="margin-top: 20px; color: #111;">Best regards,<br>The Dentistry99 Team</p>
        </div>
      </div>
    `;
  return template;
}

export function otpEmailTemplate(otp: string) {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[HarazDentalGroup] Please verify Yourself</title>
</head>
<body style="font-family: Arial, sans-serif;">

    <p>Hey!,</p>

    <p>A sign in attempt requires further verification. To complete the sign in, enter the verification code.</p>

    <p>Verification code: ${otp}</p>


    <p>Best regards,</p>
    <p>HARAZ Dental Group<br>
    +1 559-554-9791</p>
     <img src="https://harazdentalmedia.s3.amazonaws.com/57b7e73b-8922-4a4a-923c-9c24100c6598-logo.png" alt="HARAZ Dental Group" width="200" height="auto" style="display: block; float: left;">
</body>
</html>
`;

  return template;
}

export function getForgotPasswordEmailTemplate(user: any, resetUrl: string) {
  const template = `
      <div>
        <p>Hello ${user?.firstName} ${user?.lastName},</p>
        <p>You've requested to reset your password. Please click the button below to proceed:</p>
        <div>
          <a href="${resetUrl}">Reset Password</a>
        </div>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <p>Best Regards,<br>The Dentistry99 Team</p>
      </div>
    `;
  return template;
}

export function getVerifyEmailTemplate(
  newUser: any,
  verificationLink: string,
  verificationToken: string
) {
  const template = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <img
    src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
    alt="" width="130px" style="padding: 7px 15px;">

<div style="background-color: #0a96d4;text-align: center;border-radius: 10px;padding: 10px 0px;margin: 2px 15px;">
  <img src='https://i.postimg.cc/8j7nFJpy/email-icon.png' width="100px" alt="">
  <p style="text-transform: capitalize;color: white;margin: 0px; text-align: center;font-size: 15px;">Thanks for Signing up!</p>
  <p style="color: white;margin: 0px;margin-top: 5px; text-align: center;font-size: 18px;font-weight: 600;">Verify Your E-mail Address</p>
</div>
<div style="padding: 2px 15px;">
    <p style="color: black;font-size: 15px;text-align: center;">Hi ${newUser?.firstName} ${newUser?.lastName},</p>
    <p style="color: black;font-size: 13px;text-align: center;">Thank you for signing up on our platform. To complete your registration, please verify your email address by clicking the button below:</p>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 10px;">
    <tr>
      <td align="center">
        <a href="${verificationLink}?token=${verificationToken}"
           style="
             background: linear-gradient(to left, #FE7151, #F0532F);
             border-radius: 5px;
             color: #ffffff;
             display: inline-block;
             font-size: 13px;
             font-weight: 400;
             line-height: 38px;
             text-align: center;
             text-decoration: none;
             height: 38px;
             width: 150px;
             font-family: Arial, sans-serif;
           ">
          Verify Email Address
        </a>
      </td>
    </tr>
  </table>
    <p style="color: black;font-size: 13px; margin-top: 0px;margin-bottom: 0px;text-align: center;">If you did not create an account with us, you can safely ignore this email.</p>
    <p style="color: black;font-size: 13px;margin-top: 0px;margin-bottom: 0px;text-align: center;">Best regards,<br/>
    The Dentistry99 Team</p>
</div>
    <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;margin-top: 10px;">
      <div style="padding-top: 5px;">
        <p
          style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
          Find us on</p>
         <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="https://facebook.com">
                      <img src="https://i.postimg.cc/TLQVd6K8/circle-Black-Facebook.png" alt="Facebook" width="30"
                        height="30" style="border-radius: 100%; display: block;">
                    </a>
                  </td>
                  <td style="width: 8px;"></td>
                  <td>
                    <a href="https://instagram.com">
                      <img src="https://i.postimg.cc/qh91VrSk/circle-Black-Instagram.png" alt="Instagram" width="30"
                        height="30" style="border-radius: 100%; display: block;">
                    </a>
                  </td>
                  <td style="width: 8px;"></td>
                  <td>
                    <a href="https://twitter.com">
                      <img src="https://i.postimg.cc/n9rTDzmY/twitter-ellipse.png" alt="Twitter" width="25" height="25"
                        style="border-radius: 100%; display: block; background: #000;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin-bottom: 0px; margin-top: 3px;color:black;text-align: center;">NOTE: This is an automiatically generated email,
          <span style="color: #0a96d4;">Please do not,</span>
        </p>
        <p style="margin-top: 5px;margin-bottom: 0px;color:black;text-align: center;">if you want to return items, please request a
          return and use
          Dentistry99 label. </p>
      </div>
      <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;color:black;">Please contact <a
          href="https://www.dentistry99.com/contactUs" style=" text-decoration: none; color:#0a96d4;">Contact Us</a>
        if you have any questions.</p>
      <div style="width: 100%;text-align: center;">
        <div style="font-size: 11px;display: inline-flex;">
          <a href="https://www.dentistry99.com/privacy-Policy" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black; padding-right: 10px;text-align: center;font-weight: 600;color:black;">
              Privacy & Cookie Policy </p>
          </a>
          <a href="https://www.dentistry99.com/terms-Conditions" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black;padding: 0px 10px;text-align: center;font-weight: 600;color:black;">
              Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
  </div>
      `;
  return template;
}

export function getVendorStripeAccountCreateTemplate(vendor: any) {
  const template = `
      <div>
        <h2>Your Stripe Account is Now Connected</h2>
        <p>Hello, ${vendor.firstName} ${vendor.lastName} </p>
        <p>We're pleased to inform you that your Stripe account has been successfully connected to our platform. You can now start accepting payments!</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Account Details:</strong></p>
            <ul>
                <li><strong>Account ID:</strong> ${vendor.delieryId}</li>
                <li><strong>Status:</strong> Connected and Active</li>
            </ul>
        </div>
        
        <p>With this connection established, you can:</p>
        <ul>
            <li>Accept credit card payments</li>
            <li>Receive payouts to your bank account</li>
            <li>View transaction history</li>
            <li>Manage your payment settings</li>
        </ul>
        
        <p>If you didn't authorize this connection or have any questions, please contact our support team immediately.</p>
        
        <p>Best regards,<br>
        The Denstistry99 Team</p>
    </div>
  `;
  return template;
}
export function getVendorStripeAccountDisconnectedTemplate(account: any) {
  const template = `
    <div>
      <h2 style="color: #d32f2f;">Stripe Connection Revoked</h2>
      <p>Hello,</p>
      
      <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
          <p><strong>Important Notice:</strong> The Stripe connection for your account (ID: ${account.id}) has been revoked.</p>
      </div>
      
      <p>This means:</p>
      <ul>
          <li>You can no longer accept payments through Dentistry99</li>
          <li>Any pending payouts will be processed according to Stripe's schedule</li>
          <li>Payment processing is temporarily disabled</li>
      </ul>
      
      <p><strong>To restore payment capabilities:</strong></p>
      <ol>
          <li>Log in to your Dentistry99 vendor dashboard</li>
          <li>Navigate to Payment Settings</li>
          <li>Reconnect your Stripe account</li>
      </ol>
      
      <p style="margin-top: 20px;">
        <a href="https://dentistry99.com/vendor/payments" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reconnect Your Account
        </a>
      </p>
      
      <p>If you believe this was done in error or need assistance, please contact our support team immediately at support@dentistry99.com.</p>
      
      <p>Best regards,<br>
      The Dentistry99 Team</p>
    </div>
  `;
  return template;
}
