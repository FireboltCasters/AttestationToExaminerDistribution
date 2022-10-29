import React, {useState} from 'react';
import {FunctionComponent} from "react";
import {Toolbar} from "primereact/toolbar";
import { FileUpload } from 'primereact/fileupload';
import {Button} from "primereact/button";
import DownloadHelper from "../helper/DownloadHelper";
import ParseStudIPCSVToJSON from "../../api/src/ignoreCoverage/ParseStudIPCSVToJSON";
import GraphHelper from "../../api/src/ignoreCoverage/GraphHelper";

import jsgraphs from "js-graph-algorithms";
console.log(jsgraphs);

export interface AppState{
    newPlan: any,
    setNewPlan: any,
    setOldPlan: any;
    oldPlan: any;
    setReloadNumber?: any,
    reloadNumber?: any
}
export const MyToolbar: FunctionComponent<AppState> = ({setOldPlan, oldPlan, setReloadNumber, newPlan, setNewPlan, reloadNumber, ...props}) => {

    function parseStudipCSVToJSON(event: any){
        console.log("parseStudipCSVToJSON");
        console.log(event);
        let files = event.files;
        let file = files[0];
        const reader = new FileReader();
        reader.addEventListener('load', async (event) => {
            console.log("File loaded");
            let content: string = "" + event?.target?.result;
            console.log(content);
            let json = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(content);
            DownloadHelper.downloadTextAsFiletile(JSON.stringify(json, null, 2), "parsedStudip.json")
            setOldPlan(json);
            setReloadNumber(reloadNumber + 1);
        });
        reader.readAsText(file);
    }

    function handleImport(event: any){
        let files = event.files;
        let file = files[0];
        const reader = new FileReader();
        reader.addEventListener('load', async (event) => {
            let content: string = ""+event?.target?.result;
            console.log(content);
            let json = JSON.parse(content);
            setOldPlan(json);
            setReloadNumber(reloadNumber + 1);
        });
        reader.readAsText(file);
    }

    async function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async function handleExport(){
       let json = newPlan
       DownloadHelper.downloadTextAsFiletile(JSON.stringify(json, null, 2), "export.json")
    }

    function renderParseStudipFileUpload(){
        const parseOptions = {label: 'Parse Stud.IP CSV', icon: 'pi pi-upload', className: 'p-button-warning'};
        return(
            <FileUpload key={reloadNumber} auto chooseOptions={parseOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {parseStudipCSVToJSON(event)}} style={{margin: 5}} />
        )
    }

    async function handleOptimize(){
        console.log("handleOptimize");
        console.log(oldPlan);
        let optimizedPlan = GraphHelper.getOptimizedDistribution(oldPlan);
        setNewPlan(optimizedPlan);
        setReloadNumber(reloadNumber+1)
    }

    function renderOptimizeButton(){
        let disabled = !oldPlan;
        let label = !!oldPlan ? "Optimize" : "No plan to optimize";

        return(
            <Button disabled={disabled} label={label} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {handleOptimize()}} />
        )
    }

    function renderDownloadButton(){
        let disabled = !newPlan;
        let label = !!newPlan ? "Download" : "No plan to download";

        return(
            <Button disabled={disabled} label={label} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {handleExport()}} />
        )
    }

    function countGroupsForTutor(plan: any, tutor: string){
        if(!plan){
            return undefined;
        }

        let amount = 0;
        let groups = plan?.groups || {};
        let groupNames = Object.keys(groups);
        for(let groupName of groupNames){
            let group = groups[groupName];
            let selectedSlot = group?.selectedSlot;
            if(selectedSlot?.tutor === tutor){
                amount++;
            }
        }


        return amount;
    }

    function renderTutorAuslastung(){
        let tutorsDict = oldPlan?.tutors || {};
        let tutors = Object.keys(tutorsDict);
        let renderedTutors = [];
        for(let tutor of tutors){
            let tutorAuslastungOld = countGroupsForTutor(oldPlan, tutor);
            let tutorAuslastungNew = countGroupsForTutor(newPlan, tutor);
            renderedTutors.push(
                <div key={tutor} style={{flexDirection: "row", display: "flex"}}>
                    <div key={tutor} style={{flexGrow: 1, flex: 4}}>{tutor+": "}</div>
                    <div key={tutor} style={{flexGrow: 1, flex: 1}}>{tutorAuslastungOld}</div>
                    <div key={tutor} style={{flexGrow: 1, flex: 1}}>{" ==> "}</div>
                    <div key={tutor} style={{flexGrow: 1, flex: 1}}>{tutorAuslastungNew}</div>
                </div>
            )
        }
        return renderedTutors;
    }

    const uploadOptions = {label: 'Load JSON', icon: 'pi pi-upload', className: 'p-button-success'};
    const leftContents = (
        <div style={{width: "100%", flexGrow: 1, flex: 1, backgroundColor: "#EEEEEE", paddingLeft: 20,paddingTop: 20, paddingRight: 20}}>
            {renderParseStudipFileUpload()}
            <FileUpload auto chooseOptions={uploadOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImport(event)}} style={{margin: 5}} />
            {renderOptimizeButton()}
            {renderDownloadButton()}
            <div style={{width: "100%", height: 2, backgroundColor: "gray", marginTop: 20, marginBottom: 20}}></div>
            <div key={"info"} style={{flexDirection: "row", display: "flex", paddingBottom: 20}}>
                <div key={"Tutor Auslastung"} style={{flexGrow: 1, flex: 4}}>{"Tutor Auslastung"}</div>
                <div key={"vorher"} style={{flexGrow: 1, flex: 1}}>{"vorher"}</div>
                <div key={"space"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                <div key={"nachher"} style={{flexGrow: 1, flex: 1}}>{"nachher"}</div>
            </div>
            <div style={{width: "100%"}}>
                {renderTutorAuslastung()}
            </div>
        </div>
    );

    const iconCalcAuto = "pi pi-sync"
    const iconCalcManual = "pi pi-refresh"

    return leftContents
  }
