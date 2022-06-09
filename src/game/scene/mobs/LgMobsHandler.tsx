import React, {useMemo} from "react"
import {MobType} from "../../state/game";
import {MobsGroupHandler} from "../../mobs/MobsGroupHandler";
import {MobsManager} from "../../mobs/MobsHandler";
import {LgMob} from "../../mobs/LgMob";

export type MobData = {
    id: string,
    x: number,
    y: number,
    type: MobType,
}

export const LgMobsHandler: React.FC<{
    mobs: MobData[],
}> = ({mobs}) => {

    return (
        <>
            <MobsGroupHandler>
                <MobsManager>
                    {
                        mobs.map(mob => {
                            return <LgMob id={mob.id} type={mob.type} x={mob.x} y={mob.y} key={mob.id}/>
                        })
                    }
                </MobsManager>
            </MobsGroupHandler>
        </>
    )
}
