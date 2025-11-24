import { ArcadeGameName } from "@prisma/client"
import { ArcadeGameType } from "@lever-labs/common-ts/types/arcade"

export default function convertArcadeGameNameToType(gameName: ArcadeGameName): ArcadeGameType {
	switch (gameName) {
	case ArcadeGameName.TURRET_DEFENSE:
		return "turretDefense"
	case ArcadeGameName.FLAPPY_BIRD:
		return "flappyBird"
	case ArcadeGameName.CITY_DRIVER:
		return "cityDriver"
	default:
		throw new Error(`Unknown arcade game name: ${gameName}`)
	}
}

