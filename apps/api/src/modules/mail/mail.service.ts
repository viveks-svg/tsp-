import { Injectable, Logger } from '@nestjs/common';
import { escapeHtml } from '../../common/html';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  // A sender on the domain verified in Resend, e.g. "Time Space & Planets <care@timespaceplanets.com>".
  // Until the domain is verified, Resend's sandbox sender only reaches the Resend account owner.
  private readonly defaultFrom = process.env.MAIL_FROM || 'Time Space & Planets <onboarding@resend.dev>';

  constructor() {
    // Initialize Resend with the provided key or from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) this.logger.warn('RESEND_API_KEY is not set: emails will not be sent.');
    this.resend = new Resend(apiKey || 're_not_configured');
  }

  /**
   * Sends a password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const link = `${(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/reset-password?token=${token}`;
    return this.sendActionEmail(to, {
      subject: 'Set a new password — Time Space & Planets',
      paragraphs: ['We received a request to set a new password for your Time Space & Planets account.', 'The link below works once and expires in one hour.'],
      buttonText: 'Set a new password',
      link,
      footnote: "If you didn't ask for this, you can ignore this email — your password stays the same.",
    });
  }

  /**
   * Invites a teammate to the TSP admin panel. Returns false if the email could
   * not be sent — the inviter also gets the link to share directly.
   */
  async sendStaffInviteEmail(to: string, opts: { name?: string | null; roleLabel: string; link: string; inviterName?: string | null }): Promise<boolean> {
    const greeting = opts.name ? `Dear ${escapeHtml(opts.name)},` : "Hello,";
    const inviter = opts.inviterName ? `${escapeHtml(opts.inviterName)} has` : "You have been";
    try {
      const { error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: "Your invitation to Time Space & Planets",
        html: `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; background: #FFFDF8; border: 1px solid #E9E1CF; border-radius: 14px; overflow: hidden;">
            <div style="background: #0B1233; padding: 28px 32px; text-align: center;">
              <p style="margin: 0; color: #E3C88E; letter-spacing: 0.3em; font-size: 12px; text-transform: uppercase;">Time Space &amp; Planets</p>
              <p style="margin: 6px 0 0; color: #AEB3CC; letter-spacing: 0.25em; font-size: 10px; text-transform: uppercase;">The Private Office</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1A1712; font-size: 17px; margin: 0 0 16px;">${greeting}</p>
              <p style="color: #5E5546; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                ${inviter} invited you to join the Time Space &amp; Planets team as <strong style="color: #1A1712;">${escapeHtml(opts.roleLabel)}</strong>.
                Choose your password to open the admin panel. This invitation is valid for 7 days.
              </p>
              <p style="text-align: center; margin: 0 0 24px;">
                <a href="${opts.link}" style="background: #0B1233; color: #E3C88E; padding: 13px 28px; text-decoration: none; border-radius: 999px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; display: inline-block;">Accept invitation</a>
              </p>
              <p style="color: #756B5A; font-size: 12px; font-family: Arial, sans-serif; word-break: break-all; margin: 0;">Or open: ${opts.link}</p>
            </div>
          </div>
        `,
      });
      if (error) {
        this.logger.error(`Failed to send staff invite to ${to}: ${error.message}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`Failed to send staff invite to ${to}`, e as Error);
      return false;
    }
  }

  /**
   * A short branded email with one button (verify an email, reset a password).
   * `paragraphs` are plain text; they are escaped here.
   */
  async sendActionEmail(
    to: string,
    opts: {
      subject: string;
      greetingName?: string | null;
      paragraphs: string[];
      /** Label / value rows shown as a small table (e.g. booking details). */
      details?: [string, string][];
      buttonText?: string;
      link?: string;
      footnote?: string;
    },
  ): Promise<boolean> {
    if (!to) return false;
    const greeting = opts.greetingName ? `Dear ${escapeHtml(opts.greetingName)},` : "Namaste,";
    const body = opts.paragraphs
      .map((p) => `<p style="color: #5E5546; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">${escapeHtml(p)}</p>`)
      .join("");
    try {
      const { error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: opts.subject,
        html: `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; background: #FFFDF8; border: 1px solid #E9E1CF; border-radius: 14px; overflow: hidden;">
            <div style="background: #0B1233; padding: 28px 32px; text-align: center;">
              <p style="margin: 0; color: #E3C88E; letter-spacing: 0.3em; font-size: 12px; text-transform: uppercase;">Time Space &amp; Planets</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1A1712; font-size: 17px; margin: 0 0 16px;">${greeting}</p>
              ${body}
              ${
                opts.details?.length
                  ? `<table style="width: 100%; border-collapse: collapse; margin: 4px 0 20px; font-family: Arial, sans-serif; font-size: 14px;">${opts.details
                      .map(
                        ([k, v]) =>
                          `<tr><td style="padding: 8px 0; color: #756B5A; border-bottom: 1px solid #E9E1CF; width: 42%;">${escapeHtml(k)}</td><td style="padding: 8px 0; color: #1A1712; border-bottom: 1px solid #E9E1CF;">${escapeHtml(v)}</td></tr>`,
                      )
                      .join("")}</table>`
                  : ""
              }
              ${
                opts.link && opts.buttonText
                  ? `<p style="text-align: center; margin: 8px 0 24px;">
                <a href="${escapeHtml(opts.link)}" style="background: #0B1233; color: #E3C88E; padding: 13px 28px; text-decoration: none; border-radius: 999px; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; display: inline-block;">${escapeHtml(opts.buttonText)}</a>
              </p>
              <p style="color: #756B5A; font-size: 12px; font-family: Arial, sans-serif; word-break: break-all; margin: 0 0 8px;">Or open: ${escapeHtml(opts.link)}</p>`
                  : ""
              }
              ${opts.footnote ? `<p style="color: #756B5A; font-size: 12px; font-family: Arial, sans-serif; margin: 0;">${escapeHtml(opts.footnote)}</p>` : ""}
            </div>
          </div>
        `,
      });
      if (error) {
        this.logger.error(`Failed to send "${opts.subject}" to ${to}: ${error.message}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`Failed to send "${opts.subject}" to ${to}`, e as Error);
      return false;
    }
  }
}
