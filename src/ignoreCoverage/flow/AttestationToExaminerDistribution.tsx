import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {Toast} from 'primereact/toast';
import {Button} from "primereact/button";
import {Dialog} from "primereact/dialog";
import {ConfirmDialog} from "primereact/confirmdialog";
import {MyToolbar} from "./MyToolbar";
import {EditSheet} from "./EditSheet";
import {ExampleCSVContent, JSONToGraph} from "./../../api/src/";
import PlanEditHelper from "../../api/src/ignoreCoverage/PlanEditHelper";
import {useI18n} from "../i18n/I18n";
import {DragPayload, EditTarget, getSelectionKey, getSlotKey, getTutorColor, Selection, SlotRef} from "./PlanTypes";
import {HistoryLabel, usePlanHistory} from "./usePlanHistory";
import "./Plan.css";

type PlanFunction = (plan: any) => any;

export const AttestationToExaminerDistribution: FunctionComponent = () => {

    const {t} = useI18n();
    const toast = useRef<Toast>(null);
    const [reloadNumber, setReloadNumber] = useState(0);
    const history = usePlanHistory(() => ExampleCSVContent.getExampleParsedJSON(), {key: "history.initial"});
    const oldPlan = history.oldPlan;
    const newPlan = history.newPlan;

    const [switchMode, setSwitchMode] = useState(false);
    const [selections, setSelections] = useState<Selection[]>([]);

    const dragPayload = useRef<DragPayload | null>(null);
    const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
    const [pendingGroupDrop, setPendingGroupDrop] = useState<{source: string, target: string} | null>(null);

    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [hideEmptyRows, setHideEmptyRows] = useState(false);

    const currentPlan = newPlan || oldPlan;

    useEffect(() => {
        document.title = t("title");
    }, [t]);

    // keyboard shortcuts for the history: ctrl/cmd + z = back, ctrl/cmd + y or ctrl/cmd + shift + z = forward
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            let target = event.target as HTMLElement | null;
            if(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            if(!(event.ctrlKey || event.metaKey)) {
                return;
            }
            let key = event.key.toLowerCase();
            if(key === "z" && !event.shiftKey) {
                event.preventDefault();
                goToHistory(history.index - 1);
            } else if(key === "y" || (key === "z" && event.shiftKey)) {
                event.preventDefault();
                goToHistory(history.index + 1);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    function showToast(severity: "success" | "info" | "warn" | "error", detail: string) {
        toast.current?.show({severity, summary: detail, life: 3000});
    }

    // ---------- Plan changes ----------

    function goToHistory(index: number) {
        if(index < 0 || index >= history.entries.length) {
            return;
        }
        history.goTo(index);
        setSelections([]);
        setEditTarget(null);
        setPendingGroupDrop(null);
    }

    /**
     * Sets both plans at once. Used by the toolbar (import, optimize, ...)
     */
    function commitPlans(nextOldPlan: any, nextNewPlan: any, label: HistoryLabel) {
        history.record(nextOldPlan, nextNewPlan, label);
        setSelections([]);
        setEditTarget(null);
    }

    /**
     * Applies a hand made change.
     * structural: changes the data itself (members, groups, tutor slots) and is applied to the old and the new plan,
     *             so both plans stay comparable.
     * assignment: changes which group is at which slot and is applied to the new plan only, so it is listed as change.
     */
    function applyEdit(label: HistoryLabel, structural: PlanFunction | null, assignment: PlanFunction | null) {
        let nextOldPlan = structural ? structural(oldPlan) : oldPlan;
        let nextNewPlan = newPlan ? (structural ? structural(newPlan) : newPlan) : null;
        if(assignment) {
            nextNewPlan = assignment(nextNewPlan || nextOldPlan);
        }
        history.record(nextOldPlan, nextNewPlan, label);
    }

    function slotParams(slot: SlotRef) {
        return {tutor: slot.tutor, day: slot.day, time: slot.time};
    }

    function moveGroupToSlot(groupName: string, slot: SlotRef) {
        applyEdit({key: "history.moveGroup", params: {group: groupName, ...slotParams(slot)}},
            null, (plan) => PlanEditHelper.moveGroupToSlot(plan, groupName, slot));
    }

    function swapGroups(groupNameA: string, groupNameB: string) {
        applyEdit({key: "history.swapGroups", params: {a: groupNameA, b: groupNameB}},
            null, (plan) => PlanEditHelper.swapGroups(plan, groupNameA, groupNameB));
    }

    function mergeGroups(sourceGroupName: string, targetGroupName: string) {
        applyEdit({key: "history.mergeGroups", params: {source: sourceGroupName, target: targetGroupName}},
            (plan) => PlanEditHelper.mergeGroups(plan, sourceGroupName, targetGroupName).plan, null);
    }

    function moveMemberToGroup(sourceGroupName: string, member: string, targetGroupName: string) {
        applyEdit({key: "history.moveMember", params: {member, source: sourceGroupName, target: targetGroupName}},
            (plan) => PlanEditHelper.moveMemberToGroup(plan, sourceGroupName, member, targetGroupName).plan, null);
    }

    function moveMemberToSlot(sourceGroupName: string, member: string, slot: SlotRef) {
        let createdGroupName: string | undefined = undefined;
        applyEdit({key: "history.moveMemberToSlot", params: {member, ...slotParams(slot)}}, (plan) => {
            let result = PlanEditHelper.splitMemberFromGroup(plan, sourceGroupName, member);
            createdGroupName = result.groupName;
            return result.plan;
        }, (plan) => createdGroupName ? PlanEditHelper.moveGroupToSlot(plan, createdGroupName, slot) : plan);
    }

    function moveTutorSlot(slot: SlotRef, day: string, time: string) {
        if(PlanEditHelper.tutorHasSlot(currentPlan, {tutor: slot.tutor, day, time})) {
            showToast("warn", t("dnd.slotTaken"));
            return false;
        }
        applyEdit({key: "history.moveTutorSlot", params: {tutor: slot.tutor, fromDay: slot.day, fromTime: slot.time, day, time}},
            (plan) => PlanEditHelper.moveTutorSlot(plan, slot, day, time), null);
        return true;
    }

    // ---------- Switch mode ----------

    function setSwitchModeActive(active: boolean) {
        setSwitchMode(active);
        setSelections([]);
    }

    function executeSwitch(first: Selection, second: Selection) {
        if(first.kind === "group" && second.kind === "group") {
            swapGroups(first.groupName, second.groupName);
        } else if(first.kind === "group" && second.kind === "tutorSlot") {
            moveGroupToSlot(first.groupName, second.slot);
        } else if(first.kind === "tutorSlot" && second.kind === "group") {
            moveGroupToSlot(second.groupName, first.slot);
        } else {
            showToast("warn", t("switch.needGroup"));
            setSelections([first]);
            return;
        }
        showToast("success", t("switch.done"));
        setSwitchModeActive(false);
    }

    function handleSelect(selection: Selection) {
        if(!switchMode) {
            return;
        }
        let key = getSelectionKey(selection);
        if(selections.some((s) => getSelectionKey(s) === key)) {
            setSelections(selections.filter((s) => getSelectionKey(s) !== key));
            return;
        }
        if(selections.length === 0) {
            setSelections([selection]);
        } else {
            setSelections([selections[0], selection]);
            executeSwitch(selections[0], selection);
        }
    }

    function isSelected(selection: Selection) {
        let key = getSelectionKey(selection);
        return selections.some((s) => getSelectionKey(s) === key);
    }

    // ---------- Drag and drop ----------

    function startDrag(event: React.DragEvent, payload: DragPayload) {
        event.stopPropagation();
        dragPayload.current = payload;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    }

    function endDrag() {
        dragPayload.current = null;
        setDropTargetKey(null);
    }

    function dropHandlers(dropKey: string, accepts: (payload: DragPayload) => boolean, onDrop: (payload: DragPayload) => void) {
        return {
            onDragOver: (event: React.DragEvent) => {
                let payload = dragPayload.current;
                if(payload && accepts(payload)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "move";
                    if(dropTargetKey !== dropKey) {
                        setDropTargetKey(dropKey);
                    }
                }
            },
            onDragLeave: (event: React.DragEvent) => {
                if(dropTargetKey === dropKey && !event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDropTargetKey(null);
                }
            },
            onDrop: (event: React.DragEvent) => {
                let payload = dragPayload.current;
                endDrag();
                if(payload && accepts(payload)) {
                    event.preventDefault();
                    event.stopPropagation();
                    onDrop(payload);
                }
            },
        };
    }

    function dropOnGroup(targetGroupName: string, payload: DragPayload) {
        if(payload.kind === "group") {
            setPendingGroupDrop({source: payload.groupName, target: targetGroupName});
        } else if(payload.kind === "member") {
            moveMemberToGroup(payload.groupName, payload.member, targetGroupName);
        } else if(payload.kind === "tutorSlot") {
            moveGroupToSlot(targetGroupName, payload.slot);
        }
    }

    function dropOnFreeTutorSlot(slot: SlotRef, payload: DragPayload) {
        if(payload.kind === "group") {
            moveGroupToSlot(payload.groupName, slot);
        } else if(payload.kind === "member") {
            moveMemberToSlot(payload.groupName, payload.member, slot);
        }
    }

    // ---------- Rendering ----------

    function renderCondition(slot: SlotRef | undefined) {
        if(!slot) {
            return null;
        }
        let condition = JSONToGraph.getTutorSlotCondition(currentPlan, slot.tutor, slot.day, slot.time);
        return condition ? <span className="atd-condition" title={condition}>{condition}</span> : null;
    }

    function renderEditButton(target: EditTarget) {
        return (
            <Button icon="pi pi-pencil" className="p-button-text p-button-rounded p-button-sm atd-card-edit" aria-label={t("slot.edit")} tooltip={t("slot.edit")}
                    onClick={(event) => {
                        event.stopPropagation();
                        setEditTarget(target);
                    }}/>
        );
    }

    function renderGroup(groupName: string) {
        let group = currentPlan.groups[groupName];
        let slot: SlotRef = group.selectedSlot;
        let oldSlot: SlotRef | undefined = newPlan ? oldPlan?.groups?.[groupName]?.selectedSlot : undefined;
        let changed = !!newPlan && (!oldSlot || getSlotKey(oldSlot) !== getSlotKey(slot));
        let members: string[] = PlanEditHelper.getMembers(currentPlan, groupName);
        let tutorKnown = !!currentPlan.tutors?.[slot.tutor];

        let selection: Selection = {kind: "group", groupName, slot};
        let dropKey = "g:" + groupName;
        let classNames = ["atd-card"];
        if(changed) classNames.push("atd-changed");
        if(switchMode) classNames.push("atd-selectable");
        if(isSelected(selection)) classNames.push("atd-selected");
        if(dropTargetKey === dropKey) classNames.push("atd-drop-active");

        let beforeText = undefined;
        if(changed) {
            beforeText = oldSlot
                ? t("slot.before") + ": " + oldSlot.tutor + (oldSlot.day !== slot.day || oldSlot.time !== slot.time ? " (" + t("weekday." + oldSlot.day) + " " + oldSlot.time + ")" : "")
                : t("slot.before") + ": –";
        }

        return (
            <div key={dropKey} className={classNames.join(" ")} style={{["--atd-tutor-color" as any]: getTutorColor(slot.tutor, currentPlan)}}
                 draggable={!switchMode}
                 onDragStart={(event) => startDrag(event, {kind: "group", groupName})}
                 onDragEnd={endDrag}
                 onClick={() => handleSelect(selection)}
                 {...dropHandlers(dropKey,
                     (payload) => !(payload.kind === "group" && payload.groupName === groupName) && !(payload.kind === "member" && payload.groupName === groupName),
                     (payload) => dropOnGroup(groupName, payload))}>
                <div className="atd-card-tutor">
                    <span className="atd-tutor-dot"/>
                    <span>{tutorKnown ? slot.tutor : t("slot.unknownTutor", {tutor: slot.tutor})}</span>
                    {renderCondition(slot)}
                </div>
                <div className="atd-members">
                    {members.map((member) => (
                        <span key={member} className="atd-member" draggable={!switchMode}
                              onDragStart={(event) => startDrag(event, {kind: "member", groupName, member})}
                              onDragEnd={endDrag}>
                            {member}
                        </span>
                    ))}
                    {members.length === 1 ? <span className="atd-badge">{t("slot.singleGroup")}</span> : null}
                </div>
                {beforeText ? <div className="atd-card-meta atd-before">{beforeText}</div> : null}
                {renderEditButton({kind: "group", groupName})}
            </div>
        );
    }

    function renderFreeTutorSlot(slot: SlotRef) {
        let selection: Selection = {kind: "tutorSlot", slot};
        let dropKey = "t:" + getSlotKey(slot);
        let classNames = ["atd-card", "atd-free"];
        if(switchMode) classNames.push("atd-selectable");
        if(isSelected(selection)) classNames.push("atd-selected");
        if(dropTargetKey === dropKey) classNames.push("atd-drop-active");

        return (
            <div key={dropKey} className={classNames.join(" ")} style={{["--atd-tutor-color" as any]: getTutorColor(slot.tutor, currentPlan)}}
                 draggable={!switchMode}
                 onDragStart={(event) => startDrag(event, {kind: "tutorSlot", slot})}
                 onDragEnd={endDrag}
                 onClick={() => handleSelect(selection)}
                 {...dropHandlers(dropKey,
                     (payload) => payload.kind === "group" || payload.kind === "member",
                     (payload) => dropOnFreeTutorSlot(slot, payload))}>
                <div className="atd-card-tutor">
                    <span className="atd-tutor-dot"/>
                    <span>{slot.tutor}</span>
                    {renderCondition(slot)}
                </div>
                <div className="atd-card-meta">{t("slot.free")}</div>
                {renderEditButton({kind: "tutorSlot", slot})}
            </div>
        );
    }

    function getCellContent(day: string, time: string) {
        let groups = currentPlan?.groups || {};
        let groupNames = Object.keys(groups)
            .filter((groupName) => groups[groupName]?.selectedSlot?.day === day && groups[groupName]?.selectedSlot?.time === time)
            .sort((a, b) => (groups[a].selectedSlot.tutor || "").localeCompare(groups[b].selectedSlot.tutor || "") || a.localeCompare(b));

        let freeTutorSlots: SlotRef[] = Object.keys(currentPlan?.tutors || {})
            .filter((tutor) => currentPlan.tutors[tutor]?.[day]?.[time])
            .map((tutor) => ({tutor, day, time}))
            .filter((slot) => PlanEditHelper.isTutorSlotFree(currentPlan, slot))
            .sort((a, b) => a.tutor.localeCompare(b.tutor));

        return {groupNames, freeTutorSlots};
    }

    function renderCell(day: string, time: string, content: {groupNames: string[], freeTutorSlots: SlotRef[]}) {
        let dropKey = "c:" + day + "|" + time;
        return (
            <div key={dropKey} className={"atd-cell" + (dropTargetKey === dropKey ? " atd-drop-active" : "")}
                 {...dropHandlers(dropKey,
                     (payload) => payload.kind === "tutorSlot" && !(payload.slot.day === day && payload.slot.time === time),
                     (payload) => {
                         if(payload.kind === "tutorSlot") {
                             moveTutorSlot(payload.slot, day, time);
                         }
                     })}>
                {content.groupNames.map((groupName) => renderGroup(groupName))}
                {content.freeTutorSlots.map((slot) => renderFreeTutorSlot(slot))}
            </div>
        );
    }

    function renderPlan() {
        if(!currentPlan) {
            return null;
        }
        let weekdays = JSONToGraph.getWorkingWeekdays();
        let timeslots = JSONToGraph.getTimeslots(currentPlan);

        let rows = [];
        for(const time of timeslots) {
            let contents = weekdays.map((day) => getCellContent(day, time));
            let isEmpty = contents.every((content) => content.groupNames.length === 0 && content.freeTutorSlots.length === 0);
            if(hideEmptyRows && isEmpty) {
                continue;
            }
            rows.push(<div key={"time-" + time} className="atd-time">{time}</div>);
            weekdays.forEach((day, index) => rows.push(renderCell(day, time, contents[index])));
        }

        return (
            <div className="atd-plan-scroll">
                <div className="atd-grid" style={{["--atd-days" as any]: weekdays.length}}>
                    <div className="atd-grid-head atd-corner">{t("time")}</div>
                    {weekdays.map((day) => <div key={"head-" + day} className="atd-grid-head">{t("weekday." + day)}</div>)}
                    {rows}
                </div>
            </div>
        );
    }

    function renderSwitchBanner() {
        if(!switchMode) {
            return null;
        }
        return (
            <div className="atd-banner">
                <i className="pi pi-arrows-h"/>
                <span className="atd-banner-text">{t("switch.active")} <strong>{t("switch.selected", {count: selections.length})}</strong></span>
                <Button label={t("switch.cancel")} icon="pi pi-times" className="p-button-sm p-button-outlined" onClick={() => setSwitchModeActive(false)}/>
            </div>
        );
    }

    function renderMergeOrSwapDialog() {
        let footer = (
            <div>
                <Button label={t("modal.cancel")} icon="pi pi-times" className="p-button-text" onClick={() => setPendingGroupDrop(null)}/>
                <Button label={t("dnd.swap")} icon="pi pi-arrows-h" className="p-button-outlined" onClick={() => {
                    if(pendingGroupDrop) {
                        swapGroups(pendingGroupDrop.source, pendingGroupDrop.target);
                    }
                    setPendingGroupDrop(null);
                }}/>
                <Button label={t("dnd.merge")} icon="pi pi-users" onClick={() => {
                    if(pendingGroupDrop) {
                        mergeGroups(pendingGroupDrop.source, pendingGroupDrop.target);
                    }
                    setPendingGroupDrop(null);
                }}/>
            </div>
        );
        return (
            <Dialog header={t("dnd.mergeOrSwapHeader")} visible={!!pendingGroupDrop} style={{width: "min(520px, 95vw)"}} footer={footer} onHide={() => setPendingGroupDrop(null)}>
                <p>{pendingGroupDrop ? t("dnd.mergeOrSwapText", {source: pendingGroupDrop.source, target: pendingGroupDrop.target}) : ""}</p>
            </Dialog>
        );
    }

    function renderEditSheet() {
        function closeAfter(fn: () => void) {
            fn();
            setEditTarget(null);
        }

        return (
            <EditSheet
                target={editTarget}
                plan={currentPlan}
                onHide={() => setEditTarget(null)}
                onSaveMembers={(groupName, members) => {
                    let renamedGroupName: string | undefined = undefined;
                    applyEdit({key: "history.editMembers", params: {group: groupName}}, (plan) => {
                        let result = PlanEditHelper.setGroupMembers(plan, groupName, members);
                        renamedGroupName = result.groupName;
                        return result.plan;
                    }, null);
                    setEditTarget(renamedGroupName ? {kind: "group", groupName: renamedGroupName} : null);
                }}
                onAssignSlot={(groupName, slot) => closeAfter(() => moveGroupToSlot(groupName, slot))}
                onSplitGroup={(groupName) => closeAfter(() => applyEdit({key: "history.splitGroup", params: {group: groupName}},
                    (plan) => PlanEditHelper.splitGroup(plan, groupName), null))}
                onDeleteGroup={(groupName) => closeAfter(() => applyEdit({key: "history.deleteGroup", params: {group: groupName}},
                    (plan) => PlanEditHelper.deleteGroup(plan, groupName), null))}
                onSaveCondition={(slot, condition) => closeAfter(() => applyEdit({key: "history.condition", params: {...slotParams(slot), condition: condition.trim() || "–"}},
                    (plan) => PlanEditHelper.setTutorSlotCondition(plan, slot, condition), null))}
                onMoveTutorSlot={(slot, day, time) => {
                    if(moveTutorSlot(slot, day, time)) {
                        setEditTarget(null);
                    }
                }}
                onDeleteTutorSlot={(slot) => closeAfter(() => applyEdit({key: "history.deleteTutorSlot", params: slotParams(slot)},
                    (plan) => PlanEditHelper.deleteTutorSlot(plan, slot), null))}
                onAddGroup={(slot, members) => closeAfter(() => {
                    // the new group is created at this slot in the old plan too, so it does not show up as a change
                    applyEdit({key: "history.addGroup", params: {group: members.map((m) => m.trim()).filter((m) => m).join(" & "), ...slotParams(slot)}}, (plan) => {
                        let withSlot = PlanEditHelper.tutorHasSlot(plan, slot) ? plan : PlanEditHelper.addTutorSlot(plan, slot);
                        return PlanEditHelper.addGroup(withSlot, members, slot).plan;
                    }, null);
                })}
            />
        );
    }

    return (
        <div className="atd-app">
            <Toast ref={toast}/>
            <ConfirmDialog/>
            <main className="atd-main">
                <div className="atd-header">
                    <div>
                        <h1>{t("title")}</h1>
                        <p>{t("subtitle")}</p>
                    </div>
                </div>
                {renderSwitchBanner()}
                {renderPlan()}
            </main>
            <aside className="atd-sidebar">
                <MyToolbar
                    oldPlan={oldPlan}
                    newPlan={newPlan}
                    commitPlans={commitPlans}
                    switchMode={switchMode}
                    setSwitchMode={setSwitchModeActive}
                    historyEntries={history.entries}
                    historyIndex={history.index}
                    goToHistory={goToHistory}
                    hideEmptyRows={hideEmptyRows}
                    setHideEmptyRows={setHideEmptyRows}
                    reloadNumber={reloadNumber}
                    setReloadNumber={setReloadNumber}
                    showToast={showToast}
                />
            </aside>
            {renderMergeOrSwapDialog()}
            {renderEditSheet()}
        </div>
    );
};
