import { HubUUID, ScoreboardUUID } from "@lever-labs/common-ts/types/utils"

declare global {
  type RedisKey =
    | `hub:${HubUUID}`
    | `scoreboard:${ScoreboardUUID}`
    | `stream:${string}` // StreamIds are dynamic, so less strict here

  type RedisWildcardPattern = "scoreboard:*" | "hub:*"
}

export {}
