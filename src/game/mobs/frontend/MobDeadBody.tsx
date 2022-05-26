import {Html, useTexture} from "@react-three/drei"
import React, {Suspense, useEffect, useLayoutEffect, useState} from "react"
import {usePhysicsRef} from "@simonghales/react-three-physics";
import styled, {css} from "styled-components";
import {uiTheme} from "../../../ui/theme";
import {MobType} from "../../state/game";

const baseScale = [1.5, 1.5, 1.5]
const largeScale = [2.5, 2.5, 2.5]

const Visuals: React.FC<{
    type: MobType,
}> = ({type}) => {
    const texture = useTexture("assets/mob-dead.png")
    return (
        <sprite scale={(type === MobType.LARGE ? largeScale : baseScale) as any} position={[0.125, 0, 0.05]}>
            <spriteMaterial map={texture} depthWrite={false} depthTest={false}/>
        </sprite>
    )
}

const cssInteracting = css`
  //background-color: #372bbbf0;
  box-shadow: inset 0 0 0 4px rgba(255,255,255,0.75);
`

const StyledContainer = styled.div`
  position: relative;
`

const cssCarving = css`
  opacity: 0;
`

const StyledPromptContainer = styled.div<{
    interacting?: boolean,
    carving?: boolean,
}>`
  background-color: ${uiTheme.colors.faintOverlay};
  box-shadow: inset 0 0 0 4px rgba(255,255,255,0.3);
  border-radius: 3px;
  color: white;
  padding: 8px 14px;
  font-size: 1.5rem;
  line-height: 1;
  transform: translate(30px, -20px);
  position: relative;
  overflow: hidden;
  
  span {
    position: relative;
  }

  transition: box-shadow 200ms ease, opacity 200ms 200ms ease;
  
  ${props => props.interacting ? cssInteracting : ''};
  ${props => props.carving ? cssCarving : ''};
  
`

const cssBackInteracting = css`
  transform: translateX(0);
  opacity: 1;
  transition: opacity 200ms ease, transform 300ms ease-in;
`

const StyledBackShade = styled.div<{
    interacting: boolean,
}>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #372bbbf0;
  transform: translateX(-100%);
  opacity: 0;
  transition: opacity 200ms ease, transform 50ms ease;
  ${props => props.interacting ? cssBackInteracting : ''};
`

export const MobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number
    isTarget: boolean,
    interacting: boolean,
    carving: boolean,
    interactionBegan: number,
    type: MobType,
}> = ({id, x, y, isTarget, interacting, carving, type}) => {

    const ref = usePhysicsRef(id)

    useLayoutEffect(() => {
        const group = ref.current
        if (!group) return
        group.position.x = x
        group.position.y = y
    }, [])

    const [engaged, setEngaged] = useState(false)

    useEffect(() => {
        if (interacting) {
            setEngaged(true)
        } else {
            const timeout = setTimeout(() => {
                setEngaged(false)
            }, 100)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [interacting])

    return (
        <group ref={ref}>
            <Suspense fallback={null}>
                <Visuals type={type}/>
            </Suspense>
            {
                (isTarget || engaged || carving) && (
                    <Html center>
                        <StyledContainer>
                            <StyledPromptContainer carving={carving} interacting={engaged || carving}>
                                <StyledBackShade interacting={engaged || carving}/>
                                <span>
                                    C
                                </span>
                            </StyledPromptContainer>
                        </StyledContainer>
                    </Html>
                )
            }
        </group>
    )
}
