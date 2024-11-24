export default function sanitizeUserCode(userCode: string): string {
	return userCode.trim().replace(/'/g, "'\\''")
}
