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

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export const Game: React.FC = () => {

    useEffect(() => {
        window.addEventListener('blur', () => {
        })
        window.addEventListener('focus', () => {
        })
    }, [])

    return (
        <StyledContainer>
            <Canvas>
                <SceneManager>
                    <Engine>
                        <SyncableComponents components={mainSyncableComponents}>
                            <StateSync/>
                            <Scenery/>
                            <Suspense fallback={null}>
                                <Player/>
                            </Suspense>
                            {/*<OrbitControls/>*/}
                        </SyncableComponents>
                    </Engine>
                    {/*<Stats/>*/}
                </SceneManager>
            </Canvas>
            <GameUI/>
        </StyledContainer>
    )
}
