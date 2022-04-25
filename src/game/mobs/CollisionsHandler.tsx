import React, {useEffect, useMemo, useState} from "react"
import {useOnCollisionBegin, useOnCollisionEnd} from "react-three-physics";
import {Body, Fixture} from "planck";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {MobCollisionTypes} from "../data/collisions";

export const useCollisionsHandler = (id: string) => {

    const [collisions, setCollisions] = useState({} as {
        // [MobCollisionTypes.ATTACK_RANGE]?: Record<string, Body>,
        [key: string]: Record<string, Body>,
    })

    useOnCollisionBegin(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(state => ({
            ...state,
            [collisionType]: {
                ...(state[collisionType] ?? {}),
                [collidedId]: fixture.getBody(),
            }
        }))
    })

    useOnCollisionEnd(id, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(state => {
            const update: any = {
                ...state,
                [collisionType]: {
                    ...(state[collisionType] ?? {}),
                }
            }
            delete update[collisionType][collidedId]
            return update
        })
    })

    return collisions

}
