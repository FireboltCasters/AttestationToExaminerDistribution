import React, {ReactNode, useState} from 'react';
import {FunctionComponent} from "react";
import {Toolbar} from "primereact/toolbar";
import { FileUpload } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import {Button} from "primereact/button";
import DownloadHelper from "../helper/DownloadHelper";
import ParseStudIPCSVToJSON from "../../api/src/ignoreCoverage/ParseStudIPCSVToJSON";
import GraphHelper from "../../api/src/ignoreCoverage/GraphHelper";

import jsgraphs from "js-graph-algorithms";
import {JSONToGraph} from "../../api/src";
import HtmlTableStudIp from "../helper/HtmlTableStudIp";

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

    const [displayBasic, setDisplayBasic] = useState(false);
    const [textImportValue, setTextImportValue] = useState("");

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
            setReloadNumber(reloadNumber + 1);
        });
        reader.readAsText(file);
    }

    function handleImportJson(event: any){
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

    function handleImportHtmlTable(event: any){
        let files = event.files;
        let file = files[0];
        const reader = new FileReader();
        reader.addEventListener('load', async (event) => {
            let content: string = ""+event?.target?.result;
            console.log(content);
            let json = HtmlTableStudIp.htmlToJson(content);
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
        let usePlan = !!newPlan ? newPlan : oldPlan;

       let json = JSON.parse(JSON.stringify(usePlan));
       let groupsNames = Object.keys(json.groups);
       for(let i = 0; i < groupsNames.length; i++){
           let groupName = groupsNames[i];
           let group = json.groups[groupName];
           let selectedSlot = group.selectedSlot;
           delete selectedSlot["id"];
       }

       DownloadHelper.downloadTextAsFiletile(JSON.stringify(json, null, 2), "export.json")
    }

    function renderParseStudipFileUpload(){
        const parseOptions = {label: 'Parse Stud.IP CSV', icon: 'pi pi-upload', className: 'p-button-warning'};
        return(
            <FileUpload key={reloadNumber+JSON.stringify(oldPlan)} auto chooseOptions={parseOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {parseStudipCSVToJSON(event)}} style={{margin: 5, display: "inline-block"}} />
        )
    }

    async function mergeSingleGroups(){
        let oldPlanWithMergedGroups = GraphHelper.mergeSingleGroups(oldPlan);
        setOldPlan(oldPlanWithMergedGroups);
    }

    async function handleOptimize(){
        let optimizedPlan = GraphHelper.getOptimizedDistribution(oldPlan);
        setNewPlan(optimizedPlan);
    }

    function renderImportTextButton(){
        return (
            <Button label="Import Text" icon="pi pi-upload" style={{margin: 5, display: "inline-block"}} onClick={() => {console.log("setDisplayBasic"); setDisplayBasic(true)}} />
            )
    }

    function renderOptimizeButton(){
        let disabled = !oldPlan;
        let label = !!oldPlan ? "Optimize" : "No plan to optimize";

        return(
            <Button disabled={disabled} label={label} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {handleOptimize()}} />
        )
    }

    function renderMergeSingleGroupsButton(){
        let disabled = !oldPlan;
        let label = !!oldPlan ? "Merge Single Groups" : "No plan to optimize";

        return(
            <Button disabled={disabled} label={label} icon="pi pi-download" className="p-button-information" style={{margin: 5}} onClick={() => {mergeSingleGroups()}} />
        )
    }

    function renderDownloadButton(){
        let usePlan = newPlan ? newPlan : oldPlan;
        let label = !!usePlan ? "Download" : "No plan to download";
        let disabled = !usePlan;

        return(
            <Button disabled={disabled} label={label} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {handleExport()}} />
        )
    }

    function getAmountOfferedSlotsForTutor(tutor_key: string, oldPlan: any){
        // let groupsForTutorInNewPlan = ParseStudIPCSVToJSON.getGroupsForTutors(oldPlan) || {};
        // @ts-ignore
        // let tutorAuslastung = Object.keys(groupsForTutorInNewPlan[tutor_key] || {})?.length;

        let tutorsDict = oldPlan?.tutors || {};
        let tutorsWeekdaysDict = tutorsDict[tutor_key] || {};

        let weekdays = Object.keys(tutorsWeekdaysDict) || [];
        let amountFreeSlots = 0;
        for(let weekday of weekdays){
            let slots = tutorsWeekdaysDict[weekday] || {};
            let amountSlotsForWeekday = Object.keys(slots).length;
            amountFreeSlots += amountSlotsForWeekday;
        }

        let totalSlots = amountFreeSlots;
        return totalSlots;
    }

    function renderTutorAuslastung(){
        let tutorsDict = oldPlan?.tutors || {};
        let tutorNamesDict = {}
        let tutorNames = Object.keys(tutorsDict);
        for(let tutorName of tutorNames){
            // @ts-ignore
            tutorNamesDict[tutorName] = tutorName;
        }

        let groupsDict = oldPlan?.groups || {};
        let groups = Object.keys(groupsDict);
        for(let group_key of groups){
            let group = groupsDict[group_key];
            let selectedSlot = group?.selectedSlot;
            let tutor = selectedSlot?.tutor;
            if(tutor){
                // @ts-ignore
                if(!tutorNamesDict[tutor]){
                    // @ts-ignore
                    tutorNamesDict[tutor] = "Error: Tutor not known: "+tutor;
                }
            }
        }

        let tutors = Object.keys(tutorNamesDict);
        let renderedTutors = [];

        let groupsForTutorInOldPlan = ParseStudIPCSVToJSON.getGroupsForTutors(oldPlan)
        let groupsForTutorInNewPlan = ParseStudIPCSVToJSON.getGroupsForTutors(newPlan)

        let index = 0;
        for(let tutor_key of tutors){
            index++;
            let backgroundColor = index % 2 == 0 ? "transparent" : "#ffffff";
            // @ts-ignore
            let tutor_name = tutorNamesDict[tutor_key];
            let tutor = tutor_key;
            //@ts-ignore
            let tutorAuslastungOld = Object.keys(groupsForTutorInOldPlan[tutor] || {})?.length;
            //@ts-ignore
            let tutorAuslastungNew = Object.keys(groupsForTutorInNewPlan[tutor] || {})?.length;
            let tutorMultiplier = oldPlan?.tutorMultipliers?.[tutor] || 1;
            let amountOfferedSlotsForTutor = getAmountOfferedSlotsForTutor(tutor, oldPlan);
            renderedTutors.push(
                <div key={tutor} style={{flexDirection: "row", display: "flex", backgroundColor: backgroundColor}}>
                    <div key={"tutorName"} style={{flexGrow: 1, flex: 4}}>{tutor_name+" ("+tutorMultiplier+")"+": "}</div>
                    <div key={"tutorAuslastung"} style={{flexGrow: 1, flex: 1}}>{tutorAuslastungOld}</div>
                    <div key={"split1"} style={{flexGrow: 1, flex: 1}}>{" ==> "}</div>
                    <div key={"tutorAuslastungNew"} style={{flexGrow: 1, flex: 1}}>{tutorAuslastungNew}</div>
                    <div key={"split2"} style={{flexGrow: 1, flex: 1}}>{" | "}</div>
                    <div key={"amountSlots"} style={{flexGrow: 1, flex: 1}}>{amountOfferedSlotsForTutor}</div>
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

    function renderDownloadAsStudipHTMLTableButton(){
        return(
            <Button label={"Download As StudIP HTML Table"} icon="pi pi-download" className="p-button-warning" style={{margin: 5}} onClick={() => {
                let htmlTable = HtmlTableStudIp.getPlanAsStudipTable(newPlan, oldPlan);
                DownloadHelper.downloadTextAsFiletile(htmlTable, "studipHTMLTable.txt")
            }} />
        )
    }

    function renderImportTextDialog(){
        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" onClick={() => {
                    if(!!textImportValue && textImportValue.length > 0){
                        try{
                            let parsed = JSON.parse(textImportValue);
                            setOldPlan(parsed);
                            setDisplayBasic(false);
                        } catch (err){
                            console.error(err);
                        }
                    }
                }} />
                <Button label="No" icon="pi pi-times" onClick={() => {setDisplayBasic(false)}} />
            </div>
        );

        return(
            <Dialog header="Text import as JSON" visible={displayBasic} style={{ width: '50vw' }} footer={footer} onHide={() => setDisplayBasic(false)}>
                <p>Please paste the JSON content as text inside</p>
                <InputTextarea rows={30} cols={80} value={textImportValue} onChange={(e) => setTextImportValue(e.target.value)} >

                </InputTextarea>
            </Dialog>
        )
    }

    function renderSpitLine(){
        return (
            <div style={{width: "100%", height: 2, backgroundColor: "gray", marginTop: 10, marginBottom: 10}}></div>
        )
    }

    function renderSwitchButton(){
        let disabled = (selectedSlotFirst && selectedSlotSecond) ? false : true;
        let label = disabled ? "Switch (select 2)" : "Switch selection";

        return (
            <Button disabled={disabled} label={label} icon="pi pi-arrows-h" className="p-button-warning" style={{margin: 5}} onClick={() => {handleSwitchSelection()}} />
        )
    }

    function getChanges(){
        let groups = newPlan?.groups || {};
        let groupNames = Object.keys(groups);
        let changes: any[] = [];
        if(!!oldPlan && !!newPlan){
            for(let groupName of groupNames){
                let groupInOldPlan = oldPlan?.groups?.[groupName];
                let groupInNewPlan = newPlan?.groups?.[groupName];
                let oldSlot = groupInOldPlan?.selectedSlot;
                let newSlot = groupInNewPlan?.selectedSlot;
                let tutorInOldPlan = oldSlot?.tutor;
                let tutorInNewPlan = newSlot?.tutor;
                let tutorChanged = tutorInOldPlan !== tutorInNewPlan;
                if(tutorChanged){
                    let change = {
                        groupName: groupName,
                        oldSlot: oldSlot,
                        newSlot: newSlot,
                    };
                    changes.push(change);
                }
            }
        }
        return changes;
    }

    function renderChange(changeItem: any, backgroundColor: any): ReactNode{
        let key = JSON.stringify(changeItem);
        let oldSlot = changeItem?.oldSlot;
        let newSlot = changeItem?.newSlot;
        let day = oldSlot?.day;
        let time = oldSlot?.time;
        let dayAndTime = day + " " + time;
        let groupName = changeItem?.groupName;
        let tutorInOldPlan = oldSlot?.tutor;
        let tutorInNewPlan = newSlot?.tutor;

        return(
            <div key={key} style={{flexDirection: "row", display: "flex", paddingBottom: 20, backgroundColor: backgroundColor}}>
                <div key={"day & time"} style={{flexGrow: 1, flex: 3}}>{dayAndTime}</div>
                <div key={"group"} style={{flexGrow: 1, flex: 3}}>{groupName}</div>
                <div key={"space1"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                <div key={"before"} style={{flexGrow: 1, flex: 3}}>{tutorInOldPlan}</div>
                <div key={"space2"} style={{flexGrow: 1, flex: 1}}>{"-->"}</div>
                <div key={"after"} style={{flexGrow: 1, flex: 3}}>{tutorInNewPlan}</div>
            </div>
        )
    }

    function renderChanges(){
        let changes = getChanges();

        let amountOfChanges = changes.length;
        let renderedChanges: ReactNode[] = [];
        let index = 0;
        for(let change of changes){
            index++;
            let backgroundColor = index % 2 == 0 ? "transparent" : "#ffffff";
            renderedChanges.push(renderChange(change, backgroundColor));
        }

        return(
            <>
                <div>{"Changes ("+amountOfChanges+")"}</div>
                <div key={"changesHeader"} style={{flexDirection: "row", display: "flex", paddingBottom: 20}}>
                    <div key={"day & time"} style={{flexGrow: 1, flex: 3}}>{"Day & Time"}</div>
                    <div key={"group"} style={{flexGrow: 1, flex: 3}}>{"Group"}</div>
                    <div key={"space1"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                    <div key={"before"} style={{flexGrow: 1, flex: 3}}>{"before"}</div>
                    <div key={"space2"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                    <div key={"after"} style={{flexGrow: 1, flex: 3}}>{"after"}</div>
                </div>
                <div style={{width: "100%"}}>
                    {renderedChanges}
                </div>
            </>
        )
    }

    function renderSingleGroup(groupName: any, backgroundColor: any): ReactNode{
        let group = oldPlan?.groups?.[groupName];
        let oldSlot = group?.selectedSlot;
        let day = oldSlot?.day;
        let time = oldSlot?.time;
        let dayAndTime = day + " " + time;
        let tutorInOldPlan = oldSlot?.tutor;
        let key = groupName + dayAndTime + tutorInOldPlan;
        return(
            <div key={key} style={{flexDirection: "row", display: "flex", backgroundColor: backgroundColor}}>
                <div key={"dayAndTime"} style={{flexGrow: 1, flex: 1}}>{dayAndTime}</div>
                <div key={"groupName"} style={{flexGrow: 1, flex: 2}}>{groupName}</div>
                <div key={"split1"} style={{flexGrow: 1, flex: 2}}>{"("+tutorInOldPlan+")"}</div>
            </div>
        )
    }

    function renderSingleGroups(){
        let groups = oldPlan?.groups || {};
        let groupNames = Object.keys(groups);
        let renderedSingleGroups: ReactNode[] = [];
        let index = 0;
        for(let groupName of groupNames){
            let group = groups[groupName];
            let members = group?.members || [];
            let amountOfMembers = members.length;
            if(amountOfMembers === 1){
                index++;
                let backgroundColor = index % 2 == 0 ? "transparent" : "#ffffff";
                renderedSingleGroups.push(renderSingleGroup(groupName, backgroundColor));
            }
        }

        return (
            <>
                <div>{"Single Groups"}</div>
                <div key={"changesHeader"} style={{flexDirection: "row", display: "flex", width: "100%", paddingBottom: 20}}>
                    <div key={"day & time"} style={{flexGrow: 1, flex: 1}}>{"Day & Time"}</div>
                    <div key={"group"} style={{flexGrow: 1, flex: 2}}>{"Group"}</div>
                    <div key={"tutor"} style={{flexGrow: 1, flex: 2}}>{"(Tutor)"}</div>
                </div>
                <div style={{width: "100%"}}>
                    {renderedSingleGroups}
                </div>
            </>
        )
    }

    function renderTutorInformations(){
        let amountOfGroups = Object.keys(oldPlan?.groups || {}).length;

        return(
            <>
                <div>{"Amount Groups: "+amountOfGroups}</div>
                <div key={"info"} style={{flexDirection: "row", display: "flex", paddingBottom: 20}}>
                    <div key={"Tutor Auslastung"} style={{flexGrow: 1, flex: 4}}>{"Tutor (multiplier)"}</div>
                    <div key={"vorher"} style={{flexGrow: 1, flex: 1}}>{"before"}</div>
                    <div key={"space1"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                    <div key={"nachher"} style={{flexGrow: 1, flex: 1}}>{"after"}</div>
                    <div key={"space2"} style={{flexGrow: 1, flex: 1}}>{""}</div>
                    <div key={"angebote"} style={{flexGrow: 1, flex: 1}}>{"avail. slots"}</div>
                </div>
                <div style={{width: "100%"}}>
                    {renderTutorAuslastung()}
                </div>
                {renderSpitLine()}
                {renderChanges()}
                {renderSpitLine()}
                {renderSingleGroups()}
            </>
        )
    }

    const uploadJSONOptions = {label: 'Load JSON', icon: 'pi pi-upload', className: 'p-button-success'};
    const uploadHtmlOptions = {label: 'Load HTML Table', icon: 'pi pi-upload', className: 'p-button-success'};
    const leftContents = (
        <div style={{width: "100%", flexGrow: 1, flexDirection: "column", display: "flex", flex: 1, backgroundColor: "#EEEEEE", paddingLeft: 10,paddingTop: 20, paddingRight: 10}}>
            <div>

                {renderParseStudipFileUpload()}
                {renderImportTextButton()}
                <FileUpload auto chooseOptions={uploadJSONOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImportJson(event)}} style={{margin: 5, display: "inline-block"}} />
                <FileUpload auto chooseOptions={uploadHtmlOptions} accept="application/CSV" mode="basic" name="demo[]" url="./upload" className="p-button-success" customUpload uploadHandler={(event) => {handleImportHtmlTable(event)}} style={{margin: 5, display: "inline-block"}} />
            </div>

            {renderSpitLine()}

            <div>
                {renderMergeSingleGroupsButton()}
                {renderOptimizeButton()}
                {renderSwitchButton()}
            </div>

            {renderSpitLine()}

            <div>
                {renderDownloadButton()}
                {renderDownloadGroupsForTutor()}
                {renderDownloadAsStudipHTMLTableButton()}
            </div>
            {renderSpitLine()}
            {renderTutorInformations()}
            {renderSpitLine()}
            {renderImportTextDialog()}
        </div>
    );

    const iconCalcAuto = "pi pi-sync"
    const iconCalcManual = "pi pi-refresh"

    return leftContents
  }
