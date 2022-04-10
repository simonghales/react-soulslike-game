import React from "react"
import styled from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/player";

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`

export const PlayerUI: React.FC = () => {

    const energyUsage = useSnapshot(playerStateProxy).energyUsage

    return (
        <StyledContainer>
            Energy: {energyUsage}
        </StyledContainer>
    )
}
