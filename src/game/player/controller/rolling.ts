import {PlayerFixtures} from "../types";

export const updateRollingFixtures = (fixtures: PlayerFixtures, progress: number) => {

    if (progress < 0.66) {
        fixtures.default.setSensor(true)
        fixtures.medium.setSensor(true)
        fixtures.small.setSensor(true)
        return
    }

    if (progress < 0.8) {
        fixtures.default.setSensor(true)
        fixtures.medium.setSensor(true)
        fixtures.small.setSensor(false)
        return
    }

    if (progress < 0.95) {
        fixtures.default.setSensor(true)
        fixtures.medium.setSensor(false)
        fixtures.small.setSensor(false)
        return
    }

}
