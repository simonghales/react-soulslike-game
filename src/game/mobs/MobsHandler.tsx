import React from "react"
import {useMobs} from "../state/game";
import {LgBasicMob} from "./LgBasicMob";

export const MobsHandler: React.FC = () => {
    const mobs = useMobs()
    return (
        <>
            {
                Object.entries(mobs).map(([id, mob]) => {
                    if (mob.isDead) return null
                    return (
                        <LgBasicMob id={id} x={mob.x} y={mob.y} key={id}/>
                    )
                })
            }
        </>
    )
}
