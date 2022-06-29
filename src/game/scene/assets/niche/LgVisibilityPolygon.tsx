import React from "react"
import {getStaticPolygon} from "../../../state/backend/scene";
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../../data/keys";

export const LgVisibilityPolygon: React.FC<{
    id: string,
}> = ({id}) => {

    const data = getStaticPolygon(id)

    return null

    return (
        <SyncComponent data={data} id={data.id} componentId={componentSyncKeys.visibilityPolygon}/>
    )
}
