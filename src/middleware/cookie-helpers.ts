import { Request, Response } from "express"

export interface CookieOptions {
	maxAge?: number
	expires?: Date
	httpOnly?: boolean
	secure?: boolean
	sameSite?: "strict" | "lax" | "none"
	domain?: string
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AUTH_COOKIE_NAME = "auth_token"

// Default cookie options for auth
export const getAuthCookieOptions = (): CookieOptions => ({
	httpOnly: true,
	secure: (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"), // Only send over HTTPS in production
	sameSite: "lax", // Allows cross-site navigation while preventing CSRF
	// eslint-disable-next-line max-len
	domain: (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") ? ".bluedotrobots.com" : undefined, // Subdomain sharing in production
	maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
})

export const setAuthCookie = (res: Response, token: string): void => {
	res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
}

export const clearAuthCookie = (res: Response): void => {
	res.clearCookie(AUTH_COOKIE_NAME, {
		domain: (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") ? ".bluedotrobots.com" : undefined,
		httpOnly: true,
		secure: (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"),
		sameSite: "lax"
	})
}

export const getAuthTokenFromCookies = (req: Request): string | undefined => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return req.cookies?.[AUTH_COOKIE_NAME]
}
