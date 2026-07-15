export function getReversalEmailTemplate(order: any, getReverseAmount: any) {
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Reversal Confirmation</h2>
        
        <p style="color: #34495e; line-height: 1.6;">Dear ${order.user.firstName} ${order.user.lastName},</p>
        
        <p style="color: #34495e; line-height: 1.6;">We are writing to confirm that your payment for order #${order.orderNumber} has been successfully reversed. The original charge has been removed from your account statement.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Order Details:</h3>
          <p style="color: #34495e; margin: 5px 0;">Order Number: #${order.orderNumber}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="color: #34495e; margin: 5px 0;">Total Amount: $${getReverseAmount}</p>
          <p style="color: #34495e; margin: 5px 0;">Reversal Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">The reversal process has been completed, and you should see the refund reflected in your account within 5-7 business days, depending on your financial institution.</p>
        
        <p style="color: #34495e; line-height: 1.6;">If you have any questions or need further assistance, please don't hesitate to contact our customer support team:</p>
        
        <ul style="color: #34495e; line-height: 1.6;">
          <li>Email: support@dentistry99.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</li>
        </ul>
        
        <p style="color: #34495e; line-height: 1.6;">Thank you for your understanding and for choosing Dentistry99.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #7f8c8d; margin: 0;">Best regards,<br>The Dentistry99 Team</p>
        </div>
      </div>
    </div>
  `;
  return template;
}

export function getRevereseEmailTemplateForVendor(order: any, vendor: any, reversedAmount: any) {
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Reversal</h2>
        
        <p style="color: #34495e; line-height: 1.6;">Dear ${vendor.firstName} ${vendor.lastName},</p>
        
        <p style="color: #34495e; line-height: 1.6;">This email is to inform you that a payment reversal has been processed for order #${order.orderNumber} due to order cancellation.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Transaction Details:</h3>
          <p style="color: #34495e; margin: 5px 0;">Order Number: #${order.orderNumber}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="color: #34495e; margin: 5px 0;">Reversed Amount: $${reversedAmount}</p>
          <p style="color: #34495e; margin: 5px 0;">Reversal Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">The payment reversal has been processed through your connected Stripe account. You should see this reflected in your Stripe dashboard and bank account within 5-7 business days.</p>
        
        <p style="color: #34495e; line-height: 1.6;">If you have any questions or need assistance, please contact our vendor support team:</p>
        
        <ul style="color: #34495e; line-height: 1.6;">
          <li>Email: vendor-support@dentistry99.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</li>
        </ul>
        
        <p style="color: #34495e; line-height: 1.6;">Thank you for your understanding and continued partnership with Dentistry99.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #7f8c8d; margin: 0;">Best regards,<br>The Dentistry99 Vendor Support Team</p>
        </div>
      </div>
    </div>
  `;
  return template;
}

export function getRefundEmailTemplate(order: any, refundAmount: any) {
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Refund Confirmation</h2>
        
        <p style="color: #34495e; line-height: 1.6;">Dear ${order.user.firstName} ${order.user.lastName},</p>
        
        <p style="color: #34495e; line-height: 1.6;">We are writing to confirm that your refund for order #${order.orderNumber} has been processed successfully.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Order Details:</h3>
          <p style="color: #34495e; margin: 5px 0;">Order Number: #${order.orderNumber}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="color: #34495e; margin: 5px 0;">Refund Amount: $${refundAmount}</p>
          <p style="color: #34495e; margin: 5px 0;">Refund Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">The refund has been processed to your original payment method. You should see the refund reflected in your account within 5-7 business days, depending on your financial institution.</p>
        
        <p style="color: #34495e; line-height: 1.6;">If you have any questions or need assistance, please contact our customer support team:</p>
        
        <ul style="color: #34495e; line-height: 1.6;">
          <li>Email: support@dentistry99.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</li>
        </ul>
        
        <p style="color: #34495e; line-height: 1.6;">Thank you for your understanding and for choosing Dentistry99.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #7f8c8d; margin: 0;">Best regards,<br>The Dentistry99 Team</p>
        </div>
      </div>
    </div>
  `;
  return template;
}

export function getCancelEmailTemplate(order: any) {
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Order Cancellation Confirmation</h2>
        
        <p style="color: #34495e; line-height: 1.6;">Dear ${order.user.firstName} ${order.user.lastName},</p>
        
        <p style="color: #34495e; line-height: 1.6;">We are writing to confirm that your order #${order.orderNumber} has been successfully canceled.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Order Details:</h3>
          <p style="color: #34495e; margin: 5px 0;">Order Number: #${order.orderNumber}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Amount: $${order.price}</p>
          <p style="color: #34495e; margin: 5px 0;">Cancellation Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">Your payment has been canceled and no charges have been made to your account. If you see any pending charges, they will be automatically removed within 1-2 business days.</p>
        
        <p style="color: #34495e; line-height: 1.6;">If you have any questions or need assistance, please contact our customer support team:</p>
        
        <ul style="color: #34495e; line-height: 1.6;">
          <li>Email: support@dentistry99.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</li>
        </ul>
        
        <p style="color: #34495e; line-height: 1.6;">We hope to serve you again soon.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #7f8c8d; margin: 0;">Best regards,<br>The Dentistry99 Team</p>
        </div>
      </div>
    </div>
  `;
  return template;
}

export function getVendorTransferEmailTemplate(order: any, vendor: any, transferAmount: any, commissionAmount: any) {
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Transfer Confirmation</h2>
        
        <p style="color: #34495e; line-height: 1.6;">Dear ${vendor.firstName} ${vendor.lastName},</p>
        
        <p style="color: #34495e; line-height: 1.6;">We are pleased to inform you that a payment transfer has been processed for order #${order.orderNumber}.</p>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Transfer Details:</h3>
          <p style="color: #34495e; margin: 5px 0;">Order Number: #${order.orderNumber}</p>
          <p style="color: #34495e; margin: 5px 0;">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p style="color: #34495e; margin: 5px 0;">Transfer Amount: $${transferAmount}</p>
          <p style="color: #34495e; margin: 5px 0;">Platform Commission: $${commissionAmount}</p>
          <p style="color: #34495e; margin: 5px 0;">Transfer Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">The payment has been transferred to your connected Stripe account. You should see this reflected in your Stripe dashboard and bank account within 5-7 business days.</p>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Important Reminders:</h3>
          <ul style="color: #34495e; line-height: 1.6;">
            <li>Please ensure your Stripe account details are up to date</li>
            <li>Keep track of your transfers in your vendor dashboard</li>
            <li>Contact support if you notice any discrepancies</li>
          </ul>
        </div>
        
        <p style="color: #34495e; line-height: 1.6;">If you have any questions or need assistance, please contact our vendor support team:</p>
        
        <ul style="color: #34495e; line-height: 1.6;">
          <li>Email: vendor-support@dentistry99.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</li>
        </ul>
        
        <p style="color: #34495e; line-height: 1.6;">Thank you for your continued partnership with Dentistry99.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #7f8c8d; margin: 0;">Best regards,<br>The Dentistry99 Vendor Support Team</p>
        </div>
      </div>
    </div>
  `;
  return template;
}
