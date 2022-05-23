import React, {useMemo} from "react"
import styled, {css} from "styled-components";
import {useSnapshot} from "valtio";
import {playerStateProxy} from "../state/frontend/player";
import {PlayerInventoryItem} from "../state/backend/player";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 140px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
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

const InventorySlot: React.FC<{
    item: PlayerInventoryItem,
}> = ({item}) => {

    return (
        <StyledSlot>
            <StyledItem>
                <StyledImageWrapper>
                    <img src={"/assets/icons/jawbone.svg"} />
                </StyledImageWrapper>
                <StyledItemCount>
                    {item.count}
                </StyledItemCount>
            </StyledItem>
        </StyledSlot>
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
