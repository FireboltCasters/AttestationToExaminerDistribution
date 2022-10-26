import React, {useState} from 'react';
import {FunctionComponent} from "react";
import {Toolbar} from "primereact/toolbar";
import { FileUpload } from 'primereact/fileupload';
import {Button} from "primereact/button";
import DownloadHelper from "../helper/DownloadHelper";
import NetzplanHelper from "./NetzplanHelper";
import {SplitButton} from "primereact/splitbutton";

export interface AppState{
    autocalc?: any,
    setAutoCalc?: any,
    nodes?: any,
    setNodes?: any,
    edges?: any,
    setEdges?: any,
    handleCalc?: any,
    handleLayout: any,
    handleClear?: any
    setReloadNumber?: any,
    reloadNumber?: any
}
export const MyToolbar: FunctionComponent<AppState> = ({autocalc, setAutoCalc, nodes, edges, setEdges, setNodes, setReloadNumber, reloadNumber, handleCalc,handleLayout, handleClear, ...props}) => {

    function handleExport(){
        let elements = {
            nodes: nodes,
            edges: NetzplanHelper.removeEdgeStyle(JSON.parse(JSON.stringify(edges)))
        };
        DownloadHelper.downloadTextAsFiletile(JSON.stringify(elements), "graph.json")
    }

    function handleImport(event: any){
        let files = event.files;
        let file = files[0];
        const reader = new FileReader();
        reader.addEventListener('load', async (event) => {
            let content: string = ""+event?.target?.result;
            console.log(content);
            let elements = JSON.parse(content);
            setNodes([])
            setEdges([])
            await sleep(100);
            setNodes(elements?.nodes)
            setEdges(NetzplanHelper.applyDefaultEdgeStyle(elements?.edges));
            setReloadNumber(reloadNumber+1);
        });
        reader.readAsText(file);
    }

    async function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    const uploadOptions = {label: 'Upload', icon: 'pi pi-upload', className: 'p-button-success'};
    const leftContents = (
        <React.Fragment>
          <Button label="New" icon="pi pi-plus" className="mr-2" style={{margin: 5}} onClick={() => {handleClear()}} />
          <FileUpload auto chooseOptions={uploadOptions} accept="application/JSON" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImport(event)}} style={{margin: 5}} />
          <Button label="Download" icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {handleExport()}} />
        </React.Fragment>
    );

    const iconCalcAuto = "pi pi-sync"
    const iconCalcManual = "pi pi-refresh"

    const items = [
        {
            label: 'Auto-Calc',
            icon: iconCalcAuto,
            command: () => {
                setAutoCalc(!autocalc)
            }
        },
        {
            label: 'Calc',
            icon: iconCalcManual,
            command: () => {
                setAutoCalc(!autocalc)
            }
        }
    ];

    let calcLabel = autocalc ? "Auto-Calc" : "Calc"
    let calcIcon = autocalc ? iconCalcAuto : iconCalcManual

    const rightContents = (
        <React.Fragment>
            <SplitButton label={calcLabel} icon={calcIcon} model={items} className="p-button-warning" onClick={() => {handleCalc()}} />
            <Button label="Auto Layout" icon="pi pi-sitemap" className="p-button-success" style={{margin: 5}} onClick={() => {handleLayout()}} />
            <Button label="Clear" icon="pi pi-trash" className="p-button-danger" style={{margin: 5}} onClick={() => {handleClear()}} />
        </React.Fragment>
    );

    return <Toolbar left={leftContents} right={rightContents} />
  }