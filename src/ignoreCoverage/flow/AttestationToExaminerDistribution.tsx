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
import {ExampleCSVContent, JSONToGraph} from "./../../api/src/";

const edgeNormal = "#444444";
const edgeCritical = "#ff2222";

export const AttestationToExaminerDistribution : FunctionComponent = (props) => {

    const toast = useRef(null);
    const [reloadNumber, setReloadNumber] = useState(0)
    const [oldPlan, setOldPlan] = useState(ExampleCSVContent.getExampleParsedJSON());
    const [newPlan, setNewPlan] = useState(null);

    const [selectedSlotFirst, setSelectedSlotFirst] = useState(null);
    const [selectedSlotSecond, setSelectedSlotSecond] = useState(null);

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

    function handleSelect(slotToSave: any, isSelectedAtFirst: boolean, isSelectedAtSecond: boolean){
        if(selectedSlotFirst === null){
            console.log("Save first slot");
            console.log(slotToSave)
            //@ts-ignore
            setSelectedSlotFirst(slotToSave);
            //@ts-ignore
        } else if(selectedSlotSecond === null && !isSelectedAtFirst){
            //@ts-ignore
            setSelectedSlotSecond(slotToSave);
        }
        // @ts-ignore
        if(isSelectedAtFirst){
            //@ts-ignore
            setSelectedSlotFirst(null);
        }
        // @ts-ignore
        if(isSelectedAtSecond){
            //@ts-ignore
            setSelectedSlotSecond(null);
        }
    }

    function renderGroup(groupName: string, oldSelectedSlot: any, newSelectedSlot: any){
        let tutorChanged = false;
        let useSelectedSlot = newSelectedSlot ? newSelectedSlot : oldSelectedSlot;
        if(newSelectedSlot?.tutor && newSelectedSlot.tutor !== oldSelectedSlot?.tutor){
            tutorChanged = true;
        }

        let borderColor = tutorChanged ? "rgb(255, 0, 0)" : "rgb(0, 0, 0)";
        //@ts-ignore
        let isSelectedAtFirst = selectedSlotFirst?.group === groupName;
        //@ts-ignore
        let isSelectedAtSecond = selectedSlotSecond?.group === groupName;
        let isSelected = isSelectedAtFirst || isSelectedAtSecond;

        if(isSelected){
            borderColor = "rgb(0, 255, 0)";
        }

        let slotToSave = {
            tutor: useSelectedSlot?.tutor,
            time: useSelectedSlot?.time,
            day: useSelectedSlot?.day,
            group: groupName,
        };

        return (
            <div key={groupName} style={{border: '2px solid '+borderColor, marginBottom: 5}} onClick={() => {
                handleSelect(slotToSave, isSelectedAtFirst, isSelectedAtSecond);
            }}>
                <div>{"Group: "+groupName}</div>
                <div style={{height: 10}}></div>
                <div>{"Tutor old: "+oldSelectedSlot?.tutor}</div>
                <div>{"Tutor new: "+newSelectedSlot?.tutor}</div>
            </div>
        )
    }


    async function handleSwitchSelection(){
        let usePlan = newPlan ? newPlan : oldPlan;
        if(selectedSlotFirst && selectedSlotSecond){
            // @ts-ignore
            let isFirstSelectionAGroup = selectedSlotFirst?.group !== undefined;
            // @ts-ignore
            let isSecondSelectionAGroup = selectedSlotSecond?.group !== undefined;
            if(isFirstSelectionAGroup || isSecondSelectionAGroup){
                if(isFirstSelectionAGroup){
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.tutor = selectedSlotSecond?.tutor;
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.time = selectedSlotSecond?.time;
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.day = selectedSlotSecond?.day;
                } else {
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.tutor = selectedSlotFirst?.tutor;
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.time = selectedSlotFirst?.time;
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.day = selectedSlotFirst?.day;
                }

                if(isSecondSelectionAGroup){
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.tutor = selectedSlotFirst?.tutor;
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.time = selectedSlotFirst?.time;
                    // @ts-ignore
                    usePlan.groups[selectedSlotSecond?.group].selectedSlot.day = selectedSlotFirst?.day;
                } else {
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.tutor = selectedSlotSecond?.tutor;
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.time = selectedSlotSecond?.time;
                    // @ts-ignore
                    usePlan.groups[selectedSlotFirst?.group].selectedSlot.day = selectedSlotSecond?.day;
                }

                //@ts-ignore
                setNewPlan(usePlan);
                //@ts-ignore
                setSelectedSlotFirst(null);
                //@ts-ignore
                setSelectedSlotSecond(null);
            } else {
                try{
                    //@ts-ignore
                    toast.current.show({severity: 'error', summary: 'Error', detail: 'Select atleast one group', life: 3000});
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    function renderEmptyTutor(tutor: string, day: string, time: string){
        let slotToSave = {
            tutor: tutor,
            time: time,
            day: day,
            group: undefined,
        };

        //@ts-ignore
        let isSelectedAtFirst = (selectedSlotFirst?.tutor === tutor && selectedSlotFirst?.day === day && selectedSlotFirst?.time === time);
        //@ts-ignore
        let isSelectedAtSecond = (selectedSlotSecond?.tutor === tutor && selectedSlotSecond?.day === day && selectedSlotSecond?.time === time);
        let isSelected = isSelectedAtFirst || isSelectedAtSecond;

        let backgroundColor = isSelected ? "rgb(0, 255, 0)" : "rgb(0, 0, 0)";

        return (
            <div key={tutor} style={{border: '2px solid '+backgroundColor, marginBottom: 5}} onClick={() => {
                handleSelect(slotToSave, isSelectedAtFirst, isSelectedAtSecond);
            }}>
                <div>{"Tutor: "+tutor}</div>
            </div>
        )
    }

    function renderEmptySlotsOfTutors(day: string, time: string){
        // @ts-ignore
        let usePlan = !!newPlan ? newPlan : oldPlan;

        let emptyTutorSlots = [];
        let tutors = Object.keys(usePlan?.tutors || {});
        for(let tutor of tutors){
            let slotsByDayAndTimeForTutorDict = usePlan?.tutors?.[tutor];
            let slotsForDayDict = slotsByDayAndTimeForTutorDict?.[day];
            if(slotsForDayDict){
                let slotForTime = slotsForDayDict?.[time];
                if(slotForTime){
//                    console.log("Tutor "+tutor+" has slot for day "+day+" and time "+time);
  //                  console.log(slotsForDayDict)
                    let slotUsed = false;
                    let groups = usePlan?.groups || {};
                    let groupNames = Object.keys(groups);
                    for(let groupName of groupNames){
                        let group = groups?.[groupName];
                        let selectedSlot = group?.selectedSlot;
    //                    console.log("selectedSlot for group "+groupName);
      //                  console.log(selectedSlot);
                        if(selectedSlot?.tutor === tutor && selectedSlot?.day === day && selectedSlot?.time === time){
                            slotUsed = true;
                        }
                    }

                    if(!slotUsed){
                        emptyTutorSlots.push(renderEmptyTutor(tutor, day, time));
                    }
                }
            }
        }

        // @ts-ignore
        return emptyTutorSlots;
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
                    let useSelectedSlot = !!newSelectedSlot ? newSelectedSlot : oldSelectedSlot;

                    if (useSelectedSlot.day === day && useSelectedSlot.time === time) {
                        renderedGroups.push(renderGroup(groupName, oldSelectedSlot, newSelectedSlot));
                    }
                }
                let emptySlotsOfTutors = renderEmptySlotsOfTutors(day, time);
                for(let i=0; i<emptySlotsOfTutors.length; i++){
                    renderedGroups.push(emptySlotsOfTutors[i]);
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

        let usePlan = !!newPlan ? newPlan : oldPlan;
        console.log(usePlan);

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
            <ReactFlowProvider >
                <Toast ref={toast}></Toast>
                <div style={{width: "100%", height: "100vh"}}>
                        <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
                            <div style={{display: "flex", flex: 3, backgroundColor: "red"}}>
                                {renderPlan()}
                            </div>
                            <div style={{display: "flex", flex: 1, flexDirection: "column", backgroundColor: "#EEEEEE"}}>
                                <MyToolbar handleSwitchSelection={handleSwitchSelection} newPlan={newPlan} setNewPlan={setNewPlan} setOldPlan={setOldPlan} oldPlan={oldPlan} setReloadNumber={setReloadNumber} reloadNumber={reloadNumber} />
                            </div>
                        </div>
                </div>
            </ReactFlowProvider>
        );
}
