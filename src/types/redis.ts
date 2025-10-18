import { HubUUID, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"

declare global {
  type RedisKey =
    | `hub:${HubUUID}`
    | `scoreboard:${ScoreboardUUID}`

  type RedisWildcardPattern = "scoreboard:*" | "hub:*"
}

export {}
