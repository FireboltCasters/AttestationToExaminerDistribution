import React, {Component} from 'react';
import {FunctionComponent} from "react";

export const SidebarNodes: FunctionComponent = ({nodeTypes, ...props}) => {

    function onDragStart(event, nodeType, data){
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/customData', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    }

    let customNodes = [];
    if(!!nodeTypes){
        let keys = Object.keys(nodeTypes);
        for(let key of keys){
            const CustomNode = nodeTypes[key];
            const DragableNode = (
                <div style={{flex: 1, display: "flex", justifyContent: "center", alignItems: "center"}} className="output" onDragStart={(event) => onDragStart(event, key, {})} draggable>
                    <div style={{cursor: "grab"}}>
                        <CustomNode />
                    </div>
                </div>
            );

            customNodes.push(
                <div style={{padding: 10 ,flex: 1, display: "flex", width: "100%", alignItems: "center", justifyContent: "center"}}>
                    <div style={{borderRadius: 20 ,padding: 10 ,flex: 1, display: "flex", width: "100%", backgroundColor: "white", alignItems: "center", justifyContent: "center"}}>
                        {DragableNode}
                    </div>
                </div>
            );
        }
    }

    return (
        <div>
            <div style={{width: "100%", padding: 10}}>
                <div className="description">Drag and drop a new node to the left</div>
            </div>
            {customNodes}
        </div>
    );
}