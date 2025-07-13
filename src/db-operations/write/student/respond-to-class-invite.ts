import { InvitationStatus } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

interface UpdateData {
	invitation_status: InvitationStatus
	joined_classroom_at?: Date
}

export default async function respondToClassInvite(
	studentId: number,
	inviteResponse: "accept" | "decline"
): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()

	const invitationStatus = inviteResponse === "accept"
		? InvitationStatus.ACCEPTED
		: InvitationStatus.DECLINED

	const updateData: UpdateData = {
		invitation_status: invitationStatus
	}

	// Only set joined_classroom_at when accepting
	if (inviteResponse === "accept") {
		updateData.joined_classroom_at = new Date()
	}

	await prismaClient.student.update({
		where: {
			student_id: studentId
		},
		data: updateData
	})
}
