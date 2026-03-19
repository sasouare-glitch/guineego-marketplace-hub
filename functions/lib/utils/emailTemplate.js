"use strict";
/**
 * Shared Email Template — GuineeGo Branding
 * Guinea flag colors: Green (#009639), Yellow (#FEDD00), Red (#CE1126)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = exports.APP_URL = void 0;
exports.wrapInTemplate = wrapInTemplate;
exports.ctaButton = ctaButton;
exports.infoRow = infoRow;
exports.divider = divider;
exports.sectionTitle = sectionTitle;
exports.statusBadge = statusBadge;
const APP_URL = 'https://guineego.app';
exports.APP_URL = APP_URL;
// Brand colors
const COLORS = {
    green: '#009639',
    greenDark: '#007A2E',
    yellow: '#FEDD00',
    red: '#CE1126',
    darkText: '#1a1a1a',
    bodyText: '#374151',
    mutedText: '#6b7280',
    lightBg: '#f9fafb',
    border: '#e5e7eb',
    white: '#ffffff',
};
exports.COLORS = COLORS;
/**
 * Wrap email body content in the branded GuineeGo layout
 */
function wrapInTemplate(bodyContent) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GuineeGo</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.lightBg}; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.lightBg};">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          
          <!-- ========== HEADER ========== -->
          <tr>
            <td style="background: linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%); padding: 0;">
              <!-- Guinea flag stripe -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33.33%" style="height: 4px; background-color: ${COLORS.green};"></td>
                  <td width="33.33%" style="height: 4px; background-color: ${COLORS.yellow};"></td>
                  <td width="33.34%" style="height: 4px; background-color: ${COLORS.red};"></td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 28px 24px;">
                    <!-- Logo Text -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: ${COLORS.white}; width: 44px; height: 44px; border-radius: 10px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 22px; font-weight: 800; color: ${COLORS.green};">G</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 26px; font-weight: 700; color: ${COLORS.white}; letter-spacing: -0.5px;">Guinee</span><span style="font-size: 26px; font-weight: 700; color: ${COLORS.yellow}; letter-spacing: -0.5px;">Go</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- ========== BODY ========== -->
          <tr>
            <td style="padding: 32px 28px;">
              ${bodyContent}
            </td>
          </tr>
          
          <!-- ========== FOOTER ========== -->
          <tr>
            <td style="background-color: ${COLORS.lightBg}; padding: 24px 28px; border-top: 1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.mutedText};">
                      Merci pour votre confiance !
                    </p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: ${COLORS.mutedText};">
                      L'équipe <strong style="color: ${COLORS.green};">GuineeGo</strong> 🇬🇳
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="${APP_URL}" style="font-size: 12px; color: ${COLORS.green}; text-decoration: none;">Site web</a>
                        </td>
                        <td style="color: ${COLORS.border};">|</td>
                        <td style="padding: 0 8px;">
                          <a href="${APP_URL}/marketplace" style="font-size: 12px; color: ${COLORS.green}; text-decoration: none;">Marketplace</a>
                        </td>
                        <td style="color: ${COLORS.border};">|</td>
                        <td style="padding: 0 8px;">
                          <a href="mailto:support@guineego.app" style="font-size: 12px; color: ${COLORS.green}; text-decoration: none;">Support</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 16px 0 0; font-size: 11px; color: #9ca3af;">
                      © ${new Date().getFullYear()} GuineeGo — Conakry, Guinée
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
/**
 * Create a styled CTA button
 */
function ctaButton(text, url, color = COLORS.green) {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 24px 0 8px;">
          <a href="${url}" 
             style="display: inline-block; background-color: ${color}; color: ${COLORS.white}; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}
/**
 * Create a styled info row
 */
function infoRow(label, value) {
    return `
    <tr>
      <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.mutedText};">${label}</td>
      <td style="padding: 6px 0; font-size: 14px; color: ${COLORS.darkText}; text-align: right; font-weight: 500;">${value}</td>
    </tr>`;
}
/**
 * Divider
 */
function divider() {
    return `<hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 20px 0;" />`;
}
/**
 * Section title
 */
function sectionTitle(emoji, text) {
    return `<h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: ${COLORS.darkText};">${emoji} ${text}</h3>`;
}
/**
 * Status badge
 */
function statusBadge(text, bgColor, textColor = COLORS.white) {
    return `<span style="display: inline-block; background-color: ${bgColor}; color: ${textColor}; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">${text}</span>`;
}
//# sourceMappingURL=emailTemplate.js.map