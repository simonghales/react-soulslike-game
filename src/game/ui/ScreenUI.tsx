import React from "react"
import styled from "styled-components";

const StyledContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`

export const ScreenUI: React.FC = () => {
    return (
        <StyledContainer>
            <div>
                HELP?
            </div>
        </StyledContainer>
    )
}
