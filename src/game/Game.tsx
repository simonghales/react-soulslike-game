import {Box, OrbitControls, Plane, Stats} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, {Suspense, useEffect} from "react"
import styled from "styled-components";
import {Player} from "./player/Player";
import {Engine} from "./Engine";
import {Scenery} from "./Scenery";
import {PlayerCamera} from "./player/PlayerCamera";
import { SyncableComponents } from "@simonghales/react-three-physics";
import {mainSyncableComponents} from "./data/mainSyncableComponents";
import {GameUI} from "./ui/GameUI";
import {SceneManager} from "./scene/SceneManager";
import {StateSync} from "./state/frontend/StateSync";
import {GameContext} from "./GameContext";
import { SceneEditor, SceneEditorControls } from "@simonghales/react-three-scene-editor";
import {Scene} from "./scene/Scene";

const StyledContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export const Game: React.FC<{
    isPlayMode?: boolean,
}> = ({children, isPlayMode = true}) => {

    useEffect(() => {
        window.addEventListener('blur', () => {
        })
        window.addEventListener('focus', () => {
        })
    }, [])

    const inner = (
        <>
            <Scenery/>
            <Scene/>
            {children}
        </>
    )

    return (
        <>
            <StyledContainer>
                <Canvas>
                    <GameContext.Provider value={{
                        isPlayMode,
                    }}>
                        <SceneManager>
                            {
                                isPlayMode ? (
                                    <Engine>
                                        <SyncableComponents components={mainSyncableComponents}>
                                            <StateSync/>
                                            {inner}
                                        </SyncableComponents>
                                    </Engine>
                                ) : inner
                            }
                            {/*<Stats/>*/}
                        </SceneManager>
                    </GameContext.Provider>
                </Canvas>
                {
                    isPlayMode && (
                        <GameUI/>
                    )
                }
            </StyledContainer>
        </>
    )
}
