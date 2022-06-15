import React, {useState} from "react"
import Modal from 'react-modal';
import styled from "styled-components";
import {modalClassNames} from "../../ui/modal";
import {FaQuestion} from "react-icons/fa";

const StyledContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`

const StyledModalBody = styled.div`
  background-color: black;
  width: calc(100vw - 20px);
  max-width: 440px;
  padding: 20px 60px;
  border: 2px solid rgba(255,255,255,0.5);
`

const StyledButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  background: none;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  cursor: pointer;
  
  &:hover,
  &:focus {
    color: white;
    border-color: white;
  }
  
`

export const ScreenUI: React.FC = () => {

    const [showHelp, setShowHelp] = useState(false)

    const closeHelp = () => {
        setShowHelp(false)
    }

    return (
        <>
            <StyledContainer>
                <StyledButton onClick={() => {
                    setShowHelp(true)
                }}>
                    <FaQuestion/>
                </StyledButton>
            </StyledContainer>
            <Modal isOpen={showHelp} onRequestClose={closeHelp}
                   className={modalClassNames.modal}
                   overlayClassName={modalClassNames.overlay}>
                <StyledModalBody>
                    <header>
                        <h2>
                            Controls
                        </h2>
                    </header>
                    <div>
                        <h3>Movement</h3>
                        <p>WASD - Move</p>
                        <p>Space - Roll / back-step / jump</p>
                        <p>Shift - Sprint</p>
                    </div>
                    <div>
                        <h3>Combat</h3>
                        <p>Arrow keys - Directional attack</p>
                        <p>Arrow keys - Tap -&gt; short, hold -&gt; long </p>
                        <p>'Q' - Lock on to target</p>
                        <p>'E' - Release target-lock</p>
                    </div>
                </StyledModalBody>
            </Modal>
        </>
    )
}
