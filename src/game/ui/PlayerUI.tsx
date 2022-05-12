import React from "react"
import styled from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/player";
import {playerConfig} from "../player/config";

const StyledContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
`

const StyledHealthContainer = styled.div`
  width: 320px;
  height: 18px;
  background-color: white;
  position: relative;
  overflow: hidden;
`

const StyledHealthAmount = styled.div<{
    percent: number,
}>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: red;
  transform: translateX(-${props => props.percent}%);
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

const StyledDeadMessageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledDeadMessage = styled.div`
    font-size: 2rem;
    color: red;
    font-weight: bold;
`

export const PlayerUI: React.FC = () => {

    const {
        energyUsage,
        healthRemaining,
    } = useSnapshot(playerStateProxy)

    const maxEnergy = 150

    const energyAmount = Math.ceil((energyUsage / maxEnergy) * 100)

    const healthAmount = 100 - Math.ceil((healthRemaining / playerConfig.defaultHealth) * 100)

    const playerDead = healthRemaining <= 0

    return (
        <>
            <StyledContainer>
                <StyledHealthContainer>
                    <StyledHealthAmount percent={healthAmount}/>
                </StyledHealthContainer>
                <StyledEnergyContainer>
                    <StyledEnergyAmount energyAmount={energyAmount}/>
                </StyledEnergyContainer>
            </StyledContainer>
            {
                playerDead && (
                    <StyledDeadMessageContainer>
                        <StyledDeadMessage>
                            you ded
                        </StyledDeadMessage>
                    </StyledDeadMessageContainer>
                )
            }
        </>
    )
}
