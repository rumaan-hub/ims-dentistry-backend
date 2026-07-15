import { format } from "path";

export function vendorBlockStatusEmail(
  firstName: string,
  lastName: string,
  reason?: string
) {
  const template = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; padding: 20px; }
          .container { max-width: 600px; background: #ffffff; padding: 20px; margin: 0 auto; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee; }
          .content { padding: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          .button { display: inline-block; background-color: #1d87da; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75" alt="Dentistry99 Logo" />
          </div>
          <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            <p>We regret to inform you that your vendor account on <strong>Dentistry99</strong> has been <strong>blocked</strong> due to compliance concerns.</p>
            <p><strong>Reason for Block:</strong> ${reason}</p>
            <p>If you believe this action was taken in error or require further clarification, please contact our support team.</p>
            <p style="text-align: center;">
              <a href="https://www.dentistry99.com" class="button">Contact Support</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return template;
}

export function vendorReSubmitStatusEmail(
  firstName: string,
  lastName: string,
  reason: string
) {
  const template = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background: #ffffff;
            padding: 20px;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #1d87da;
            color: #f1f1f1;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Action Required: Update Your Vendor Profile</h2>
          </div>
          
          <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Thank you for registering as a vendor on <strong>Dentistry99</strong>. After reviewing your application, we require some additional details or corrections before we can proceed.</p>
            
            <p><strong>Reason for Resubmission:</strong> ${reason}</p>

            <p>Please update your details and resubmit your application using the link below:</p>
            <p style="text-align: center;">
              <a href="${process.env.HOST_VENDOR_URL}/profile" class="button">Update & Resubmit</a>
            </p>

            <p>If you have any questions, feel free to contact our support team.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return template;
}

export function vendorRejectedStatusEmail(
  firstName: string,
  lastName: string,
  reason: string
) {
  const template = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          background: #ffffff;
          padding: 20px;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .header img {
          max-width: 150px;
        }
        .content {
          padding: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Action Required: Update Your Vendor Profile</h2>
        </div>
        
        <div class="content">
          <p>Dear ${firstName} ${lastName},</p>
          <p>We regret to inform you that your vendor profile registration has been <strong>rejected</strong>. Below is the reason provided:</p>
          <p><strong>Reason for reject:</strong> ${reason}</p>
          <p>To proceed, please review and update your profile with the necessary corrections and resubmit your application for further evaluation.</p>
          <p>Please update your details and resubmit your application using the link below:</p>
          <p style="text-align: center;">
            <a href="${process.env.HOST_VENDOR_URL}/profile" class="button">Update & Resubmit</a>
          </p>
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
  return template;
}

export function vendorPendingStatusEmail(firstName: string, lastName: string) {
  const template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              background: #ffffff;
              padding: 20px;
              margin: 0 auto;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .header img {
              max-width: 150px;
            }
            .content {
              padding: 20px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Thanks for your registiration</h2>
            </div>
            
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              <p>We are pleased to inform you that your vendor profile is currently under <strong>review</strong>. Our team is thoroughly assessing your application to ensure all requirements are met.</p>
              <p>You will receive an update on your application status shortly.</p>
              <p>For any urgent inquiries, please feel free to contact our support team.</p>
              <p>Thank you for your patience and cooperation.</p>
            </div>

            <div class="footer">
              <p>Best Regards,</p>
              <p><strong>Dentistry99 Team</strong></p>
              <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  return template;
}

export function vendorApprovedStatusEmail(firstName: string, lastName: string) {
  const template = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              background: #ffffff;
              padding: 20px;
              margin: 0 auto;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .header img {
              max-width: 150px;
            }
            .content {
              padding: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin: 20px 0;
              font-size: 16px;
              color: #fff;
              background-color: #28a745;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Congratulations</h2>
            </div>
            
            <div class="content">
              <p>Dear ${firstName} ${lastName},</p>
              <p>We are delighted to inform you that your vendor profile has been <strong>approved!</strong></p>
              <p>You now have full access to our platform and can start managing your services immediately.</p>
              <p>To get started, please log in to your account:</p>

              <p style="text-align: center;">
                <a href="${process.env.HOST_VENDOR_URL}/profile" class="button">Login to Your Account</a>
              </p>

              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>We are excited to have you on board and look forward to working with you.</p>
            </div>

            <div class="footer">
              <p>Best Regards,</p>
              <p><strong>Dentistry99 Team</strong></p>
              <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  return template;
}

export function vendorReSubmittedProfileEmailForAdmin(
  firstName: string,
  lastName: string,
  vendorId: string
) {
  const template = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear Admin,</p>

        <p>We would like to inform you that the vendor <strong>${firstName} ${lastName}</strong> (Vendor ID: <strong>${vendorId}</strong>) has resubmitted their profile for approval.</p>

        <p>As part of our quality assurance and compliance process, please review the updated details at your earliest convenience.</p>

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Review the updated vendor profile</li>
          <li>Verify any modifications made to the submitted information</li>
          <li>Approve or request further clarification if needed</li>
        </ul>

        <p>Best Regards,</p>
        <p><strong>Dentistry99 Team</strong></p>
      </body>
    </html>
  `;
  return template;
}

export function getProductRejectionEmail(
  firstName: string,
  lastName: string,
  reason: string
) {
  const template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h4>Hello ${firstName} ${lastName},</h4>
      <p>We regret to inform you that your product submission has been <strong style="color: red;">rejected</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please review the feedback and make necessary changes before resubmitting.</p>
      <p>For further assistance, feel free to reach out to our support team.</p>
      <br/>
      <h4>Best Regards,</h4>
      <p><strong>Dentistry99 Team</strong></p>
    </div>
  `;
  return template;
}

export function getProductApprovalEmail(
  firstName: string,
  lastName: string,
  productName: string
) {
  const template = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h4>Hello ${firstName} ${lastName},</h4>
      <p>We are pleased to inform you that your product <strong>${productName}</strong> has been <strong style="color: green;">approved</strong> and is now live on our platform.</p>
      <p>Customers can now view and purchase your product. We wish you great success in your sales!</p>
      <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
      <br/>
      <h4>Best Regards,</h4>
      <p><strong>Dentistry99 Team</strong></p>
    </div>
  `;
  return template;
}

export function getOrderEmailTemplateForVendor(order, vendor) {
  let totalSubTotal = 0;
  let totalDiscount = 0;
  let moreThanOne = false;
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  order.products.map((product: any) => {
    const price = parseFloat(product?.variant?.price || 0);
    const discount = parseFloat(product?.variant?.discount || 0);
    const isMoreThan = product?.variant?.product.length > 1;
    moreThanOne = isMoreThan;
    totalSubTotal += price;
    totalDiscount += discount;
  });
  const template = `
        <div style="font-family: Arial, sans-serif; color: #333;border-radius: 10px;background-color: #fff;font-weight: 300;">
    <div style="padding: 2px 10px;background-color:#FAFAFA; border-top-left-radius: 6px; border-top-right-radius: 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style=" height: 40px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
        <tr>
          <td align="left">
            <img
              src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
              alt="Dentistry99 Logo" width="83" style="display: block;">
          </td>
          <td align="right" style="font-size: 9px;color: #0A96D4;">
            ORDER ${order?.status}
          </td>
        </tr>
      </table>
    </div>
<div style="padding: 2px 15px;">
 <h2  style="color: #000; font-size: 11px;font-weight: 600;margin-bottom: 3px;">Dear ${vendor.firstName} ${vendor.lastName},</h2>
 <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 0px;margin-top: 0px;">
   We're happy to let you know that one or more of your products have been purchased on
   <strong style="color: #0a96d4;">Dentistry99</strong>.
   Below are the order details relevant to you.
 </p>
 <h3
        style="margin-top: 5px;font-size: 11px;color: #000;border-bottom: 1px solid #0A96D4; padding-bottom: 3px;margin-bottom: 8px;">
        Order Summary</h3>
      <div style="background-color:#FAFAFA;border-radius: 6px;padding: 2px 7px 7px 7px;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td align="left" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Order ID</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${order.orderNumber}</p>
            </td>
            <td align="right" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Purchase Date</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${formattedDate}</p>
            </td>
          </tr>
        </table>
      </div>
</div>
<h3 style="margin: 2px 15px 8px 15px; color: #000; border-bottom: 1px solid #0A96D4; padding-bottom: 3px; font-size: 11px; font-weight: 600;margin-top: 5px;">${moreThanOne ? "Products" : "Product"} Sold</h3>

${order.products
  .map(
    (product) => `
<div style="margin: 0 15px 5px 15px;">
<table cellpadding="0" cellspacing="0" border="0"
style=" border-bottom: 1px solid #e0e0e0;width: 100%; padding-bottom: 5px;">
<tr>
  <td width="60" valign="top" style="padding-right: 10px;">
     <img src="${product?.variant?.product?.images[0]}" alt="Dental Kit" width="60" height="60"
      style="border-radius: 6px; display: block;font-size: 9px;" />
  </td>
  <td valign="top">
    <table cellpadding="1" cellspacing="0" border="0">
      <tr>
        <td style="font-size: 11px; color: #007acc; font-weight: bold;">
          ${product.variant.product.title}
        </td>
      </tr>
      <tr>
        <td
          style="font-size: 9px; color: #000; max-width: 100px; overflow: hidden; text-overflow: ellipsis;white-space: nowrap;">
          ${product?.vendor?.firstName} ${product?.vendor?.lastName}
        </td>
      </tr>
      <tr>
        <td style="font-size: 9px; color: #000;">Qty: ${product.quantity}</td>
      </tr>
      <tr>
        <td style="font-size: 9px; font-weight: 600; color: #FA8232;">$${product.variant.discountedPrice}</td>
      </tr>
    </table>
  </td>
</tr>
</table>
</div>
`
  )
  .join("")}

<div style="padding: 2px 10px;">
  <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
    <tr>
      <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
        subTotal:
      </td>
      <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
        $${totalSubTotal}
      </td>
    </tr>
    <tr>
      <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
        Discount:
      </td>
      <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
        ${totalDiscount}%
      </td>
    </tr>
    <tr>
      <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
        Tax:
      </td>
      <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
        ${order?.tax}
      </td>
    </tr>
    <tr>
      <td align="left"
        style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
        Shipping:
      </td>
      <td align="right"
        style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
        ${order?.shippingTax ? order?.shippingTax : 0}
      </td>
    </tr>
    <tr style="border-top: 1px solid #E5E5E5;">
      <td align="left"
        style="width: 50%;color:#000;font-weight: 600; font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
        Total:
      </td>
      <td align="right"
        style="width: 50%;font-weight: 600; color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
        $${order.price + order.tax + order.shippingTax}
      </td>
    </tr>
  </table>
</div>
 <div style="padding: 2px 10px;">
      <table style="width: 100%; border-collapse: collapse; min-width: 280px;background-color: #FAFAFA; border-radius: 8px;padding: 5px 7px 5px 7px;">
        <tr>
          <td align="left" style="width: 50%;line-height: 13px; white-space: nowrap; margin-top: 0px;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
            <p style="width: 160px;text-align: left;margin-bottom: 0px;margin-top: 5px; padding-left: 5px;">
            Shipping Address
            </p>
          </td>
          <td align="right" style="width: 50%;line-height: 13px; white-space: nowrap;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
           <p style="width: 125px;text-align: left;margin-bottom: 0px;;margin-top: 5px;">
            Customer Contact
           </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 160px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order.address.officeName}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 125px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order.user.firstName}${order.user.lastName}
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 160px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.address.streetAddress}, ${order.address.building} 
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 125px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.user.email}
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 160px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.address.city} / ${order.address.state} / ${order.address.country ? order.address.country : "US"} / ${order.address.zipCode}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 125px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.user.officePhoneNo}
            </p>
          </td>
        </tr>
        </table>
    </div> 

<div style="padding: 2px 15px;">
 <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 0px;">
   Please prepare these items for shipping and update the tracking status in your vendor dashboard.
 </p>

 <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 0px;">If you have questions, contact
   <a href="mailto:support@dentistry99.com" style="color: #0a96d4;">support@dentistry99.com</a>.
 </p>

 <p style="color:#7D7D7D;font-size: 9px;margin: 0px;">Thank you for partnering with
   <strong style="color: #000;">Dentistry99</strong>!
 </p>
 <p style="color:#7D7D7D;font-size: 9px;margin-top: 3px;margin-bottom: 0px;">— The Dentistry99 Team</p>
 <p  style="font-size: 9px;margin-top: 3px;">
   <a href="https://www.dentistry99.com/" style="color: #0a96d4;">www.dentistry99.com</a>
 </p>
</div>

<div style="margin: 2px 10px;border-top:1px solid #E5E5E5;">
  <div style="display: flex; justify-content: start; align-items: start;">
    <div style="margin-top:7px;">
      <img src='https://i.postimg.cc/vcBCp3Jm/safe.png' width="12px" height="12px" alt=""
        style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
    </div>
    <div>
      <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Safe Payments</p>
      <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;;">your payment
        information is safe with us.
      </p>
      <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
        <span style="font-size: 9px; margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
        <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">
      </div>
    </div>
  </div>
  <div style="display: flex; justify-content: start; align-items: start;">
    <div style="margin-top:7px ;">
      <img src='https://i.postimg.cc/Sj7DDCjx/lock-icon.png' width="12px" height="12px" alt=""
        style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
    </div>
    <div>
      <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Secure Privacy</p>
      <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">
        We value your privacy. We neversell your data and only use it to improve our services, as outlined in our
        privacy policy.
      </p>
      <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
        <span style="font-size: 9px;margin-right: 4px;line-height: 8px;color: #0A96D4;">learn more</span>
        <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

      </div>
    </div>
  </div>

  <div style="display: flex; justify-content: start; align-items: start;">
    <div style="margin-top:7px;">
      <img src='https://i.postimg.cc/KkV2WYh0/return.png' width="12px" height="12px" alt=""
        style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
    </div>
    <div>
      <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Free Returns*</p>
      <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">we hope you love the
        items. you have purchased,
        but if you are not 100% satisfied, it is easy to return any eligible item in its original
        condition.
      </p>
      <div
        style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 5px; margin-bottom: 10px;">
        <span style="font-size: 9px;margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
        <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

      </div>
    </div>
  </div>
</div>
<div style="padding: 2px 10px;background-color: #FAFAFA;font-size: 9px;">
  <div style="padding-top: 5px;">
    <p
      style="color:black; font-size: 11px; text-align: center; margin-top: 0px;margin-bottom: 5px; font-weight: 600;">
      Find us on</p>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <a href="https://facebook.com">
                  <img src='https://i.postimg.cc/5YY7xh0t/facebook.png' alt="Facebook" width="25" height="25"
                    style="border-radius: 100%; display: block;">
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
                <a href="https://instagram.com">
                  <img src='https://i.postimg.cc/CRXhwTfx/twiter-icon.png' alt="Instagram" width="25" height="25"
                    style="border-radius: 100%; display: block;">
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin-bottom: 0px; margin-top: 3px;color:#7D7D7D;text-align: center;font-size: 9px;">NOTE: This is
      an
      automiatically generated email,
      <span style="color: #0a96d4;">Please do not reply,</span>
    </p>
    <p style="margin-top: 3px;margin-bottom: 0px;color:#7D7D7D;text-align: center;font-size: 9px;">if you want to
      return
      items, please request a return and use
      Dentistry99 label. </p>
  </div>
  <p
    style="margin-top: 3px; margin-bottom: 3px;text-align: center;color:#7D7D7D;text-align: center;font-size: 9px;">
    Please
    contact <a href="https://www.dentistry99.com/contactUs"
      style=" text-decoration: none; color:#0a96d4;text-align: center;font-size: 9px;">Contact Us</a> if you have
    any
    questions.</p>
  <div style="width: 100%;text-align: center;">
    <div style="font-size: 11px;display: inline-flex;text-align: center;">
      <a href="https://www.dentistry99.com/privacy-Policy" style="text-decoration: none; color:black;">
        <p
          style="border-right: 1px solid black;font-size: 9px; padding-right: 10px;text-align: center;font-weight: 600;color:black;margin-top: 5px;">
          Privacy & Cookie Policy </p>
      </a>
      <a href="https://www.dentistry99.com/terms-Conditions" style="text-decoration: none; color:black;">
        <p
          style="border-right: 1px solid black;padding: 0px 10px;text-align: center;font-weight: 600;color:black;font-size: 9px;margin-top: 5px;">
          Terms & Conditions </p>
      </a>
    </div>
  </div>
</div>
</div>
      `;
  return template;
}

export function getOrderEmailTemplateForUser(order: any) {
  let totalSubTotal = 0;
  let totalDiscount = 0;
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const regularProducts: any[] = order.products || [];
  const bundleItems: any[] = order.bundleItems || [];
  regularProducts.forEach((product: any) => {
    const price = parseFloat(product?.variant?.price || 0);
    const discountedPrice = parseFloat(product?.variant?.discountedPrice || 0);
    const effectivePrice = discountedPrice > 0 ? discountedPrice : price;
    totalSubTotal += effectivePrice * (product?.quantity || 1);
  });
  let bundleSavingsTotal = 0;
  bundleItems.forEach((bi: any) => {
    const paid = (bi.priceAtPurchase || bi.bundle?.bundlePrice || 0) * (bi.quantity || 1);
    const original = (bi.bundle?.originalPrice || 0) * (bi.quantity || 1);
    totalSubTotal += paid;
    bundleSavingsTotal += Math.max(0, original - paid);
  });
  const moreThanOne = regularProducts.length + bundleItems.length > 1;
  const promoCodeDiscount: number = Array.isArray(order?.promotionDiscount)
    ? order.promotionDiscount
        .filter((p: any) => p.promotionType === 'PROMO_CODE')
        .reduce((sum: number, p: any) => sum + (p.discount || 0), 0)
    : 0;
  const storewideDiscount: number = Array.isArray(order?.promotionDiscount)
    ? order.promotionDiscount
        .filter((p: any) => p.promotionType === 'STOREWIDE_DEAL')
        .reduce((sum: number, p: any) => sum + (p.discount || 0), 0)
    : 0;
  const template = `
      <div style="font-family: Arial, sans-serif; color: #333;border-radius: 10px;background-color: #fff;font-weight: 300;">
    <div style="padding: 2px 10px;background-color:#FAFAFA; border-top-left-radius: 6px; border-top-right-radius: 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style=" height: 40px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
        <tr>
          <td align="left">
            <img
              src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
              alt="Dentistry99 Logo" width="83" style="display: block;">
          </td>
          <td align="right" style="font-size: 9px;color: #0A96D4;">
            ORDER ${order?.status}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 2px 10px;">

      <h2 style="color: #000; font-size: 11px;font-weight: 600;margin-bottom: 3px;">Dear ${order?.user?.firstName} ${order?.user?.lastName},</h2>
      <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 0px;margin-top: 0px;">
        Thank you for your order on <strong style="color: #0a96d4;">Dentistry99</strong>! We're processing your order
        and will notify you once
        it's shipped.
      </p>
      <h3
        style="margin-top: 5px;font-size: 11px;color: #000;border-bottom: 1px solid #0A96D4; padding-bottom: 3px;margin-bottom: 8px;">
        Order Summary</h3>
      <div style="background-color:#FAFAFA;border-radius: 6px;padding: 2px 7px 7px 7px;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td align="left" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Order ID</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${order.orderNumber}</p>
            </td>
            <td align="right" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Purchase Date</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${formattedDate}</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <h3
      style="margin: 2px 15px 8px 15px; color: #000; border-bottom: 1px solid #0A96D4; padding-bottom: 3px; font-size: 11px; font-weight: 600;margin-top: 5px;">
      ${moreThanOne ? "Products" : "Product"}
    </h3>
    ${order.products
          .map(
            (product) => `
    <div style="margin: 0 15px 5px 15px;">
      <table cellpadding="0" cellspacing="0" border="0"
        style=" border-bottom: 1px solid #e0e0e0;width: 100%; padding-bottom: 5px;">
        <tr>
          <td width="60" valign="top" style="padding-right: 10px;">
             <img src="${product?.variant?.product?.images[0]}" alt="Dental Kit" width="60" height="60"
              style="border-radius: 6px; display: block;font-size: 9px;" />
          </td>
          <td valign="top">
            <table cellpadding="1" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 11px; color: #007acc; font-weight: bold;">
                  ${product?.variant?.product?.title}
                </td>
              </tr>
              <tr>
                <td
                  style="font-size: 9px; color: #000; max-width: 100px; overflow: hidden; text-overflow: ellipsis;white-space: nowrap;">
                  ${product?.vendor?.firstName} ${product?.vendor?.lastName}
                </td>
              </tr>
              <tr>
                <td style="font-size: 9px; color: #000;">Qty: ${product?.quantity}</td>
              </tr>
              <tr>
                <td style="font-size: 9px; font-weight: 600; color: #FA8232;">$${product.variant.price}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `
    ).join("")}

    ${bundleItems.length > 0 ? `
    <h3 style="margin: 2px 15px 8px 15px; color: #000; border-bottom: 1px solid #7B2FF7; padding-bottom: 3px; font-size: 11px; font-weight: 600; margin-top: 5px;">
      Bundle Deal${bundleItems.length > 1 ? 's' : ''}
    </h3>
    ${bundleItems.map((bi: any) => `
    <div style="margin: 0 15px 5px 15px;">
      <table cellpadding="0" cellspacing="0" border="0"
        style="border-bottom: 1px solid #e0e0e0; width: 100%; padding-bottom: 5px;">
        <tr>
          <td width="60" valign="top" style="padding-right: 10px;">
            ${bi.bundle?.images?.[0] ? `<img src="${bi.bundle.images[0]}" alt="Bundle" width="60" height="60" style="border-radius: 6px; display: block; font-size: 9px; object-fit: cover;" />` : `<div style="width:60px;height:60px;background-color:#f0e6ff;border-radius:6px;display:flex;align-items:center;justify-content:center;"><span style="font-size:9px;color:#7B2FF7;">Bundle</span></div>`}
          </td>
          <td valign="top">
            <table cellpadding="1" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 11px; color: #7B2FF7; font-weight: bold;">
                  ${bi.bundle?.title || 'Bundle Deal'}
                </td>
              </tr>
              ${bi.bundle?.label ? `<tr><td style="font-size: 9px; color: #ADADAD;">${bi.bundle.label}</td></tr>` : ''}
              <tr>
                <td style="font-size: 9px; color: #000;">Qty: ${bi.quantity || 1}</td>
              </tr>
              <tr>
                <td style="font-size: 9px; font-weight: 600; color: #FA8232;">$${(bi.priceAtPurchase || bi.bundle?.bundlePrice || 0).toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `).join('')}
    ` : ''}

    <div style="padding: 2px 10px;">
      <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            subTotal:
          </td>
          <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
            $${totalSubTotal.toFixed(2)}
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            Tax:
          </td>
          <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
            $${(order?.tax || 0).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td align="left"
            style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            Shipping:
          </td>
          <td align="right"
            style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            $${(order?.shippingTax || 0).toFixed(2)}
          </td>
        </tr>
        ${storewideDiscount > 0 ? `
        <tr>
          <td align="left" style="width: 50%;color:#25C077;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            Bundle Discount:
          </td>
          <td align="right" style="width: 50%;color:#25C077;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            -$${storewideDiscount.toFixed(2)}
          </td>
        </tr>` : ''}
        ${promoCodeDiscount > 0 ? `
        <tr>
          <td align="left" style="width: 50%;color:#007D1B;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            Promo Discount:
          </td>
          <td align="right" style="width: 50%;color:#007D1B;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            -$${promoCodeDiscount.toFixed(2)}
          </td>
        </tr>` : ''}
        ${bundleSavingsTotal > 0 ? `
        <tr>
          <td align="left" style="width: 50%;color:#25C077;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            Bundle Savings:
          </td>
          <td align="right" style="width: 50%;color:#25C077;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            -$${bundleSavingsTotal.toFixed(2)}
          </td>
        </tr>` : ''}
        <tr style="border-top: 1px solid #E5E5E5;">
          <td align="left"
            style="width: 50%;color:#000;font-weight: 600; font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
            Total:
          </td>
          <td align="right"
            style="width: 50%;font-weight: 600; color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
            $${Math.max(0, totalSubTotal + (order.tax || 0) + (order?.shippingTax || 0) - promoCodeDiscount - storewideDiscount).toFixed(2)}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 2px 10px;">
      <p
        style="margin-top: 5px;margin-bottom: 9px; color: #000;border-bottom: 1px solid #0A96D4;padding-bottom: 3px;font-size: 11px;font-weight: 600;">
       Customer Information
      </p>

      <table style="width: 100%; border-collapse: collapse; min-width: 280px;background-color: #FAFAFA; border-radius: 8px;padding: 5px 7px 5px 7px;">
        <tr>
          <td align="left" style="width: 50%;line-height: 13px; white-space: nowrap; margin-top: 0px;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
            <p style="width: 140px;text-align: left;margin-bottom: 0px;margin-top: 5px; padding-left: 5px;">
            Shipping Address
            </p>
          </td>
          <td align="right" style="width: 50%;line-height: 13px; white-space: nowrap;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
           <p style="width: 140px;text-align: left;margin-bottom: 0px;;margin-top: 5px;">
            Billing Address
           </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order.address.officeName}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order.billingDetails.name}
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.address.streetAddress}, ${order.address.building} 
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.billingDetails.address.line1}, ${order.billingDetails.address.line2} 
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.address.city} / ${order.address.state} / ${order.address.country ? order.address.country : "US"} / ${order.address.zipCode}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.billingDetails.address.city} / ${order.billingDetails.address.state} / ${order.billingDetails.address.country ? order.billingDetails.address.country : "US"} / ${order.billingDetails.address.postal_code}
            </p>
          </td>
        </tr>
        </table>
    </div> 
    <div style="padding: 2px 10px;">
      <p
      style="margin-top: 5px;margin-bottom: 9px; color: #000;border-bottom: 1px solid #0A96D4;padding-bottom: 3px;font-size: 11px;font-weight: 600;">
     Payment Method
    </p>
    <div style="display: inline-flex;">
    <img src=${`https://img.icons8.com/color/48/${order.billingDetails.cardBrand}.png`} height="20px" width="34px" style="border-radius: 5px; object-fit: cover" />
    <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 5px;margin-left: 6px;">${order.billingDetails.cardNumber}</p>
  </div>
    </div>
    <div style="padding: 2px 10px;">
      <h3 style="color:#000;font-size: 11px;margin-top: 3px;margin-bottom: 3px;">Need Help?</h3>
      <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 0px;">If you have any questions or need
        support, feel free to
        contact us at <a href="mailto:support@dentistry99.com" style="color:#0a96d4;">support@dentistry99.com</a>.</p>

      <p style="color:#7D7D7D;font-size: 9px;margin: 0px;">Thank you for choosing <strong
          style="color: #000;">Dentistry99</strong>!</p>
      <p style="color:#7D7D7D;font-size: 9px;margin-top: 3px;margin-bottom: 0px;">— The Dentistry99 Team</p>
      <p style="font-size: 9px;margin-top: 3px;">
        <a href="https://www.dentistry99.com/" style="color:#0a96d4;">www.dentistry99.com</a>
      </p>
    </div>
    <div style=" margin: 2px 10px;border-top:1px solid #E5E5E5;">
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px;">
          <img src='https://i.postimg.cc/vcBCp3Jm/safe.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Safe Payments</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;;">your payment
            information is safe with us.
          </p>
          <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
            <span style="font-size: 9px; margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">
          </div>
        </div>
      </div>
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px ;">
          <img src='https://i.postimg.cc/Sj7DDCjx/lock-icon.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Secure Privacy</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">
            We value your privacy. We neversell your data and only use it to improve our services, as outlined in our
            privacy policy.
          </p>
          <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
            <span style="font-size: 9px;margin-right: 4px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px;">
          <img src='https://i.postimg.cc/KkV2WYh0/return.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Free Returns*</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">we hope you love the
            items. you have purchased,
            but if you are not 100% satisfied, it is easy to return any eligible item in its original
            condition.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 5px; margin-bottom: 10px;">
            <span style="font-size: 9px;margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

          </div>
        </div>
      </div>
    </div>
    <div style=" padding: 2px 10px;background-color: #FAFAFA;font-size: 9px;">
      <div style="padding-top: 5px;">
        <p
          style="color:black; font-size: 11px; text-align: center; margin-top: 0px;margin-bottom: 5px; font-weight: 600;">
          Find us on</p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="https://facebook.com">
                      <img src='https://i.postimg.cc/5YY7xh0t/facebook.png' alt="Facebook" width="25" height="25"
                        style="border-radius: 100%; display: block;">
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
                    <a href="https://instagram.com">
                      <img src='https://i.postimg.cc/CRXhwTfx/twiter-icon.png' alt="Instagram" width="25" height="25"
                        style="border-radius: 100%; display: block;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin-bottom: 0px; margin-top: 3px;color:#7D7D7D;text-align: center;font-size: 9px;">NOTE: This is
          an
          automiatically generated email,
          <span style="color: #0a96d4;">Please do not reply,</span>
        </p>
        <p style="margin-top: 3px;margin-bottom: 0px;color:#7D7D7D;text-align: center;font-size: 9px;">if you want to
          return
          items, please request a return and use
          Dentistry99 label. </p>
      </div>
      <p
        style="margin-top: 3px; margin-bottom: 3px;text-align: center;color:#7D7D7D;text-align: center;font-size: 9px;">
        Please
        contact <a href="https://www.dentistry99.com/contactUs"
          style=" text-decoration: none; color:#0a96d4;text-align: center;font-size: 9px;">Contact Us</a> if you have
        any
        questions.</p>
      <div style="width: 100%;text-align: center;">
        <div style="font-size: 11px;display: inline-flex;text-align: center;">
          <a href="https://www.dentistry99.com/privacy-Policy" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black;font-size: 9px; padding-right: 10px;text-align: center;font-weight: 600;color:black;margin-top: 5px;">
              Privacy & Cookie Policy </p>
          </a>
          <a href="https://www.dentistry99.com/terms-Conditions" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black;padding: 0px 10px;text-align: center;font-weight: 600;color:black;font-size: 9px;margin-top: 5px;">
              Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
  </div>
  `
  return template;
}

export function getOrderEmailTemplateForUserInprogress(order: any, status: any) {
  let totalSubTotal = 0;
  let totalAfterDiscount = 0;
  let totalDiscount = 0;
  let moreThanOne = false;
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let productSnapshots: any[] = [];
  order.products
    .map((product: any) => {
      const price = parseFloat(product?.variant?.price || 0);
      const discountedPrice = parseFloat(product?.variant?.discountedPrice || 0);
      const discount = parseFloat(product?.variant?.discount || 0);
      const isMoreThan = product?.variant?.product.length > 1;
      moreThanOne = isMoreThan;
      totalSubTotal += price;
      totalAfterDiscount += discountedPrice;
      totalDiscount += discount;
      if (Array.isArray(product?.productSnapshot)) {
        productSnapshots.push(...product.productSnapshot);
      } else if (product?.productSnapshot) {
        productSnapshots.push(product.productSnapshot);
      }
    });
  const template = `
      <div style="font-family: Arial, sans-serif; color: #333;border-radius: 10px;background-color: #fff;font-weight: 300;">
    <div style="padding: 2px 10px;background-color:#FAFAFA; border-top-left-radius: 6px; border-top-right-radius: 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style=" height: 40px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
        <tr>
          <td align="left">
            <img
              src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
              alt="Dentistry99 Logo" width="83" style="display: block;">
          </td>
          <td align="right" style="font-size: 9px;color: #0A96D4;">
            ORDER ${status}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 2px 10px;">

      <h2 style="color: #000; font-size: 11px;font-weight: 600;margin-bottom: 3px;">Dear ${order?.user?.firstName} ${order?.user?.lastName},</h2>
      <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 0px;margin-top: 0px;">
        ${
          status === "INPROGRESS" ? "Great news! Your order is now being processed. Our team is working diligently to prepare your items for packing."
            : status === "PACKED" ? "Your order has been successfully packed and is now ready to be shipped. We're doing a final check to ensure everything is perfect."
            : status === "SHIPPED" ? "Your order has been shipped and is on its way to you. We hope you're as excited as we are!"
            : status === "DELIVERED" ? "Your order has been successfully delivered. We hope everything arrived in perfect condition!"
            : status === "CANCELED" ? "This email confirms that your cancellation request has been received and is currently being processed."
            : ""
        }
      </p>
      <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 0px;margin-top: 0px;">
        ${
          status === "INPROGRESS" ? "You’ll receive another update once your order has been packed and is ready for shipment."
            : status === "PACKED" ? "We'll notify you with tracking details as soon as your order has been shipped."
            : status === "SHIPPED" ? "Your tracking number is <strong>${order.trackingNo}</strong>. You can use this to track your package in real time."
            : status === "DELIVERED" ? "Thank you for choosing <strong style=\"color: #0a96d4;\">Dentistry99</strong>. We look forward to serving you again soon."
            : status === "CANCELED" ? "We are in the process of reversing any payments made. A confirmation will be sent to you once the cancellation is finalized."
            : ""
        }
      </p>
      <h3
        style="margin-top: 5px;font-size: 11px;color: #000;border-bottom: 1px solid #0A96D4; padding-bottom: 3px;margin-bottom: 8px;">
        Order Summary</h3>
      <div style="background-color:#FAFAFA;border-radius: 6px;padding: 2px 7px 7px 7px;">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td align="left" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Order ID</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${order.orderNumber}</p>
            </td>
            <td align="right" style="width: 50%;">
              <span style="color: #7D7D7D;font-size: 10px;">Purchase Date</span><br>
              <p style="margin: 0;color: #000;font-weight: 600;font-size: 9px;">${formattedDate}</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <h3
      style="margin: 2px 15px 8px 15px; color: #000; border-bottom: 1px solid #0A96D4; padding-bottom: 3px; font-size: 11px; font-weight: 600;margin-top: 5px;">
      ${moreThanOne ? "Products" : "Product"}
    </h3>
    ${productSnapshots
          .map(
            (product) => `
    <div style="margin: 0 15px 5px 15px;">
      <table cellpadding="0" cellspacing="0" border="0"
        style=" border-bottom: 1px solid #e0e0e0;width: 100%; padding-bottom: 5px;">
        <tr>
          <td width="60" valign="top" style="padding-right: 10px;">
             <img src="${product?.variant?.product?.images[0]}" alt="Dental Kit" width="60" height="60"
              style="border-radius: 6px; display: block;font-size: 9px;" />
          </td>
          <td valign="top">
            <table cellpadding="1" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 11px; color: #007acc; font-weight: bold;">
                  ${product?.variant?.product?.title}
                </td>
              </tr>
              <tr>
                <td
                  style="font-size: 9px; color: #000; max-width: 100px; overflow: hidden; text-overflow: ellipsis;white-space: nowrap;">
                  ${product?.variant.product.vendor?.firstName} ${product?.variant.product.vendor?.lastName}
                </td>
              </tr>
              <tr>
                <td style="font-size: 9px; color: #000;">Qty: ${product?.quantity}</td>
              </tr>
              <tr>
                <td style="font-size: 9px; font-weight: 600; color: #FA8232;">$${product.variant.price}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `
    ).join("")}
    
    <div style="padding: 2px 10px;">
      <table style="width: 100%; border-collapse: collapse; min-width: 280px;">
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            subTotal:
          </td>
          <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
            $${totalSubTotal}
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            Discount:
          </td>
          <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
            ${totalDiscount}%
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            Tax:
          </td>
          <td align="right" style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;">
            ${order?.tax}
          </td>
        </tr>
        <tr>
          <td align="left"
            style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            Shipping:
          </td>
          <td align="right"
            style="width: 50%;color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-bottom: 4px;">
            ${order?.shippingTax ? order?.shippingTax : 0}
          </td>
        </tr>
        <tr style="border-top: 1px solid #E5E5E5;">
          <td align="left"
            style="width: 50%;color:#000;font-weight: 600; font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
            Total:
          </td>
          <td align="right"
            style="width: 50%;font-weight: 600; color:#7D7D7D;font-size:9px; line-height: 13px; white-space: nowrap;padding-top: 4px;">
            $${(totalAfterDiscount + order.tax + order.shippingTax).toFixed(2)}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 2px 10px;">
      <p
        style="margin-top: 5px;margin-bottom: 9px; color: #000;border-bottom: 1px solid #0A96D4;padding-bottom: 3px;font-size: 11px;font-weight: 600;">
       Customer Information
      </p>

      <table style="width: 100%; border-collapse: collapse; min-width: 280px;background-color: #FAFAFA; border-radius: 8px;padding: 5px 7px 5px 7px;">
        <tr>
          <td align="left" style="width: 50%;line-height: 13px; white-space: nowrap; margin-top: 0px;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
            <p style="width: 140px;text-align: left;margin-bottom: 0px;margin-top: 5px; padding-left: 5px;">
            Shipping Address
            </p>
          </td>
          <td align="right" style="width: 50%;line-height: 13px; white-space: nowrap;margin-bottom: 0px; color: #000;font-size: 10px;font-weight: 600;">
           <p style="width: 140px;text-align: left;margin-bottom: 0px;;margin-top: 5px;">
            Billing Address
           </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order?.userSnapshot?.address?.officeName}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px; margin-bottom: 0px;margin-top: 0px;">
              ${order.billingDetails.name}
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.userSnapshot.address.streetAddress}, ${order.userSnapshot.address.building} 
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left;padding-left: 5px;margin-bottom: 0px;margin-top: 0px;">
              ${order.billingDetails.address.line1}, ${order.billingDetails.address.line2} 
            </p>
          </td>
        </tr>
        <tr>
          <td align="left" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.userSnapshot.address.city} / ${order.userSnapshot.address.state} / ${order.userSnapshot.address.country ? order.userSnapshot.address.country : "US"} / ${order.userSnapshot.address.zipCode}
            </p>
          </td>
          <td align="right" style="width: 50%;color:#000;font-size:9px; line-height: 13px; white-space: nowrap;">
            <p style="width: 140px;text-align: left; padding-left: 5px;margin-bottom: 5px;margin-top: 0px;">
              ${order.billingDetails.address.city} / ${order.billingDetails.address.state} / ${order.billingDetails.address.country ? order.billingDetails.address.country : "US"} / ${order.billingDetails.address.postal_code}
            </p>
          </td>
        </tr>
        </table>
    </div> 
    <div style="padding: 2px 10px;">
      <p
      style="margin-top: 5px;margin-bottom: 9px; color: #000;border-bottom: 1px solid #0A96D4;padding-bottom: 3px;font-size: 11px;font-weight: 600;">
     Payment Method
    </p>
    <div style="display: inline-flex;">
    <img src=${`https://img.icons8.com/color/48/${order.billingDetails.cardBrand}.png`} height="20px" width="34px" style="border-radius: 5px; object-fit: cover" />
    <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 5px;margin-left: 6px;">${order.billingDetails.cardNumber}</p>
  </div>
    </div>
    <div style="padding: 2px 10px;">
      <h3 style="color:#000;font-size: 11px;margin-top: 3px;margin-bottom: 3px;">Need Help?</h3>
      <p style="color:#7D7D7D;font-size: 9px;margin-bottom: 5px;margin-top: 0px;">If you have any questions or need
        support, feel free to
        contact us at <a href="mailto:support@dentistry99.com" style="color:#0a96d4;">support@dentistry99.com</a>.</p>

      <p style="color:#7D7D7D;font-size: 9px;margin: 0px;">Thank you for choosing <strong
          style="color: #000;">Dentistry99</strong>!</p>
      <p style="color:#7D7D7D;font-size: 9px;margin-top: 3px;margin-bottom: 0px;">— The Dentistry99 Team</p>
      <p style="font-size: 9px;margin-top: 3px;">
        <a href="https://www.dentistry99.com/" style="color:#0a96d4;">www.dentistry99.com</a>
      </p>
    </div>
    <div style=" margin: 2px 10px;border-top:1px solid #E5E5E5;">
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px;">
          <img src='https://i.postimg.cc/vcBCp3Jm/safe.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Safe Payments</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;;">your payment
            information is safe with us.
          </p>
          <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
            <span style="font-size: 9px; margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">
          </div>
        </div>
      </div>
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px ;">
          <img src='https://i.postimg.cc/Sj7DDCjx/lock-icon.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Secure Privacy</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">
            We value your privacy. We neversell your data and only use it to improve our services, as outlined in our
            privacy policy.
          </p>
          <div style="display: flex; justify-content: start; align-items: center; margin-top: 5px; ">
            <span style="font-size: 9px;margin-right: 4px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:7px;">
          <img src='https://i.postimg.cc/KkV2WYh0/return.png' width="12px" height="12px" alt=""
            style="margin-right: 5px;background-color: #0A96D41A;padding: 4px;border-radius: 100%;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color:#000;font-size: 11px;">Free Returns*</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 9px;color:#7D7D7D;">we hope you love the
            items. you have purchased,
            but if you are not 100% satisfied, it is easy to return any eligible item in its original
            condition.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 5px; margin-bottom: 10px;">
            <span style="font-size: 9px;margin-right: 2px;line-height: 8px;color: #0A96D4;">learn more</span>
            <img src='https://i.postimg.cc/qhKFcNKr/arrow.png' width="9px" height="9px" alt="">

          </div>
        </div>
      </div>
    </div>
    <div style=" padding: 2px 10px;background-color: #FAFAFA;font-size: 9px;">
      <div style="padding-top: 5px;">
        <p
          style="color:black; font-size: 11px; text-align: center; margin-top: 0px;margin-bottom: 5px; font-weight: 600;">
          Find us on</p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="https://facebook.com">
                      <img src='https://i.postimg.cc/5YY7xh0t/facebook.png' alt="Facebook" width="25" height="25"
                        style="border-radius: 100%; display: block;">
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
                    <a href="https://instagram.com">
                      <img src='https://i.postimg.cc/CRXhwTfx/twiter-icon.png' alt="Instagram" width="25" height="25"
                        style="border-radius: 100%; display: block;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin-bottom: 0px; margin-top: 3px;color:#7D7D7D;text-align: center;font-size: 9px;">NOTE: This is
          an
          automiatically generated email,
          <span style="color: #0a96d4;">Please do not reply,</span>
        </p>
        <p style="margin-top: 3px;margin-bottom: 0px;color:#7D7D7D;text-align: center;font-size: 9px;">if you want to
          return
          items, please request a return and use
          Dentistry99 label. </p>
      </div>
      <p
        style="margin-top: 3px; margin-bottom: 3px;text-align: center;color:#7D7D7D;text-align: center;font-size: 9px;">
        Please
        contact <a href="https://www.dentistry99.com/contactUs"
          style=" text-decoration: none; color:#0a96d4;text-align: center;font-size: 9px;">Contact Us</a> if you have
        any
        questions.</p>
      <div style="width: 100%;text-align: center;">
        <div style="font-size: 11px;display: inline-flex;text-align: center;">
          <a href="https://www.dentistry99.com/privacy-Policy" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black;font-size: 9px; padding-right: 10px;text-align: center;font-weight: 600;color:black;margin-top: 5px;">
              Privacy & Cookie Policy </p>
          </a>
          <a href="https://www.dentistry99.com/terms-Conditions" style="text-decoration: none; color:black;">
            <p
              style="border-right: 1px solid black;padding: 0px 10px;text-align: center;font-weight: 600;color:black;font-size: 9px;margin-top: 5px;">
              Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
  </div>
  `
  return template;
}

export function orderStatusInProgressEmailTemplate(order: any) {
  const template = `
        <div>
    <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
    <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your Order Is
      Being Processed - <span style="font-weight: 600;">Order #12345 </span> </p>
    <table style="width: 100%; background-color: white; padding: 2px 15px; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 10px;">
          <img
            src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
            alt="" width="130px">
        </td>
        <td style="width: 50%; padding: 10px; text-align: right; vertical-align: middle;">
          <p style="font-size: 13px; margin: 0;color:black;">Your order is in progress!</p>
        </td>
      </tr>
    </table>

    <div style="padding: 2px 15px;">
      <p style="margin-bottom: 0px; font-weight: 300;color:black;">Dear ${order.user?.firstName} ${order.user.lastName}, We're excited to let you know that your order (${order.id})
        is being processed. Our team is working hard to ensure everything is ready for shipment as soon as possible.</p>
      <p style="margin-top: 10px;margin-bottom: 0px;color:black;">Once your order is ready to ship, we'll send you another email
        with tracking information.</p>
    </div>

    <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
      <div style="width: 100%;">
        <p style="color:gray;font-weight: 600;color:black;">Order ID: <span style="font-weight: 300;">(${order.id})</span></p>
        ${order.products?.map(
          (product) => `
          <table style="width: 100%; margin-bottom: 15px; border-collapse: collapse;">
            <tr>
              <td style="width: 70%; padding: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 70px; padding-right: 10px;">
                      <img src="${product.variant.product.images[0]}" alt="" height="70px" width="70px" style="border-radius: 5px;">
                    </td>
                    <td>
                      <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;color:black;">
                        Product Name</p>
                      <p style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${product.variant.product.title}</p>
                      <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">Brand: ${product?.variant?.product?.brand}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`
        )}
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0;">
            <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%;">
                  <table style="border-collapse: collapse;">
                    <tr>
                      <td style="padding-right: 10px;">
                        <img src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                          width="60px" height="40px" alt="" style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
                      </td>
                      <td>
                        <p style="margin: 0;color:black;">visa...2499</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 50%; text-align: right;">
                  <p style="margin: 0;color:black;">$ ${order.price}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #f6f4f4; padding: 10px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: gray;">item(s) total:</td>
                <td style="text-align: right; color: gray;">$ <span>${order.price}</span></td>
              </tr>
              <tr>
                <td style="color: gray;">item(s) discount:</td>
                <td style="text-align: right; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></td>
              </tr>
               <tr>
                <td style="color: gray;">item(s) tax:</td>
                <td style="text-align: right; color: orange;">$ <span>${order.tax ? order.tax : "0"}</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #f6f4f4; padding: 10px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: gray;">shippingTax:</td>
                <td style="text-align: right; color: rgb(63, 185, 49);">${order.shippingTax ? order.shippingTax : "Free"}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #f6f4f4; padding: 10px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: rgb(42, 42, 42); font-weight: 600;">Order Total:</td>
                <td style="text-align: right; color: rgb(42, 42, 42); font-weight: 600;">$ <span>${order.price + order.tax + order.shippingTax}</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <table style="width: 100%; border-collapse: collapse;">
            ${
              order.discount > 0
                ? `<tr>
              <td style="color: orange; font-weight: 500;">Your saved:</td>
              <td style="text-align: right; color: orange; font-weight: 500;">$ <span>${order.discount ? order.discount : "0"}</span></td>
            </tr>`
                : ""
            }
            </table>
          </td>
        </tr>
      </table>
    </div>

    <div  style="padding: 2px 15px;">
<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
  <tr>
    <td style="padding: 0px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="color: black;">
         <p style="font-weight: 600; margin-bottom: 5px;margin-bottom: 0px;"> 
           Shipping Address:
           </p>
        </tr>
        <tr>
          <td style="color: black;">Office Name:</td>
          <td style="text-align: right; color: gray;">abc</td>
        </tr>
        <tr>
          <td style="color: black;">Street Address:</td>
          <td style="text-align: right; color: gray;">822 E. 20th Street</td>
        </tr>
         <tr>
          <td style="color: black;">Building:</td>
          <td style="text-align: right; color: gray;">822 E. 20th Street</td>
        </tr>
        <tr>
          <td style="color: black;">City:</td>
          <td style="text-align: right; color: gray;">Los Angeles</td>
        </tr>
        <tr>
          <td style="color: black;">Country:</td>
          <td style="text-align: right; color: gray;">null</td>
        </tr>
         <tr>
          <td style="color: black;">Zip Code:</td>
          <td style="text-align: right; color: gray;">90011</td>
        </tr>
        <tr>
          <td style="color: black;">State:</td>
          <td style="text-align: right; color: gray;">CA</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</div>
   
        <div style="padding: 2px 15px;">
      <p style="text-align: center;color:black;">Have Questions or need help?</p>
      <table style="margin: 0 auto;">
        <tr>
          <td>
            <button
              style="padding: 7px 15px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: inline-flex;margin-right: 10px;">
              <img src='https://i.postimg.cc/5jhhvxhB/return-icon.png'
              width="15px" alt="">
              <span style="font-size: 12px;font-weight: 400;margin-left:5px;">Return</span>
            </button>
          </td>
          <td>
            <button
              style="padding: 7px 15px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: inline-flex;">
              <img
                src='https://i.postimg.cc/XZKqMH9h/support.png'
                width="15px" alt="">
              <span style="font-size: 12px;font-weight: 400;margin-left: 5px;">Support</span>
            </button>
          </td>
        </tr>
      </table>
    </div>

     <div style=" padding: 2px 15px;">
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:13px ;">
          <img
            src='https://i.postimg.cc/vcBCp3Jm/safe.png'
            width="20px" height="20px" alt="" style="margin-right: 5px;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color: black;">Safe Payments</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 12px;color: black;">your payment information is safe with us.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 0px; ">
            <span style="font-size: 12px; margin-right: 2px;line-height: 25px;">learn more</span>
            <img
              src='https://i.postimg.cc/PPz8nqhK/right-arrow.png'
              width="25px" alt="" >

          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:13px ;">
          <img
            src='https://i.postimg.cc/pyg16RJs/date-encrypt.png' 
            width="20px" height="20px" alt="" style="margin-right: 5px;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color: black;">Data Encryption</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 12px;color: black;">Dentistry protects your address
            information,ensuring its privacy and security. All address data is encrypted.
          </p>
        </div>
      </div>

      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:13px ;">
          <img
            src='https://i.postimg.cc/Sj7DDCjx/lock-icon.png' 
            width="20px" height="20px" alt="" style="margin-right: 5px;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color: black;">Secure Privacy</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 12px;color: black;">Protecting your privacy is important to us!
            Please be assured and uncompromised. we do not sell your personal information for money and will only use
            your information in accordance with our privacy and cookie policy to provide and improve our services to
            you.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 0px; ">
            <span style="font-size: 12px;margin-right: 2px;line-height: 25px;">learn more</span>
            <img
              src='https://i.postimg.cc/PPz8nqhK/right-arrow.png'
              width="25px" alt="">

          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:13px ;">
          <img
            src='https://i.postimg.cc/7511XyKJ/cart-icon.png' 
            width="20px" height="20px" alt="" style="margin-right: 5px;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color: black;">Purchase Protection</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 12px;color: black;">Shop confidently on Dentistry99 knowing if
            something goes wrong with an order, we've got your back.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center;color: gray; margin-top: 0px; ">
            <span style="font-size: 12px;margin-right: 2px;line-height: 25px;">learn more</span>
            <img
              src='https://i.postimg.cc/PPz8nqhK/right-arrow.png'
              width="25px" alt="">

          </div>
        </div>
      </div>
      <div style="display: flex; justify-content: start; align-items: start;">
        <div style="margin-top:13px ;">
          <img
            src='https://i.postimg.cc/3WwLRWnS/free-return.png'
            width="20px" height="20px" alt="" style="margin-right: 5px;">
        </div>
        <div>
          <p style="margin-bottom: 0px; font-weight: 600;color: black;">Free Returns*</p>
          <p style="margin-bottom: 0px;margin-top: 3px;font-size: 12px;color: black;">we hope you love the items. you have purchased,
            but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
          </p>
          <div
            style="display: flex; justify-content: start; align-items: center; color: gray; margin-top: 0px; margin-bottom: 10px;">
            <span style="font-size: 12px;margin-right: 2px;line-height: 25px;">learn more</span>
            <img
              src='https://i.postimg.cc/PPz8nqhK/right-arrow.png'
              width="25px" alt="">

          </div>
        </div>
      </div>
    </div>
     <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
      <div style="padding-top: 5px;">
        <p
          style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
          Find us on</p>
        <div style="display: flex; justify-content: center; align-items: center;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px" height="25px"
            style="border-radius: 100%;">
          <img
            src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
            width="25px" height="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
          <img
            src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
            width="25px" height="25px"alt="" style="border-radius: 100%;margin-left: 8px;">
        </div>
        <p style="margin-bottom: 0px; margin-top: 3px;color:black;">NOTE: This is an automiatically generated email,
          <span style="color: #0a96d4;">Please do not,</span>
        </p>
        <p style="margin-top: 5px;margin-bottom: 0px;color:black;">if you want to return items, please request a return and use
          Dentistry99 label. </p>
      </div>
      <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;color:black;">Please contact <a href="https://www.dentistry99.com/contactUs"
          style=" text-decoration: none; color:#0a96d4;">Contact Us</a> if you have any questions.</p>
      <div style="width: 100%;text-align: center;">
      <div style="font-size: 11px;display: inline-flex;">
        <a href="https://www.dentistry99.com/privacy-Policy" style="text-decoration: none; color:black;">
          <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;font-weight: 600;color:black;">Privacy & Cookie Policy </p>
        </a>
        <a href="https://www.dentistry99.com/terms-Conditions" style="text-decoration: none; color:black;">
          <p style="border-right: 1px solid black;padding: 0px 10px;text-align: center;font-weight: 600;color:black;">Terms & Conditions </p>
        </a>
      </div>
      </div>
    </div>
  </div>
          </div>
            `;
  return template;
}

export function orderStatusPlacedEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been placed! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been placed!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're excited to let you know that your order (${order.id})
          has been succesfully placed. Our team is working hard to ensure everything is ready for shipment as soon as possible.</p>
        <p style="margin-top: 10px;margin-bottom: 0px;">Once your order is ready to ship, we’ll send you another email
          with tracking information.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function orderStatusPackedEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been packed! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been packed!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're excited to let you know that your order (${order.id})
          has been succesfully packed. Our team is working hard to ensure everything is ready for shipment as soon as possible.</p>
        <p style="margin-top: 10px;margin-bottom: 0px;">Once your order is ready to ship, we’ll send you another email
          with tracking information.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function orderStatusDeliveredEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been delivered! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been delivered!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're excited to let you know that your order (${order.id})
          has been succesfully delivered.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function orderStatusShippedEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been shipped! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been shipped!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're excited to let you know that your order (${order.id})
          has been succesfully shipped.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function orderStatusReturnedEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been returned! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been returned!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're sending this email to let you know that your order (${order.id})
          has been succesfully returned.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function orderStatusCanceledEmailTemplate(order: any) {
  const template = `
      <div>
      <div style="font-size: 14px;font-family: sans-serif;letter-spacing: 0.3px;font-weight: 300;">
      <p style="font-size: 16px; font-weight: 500;padding: 5px 15px; border-bottom: 1px solid #EDEBEB;">Your order has been canceled! - <span style="font-weight: 600;">Order #12345 </span> </p>
      <div
        style="display: flex;flex-wrap: wrap; justify-content: space-between; align-items: center;gap:10px; background-color: white;padding: 2px 15px;">
        <img
          src="https://www.dentistry99.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fdentistry-logo.8c48c67f.png&w=3840&q=75"
          alt="" width="130px">
        <p style="font-size: 13px; margin-top: 0px; margin-bottom: 0px;">Your order has been canceled!</p>
      </div>
  
      <div style="padding: 2px 15px;">
        <p style="margin-bottom: 0px; font-weight: 300;">Dear ${order.user?.name || "Customer"},We're sending this email to let you know that your order (${order.id})
          has been succesfully canceled.</p>
      </div>

      <div style="border-top: 1px solid #f6f4f4;background-color: rgb(246, 251, 255);padding: 2px 15px;">
        <div style="width: 100%; ">
          <p style="color:gray;font-weight: 600;">Order ID: <span style="font-weight: 300;">PO-154-098765432456786</span></p>
          ${order.products?.map(
            (
              product
            ) => `<div style="display: flex; gap: 10px;justify-content: space-between; width: 100%;">
            <div style="display: flex; gap:10px; justify-content: start;">
              <img src="${product.variant.images[0]}" fill alt="" height="70px"
                width="70px" style="border-radius: 5px;">
  
              <div>
                <p style="margin: 0; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Product Name</p>
                <p
                  style="color:gray; margin-top: 1px; width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${product.variant.product.title}.</p>
                <p style="color:gray; margin-top: 2px; margin-bottom: 0px;">${product?.variant?.product?.brand ? product?.variant?.product?.brand?.name : ""} Brand</p>
              </div>
            </div>
            <div style="display: flex; flex-direction: column;align-items: end;">
              <p style="margin: 0px 0px;">$ <span>${product.variant.price}</span></p>
              <p style="color:gray; margin-top: 1px;">x${product.variant.quantity}</p>
            </div>
          </div>`
          )}
        </div>
        <div style="border-top: 1px solid #f6f4f4;margin-top: 20px; padding-bottom: 5px;">
          <p style="color: gray;margin: 9px 0px;">Payment Method:</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; justify-content: start;gap:10px; align-items: center;">
              <img
                src="https://static.vecteezy.com/system/resources/previews/020/975/576/non_2x/visa-logo-visa-icon-transparent-free-png.png"
                width="60px" height="40px" alt=""
                style="background-color: white; border:1px solid #f6f4f4; border-radius: 5px;">
              <p>visa...2499</p>
            </div>
            <p>$ ${order.price}</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px; margin-bottom: 0px;">item(s) total:</p>
            <p style="margin-top: 7px; margin-bottom: 0px;">$ <span>${order.price + order.discount}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin: 7px 0px;">item(s) discount:</p>
            <p style="margin: 7px 0px; color: orange;">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; color: gray;">
            <p style="margin-top:  0px; margin-bottom: 0px;">Subtotal:</p>
            <p style="margin-top:  0px; margin-bottom: 0px; color: rgb(42, 42, 42);">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: gray;border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Shipping:</p>
            <p style="margin-top:  7px;margin-bottom: 0px; color: rgb(63, 185, 49); ">Free</p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: rgb(42, 42, 42); font-weight: 600; border-top: 1px solid #f6f4f4;margin-top: 10px;">
            <p style="margin-top:  7px;margin-bottom: 0px;">Order Total:</p>
            <p style="margin-top:  7px; margin-bottom: 0px; ">$ <span>${order.price}</span></p>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; color: orange;; font-weight: 500;">
            <p style="margin-top:  5px;margin-bottom: 7px;">Your saved:</p>
            <p style="margin-top:  5px; margin-bottom: 7px; ">$ <span>${order.discount ? order.discount : "0"}</span></p>
          </div>
        </div>
      </div>
      <div style="padding: 2px 15px;">
        <p style="text-align: center;">Have Questions or need help?</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0yMCAzSDRjLTEuMTAzIDAtMiAuODk3LTIgMnYxNGMwIDEuMTAzLjg5NyAyIDIgMmgxNmMxLjEwMyAwIDItLjg5NyAyLTJWNWMwLTEuMTAzLS44OTctMi0yLTJNNCAxOVY1aDE2bC4wMDIgMTR6IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTYgN2gxMnYySDZ6bTAgNGgxMnYySDZ6bTAgNGg2djJINnoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Return/Other help</p>
          </button>
          <button
            style="width: 155px;height: 38px; background-color: transparent; outline: none;border:1px solid #c3c5c9;border-radius: 8px;display: flex;justify-content: center; align-items: center; gap:5px;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiAyQzYuNDg2IDIgMiA1LjU4OSAyIDEwYzAgMi45MDggMS44OTggNS41MTUgNSA2LjkzNFYyMmw1LjMzOS00LjAwNUMxNy42OTcgMTcuODUyIDIyIDE0LjMyIDIyIDEwYzAtNC40MTEtNC40ODYtOC0xMC04bTAgMTRoLS4zMzNMOSAxOHYtMi40MTdsLS42NDEtLjI0N0M1LjY3IDE0LjMwMSA0IDEyLjI1NiA0IDEwYzAtMy4zMDkgMy41ODktNiA4LTZzOCAyLjY5MSA4IDZzLTMuNTg5IDYtOCA2IiAvPgoJPHBhdGggZmlsbD0iIzAwMCIgZD0iTTExIDExLjU4Nkw4LjcwNyA5LjI5M2wtMS40MTQgMS40MTRMMTEgMTQuNDE0bDYuMjA3LTYuMjA3bC0xLjQxNC0xLjQxNHoiIC8+Cjwvc3ZnPg=="
              width="20px" alt="">
            <p style="font-size: 12px;">Support</p>
          </button>
        </div>
      </div>
      <div style=" padding: 2px 15px;">
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTUxMiA2NEwxMjggMTkydjM4NGMwIDIxMi4xIDE3MS45IDM4NCAzODQgMzg0czM4NC0xNzEuOSAzODQtMzg0VjE5MnptMzEyIDUxMmMwIDE3Mi4zLTEzOS43IDMxMi0zMTIgMzEyUzIwMCA3NDguMyAyMDAgNTc2VjI0NmwzMTItMTEwbDMxMiAxMTB6IiAvPgoJPHBhdGggZmlsbD0iIzBhOTZkNCIgZD0iTTM3OC40IDQ3NS4xYTM1LjkxIDM1LjkxIDAgMCAwLTUwLjkgMGEzNS45MSAzNS45MSAwIDAgMCAwIDUwLjlsMTI5LjQgMTI5LjRsMi4xIDIuMWEzMy45OCAzMy45OCAwIDAgMCA0OC4xIDBMNzMwLjYgNDM0YTMzLjk4IDMzLjk4IDAgMCAwIDAtNDguMWwtMi44LTIuOGEzMy45OCAzMy45OCAwIDAgMC00OC4xIDBMNDgzIDU3OS43eiIgLz4KPC9zdmc+"
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Safe Payments</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">your payment information is safe with us. Temu
              does not share your credit card information with sellers.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0yMSAxMWMwIDUuNTUtMy44NCAxMC43NC05IDEyYy01LjE2LTEuMjYtOS02LjQ1LTktMTJWNWw5LTRsOSA0em0tOSAxMGMzLjc1LTEgNy01LjQ2IDctOS43OFY2LjNsLTctMy4xMkw1IDYuM3Y0LjkyQzUgMTUuNTQgOC4yNSAyMCAxMiAyMW0yLjgtMTBWOS41QzE0LjggOC4xIDEzLjQgNyAxMiA3UzkuMiA4LjEgOS4yIDkuNVYxMWMtLjYgMC0xLjIuNi0xLjIgMS4ydjMuNWMwIC43LjYgMS4zIDEuMiAxLjNoNS41Yy43IDAgMS4zLS42IDEuMy0xLjJ2LTMuNWMwLS43LS42LTEuMy0xLjItMS4zbS0xLjMgMGgtM1Y5LjVjMC0uOC43LTEuMyAxLjUtMS4zczEuNS41IDEuNSAxLjN6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Data Encryption</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Dentistry protects your address
              information,ensuring its privacy and security. All address data is encrypted.
            </p>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhOTZkNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMS41IiBkPSJNOCAxMFY3YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDR2M20tNCA1YTEgMSAwIDEgMCAwLTJhMSAxIDAgMCAwIDAgMm0wIDB2M20tNS40LThoMTAuOGMuODggMCAxLjYuNzIgMS42IDEuNnY3YzAgMS4zMi0xLjA4IDIuNC0yLjQgMi40SDcuNEM2LjA4IDIxIDUgMTkuOTIgNSAxOC42di03YzAtLjg4LjcyLTEuNiAxLjYtMS42IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Secure Privacy</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Protecting your privacy is important to us!
              Please be assured and uncompromised. we do not sell your personal information for money and will only use
              your information in accordance with our privacy and cookie policy to provide and improve our services to
              you.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
  
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Ik0xMS4yNSAxOC43NWMwIC44My0uNjcgMS41LTEuNSAxLjVzLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjVzMS41LjY3IDEuNSAxLjVtNS0xLjVjLS44MyAwLTEuNS42Ny0xLjUgMS41cy42NyAxLjUgMS41IDEuNXMxLjUtLjY3IDEuNS0xLjVzLS42Ny0xLjUtMS41LTEuNW00LjQ4LTkuNTdsLTIgOGEuNzUuNzUgMCAwIDEtLjczLjU3SDhjLS4zNiAwLS42Ny0uMjYtLjc0LS42Mkw1LjM3IDUuMjVINGMtLjQxIDAtLjc1LS4zNC0uNzUtLjc1cy4zNC0uNzUuNzUtLjc1aDJjLjM2IDAgLjY3LjI2Ljc0LjYybC40MyAyLjM4SDIwYS43NTQuNzU0IDAgMCAxIC43My45M20tMS42OS41N0g3LjQ0bDEuMTggNi41aDguNzl6IiAvPgo8L3N2Zz4="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Purchase Protection</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">Shop confidently on Dentistry99 knowing if
              something goes wrong with an order, we've got your back.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 5px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: start; align-items: start; gap:10px;">
          <div style="margin-top:13px ;">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9IiMwYTk2ZDQiIGQ9Im0xMiAxNmwxLjQtMS40bC0xLjU3NS0xLjZIMTZ2LTJoLTQuMTc1TDEzLjQgOS40TDEyIDhsLTQgNHptLTcgNXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOVY1cTAtLjgyNS41ODgtMS40MTJUNSAzaDQuMnEuMzI1LS45IDEuMDg4LTEuNDVUMTIgMXQxLjcxMy41NVQxNC44IDNIMTlxLjgyNSAwIDEuNDEzLjU4OFQyMSA1djE0cTAgLjgyNS0uNTg3IDEuNDEzVDE5IDIxem0wLTJoMTRWNUg1em03LTE0Ljc1cS4zMjUgMCAuNTM4LS4yMTN0LjIxMi0uNTM3dC0uMjEzLS41MzdUMTIgMi43NXQtLjUzNy4yMTN0LS4yMTMuNTM3dC4yMTMuNTM4dC41MzcuMjEyTTUgMTlWNXoiIC8+Cjwvc3ZnPg=="
              width="30px" alt="">
          </div>
          <div>
            <p style="margin-bottom: 0px; font-weight: 600;">Free Returns*</p>
            <p style="margin-bottom: 3px;margin-top: 0px;font-size: 12px;">we hope you love the items. you have purchased,
              but if yiu are not 100% satisfied, it is easy to return any eligible item in its original condition.
            </p>
            <div
              style="display: flex; justify-content: start; align-items: center; gap:5px;color: gray; margin-top: 0px; margin-bottom: 10px;">
              <span style="font-size: 12px;">learn more</span>
              <img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxwYXRoIGZpbGw9ImdyYXkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjQ3IDUuNDdhLjc1Ljc1IDAgMCAxIDEuMDYgMGw2IDZhLjc1Ljc1IDAgMCAxIDAgMS4wNmwtNiA2YS43NS43NSAwIDEgMS0xLjA2LTEuMDZsNC43Mi00LjcySDRhLjc1Ljc1IDAgMCAxIDAtMS41aDE0LjE5bC00LjcyLTQuNzJhLjc1Ljc1IDAgMCAxIDAtMS4wNiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPgo8L3N2Zz4="
                width="17px" alt="">
  
            </div>
          </div>
        </div>
      </div>
      <div style=" padding: 2px 15px;background-color: rgb(246, 251, 255);font-size: 13px;">
        <div style="padding-top: 5px;">
          <p
            style="color:black; font-size: 14px; text-align: center; margin-top: 0px;margin-bottom: 0px; font-weight: 600;">
            Find us on</p>
          <div style="display: flex; justify-content: center; align-items: center; gap:5px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png" alt="" width="25px"
              style="border-radius: 100%;">
            <img
              src="https://e7.pngegg.com/pngimages/672/312/png-clipart-instagram-logo-icon-others-text-photography-thumbnail.png"
              width="25px" alt="" style="margin-left: 8px;border-radius: 100%;">
            <img
              src="https://cdn.iconscout.com/icon/free/png-256/free-twitter-x-icon-download-in-svg-png-gif-file-formats--logo-social-media-logos-pack-icons-7740647.png?f=webp&w=256"
              width="38px" alt="" style="border-radius: 100%;">
          </div>
          <p style="margin-bottom: 0px; margin-top: 3px;">NOTE: This is an automiatically generated email,please do not
            reply.Office address:6 Raffies Quay,#14-06,Enfant Plaza SW Washington, D.C.
            <span style="color: #0a96d4;">Please note, return will not be accepted at this address.</span>
          </p>
          <p style="margin-top: 5px;margin-bottom: 0px;">if you want to return items, please request a return and use
            Dentistry99 label. </p>
          <a href="/" style="text-align: center; text-decoration: none; color:#0a96d4;">
            <p style="margin-bottom: 0px; margin-top: 0px;">Click to view more details,</p>
          </a>
        </div>
        <p style="margin-top: 3px; margin-bottom: 3px;text-align: center;">Please contact <a href=""
            style=" text-decoration: none; color:#0a96d4;">Customer Services</a> if you have any questions.</p>
        <div style="display: flex;font-size: 11px; justify-content: center; align-items: center; gap:10px">
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black; padding-right: 10px;text-align: center;">Privacy & Cookie Policy </p>
          </a>
          <a href="" style="text-decoration: none; color:black;">
            <p style="border-right: 1px solid black;padding-right: 10px;text-align: center;">Terms & Conditions </p>
          </a>
        </div>
      </div>
    </div>
            </div>
            `;
  return template;
}

export function adminDeactivationEmail(admin, reason: string) {
  const template = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background: #ffffff;
            padding: 20px;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #d9534f;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
          }
          .reason-box {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #f5c6cb;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Account Deactivation Notice</h2>
          </div>
          
          <div class="content">
            <p>Dear ${admin.firstName} ${admin.lastName},</p>
            <p>We regret to inform you that your admin account has been deactivated by the Super Admin. As a result, you will no longer be able to access your account.</p>
            
            <div class="reason-box">
              <p><strong>Reason for Deactivation:</strong> ${reason}</p>
            </div>

            <p>If you believe this deactivation was made in error or have any concerns, please contact our support team.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return template;
}

export function adminActivationEmail(admin) {
  const template = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background: #ffffff;
            padding: 20px;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background-color: #28a745;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Account Activation Notice</h2>
          </div>
          
          <div class="content">
            <p>Dear ${admin.firstName} ${admin.lastName},</p>
            <p>We are pleased to inform you that your admin account has been successfully activated by the Super Admin. You can now log in and resume your activities.</p>
            <p>If you have any questions or face any issues, feel free to contact our support team.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return template;
}

export function getVendorDeactivateEmailTemplate(vendor: any, reason: string) {
  const template = `
    <div style="width: 100%; background-color: #f8f9fa;">
      <div style="width: 100%; max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px;">
        <div style="padding: 20px;">
          <h2 style="text-align: center;">Account Deactivation Notice</h2>
          <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
          <p>We regret to inform you that your vendor account has been deactivated by the Admin. As a result, you will no longer be able to access your account.</p>
          <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; border: 1px solid #f5c6cb; margin: 15px 0;">
            <strong>Reason for Deactivation:</strong> ${reason}
          </div>
          <p>If you believe this deactivation was made in error or have any concerns, please contact our support team.</p>
        </div>
      </div>
      <div style="padding: 20px;">
        <h3 style="text-align: center;">Thank you for being a part of our community!</h3>
        <p style="text-align: center;">&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
      </div>
    </div>
            `;
  return template;
}

export function getVendorActivationEmailTemplate(vendor) {
  const template = `
    <div style="width: 100%; background-color: #f8f9fa;">
      <div style="width: 100%; max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px;">
        <div style="padding: 20px;">
          <h2 style="text-align: center;">Account Activation Notice</h2>
          <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
          <p>We are pleased to inform you that your vendor account has been successfully activated by the Admin. You can now log in and resume your activities.</p>
          <p>If you have any questions or face any issues, feel free to contact our support team.</p>
        </div>
      </div>
      <div style="padding: 20px;">
        <h3 style="text-align: center;">Thank you for being a part of our community!</h3>
        <p style="text-align: center;">&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
      </div>
    </div>
            `;
  return template;
}

export function getOtherCategoryNotificationEmailTemplate(
  productData: any,
  subCategoryName: string
) {
  const template = `
    <div style="width: 100%; background-color: #f4f6f8; padding: 20px 0;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #ddd; font-family: Arial, sans-serif;">
        <div style="padding: 30px;">
          <h2 style="color: #333333; text-align: center;">🚨 Action Required: Vendor Submitted Product Under "Other" Category</h2>

          <p style="font-size: 14px; color: #444;">
            Dear Admin,
          </p>

          <p style="font-size: 14px; color: #444; line-height: 1.6;">
            A vendor has submitted a new product and selected the <strong>"Other"</strong> option for the subcategory. This typically means that the available category options did not match the nature of their product. Please review the submission details below to determine whether a new subcategory should be added or if this product should be reassigned to an existing one.
          </p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

          <p style="font-size: 14px; color: #333;"><strong>Vendor ID:</strong> ${productData.vendorId ?? "N/A"}</p>
          <p style="font-size: 14px; color: #333;"><strong>Product Title:</strong> ${productData.title}</p>
          <p style="font-size: 14px; color: #333;"><strong>Description:</strong> ${productData.description}</p>
          <p style="font-size: 14px; color: #333;"><strong>Requested Subcategory:</strong> ${subCategoryName}</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />

          <p style="font-size: 14px; color: #444;">
            To maintain a clear and structured product catalog, it is important to periodically evaluate these "Other" submissions and adjust the category list accordingly.
          </p>

          <p style="font-size: 14px; color: #444;">
            If you determine that this is a valid new category, please update the category list in the admin panel. If the product fits within an existing category, kindly reassign it appropriately.
          </p>

          <p style="font-size: 14px; color: #444; margin-top: 30px;">
            Thank you for your attention to this matter.
          </p>

          <p style="font-size: 14px; color: #444;">— Dentistry99 System Notification</p>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999999;">
        <p>This is an automated email. Please do not reply directly to this message.</p>
        <p>&copy; ${new Date().getFullYear()} Dentistry99. All rights reserved.</p>
      </div>
    </div>
  `;
  return template;
}
