import React from "react"
import {PlayerUI} from "./PlayerUI";
import {ScreenUI} from "./ScreenUI";

export const GameUI: React.FC = () => {
    return (
        <>
            <PlayerUI/>
            <ScreenUI/>
        </>
    )
}
