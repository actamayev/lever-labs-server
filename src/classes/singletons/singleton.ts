/* eslint-disable @typescript-eslint/no-explicit-any */
export default abstract class Singleton {
	protected static instance: any | null = null
	protected readonly region: string = "us-east-1"

	protected constructor() {}

	public static getInstance(): any {
		throw new Error("getInstance method must be implemented in the subclass")
	}
}
