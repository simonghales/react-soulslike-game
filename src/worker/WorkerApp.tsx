import { World } from "planck";
import React, {useEffect, useState} from "react"
import {KeysConsumer, PlanckjsCollisions, PlanckjsPhysicsProvider, SyncableComponents} from "@simonghales/react-three-physics";
import {LgPlayer} from "../game/player/LgPlayer";
import {WorldProvider} from "./WorldProvider";
import {LgBasicMob} from "../game/mobs/LgBasicMob";
import {MobsHandler} from "../game/mobs/MobsHandler";
import {DeadBodiesHandler} from "../game/mobs/backend/DeadBodiesHandler";

export const WorkerApp: React.FC<{
    worker: Worker
}> = ({worker}) => {
    const [world, setWorld] = useState<World | null>(null)

    useEffect(() => {
        setWorld(new World())
    }, [])

    if (!world) return null

    return (
        <PlanckjsPhysicsProvider worker={worker} world={world} lerpUpdates={false} manualSteps>
            <WorldProvider world={world}>
                <KeysConsumer>
                    <PlanckjsCollisions world={world}>
                        <SyncableComponents components={{}}>
                            <LgPlayer/>
                            <MobsHandler/>
                            <DeadBodiesHandler/>
                        </SyncableComponents>
                    </PlanckjsCollisions>
                </KeysConsumer>
            </WorldProvider>
        </PlanckjsPhysicsProvider>
    )
}
