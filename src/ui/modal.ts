import {css} from "styled-components";

export const modalClassNames = {
    modal: '_modal',
    overlay: '_modalOverlay',
}

export const cssModal = css`

  .${modalClassNames.modal} {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .${modalClassNames.overlay} {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.25);
    display: flex;
    justify-content: center;
    align-items: center;
  }

`
