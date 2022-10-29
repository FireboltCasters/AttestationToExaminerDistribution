import React, {useState, useRef, Component, FunctionComponent, useEffect} from 'react';
import ReactFlow, {
    addEdge,
//    removeElements,
    Controls, isNode,
    Background,
    getOutgoers, isEdge, useEdgesState, useNodesState, ReactFlowProvider, ReactFlowInstance, getBezierPath
} from 'react-flow-renderer';
import { Toast } from 'primereact/toast';
import {MyToolbar} from "./MyToolbar";
import NetzplanHelper from "./NetzplanHelper";
import {ExampleCSVContent} from "./../../api/src/";
import ParseStudIPCSVToJSON from "../../api/build/ignoreCoverage/ParseStudIPCSVToJSON";
import JSONToGraph from "../../api/src/ignoreCoverage/JSONToGraph";

const edgeNormal = "#444444";
const edgeCritical = "#ff2222";

export const Netzplan : FunctionComponent = (props) => {

    const toast = useRef(null);
    const [reloadNumber, setReloadNumber] = useState(0)
    const [oldPlan, setOldPlan] = useState(ExampleCSVContent.getExampleParsedJSON());
    const [newPlan, setNewPlan] = useState(null);

    console.log("oldPlan");
    console.log(oldPlan);


    async function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async function reset() {
        //@ts-ignore
        setOldPlan(null);
        setReloadNumber(reloadNumber + 1);
    }

    useEffect(() => {
        document.title = "Attestation to Examiner Distribution";
    }, [])

    function renderGroup(groupName: string, oldSelectedSlot: any, newSelectedSlot: any){
        let tutorChanged = false;
        if(newSelectedSlot?.tutor && newSelectedSlot.tutor !== oldSelectedSlot?.tutor){
            tutorChanged = true;
        }

        let borderColor = tutorChanged ? "rgb(255, 0, 0)" : "rgb(0, 0, 0)";

        return (
            <div key={groupName} style={{border: '2px solid '+borderColor, marginBottom: 5}}>
                <div>{"Group: "+groupName}</div>
                <div style={{height: 10}}></div>
                <div>{"Tutor alt: "+oldSelectedSlot?.tutor}</div>
                <div>{"Tutor new: "+newSelectedSlot?.tutor}</div>
            </div>
        )
    }

    function renderWeekday(day: string, time: string){
        let weekdayFlex = 2;

        if(!time){
            return (
                <div key={day} style={{border: '2px solid rgba(0, 0, 0, 0.05)', flexGrow: 1, flex: weekdayFlex, backgroundColor: "white", alignContent: "center"}}>
                    {day}
                </div>
            )
        } else {
            let renderedContent = null;
            if(oldPlan){
                let oldGroups = oldPlan.groups;
                //@ts-ignore
                let newGroups = newPlan?.groups;
                let oldGroupNames = Object.keys(oldGroups);
                let renderedGroups = [];

                for(let i=0; i<oldGroupNames.length; i++) {
                    let groupName = oldGroupNames[i];
                    let oldSelectedSlot = oldGroups?.[groupName]?.selectedSlot;
                    let newSelectedSlot = newGroups?.[groupName]?.selectedSlot;
                    if (oldSelectedSlot && oldSelectedSlot.day === day && oldSelectedSlot.time === time) {
                        renderedGroups.push(renderGroup(groupName, oldSelectedSlot, newSelectedSlot));
                    }
                }
                renderedContent = renderedGroups;
            }

            return (
                <div key={day} style={{border: '2px solid rgba(0, 0, 0, 0.05)', flexGrow: 1, flex: weekdayFlex, backgroundColor: "white", alignContent: "center"}}>
                    {renderedContent}
                </div>
            )
        }
    }

    function getTimeslots(){
        let startHour = 8;
        let endHour = 20;
        let minuteStep = 15;

        let timeslots = [];
        for(let i = startHour; i < endHour; i++){
            for(let j = 0; j < 60; j+=minuteStep){
                timeslots.push(i + ":" + (j < 10 ? "0" + j : j));
            }
        }
        return timeslots;
    }

    function renderTimeslots(){
        let timeslots = getTimeslots();
        let timeslotFlex = 1;
        let renderedTimeslots = [];
        renderedTimeslots.push(
            <div key={"header"} style={{borderWidth: 2, borderColor: "black", flexDirection: "row", display: "flex", width: "100%", flex: 1, backgroundColor: "green"}}>
                <div key={"Test"} style={{border: '2px solid rgba(0, 0, 0, 0.05)', flexGrow: 1, flex: timeslotFlex, backgroundColor: "white", alignContent: "center"}}>
                    {"Timeslots"}
                </div>
                {renderWeekdays(null)}
            </div>
        )
        for(let i = 0; i < timeslots.length; i++){
            let timeslot = timeslots[i];
            renderedTimeslots.push(
                <div key={timeslot} style={{borderWidth: 2, borderColor: "black", flexDirection: "row", display: "flex", width: "100%", flex: 1, backgroundColor: "green"}}>
                    <div key={"Test"} style={{border: '2px solid rgba(0, 0, 0, 0.05)', flexGrow: 1, flex: timeslotFlex, backgroundColor: "white", alignContent: "center"}}>
                        {""+timeslot}
                    </div>
                    {renderWeekdays(timeslots[i])}
                </div>
            )
        }

        return renderedTimeslots
    }

    function renderWeekdays(timeslot: any){
        let renderedWeekdays = [];
        let offset = 1;
        for(let i=0; i<5; i++){
            let weekday = JSONToGraph.getWeekdayByNumber(i+offset);
            renderedWeekdays.push(renderWeekday(weekday, timeslot));
        }

        return renderedWeekdays;
    }

    function renderPlan(){
        if(oldPlan == null){
            return <div/>
        }

        let renderedTimeslots = renderTimeslots();

        return (
            <div style={{backgroundColor: "white", flex: 1}}>
                <div style={{marginLeft: 20}}><h2>{"Attestation to Examiner Distribution"}</h2></div>
                {renderedTimeslots}
            </div>
        )
    }

    return (
            <ReactFlowProvider key={reloadNumber+1+""}>
                <Toast ref={toast}></Toast>
                <div style={{width: "100%", height: "100vh"}}>
                        <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
                            <div style={{display: "flex", flex: 3, backgroundColor: "red"}}>
                                {renderPlan()}
                            </div>
                            <div style={{display: "flex", flex: 1, flexDirection: "column", backgroundColor: "#DDDDDD"}}>
                                <MyToolbar newPlan={newPlan} setNewPlan={setNewPlan} setOldPlan={setOldPlan} oldPlan={oldPlan} setReloadNumber={setReloadNumber} reloadNumber={reloadNumber} />
                            </div>
                        </div>
                </div>
            </ReactFlowProvider>
        );
}
