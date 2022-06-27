import React, {useEffect} from "react"
import {ConversationPointData, ConversationPointTextData} from "./types";
import {Html} from "@react-three/drei";
import styled, {css} from "styled-components";
import {FaArrowLeft, FaArrowRight} from "react-icons/fa";

const StyledContainer = styled.div`
  width: auto;
  max-width: 500px;
  white-space: nowrap;
  color: black;
  font-weight: bold;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  height: 44px;
`

const StyledText = styled.div`
  padding: 12px;
  height: 100%;
  background-color: white;
`

const cssDisabled = css`
  color: rgba(0,0,0,0.2);
`

const StyledPrompt = styled.div<{
    disabled: boolean,
}>`
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: rgba(0,0,0,0.75);
  
  svg {
    font-size: 0.8em;
    margin-top: -3px;
  }
  
  &:first-child {
    padding-left: 12px;
  }
  
  &:last-child {
    padding-right: 12px;
  }
  
  ${props => props.disabled ? cssDisabled : ''}
  
`

export const ActiveDialogue: React.FC<{
    hasNextPoint: boolean,
    hasPrevPoint: boolean,
    text: ConversationPointTextData,
    position: null | [number, number]
}> = ({
                                       hasNextPoint,
                                       hasPrevPoint,
                                       text,
                                       position
}) => {

    return (
        <group position={position ? [position[0], position[1], 0] : undefined}>
            <Html center>
                <StyledContainer>
                    <StyledPrompt disabled={!hasPrevPoint}>
                        <div>
                            O
                        </div>
                        <FaArrowLeft/>
                    </StyledPrompt>
                    <StyledText>
                        {text.text}
                    </StyledText>
                    <StyledPrompt disabled={!hasNextPoint}>
                        <div>
                            P
                        </div>
                        <FaArrowRight/>
                    </StyledPrompt>
                </StyledContainer>
            </Html>
        </group>
    )
}
