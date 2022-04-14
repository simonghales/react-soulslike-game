import {Fixture} from "planck/dist/planck-with-testbed";

export const halve = (amount: number) => {
    return amount / 2
}

export const getFixtureCollisionType = (fixture: Fixture) => {
    return (fixture.getUserData() as any)?.collisionType
}

export const getFixtureCollisionId = (fixture: Fixture) => {
    return (fixture.getUserData() as any)?.collisionId
}
