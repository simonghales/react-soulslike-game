import React, {useEffect, useMemo, useState} from "react"
import {useOnCollisionBegin, useOnCollisionEnd} from "react-three-physics";
import {Body, Fixture} from "planck";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {MobCollisionTypes, PlayerRangeCollisionTypes} from "../data/collisions";
import {Collisions, CollisionStates} from "./MobContext";

export const useCollisionStates = (collisions: Collisions) => {

    return useMemo<CollisionStates>(() => {
        let isInLargeCombatRange = false
        let isInMediumCombatRange = false
        let isInSmallCombatRange = false
        let isInExtraLargeCombatRange = false

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
                if (collisions[MobCollisionTypes.BODY].player.fixtureTypes[PlayerRangeCollisionTypes.PLAYER_SMALL_COMBAT_RANGE]) {
                    isInSmallCombatRange = true
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

        let enemiesInAttackRange = Object.keys(collisions[MobCollisionTypes.ATTACK_RANGE] ?? {}).length > 0

        return {
            isInLargeCombatRange,
            isInMediumCombatRange,
            isInSmallCombatRange,
            isInExtraLargeCombatRange,
            enemiesInAttackRange,
        }
    }, [collisions])

}

export const useCollisionsHandler = (id: string) => {

    const [collisions, setCollisions] = useState({} as Collisions)

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

    return collisions

}
