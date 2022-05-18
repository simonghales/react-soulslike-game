import React from "react"
import {useDeadBodies} from "../../state/game";
import {LgMobDeadBody} from "./LgMobDeadBody";

export const DeadBodiesHandler: React.FC = () => {

    const deadBodies = useDeadBodies()

    return (
        <>
            {
                Object.entries(deadBodies).map(([id, body]) => (
                    <LgMobDeadBody id={id} x={body.x} y={body.y} key={id}/>
                ))
            }
        </>
    )
}
