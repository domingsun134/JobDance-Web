import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing SMTP configuration');
      return NextResponse.json({ error: 'Server misconfiguration: Missing SMTP settings' }, { status: 500 });
    }

    const port = Number(process.env.SMTP_PORT || 587);
    // Automatically use secure=true for port 465, false for others unless explicitly set
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

    console.log(`Attempting SMTP connection to ${process.env.SMTP_HOST}:${port} (Secure: ${isSecure})`);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Increase timeouts
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 10000,     // 10 seconds
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"JobDance" <no-reply@jobdance.ai>',
      to: email,
      subject: 'Welcome to JobDance! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to JobDance</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
                  <!-- Header with Gradient -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(6, 182, 212, 0.1));">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; background: linear-gradient(to right, #a855f7, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #a855f7; letter-spacing: -0.5px;">JobDance</h1>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 20px 40px 40px 40px;">
                      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Welcome, ${name || 'Future Star'}! 👋</h2>
                      <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        We're thrilled to have you on board. JobDance is your AI-powered career companion, designed to help you land your dream job with confidence.
                      </p>

                      <!-- Feature Grid -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td width="40" style="vertical-align: top;">
                                  <div style="width: 32px; height: 32px; background-color: rgba(168, 85, 247, 0.2); border-radius: 8px; text-align: center; line-height: 32px; font-size: 18px;">📝</div>
                                </td>
                                <td style="padding-left: 15px;">
                                  <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Smart Resume Builder</strong>
                                  <span style="color: #a1a1aa; font-size: 14px;">Create ATS-friendly resumes in minutes.</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td width="40" style="vertical-align: top;">
                                  <div style="width: 32px; height: 32px; background-color: rgba(6, 182, 212, 0.2); border-radius: 8px; text-align: center; line-height: 32px; font-size: 18px;">🎤</div>
                                </td>
                                <td style="padding-left: 15px;">
                                  <strong style="color: #ffffff; display: block; margin-bottom: 4px;">AI Interview Practice</strong>
                                  <span style="color: #a1a1aa; font-size: 14px;">Get real-time feedback on your answers.</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td width="40" style="vertical-align: top;">
                                  <div style="width: 32px; height: 32px; background-color: rgba(236, 72, 153, 0.2); border-radius: 8px; text-align: center; line-height: 32px; font-size: 18px;">📊</div>
                                </td>
                                <td style="padding-left: 15px;">
                                  <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Progress Tracking</strong>
                                  <span style="color: #a1a1aa; font-size: 14px;">Visualize your improvement over time.</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #a855f7, #06b6d4); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);">
                              Go to Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin-top: 40px; color: #52525b; font-size: 12px; text-align: center;">
                        If you have any questions, just reply to this email. We're here to help!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px; text-align: center; background-color: #000000; border-top: 1px solid #27272a;">
                      <p style="color: #52525b; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} JobDance AI. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ message: 'Email sent', messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
