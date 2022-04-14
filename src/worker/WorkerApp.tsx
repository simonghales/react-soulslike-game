import { World } from "planck";
import React, {useEffect, useState} from "react"
import {KeysConsumer, PlanckjsCollisions, PlanckjsPhysicsProvider, SyncableComponents} from "react-three-physics";
import {LgPlayer} from "../game/player/LgPlayer";
import {WorldProvider} from "./WorldProvider";
import {LgBasicMob} from "../game/mobs/LgBasicMob";

export const WorkerApp: React.FC<{
    worker: Worker
}> = ({worker}) => {
    const [world, setWorld] = useState<World | null>(null)

    useEffect(() => {
        setWorld(new World())
    }, [])

    if (!world) return null

    return (
        <PlanckjsPhysicsProvider worker={worker} world={world}>
            <WorldProvider world={world}>
                <KeysConsumer>
                    <PlanckjsCollisions world={world}>
                        <SyncableComponents components={{}}>
                            <LgPlayer/>
                            <LgBasicMob id={'basicMob--0'} x={-2}/>
                            <LgBasicMob id={'basicMob--1'}/>
                            <LgBasicMob id={'basicMob--2'} x={0} y={-5}/>
                        </SyncableComponents>
                    </PlanckjsCollisions>
                </KeysConsumer>
            </WorldProvider>
        </PlanckjsPhysicsProvider>
    )
}
