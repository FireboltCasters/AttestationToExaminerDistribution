import React, {useState} from 'react';
import {FunctionComponent} from "react";
import {Toolbar} from "primereact/toolbar";
import { FileUpload } from 'primereact/fileupload';
import {Button} from "primereact/button";
import DownloadHelper from "../helper/DownloadHelper";
import ParseStudIPCSVToJSON from "../../api/src/ignoreCoverage/ParseStudIPCSVToJSON";
import GraphHelper from "../../api/src/ignoreCoverage/GraphHelper";

import jsgraphs from "js-graph-algorithms";
import {JSONToGraph} from "../../api/src";
console.log(jsgraphs);

export interface AppState{
    handleSwitchSelection: any,
    selectedSlotFirst: any,
    selectedSlotSecond: any,
    newPlan: any,
    setNewPlan: any,
    setOldPlan: any;
    oldPlan: any;
    setReloadNumber?: any,
    reloadNumber?: any
}
export const MyToolbar: FunctionComponent<AppState> = ({selectedSlotFirst, selectedSlotSecond, handleSwitchSelection, setOldPlan, oldPlan, setReloadNumber, newPlan, setNewPlan, reloadNumber, ...props}) => {

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
            setNewPlan(null);
            //setReloadNumber(reloadNumber + 1);
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
            setNewPlan(null);
            //setReloadNumber(reloadNumber + 1);
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
        console.log("optimizedPlan");
        console.log(optimizedPlan);

        setNewPlan(optimizedPlan);
        //setReloadNumber(reloadNumber+1)
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

        let groupsForTutorInOldPlan = ParseStudIPCSVToJSON.getGroupsForTutors(oldPlan)
        let groupsForTutorInNewPlan = ParseStudIPCSVToJSON.getGroupsForTutors(newPlan)
        for(let tutor of tutors){
            //@ts-ignore
            let tutorAuslastungOld = Object.keys(groupsForTutorInOldPlan[tutor] || {})?.length;
            //@ts-ignore
            let tutorAuslastungNew = Object.keys(groupsForTutorInNewPlan[tutor] || {})?.length;
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

    function renderDownloadGroupsForTutor(){
        return(
            <Button label={"Download Tutors groups"} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {
                let usePlan = newPlan || oldPlan;
                let groupsForTutor = ParseStudIPCSVToJSON.getGroupsForTutors(usePlan);
                DownloadHelper.downloadTextAsFiletile(JSON.stringify(groupsForTutor, null, 2), "tutorsGroups.json")
            }} />
        )
    }

    function getTableTdsFromList(list: string[]): string{
        let tds = "";
        for(let item of list){
            tds += '\t\t\t<td>'+item+'</td>\n';
        }
        return tds;
    }

    function getContentForCell(time: string, day: string, plan: any): string{
        let groups = plan?.groups || {};
        let groupNames = Object.keys(groups);
        let content = "";
        let listContent = "";
        for(let groupName of groupNames){
            let group = groups[groupName];
            let selectedSlot = group?.selectedSlot;
            if(selectedSlot?.time === time && selectedSlot?.day === day){
                let tutor = selectedSlot?.tutor;
                listContent += '\t\t\t\t<li>'+groupName+' (bei '+tutor+')'+'</li>\n';
            }
        }
        if(listContent){
            content = '\t\t\t<ul>\n'+listContent+'\t\t\t</ul>\n';
        }
        return content;
    }

    function getPlanAsStudipTable(){
        let usePlan = newPlan || oldPlan;

        let workingWeekdays = JSONToGraph.getWorkingWeekdays();
        let timeslots = JSONToGraph.getTimeslots();

        let headerTexts = ["Uhrzeit"];
        for(let weekday of workingWeekdays){
            let germanWeekday = JSONToGraph.getWeekdayTranslation(weekday);
            headerTexts.push(germanWeekday);
        }
        let header = '\t\t<tr>\n' +
            getTableTdsFromList(headerTexts) +
            '\t\t</tr>';

        let rows = "";
        for(let timeslot of timeslots){
            let rowTexts = [timeslot];
            for(let weekday of workingWeekdays){
                let textForCell = getContentForCell(timeslot, weekday, usePlan);
                rowTexts.push(textForCell);
            }

            let row = '\t\t<tr>\n' +
                getTableTdsFromList(rowTexts) +
                '\t\t</tr>\n';
            rows += row;
        }

        return '<table class="content">\n' +
            '\t<tbody>\n' +
            header +'\n'+
            rows+'\n'+
            '\t</tbody>\n' +
            '</table>\n';

    }

    function renderDownloadAsStudipHTMLTableButton(){
        return(
            <Button label={"Download As StudIP HTML Table"} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {
                let htmlTable = getPlanAsStudipTable();
                DownloadHelper.downloadTextAsFiletile(htmlTable, "studipHTMLTable.txt")
            }} />
        )
    }

    function renderSpitLine(){
        return (
            <div style={{width: "100%", height: 2, backgroundColor: "gray", marginTop: 20, marginBottom: 20}}></div>
        )
    }

    function renderSwitchButton(){
        let disabled = (selectedSlotFirst && selectedSlotSecond) ? false : true;
        let label = disabled ? "Switch (select 2)" : "Switch selection";

        return (
            <Button disabled={disabled} label={label} icon="pi pi-arrows-h" className="p-button-warning" style={{margin: 5}} onClick={() => {handleSwitchSelection()}} />
        )
    }

    const uploadOptions = {label: 'Load JSON', icon: 'pi pi-upload', className: 'p-button-success'};
    const leftContents = (
        <div style={{width: "100%", flexGrow: 1, flex: 1, backgroundColor: "#EEEEEE", paddingLeft: 20,paddingTop: 20, paddingRight: 20}}>
            {renderParseStudipFileUpload()}
            <FileUpload auto chooseOptions={uploadOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImport(event)}} style={{margin: 5}} />
            {renderOptimizeButton()}
            {renderSwitchButton()}
            {renderSpitLine()}
            {renderDownloadButton()}
            {renderDownloadGroupsForTutor()}
            {renderDownloadAsStudipHTMLTableButton()}
            {renderSpitLine()}
            <div key={"info"} style={{flexDirection: "row", display: "flex", paddingBottom: 20}}>
                <div key={"Tutor Auslastung"} style={{flexGrow: 1, flex: 4}}>{"Tutor Auslastung"}</div>
                <div key={"vorher"} style={{flexGrow: 1, flex: 1}}>{"vorher"}</div>
                <div key={"space"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                <div key={"nachher"} style={{flexGrow: 1, flex: 1}}>{"nachher"}</div>
            </div>
            <div style={{width: "100%"}}>
                {renderTutorAuslastung()}
            </div>
            {renderSpitLine()}
        </div>
    );

    const iconCalcAuto = "pi pi-sync"
    const iconCalcManual = "pi pi-refresh"

    return leftContents
  }
