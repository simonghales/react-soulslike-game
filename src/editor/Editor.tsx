import {SceneEditor, SceneEditorControls } from "@simonghales/react-three-scene-editor";
import React from "react"
import {Game} from "../game/Game";
import {gameScenes} from "../game/data/scenes";

export const Editor: React.FC = () => {
    return (
        <SceneEditor scenes={gameScenes}>
            <Game isPlayMode={false}>
                <SceneEditorControls zAxisVertical/>
            </Game>
        </SceneEditor>
    )
}
