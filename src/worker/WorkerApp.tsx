import { World } from "planck";
import React, {useEffect, useState} from "react"
import {KeysConsumer, PlanckjsCollisions, PlanckjsPhysicsProvider, SyncableComponents} from "@simonghales/react-three-physics";
import {LgPlayer} from "../game/player/LgPlayer";
import {WorldProvider} from "./WorldProvider";
import {MobsHandler} from "../game/mobs/MobsHandler";
import {DeadBodiesHandler} from "../game/mobs/backend/DeadBodiesHandler";
import {LgStateSync} from "../game/state/backend/LgStateSync";
import {LgScene} from "../game/scene/LgScene";
import {CollisionsChecker} from "../game/physics/CollisionsChecker";
import {logicSyncableComponents} from "../game/data/logicSyncableComponents";

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
                        <SyncableComponents components={logicSyncableComponents}>
                            <CollisionsChecker/>
                            <LgScene/>
                            <LgStateSync/>
                            <MobsHandler/>
                            <DeadBodiesHandler/>
                        </SyncableComponents>
                    </PlanckjsCollisions>
                </KeysConsumer>
            </WorldProvider>
        </PlanckjsPhysicsProvider>
    )
}
