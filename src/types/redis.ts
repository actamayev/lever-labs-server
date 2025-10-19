import { ScoreboardUUID } from "@lever-labs/common-ts/types/utils"

declare global {
  type RedisKey =
    | `scoreboard:${ScoreboardUUID}`

  type RedisWildcardPattern = "scoreboard:*" | "hub:*"
}

export {}
