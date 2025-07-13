import PrismaClientClass from "../../../classes/prisma-client"

export default async function upsertProfilePicture(
	imageUploadUrl: string,
	fileName: string,
	uuid: string,
	userId: number
): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()

	await prismaClient.profile_picture.upsert({
		where: { user_id: userId },
		update: {
			image_url: imageUploadUrl,
			file_name: fileName,
			uuid,
			is_active: true
		},
		create: {
			image_url: imageUploadUrl,
			file_name: fileName,
			uuid,
			user_id: userId
		}
	})
}
