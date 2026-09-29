import nodemailer from 'nodemailer';

export interface OrderItemForEmail {
  id?: string;
  product?: {
    name?: string;
    sku?: string;
    price?: number;
  };
  productName?: string;
  sku?: string;
  selectedVariantOptions?: Record<string, string>;
  selectedOptions?: Record<string, string>;
  quantity: number;
  unitPrice?: number;
  price?: number;
}

export interface OrderForEmail {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customer?: {
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    fullName?: string;
    address?: string;
    street?: string;
    city?: string;
    province?: string;
    phone?: string;
    email?: string;
  };
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  orderNotes?: string;
  items: OrderItemForEmail[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  discountCode?: string;
  giftCharges?: number;
  total: number;
  paymentMethod?: string;
  status?: string;
  createdAt?: string;
  emailSent?: boolean;
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function formatPaymentMethod(method?: string): string {
  if (!method) return 'Cash on Delivery (COD)';
  const lower = method.toLowerCase();
  if (lower.includes('cod') || lower.includes('cash')) return 'Cash on Delivery (COD)';
  if (lower.includes('bank') || lower.includes('transfer') || lower.includes('hbl')) return 'Direct Bank Transfer (HBL)';
  if (lower.includes('card')) return 'Credit / Debit Card';
  return method;
}

export async function sendNewOrderEmail(order: OrderForEmail): Promise<{ success: boolean; messageId?: string; skipped?: boolean; error?: string }> {
  // Prevent duplicate emails for the same order
  if (order.emailSent) {
    console.log(`[SOFYRA Email] Email already sent for order ${order.orderNumber || order.id}, skipping duplicate.`);
    return { success: true, skipped: true };
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || 'sofyrastore@gmail.com';
  const smtpPass = process.env.SMTP_PASSWORD;
  const recipientEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'sofyrastore@gmail.com';

  if (!smtpPass) {
    console.warn(`[SOFYRA Email] SMTP_PASSWORD is not configured in environment variables. Email notification for order ${order.orderNumber || order.id} was skipped.`);
    return { success: false, error: 'SMTP_PASSWORD environment variable is not set' };
  }

  // Extract Customer details
  const orderNum = order.orderNumber || `SOF-${order.id.replace('ord-', '')}`;
  const name = order.customerName || order.customer?.fullName || order.customer?.name || order.shippingAddress?.fullName || 'Valued Customer';
  const phone = order.phone || order.customer?.phone || order.shippingAddress?.phone || 'N/A';
  const email = order.email || order.customer?.email || order.shippingAddress?.email || 'N/A';

  const addressLine = order.address || order.shippingAddress?.address || order.shippingAddress?.street || 'N/A';
  const city = order.city || order.shippingAddress?.city || '';
  const province = order.province || order.shippingAddress?.province || '';
  const fullAddress = [addressLine, city, province, 'Pakistan'].filter(Boolean).join(', ');

  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-PK', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Karachi'
  }) : new Date().toLocaleString('en-PK', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'Asia/Karachi' });

  const paymentFormatted = formatPaymentMethod(order.paymentMethod);

  // Items list construction
  const itemRowsHtml = (order.items || []).map((item, idx) => {
    const pName = item.product?.name || item.productName || `Product #${idx + 1}`;
    const pSku = item.product?.sku || item.sku || '';
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.price || item.product?.price || 0;
    const itemTotal = unitPrice * qty;

    const optsObj = item.selectedVariantOptions || item.selectedOptions || {};
    const optsFormatted = Object.entries(optsObj)
      .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
      .join(' &bull; ');

    return `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 12px; font-size: 13px; color: #111111;">
          <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${pName}</div>
          ${pSku ? `<div style="font-size: 11px; color: #777777;">SKU: ${pSku}</div>` : ''}
          ${optsFormatted ? `<div style="font-size: 12px; color: #555555; margin-top: 4px;">${optsFormatted}</div>` : ''}
        </td>
        <td style="padding: 12px; font-size: 13px; color: #111111; text-align: center;">${qty}</td>
        <td style="padding: 12px; font-size: 13px; color: #111111; text-align: right;">${formatCurrency(unitPrice)}</td>
        <td style="padding: 12px; font-size: 13px; font-weight: 600; color: #111111; text-align: right;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  const itemRowsText = (order.items || []).map((item, idx) => {
    const pName = item.product?.name || item.productName || `Product #${idx + 1}`;
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.price || item.product?.price || 0;
    const itemTotal = unitPrice * qty;
    const optsObj = item.selectedVariantOptions || item.selectedOptions || {};
    const optsFormatted = Object.entries(optsObj).map(([k, v]) => `${k}: ${v}`).join(', ');
    return `- ${pName} ${optsFormatted ? `(${optsFormatted})` : ''} | Qty: ${qty} x ${formatCurrency(unitPrice)} = ${formatCurrency(itemTotal)}`;
  }).join('\n');

  // Pricing breakdown
  const subtotalFormatted = formatCurrency(order.subtotal || 0);
  const shippingFormatted = order.shippingFee === 0 ? 'FREE SHIPPING' : formatCurrency(order.shippingFee || 0);
  const discountFormatted = order.discountAmount ? `- ${formatCurrency(order.discountAmount)}` : null;
  const totalFormatted = formatCurrency(order.total || 0);

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Notification - ${orderNum}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f6f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e2e0; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #111111; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 4px; text-transform: uppercase; font-weight: normal; color: #ffffff;">SOFYRA</h1>
          <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #C5A880; text-transform: uppercase;">New Order Received</p>
        </div>

        <!-- Order Summary Badge -->
        <div style="background-color: #faf9f6; padding: 16px 24px; border-bottom: 1px solid #eeeeee;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
              <div style="font-size: 18px; font-weight: bold; color: #111111;">${orderNum}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #777777; text-transform: uppercase; letter-spacing: 1px;">Date & Time</div>
              <div style="font-size: 12px; color: #333333; font-weight: 500;">${dateStr}</div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          
          <!-- Customer Information -->
          <div style="background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #111111; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px;">Customer & Delivery Information</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #333333;">
              <tr>
                <td style="padding: 4px 0; font-weight: 600; width: 130px;">Customer Name:</td>
                <td style="padding: 4px 0; color: #111111;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Phone Number:</td>
                <td style="padding: 4px 0; color: #111111;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Email Address:</td>
                <td style="padding: 4px 0; color: #111111;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; vertical-align: top;">Delivery Address:</td>
                <td style="padding: 4px 0; color: #111111; line-height: 1.4;">${fullAddress}</td>
              </tr>
              ${order.orderNotes ? `
              <tr>
                <td style="padding: 4px 0; font-weight: 600; vertical-align: top; color: #c5a880;">Order Notes:</td>
                <td style="padding: 4px 0; color: #444444; font-style: italic;">${order.orderNotes}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Products Table -->
          <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #111111;">Products Ordered</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f1f1ef; border-bottom: 2px solid #dddddd;">
                <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555555; text-align: left;">Item</th>
                <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555555; text-align: center;">Qty</th>
                <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555555; text-align: right;">Price</th>
                <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555555; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="background-color: #fafafa; border: 1px solid #e0e0e0; padding: 16px; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #333333;">
              <tr>
                <td style="padding: 4px 0; text-align: right;">Subtotal:</td>
                <td style="padding: 4px 0 4px 16px; text-align: right; width: 140px; font-weight: 500;">${subtotalFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; text-align: right;">Shipping Fee:</td>
                <td style="padding: 4px 0 4px 16px; text-align: right; font-weight: 500;">${shippingFormatted}</td>
              </tr>
              ${discountFormatted ? `
              <tr>
                <td style="padding: 4px 0; text-align: right; color: #008000;">Discount ${order.discountCode ? `(${order.discountCode})` : ''}:</td>
                <td style="padding: 4px 0 4px 16px; text-align: right; color: #008000; font-weight: 600;">${discountFormatted}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1px solid #cccccc; border-bottom: 2px solid #111111;">
                <td style="padding: 10px 0; text-align: right; font-size: 15px; font-weight: bold; color: #111111; text-transform: uppercase;">Final Total:</td>
                <td style="padding: 10px 0 10px 16px; text-align: right; font-size: 16px; font-weight: bold; color: #111111;">${totalFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0 0 0; text-align: right; font-size: 12px; color: #666666;">Payment Method:</td>
                <td style="padding: 8px 0 0 16px; text-align: right; font-size: 12px; font-weight: bold; color: #111111;">${paymentFormatted}</td>
              </tr>
            </table>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #111111; color: #999999; padding: 16px 24px; text-align: center; font-size: 11px;">
          <p style="margin: 0;">SOFYRA Fine Jewellery Automated Store Notification</p>
        </div>

      </div>
    </body>
    </html>
  `;

  const textBody = `
NEW ORDER NOTIFICATION - SOFYRA FINE JEWELLERY
=================================================
Order Number: ${orderNum}
Order Date/Time: ${dateStr}

CUSTOMER & DELIVERY DETAILS:
- Name: ${name}
- Phone: ${phone}
- Email: ${email}
- Delivery Address: ${fullAddress}
${order.orderNotes ? `- Order Notes: ${order.orderNotes}` : ''}

PRODUCTS ORDERED:
${itemRowsText}

FINANCIAL BREAKDOWN:
- Subtotal: ${subtotalFormatted}
- Shipping: ${shippingFormatted}
${discountFormatted ? `- Discount (${order.discountCode || ''}): ${discountFormatted}` : ''}
- Final Total: ${totalFormatted}
- Payment Method: ${paymentFormatted}

=================================================
  `.trim();

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"SOFYRA Store" <${smtpUser}>`,
      to: recipientEmail,
      subject: `✨ New Order Received: ${orderNum} (${totalFormatted})`,
      text: textBody,
      html: htmlBody
    };

    console.log(`[SOFYRA Email] Attempting to send order email for ${orderNum} to ${recipientEmail} via ${smtpHost}:${smtpPort}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SOFYRA Email] Notification email sent successfully for ${orderNum}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[SOFYRA Email Error] Failed to send email for order ${orderNum}:`, err?.message || err);
    return { success: false, error: err?.message || 'Failed to send email' };
  }
}
