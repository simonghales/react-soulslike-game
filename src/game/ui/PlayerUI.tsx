import React, {useEffect, useState} from "react"
import styled from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/frontend/player";
import {playerConfig} from "../player/config";
import {useEffectRef} from "../../utils/hooks";
import {uiTheme} from "../../ui/theme";
import {InventoryUI} from "./InventoryUI";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 80px;
  right: 0;
  left: 0;
  display: flex;
  justify-content: center;
`

const StyledStatusBarsContainer = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 2px;
`

const classNames = {
    healthStyling: '_healthStyling',
}

const StyledStatusBarContainer = styled.div`
  width: 260px;
  height: 18px;
  background-color: ${uiTheme.colors.faintOverlay};
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.6);
  border-radius: 3px;
`

const StyledStatusBarAmount = styled.div.attrs((props: any) => ({
    style: {
        transform: `translateX(-${props.energyAmount}%)`,
    },
}))<{
    energyAmount: number,
}>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: #1d7bce;
  transition: all 100ms linear;
  
  .${classNames.healthStyling} & {
    background-color: #c40b1d;
  }
  
`

const StyledStatusBarAmountBack = styled(StyledStatusBarAmount)`
  background-color: #cec31d;
  transition: all 250ms linear;

  .${classNames.healthStyling} & {
    background-color: #cec31d;
  }
  
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

const StatusBar: React.FC<{
    amount: number,
    healthStyling?: boolean,
}> = ({amount, healthStyling}) => {

    const [delayedAmount, setDelayedAmount] = useState(amount)
    const [delayedAmountTarget, setDelayedAmountTarget] = useState(delayedAmount)

    const delay = delayedAmount !== delayedAmountTarget
    const delayRef = useEffectRef(delay)
    const delayedAmountRef = useEffectRef(delayedAmount)
    const delayedAmountTargetRef = useEffectRef(delayedAmountTarget)
    const [synced, setSynced] = useState(false)

    const [localState] = useState({
        previousAmount: amount,
    })

    useEffect(() => {
        if (!delay) {
            const timeout = setTimeout(() => {
                setSynced(true)
            }, 500)
            return () => {
                clearTimeout(timeout)
            }
        }
        setSynced(false)
        const timeout = setTimeout(() => {
            setDelayedAmount(delayedAmountTargetRef.current)
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [delay])

    useEffect(() => {
        if (!synced || delay) return
        const timeout = setTimeout(() => {
            setDelayedAmount(amount)
            setDelayedAmountTarget(amount)
        }, 250)
        return () => {
            clearTimeout(timeout)
        }
    }, [synced, delay, amount])


    useEffect(() => {
        const targetDifference = amount - delayedAmountTargetRef.current
        const energyDecreasing = amount > localState.previousAmount
        const previousEnergyAmount = localState.previousAmount
        localState.previousAmount = amount

        if (energyDecreasing) {
            if (previousEnergyAmount < delayedAmountRef.current) {
                setDelayedAmount(previousEnergyAmount)
                setDelayedAmountTarget(amount)
                return
            }
        }

        if (targetDifference <= 0) {
            return
        }

        if (targetDifference <= 2) {
            setDelayedAmountTarget(amount)
            if (!delayRef.current) {
                setDelayedAmount(amount)
            }
            return
        }

        setDelayedAmountTarget(amount)

    }, [amount])

    return (
        <StyledStatusBarContainer className={healthStyling ? classNames.healthStyling : ''}>
            <StyledStatusBarAmountBack energyAmount={delayedAmount}/>
            <StyledStatusBarAmount energyAmount={amount}/>
        </StyledStatusBarContainer>
    )

}

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
                <StyledStatusBarsContainer>
                    <StatusBar healthStyling amount={healthAmount}/>
                    <StatusBar amount={energyAmount}/>
                </StyledStatusBarsContainer>
            </StyledContainer>
            <InventoryUI/>
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
