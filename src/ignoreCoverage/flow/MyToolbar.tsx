import React, {useState} from 'react';
import {FunctionComponent} from "react";
import {Toolbar} from "primereact/toolbar";
import { FileUpload } from 'primereact/fileupload';
import {Button} from "primereact/button";
import DownloadHelper from "../helper/DownloadHelper";
import NetzplanHelper from "./NetzplanHelper";
import {SplitButton} from "primereact/splitbutton";
import ParseStudIPCSV from "../../api/src/ignoreCoverage/ParseStudIPCSV";
import ExampleCSVContent from "../../api/src/ignoreCoverage/ExampleCSVContent";
import GraphHelper from "../../api/src/ignoreCoverage/GraphHelper";

import jsgraphs from "js-graph-algorithms";
console.log(jsgraphs);

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

            let output = await ParseStudIPCSV.parse(content);
            console.log("++++  Output +++++");
            console.log(output);
            console.log("++++++++++++++++++");
            let nameToVertice = ParseStudIPCSV.getHelpingMapToVertices(output);
            console.log("++++  Name to Vertice +++++");
            console.log(nameToVertice)
            console.log("++++++++++++++++++");
            let verticeToName = ParseStudIPCSV.getHelpingMapVerticiesToName(nameToVertice);
            console.log("++++  Vertice to Name +++++");
            console.log(verticeToName)
            console.log("++++++++++++++++++");
            let tutorCapacity = 16;

            let initialGraph = ParseStudIPCSV.getGraph(output, nameToVertice, tutorCapacity);
            console.log("++++  Initial Graph +++++");
            console.log(initialGraph)
            console.log("++++++++++++++++++");

            let nodes = [];
            let edges = [];
            nodes.push({"id":"Start","type":"input","data":{"label":"Start"},"position":{"x":260.5,"y":-76},"width":150,"height":36},)
            edges.push({"source":"Start","target":0,"id":"reactflow__edge-Start-Activity_0"})
            nodes.push({
                id: "Ende", //sink
                type: "ReactFlowNetzplanNode",
                data: {
                    label: "Sink",
                    type: "Ende"
                },
                width:150,height:36,
                position:{x:260.5,y:-76}
            });


            let verticeIds = Object.keys(initialGraph);
            for(let i = 0; i < verticeIds.length; i++){
                let verticeId = verticeIds[i];
                let vertice = initialGraph[verticeId];
                let name = verticeToName[verticeId];
                let node = {
                    id: verticeId,
                    type: "ReactFlowNetzplanNode",
                    data: {
                        label: name,
                        type: "Knoten"
                    },
                    width:150,height:36,
                    position:{x:260.5,y:-76}
                };
                nodes.push(node);

                let connectionToVerticeIds = Object.keys(vertice);
                console.log("++++  Connection to Vertice Ids +++++");
                console.log(connectionToVerticeIds)
                for(let j = 0; j < connectionToVerticeIds.length; j++){
                    let connectionToVerticeId = connectionToVerticeIds[j];
                    let connectionToVertice = vertice[connectionToVerticeId];
                    if(connectionToVerticeId === '1'){
                        connectionToVerticeId = "Ende"
                    }
                    let edge = {"source":verticeId,"target":connectionToVerticeId,"targetHandle":null,"id":"reactflow__edge-"+verticeId+"-"+connectionToVerticeId}
                    edges.push(edge);
                }
            }

            console.log("++++  Nodes +++++");
            console.log(nodes)
            console.log("++++++++++++++++++");
            console.log("++++  Edges +++++");
            console.log(edges)
            console.log("++++++++++++++++++");




            let minTutorCapacity = GraphHelper.getMinTutorCapacity(output, nameToVertice, verticeToName, tutorCapacity);
            console.log("++++  Min Tutor Capacity +++++");
            console.log(minTutorCapacity)
            console.log("++++++++++++++++++");
            let result = GraphHelper.getTutorDistribution(output, nameToVertice, verticeToName, minTutorCapacity);



            setNodes(nodes)
            setEdges(edges)
            await sleep(100);
            //setNodes(elements?.nodes)
            //setEdges(NetzplanHelper.applyDefaultEdgeStyle(elements?.edges));
            setReloadNumber(reloadNumber+1);
        });
        reader.readAsText(file);
    }

    async function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    const uploadOptions = {label: 'Load CSV', icon: 'pi pi-upload', className: 'p-button-success'};
    const leftContents = (
        <React.Fragment>
          <FileUpload auto chooseOptions={uploadOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImport(event)}} style={{margin: 5}} />
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
            <Button label="Distribute" icon="pi pi-sitemap" className="p-button-success" style={{margin: 5}} onClick={() => {handleLayout()}} />
            <Button label="Auto Layout" icon="pi pi-sitemap" className="p-button-success" style={{margin: 5}} onClick={() => {handleLayout()}} />
            <Button label="Clear" icon="pi pi-trash" className="p-button-danger" style={{margin: 5}} onClick={() => {handleClear()}} />
        </React.Fragment>
    );

    return <Toolbar left={leftContents} right={rightContents} />
  }
