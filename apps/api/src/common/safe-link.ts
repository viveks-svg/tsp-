/**
 * Links admins may put in front of clients (promo buttons, images, announcements,
 * blog covers): https:// URLs, or a path on this site. "//host" and "/\host"
 * are rejected — browsers treat them as other websites. Empty means "no link".
 */
export const SAFE_LINK = /^$|^https:\/\/[^\s\\]+$|^\/(?![\/\\])[^\s\\]*$/;
export const SAFE_LINK_MESSAGE = "Links must start with https:// or be a page on this site (starting with /)";
