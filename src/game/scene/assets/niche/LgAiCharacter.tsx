import React from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../../data/keys";
import {getWorldPosition, sceneStateProxy} from "../../../state/backend/scene";
import {WorldPositionId} from "../../../data/ids";

export const LgAiCharacter: React.FC = () => {

    const position = getWorldPosition(WorldPositionId.L0_AI)

    console.log('position', position)

    return (
        <SyncComponent id={'ai'} position={position ?? [0, 0]} componentId={componentSyncKeys.aiCharacter}/>
    )
}
