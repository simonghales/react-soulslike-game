import {createGlobalStyle} from "styled-components";
import {cssModal} from "./modal";

export const GlobalStyle = createGlobalStyle`
  
  * {
    box-sizing: border-box;
  }
  
  body {
    color: white;
    font-family: 'Lato', sans-serif;
  }
  
  ${cssModal};
  
`
