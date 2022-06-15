import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";
import {Game} from "./game/Game";
import {GlobalStyle} from "./ui/global";
import {Editor} from "./editor/Editor";

function App() {
  return (
      <>
        <GlobalStyle/>
          <BrowserRouter>
              <Routes>
                  <Route path="/" element={<Game/>}/>
                  <Route path="/editor" element={<Editor/>}/>
              </Routes>
          </BrowserRouter>
      </>
  );
}

export default App;
