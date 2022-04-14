import React from "react"
import styled from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/player";

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`

const StyledEnergyContainer = styled.div`
  width: 320px;
  height: 18px;
  background-color: white;
  position: relative;
  overflow: hidden;
`

const StyledEnergyAmount = styled.div<{
    energyAmount: number,
}>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: green;
  transform: translateX(-${props => props.energyAmount}%);
`

export const PlayerUI: React.FC = () => {

    const energyUsage = useSnapshot(playerStateProxy).energyUsage

    const maxEnergy = 150

    const energyAmount = Math.ceil((energyUsage / maxEnergy) * 100)

    return (
        <StyledContainer>
            <StyledEnergyContainer>
                <StyledEnergyAmount energyAmount={energyAmount}/>
            </StyledEnergyContainer>
        </StyledContainer>
    )
}
