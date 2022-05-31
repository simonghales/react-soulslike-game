import React, {useCallback, useEffect, useMemo, useState} from "react"
import uniqid from 'uniqid';
import { useAutoAnimate } from '@formkit/auto-animate/react'
import styled, {css} from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/frontend/player";
import {PlayerInventoryItem} from "../state/backend/player";
import {ItemType} from "../data/types";
import {useOnCustomMessage} from "@simonghales/react-three-physics";
import {eventKeys, messageKeys} from "../data/keys";
import {eventEmitter} from "../events/general";
import {PlayerEventType} from "../events/player";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 140px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
`

const StyledMessageContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 20px;
  display: grid;
  grid-auto-flow: row;
  justify-content: center;
  grid-row-gap: 4px;
`

const StyledMessage = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
  //width: 100%;
  //max-width: 300px;
  background-color: rgba(0,0,0,0.75);
  border-radius: 4px;
  line-height: 1;
  grid-column-gap: 4px;
  border: 2px solid rgba(250, 218, 255, 0.5);
  padding: 2px;
  align-items: center;
`

const StyledMessageIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  background-color: rgba(44, 35, 138, 0.9);
  border-radius: 2px 0 0 2px;
  
  img {
    line-height: 0;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  
`

const StyledMessageText = styled.div`
  color: #c5b4d5;
  padding: 0 16px 0 12px;
  font-size: 16px;
  font-weight: 700;
  min-width: 200px;
  
  span {
    display: inline-block;
    margin-left: 6px;
    opacity: 0.5;
  }
  
`

const StyledContent = styled.div`
  border: 1px solid rgba(250, 218, 255, 0.5);
  display: grid;
  grid-auto-flow: column;
  border-radius: 4px;
  background-color: rgba(24, 20, 26, 0.51);
  padding: 4px;
  grid-column-gap: 4px;
`

const cssEmpty = css`
  background-color: rgba(0,0,0,0.25);
`

const StyledSlot = styled.div<{
    empty?: boolean,
}>`
  width: 48px;
  height: 48px;
  background-color: rgba(44, 35, 138, 0.9);
  // rgba(60, 55, 57, 0.9)
  border-radius: 4px;
  ${props => props.empty ? cssEmpty : ''};
`

const StyledItem = styled.div`
  height: 100%;
  position: relative;
`

const StyledImageWrapper = styled.div`
  height: 100%;
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    line-height: 0;
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  
`

const StyledItemCount = styled.div`
  position: absolute;
  top: 2px;
  right: 4px;
  font-weight: 900;
  font-size: 18px;
  color: rgba(255,255,255,0.75);
  text-shadow: -1px 1px 2px rgba(0,0,0,0.5),0 1px 0px rgba(0,0,0,0.5), 0 1px 5px #1f1d2294;
`

const useGetSortedInventory = () => {

    const inventory = useSnapshot(playerStateProxy.inventory)

    return Object.entries(inventory)

}

const numberOfSlots = 8

const ICON_PATHS: Record<string, string> = {
    [ItemType.MEDIUM_BRAIN]: "/assets/icons/brain.svg",
    [ItemType.MEDIUM_MEAT]: "/assets/icons/ham-shank.svg",
}

const itemsConfig = {
    [ItemType.MEDIUM_MEAT]: {
        name: 'Meat Portion',
    },
    [ItemType.MEDIUM_BRAIN]: {
        name: 'Brain Portion',
    },
}

const getIcon = (itemType: ItemType) => {

    const path = ICON_PATHS[itemType]

    if (path) {
        return <img src={path} />
    }

    return null

}

const getName = (itemType: ItemType) => {

    const name = itemsConfig[itemType]?.name

    return name || 'UNKNOWN_NAME'

}

const getCount = (count: number) => {
    if (count <= 1) {
        return ``
    }
    return (<span>({count})</span>)
}

const InventorySlot: React.FC<{
    item: PlayerInventoryItem,
}> = ({item}) => {

    return (
        <StyledSlot>
            <StyledItem>
                <StyledImageWrapper>
                    {
                        getIcon(item.type)
                    }
                </StyledImageWrapper>
                <StyledItemCount>
                    {item.count}
                </StyledItemCount>
            </StyledItem>
        </StyledSlot>
    )
}

const Message: React.FC<{
    data: MessageData,
    removeMessage: (id: string) => void,
}> = ({data, removeMessage}) => {

    useEffect(() => {
        const timeToWait = (data.time + 3000) - performance.now()
        const timeout = setTimeout(() => {
            removeMessage(data.id)
        }, timeToWait)
        return () => {
            clearTimeout(timeout)
        }
    }, [])

    return (
        <StyledMessage>
            <StyledMessageIcon>
                {
                    getIcon(data.type)
                }
            </StyledMessageIcon>
            <StyledMessageText>
                <p>
                    {getName(data.type)}{getCount(data.count)}
                </p>
            </StyledMessageText>
        </StyledMessage>
    )
}

export type MessageData = {
    id: string,
    time: number,
    count: number,
    type: ItemType,
}

const Messages: React.FC = () => {
    const [animationParent] = useAutoAnimate()
    const [messageList, setMessageList] = useState([] as MessageData[])

    const removeMessage = (id: string) => {
        setMessageList(messages => {
            const copy = [...messages]
            const index = copy.findIndex(message => message.id === id)
            if (index >= 0) {
                copy.splice(index, 1)
            }
            return copy
        })
    }

    useEffect(() => {

        const onMessage = (data: any) => {
            switch (data.type) {
                case PlayerEventType.ITEM_RECEIVED:
                    setMessageList(messages => {
                        const copy = [...messages]
                        copy.push({
                            id: uniqid(),
                            time: performance.now(),
                            type: data.data.type,
                            count: data.data.count,
                        })
                        return copy
                    })
                    break;
            }
        }

        eventEmitter.on(eventKeys.playerInventory, onMessage)

        return () => {
            eventEmitter.off(eventKeys.playerInventory, onMessage)
        }
    }, [])

    return (
        <StyledMessageContainer>
            {
                messageList.map((message => (
                    <Message data={message} removeMessage={removeMessage} key={message.id}/>
                )))
            }
        </StyledMessageContainer>
    )

}

export const InventoryUI: React.FC = () => {

    const sortedInventory = useGetSortedInventory()

    const inventorySlots = useMemo(() => {
        return Array.from({length: numberOfSlots}).map((_,index) => {
            return sortedInventory[index] ?? null
        })
    }, [sortedInventory])

    return (
        <StyledContainer>
            <Messages/>
            <StyledContent>
                {
                    inventorySlots.map((item, index) => {
                        return item ? (
                            <InventorySlot item={item[1]} key={index}/>
                        ) : <StyledSlot empty key={index}/>
                    })
                }
            </StyledContent>
        </StyledContainer>
    )
}
