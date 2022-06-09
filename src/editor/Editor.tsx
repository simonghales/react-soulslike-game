import {SceneEditor, SceneEditorControls } from "@simonghales/react-three-scene-editor";
import React from "react"
import {Game} from "../game/Game";

export const Editor: React.FC = () => {
    return (
        <SceneEditor>
            <Game isPlayMode={false}>
                <SceneEditorControls zAxisVertical/>
            </Game>
        </SceneEditor>
    )
}
