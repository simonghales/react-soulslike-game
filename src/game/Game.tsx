import {Box, OrbitControls, Plane} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react"
import styled from "styled-components";
import {Player} from "./player/Player";
import {Engine} from "./Engine";
import {Scenery} from "./Scenery";
import {PlayerCamera} from "./player/PlayerCamera";
import { SyncableComponents } from "react-three-physics";
import {mainSyncableComponents} from "./data/mainSyncableComponents";
import {GameUI} from "./ui/GameUI";

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export const Game: React.FC = () => {
    return (
        <StyledContainer>
            <Canvas>
                <Engine>
                    <SyncableComponents components={mainSyncableComponents}>
                        <Scenery/>
                        <Player/>
                        {/*<OrbitControls/>*/}
                    </SyncableComponents>
                </Engine>
            </Canvas>
            <GameUI/>
        </StyledContainer>
    )
}