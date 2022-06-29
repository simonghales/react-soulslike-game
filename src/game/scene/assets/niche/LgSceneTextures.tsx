import { SyncComponent } from "@simonghales/react-three-physics"
import React from "react"
import {componentSyncKeys} from "../../../data/keys";

export const LgSceneTextures: React.FC = () => {
    return <SyncComponent componentId={componentSyncKeys.sceneTextures} id={'lv0'}/>
}
