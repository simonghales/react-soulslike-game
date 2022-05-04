import React, {useEffect, useMemo, useState} from "react"
import {Collisions, CollisionsState} from "./types";
import {useOnCollisionBegin, useOnCollisionEnd} from "react-three-physics";
import {Fixture} from "planck";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../../utils/physics";
import {useMobBrainContext} from "../mobBrainContext";
import {MobCollisionTypes, PlayerRangeCollisionTypes} from "../../data/collisions";

export const CollisionsHandler: React.FC = () => {

    const {
        id,
        setCollisionsState,
    } = useMobBrainContext()

    const [collisions, setCollisions] = useState({} as Collisions)

    const collisionsState = useMemo<CollisionsState>(() => {

        let isInExtraLargeCombatRange = false
        let isInLargeCombatRange = false
        let isInMediumCombatRange = false
        let isInSmallCombatRange = false
        let isInExtraSmallCombatRange = false

        if (collisions[MobCollisionTypes.BODY]) {
            if (collisions[MobCollisionTypes.BODY].player) {
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_EXTRA_LARGE_COMBAT_RANGE]) {
                    isInExtraLargeCombatRange = true
                }
            }
        }

        if (collisions[MobCollisionTypes.BODY]) {
            if (collisions[MobCollisionTypes.BODY].player) {
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_LARGE_COMBAT_RANGE]) {
                    isInLargeCombatRange = true
                }
            }
        }

        if (collisions[MobCollisionTypes.BODY]) {
            if (collisions[MobCollisionTypes.BODY].player) {
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_MEDIUM_COMBAT_RANGE]) {
                    isInMediumCombatRange = true
                }
            }
        }

        if (collisions[MobCollisionTypes.BODY]) {
            if (collisions[MobCollisionTypes.BODY].player) {
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_SMALL_COMBAT_RANGE]) {
                    isInSmallCombatRange = true
                }
            }
        }

        if (collisions[MobCollisionTypes.BODY]) {
            if (collisions[MobCollisionTypes.BODY].player) {
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_EXTRA_SMALL_COMBAT_RANGE]) {
                    isInExtraSmallCombatRange = true
                }
            }
        }

        let enemiesInAttackRange = Object.keys(collisions[MobCollisionTypes.ATTACK_RANGE] ?? {}).length > 0

        return {
            isInExtraSmallCombatRange,
            isInSmallCombatRange,
            isInMediumCombatRange,
            isInLargeCombatRange,
            isInExtraLargeCombatRange,
            enemiesInAttackRange,
        }

    }, [collisions])

    useEffect(() => {
        setCollisionsState(collisionsState)
    }, [collisionsState])

    useOnCollisionBegin(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collidedCollisionType = getFixtureCollisionType(fixture)
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(state => ({
            ...state,
            [collisionType]: {
                ...(state[collisionType] ?? {}),
                [collidedId]: {
                    fixtureTypes: {
                        ...(state?.[collisionType]?.[collidedId]?.fixtureTypes ?? {}),
                        [collidedCollisionType]: Date.now(),
                    },
                    body: state?.[collisionType]?.body ?? fixture.getBody(),
                },
            }
        }))
    })

    useOnCollisionEnd(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collidedCollisionType = getFixtureCollisionType(fixture)
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(state => {
            const update: any = {
                ...state,
                [collisionType]: {
                    ...(state[collisionType] ?? {}),
                }
            }
            if (update[collisionType][collidedId]) {
                delete update[collisionType][collidedId].fixtureTypes[collidedCollisionType]
                if (Object.keys(update[collisionType][collidedId].fixtureTypes).length === 0) {
                    delete update[collisionType][collidedId]
                }
            }
            if (update[collisionType] && Object.keys(update[collisionType]).length === 0) {
                delete update[collisionType]
            }
            return update
        })
    })

    return null
}
