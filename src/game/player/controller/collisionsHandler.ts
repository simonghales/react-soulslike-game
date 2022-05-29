import {useEffect, useMemo, useState} from "react";
import {useOnCollisionBegin, useOnCollisionEnd} from "@simonghales/react-three-physics";
import {Fixture} from "planck/dist/planck-with-testbed";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../../utils/physics";
import {CollisionTypes, PlayerAttackCollisionTypes, PlayerRangeCollisionTypes} from "../../data/collisions";
import {PlayerCollisionsState} from "../types";
import {Body} from "planck";
import {setPlayerCollidedSensors} from "../../state/backend/player";

export type PlayerCollisionsData = Record<string, Record<string, Body>>

export const useCollisionsHandler = (id: string) => {

    const [activeCollisions, setActiveCollisions] = useState({} as PlayerCollisionsData)

    useOnCollisionBegin(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setActiveCollisions(prev => {
            const update = {
                ...prev
            }
            if (!update[collisionType]) {
                update[collisionType] = {}
            }
            update[collisionType][collidedId] = fixture.getBody()
            return update
        })
    })

    useOnCollisionEnd(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setActiveCollisions(prev => {
            const update = {
                ...prev
            }
            if (!update[collisionType]) {
                return update
            }
            delete update[collisionType][collidedId]
            return update
        })
    })

    return activeCollisions

}


export const useCollisionsState = (collisions: PlayerCollisionsData, combatCollisions: PlayerCollisionsData) => {

    const collisionsState = useMemo<PlayerCollisionsState>(() => {

        const enemiesInLongAttackSensor: string[] = []
        const enemiesInShortAttackSensor: string[] = []
        const collidedSensors: string[] = []

        Object.entries(collisions[PlayerRangeCollisionTypes.PLAYER] ?? {}).forEach(([id, body]) => {
            if ((body.getUserData() as any)?.collisionType === CollisionTypes.SENSOR) {
                collidedSensors.push(id)
            }
        })

        Object.keys(combatCollisions[PlayerAttackCollisionTypes.QUICK_ATTACK] ?? {}).forEach((id) => {
            enemiesInShortAttackSensor.push(id)
        })
        Object.keys(combatCollisions[PlayerAttackCollisionTypes.LONG_ATTACK] ?? {}).forEach((id) => {
            enemiesInLongAttackSensor.push(id)
        })

        setPlayerCollidedSensors(collidedSensors)

        return {
            enemiesInLongAttackSensor,
            enemiesInShortAttackSensor,
            collidedSensors,
        }
    }, [collisions, combatCollisions])

    return collisionsState

}
