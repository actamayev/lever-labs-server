import { ArcadeGameName } from "@prisma/client"
import { ArcadeGameType } from "@lever-labs/common-ts/types/arcade"

export function convertArcadeGameNameToType(gameName: ArcadeGameName): ArcadeGameType {
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

export function convertArcadeGameTypeToName(gameType: ArcadeGameType): ArcadeGameName {
	switch (gameType) {
	case "turretDefense":
		return ArcadeGameName.TURRET_DEFENSE
	case "flappyBird":
		return ArcadeGameName.FLAPPY_BIRD
	case "cityDriver":
		return ArcadeGameName.CITY_DRIVER
	default:
		throw new Error(`Unknown arcade game type: ${gameType}`)
	}
}

