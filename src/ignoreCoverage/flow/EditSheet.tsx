import React, {FunctionComponent, useEffect, useState} from "react";
import {Sidebar} from "primereact/sidebar";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {confirmDialog} from "primereact/confirmdialog";
import PlanEditHelper from "../../api/src/ignoreCoverage/PlanEditHelper";
import {JSONToGraph} from "../../api/src";
import {useI18n} from "../i18n/I18n";
import {EditTarget, getSlotKey, getTutorColor, SlotRef} from "./PlanTypes";

export interface EditSheetProps {
    target: EditTarget | null;
    plan: any;
    onHide: () => void;
    onSaveMembers: (groupName: string, members: string[]) => void;
    onAssignSlot: (groupName: string, slot: SlotRef) => void;
    onSplitGroup: (groupName: string) => void;
    onDeleteGroup: (groupName: string) => void;
    onSaveCondition: (slot: SlotRef, condition: string) => void;
    onMoveTutorSlot: (slot: SlotRef, day: string, time: string) => void;
    onDeleteTutorSlot: (slot: SlotRef) => void;
    onAddGroup: (slot: SlotRef, members: string[]) => void;
    isHidingOtherSlotsOfTutor: (slot: SlotRef) => boolean;
    onHideOtherSlotsOfTutor: (slot: SlotRef, hide: boolean) => void;
}

export const EditSheet: FunctionComponent<EditSheetProps> = (props) => {
    const {target, plan, onHide} = props;
    const {t} = useI18n();

    const [memberDrafts, setMemberDrafts] = useState<string[]>([]);
    const [assignSlotKey, setAssignSlotKey] = useState<string | null>(null);
    const [conditionDraft, setConditionDraft] = useState("");
    const [moveDay, setMoveDay] = useState<string | null>(null);
    const [moveTime, setMoveTime] = useState<string | null>(null);
    const [newGroupNames, setNewGroupNames] = useState("");

    const group = target?.kind === "group" ? plan?.groups?.[target.groupName] : undefined;
    const slot: SlotRef | undefined = target?.kind === "group" ? group?.selectedSlot : target?.slot;
    const condition = slot ? JSONToGraph.getTutorSlotCondition(plan, slot.tutor, slot.day, slot.time) : undefined;

    useEffect(() => {
        setMemberDrafts(target?.kind === "group" && group ? [...PlanEditHelper.getMembers(plan, target.groupName)] : []);
        setAssignSlotKey(null);
        setConditionDraft(condition || "");
        setMoveDay(slot?.day || null);
        setMoveTime(slot?.time || null);
        setNewGroupNames("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(target), JSON.stringify(group), condition]);

    const weekdays = JSONToGraph.getWorkingWeekdays();

    function formatSlot(s: SlotRef) {
        return t("weekday." + s.day) + " " + s.time + " · " + s.tutor;
    }

    function renderHeader() {
        if(!target || !slot) {
            return null;
        }
        let title = target.kind === "group" ? t("modal.groupTitle") + ": " + target.groupName : t("modal.slotTitle");
        return (
            <>
                <h2 className="atd-edit-title">{title}</h2>
                <div className="atd-edit-subtitle">
                    <span className="atd-tutor-dot" style={{["--atd-tutor-color" as any]: getTutorColor(slot.tutor, plan)}}/>
                    <span>{formatSlot(slot)}</span>
                    {condition ? <span className="atd-condition">{condition}</span> : null}
                </div>
                <label className="atd-checkbox atd-edit-filter">
                    <input type="checkbox" checked={props.isHidingOtherSlotsOfTutor(slot)}
                           onChange={(e) => props.onHideOtherSlotsOfTutor(slot, e.target.checked)}/>
                    <i className="pi pi-filter"/>
                    {t("filter.hideOtherSlotsOfTutor", {tutor: slot.tutor})}
                </label>
            </>
        );
    }

    function renderGroupSections(groupName: string) {
        let freeSlots = PlanEditHelper.getAllTutorSlots(plan, weekdays).filter((s) => PlanEditHelper.isTutorSlotFree(plan, s));
        let slotOptions = freeSlots.map((s) => {
            let slotCondition = JSONToGraph.getTutorSlotCondition(plan, s.tutor, s.day, s.time);
            return {label: formatSlot(s) + (slotCondition ? " (" + slotCondition + ")" : ""), value: getSlotKey(s), slot: s};
        });
        let selectedOption = slotOptions.find((option) => option.value === assignSlotKey);

        return (
            <div className="atd-edit-sections">
                <div className="atd-edit-section">
                    <h4>{t("modal.members")}</h4>
                    {memberDrafts.map((member, index) => (
                        <div className="atd-edit-row" key={index}>
                            <InputText value={member} placeholder={t("modal.memberPlaceholder")} onChange={(e) => {
                                let next = [...memberDrafts];
                                next[index] = e.target.value;
                                setMemberDrafts(next);
                            }}/>
                            <Button icon="pi pi-times" className="p-button-text p-button-danger p-button-rounded" aria-label="remove" onClick={() => {
                                setMemberDrafts(memberDrafts.filter((_, i) => i !== index));
                            }}/>
                        </div>
                    ))}
                    <div className="atd-buttons">
                        <Button label={t("modal.addMember")} icon="pi pi-plus" className="p-button-outlined p-button-sm" onClick={() => setMemberDrafts([...memberDrafts, ""])}/>
                        <Button label={t("modal.saveMembers")} icon="pi pi-check" className="p-button-sm" onClick={() => props.onSaveMembers(groupName, memberDrafts)}/>
                    </div>
                </div>

                <div className="atd-edit-section">
                    <h4>{t("modal.assignSlot")}</h4>
                    <Dropdown value={assignSlotKey} options={slotOptions} filter onChange={(e) => setAssignSlotKey(e.value)} placeholder={t("modal.assignSlotPlaceholder")}/>
                    <div className="atd-buttons">
                        <Button label={t("modal.assign")} icon="pi pi-arrow-right" className="p-button-sm" disabled={!selectedOption} onClick={() => {
                            if(selectedOption) {
                                props.onAssignSlot(groupName, selectedOption.slot);
                            }
                        }}/>
                    </div>
                </div>

                <div className="atd-edit-section">
                    <h4>{t("section.edit")}</h4>
                    <div className="atd-buttons">
                        <Button label={t("modal.split")} icon="pi pi-users" className="p-button-outlined p-button-sm" disabled={PlanEditHelper.getMembers(plan, groupName).length < 2} onClick={() => props.onSplitGroup(groupName)}/>
                        <Button label={t("modal.deleteGroup")} icon="pi pi-trash" className="p-button-danger p-button-outlined p-button-sm" onClick={() => {
                            confirmDialog({
                                message: t("modal.deleteGroupConfirm", {group: groupName}),
                                header: t("modal.deleteGroup"),
                                icon: "pi pi-exclamation-triangle",
                                acceptLabel: t("modal.yes"),
                                rejectLabel: t("modal.no"),
                                acceptClassName: "p-button-danger",
                                accept: () => props.onDeleteGroup(groupName),
                            });
                        }}/>
                    </div>
                </div>
            </div>
        );
    }

    function renderTutorSlotSections(tutorSlot: SlotRef) {
        let dayOptions = weekdays.map((day) => ({label: t("weekday." + day), value: day}));
        let timeOptions = JSONToGraph.getTimeslots(plan).map((time) => ({label: time, value: time}));
        let moveTarget = moveDay && moveTime ? {tutor: tutorSlot.tutor, day: moveDay, time: moveTime} : undefined;
        let moveTargetTaken = !!moveTarget && PlanEditHelper.tutorHasSlot(plan, moveTarget);

        return (
            <div className="atd-edit-sections">
                <div className="atd-edit-section">
                    <h4>{t("modal.condition")}</h4>
                    <div className="atd-edit-row">
                        <InputText value={conditionDraft} placeholder={t("modal.conditionPlaceholder")} onChange={(e) => setConditionDraft(e.target.value)}/>
                    </div>
                    <div className="atd-buttons">
                        <Button label={t("modal.saveCondition")} icon="pi pi-check" className="p-button-sm" onClick={() => props.onSaveCondition(tutorSlot, conditionDraft)}/>
                    </div>
                </div>

                <div className="atd-edit-section">
                    <h4>{t("modal.moveSlot")}</h4>
                    <div className="atd-edit-row">
                        <Dropdown value={moveDay} options={dayOptions} onChange={(e) => setMoveDay(e.value)} placeholder={t("modal.day")}/>
                        <Dropdown value={moveTime} options={timeOptions} onChange={(e) => setMoveTime(e.value)} placeholder={t("time")}/>
                    </div>
                    {moveTargetTaken && !PlanEditHelper.isSameSlot(moveTarget, tutorSlot) ? <small className="atd-muted">{t("dnd.slotTaken")}</small> : null}
                    <div className="atd-buttons">
                        <Button label={t("modal.move")} icon="pi pi-arrows-alt" className="p-button-sm" disabled={!moveTarget || moveTargetTaken} onClick={() => {
                            if(moveDay && moveTime) {
                                props.onMoveTutorSlot(tutorSlot, moveDay, moveTime);
                            }
                        }}/>
                    </div>
                </div>

                <div className="atd-edit-section">
                    <h4>{t("modal.newGroup")}</h4>
                    <div className="atd-edit-row">
                        <InputText value={newGroupNames} placeholder={t("modal.newGroupPlaceholder")} onChange={(e) => setNewGroupNames(e.target.value)}/>
                    </div>
                    <div className="atd-buttons">
                        <Button label={t("modal.create")} icon="pi pi-plus" className="p-button-sm" disabled={newGroupNames.trim().length === 0} onClick={() => {
                            props.onAddGroup(tutorSlot, newGroupNames.split(","));
                        }}/>
                    </div>
                </div>

                <div className="atd-edit-section">
                    <h4>{t("modal.deleteSlot")}</h4>
                    <div className="atd-buttons">
                        <Button label={t("modal.deleteSlot")} icon="pi pi-trash" className="p-button-danger p-button-outlined p-button-sm" onClick={() => {
                            confirmDialog({
                                message: t("modal.deleteSlotConfirm", {tutor: tutorSlot.tutor, day: t("weekday." + tutorSlot.day), time: tutorSlot.time}),
                                header: t("modal.deleteSlot"),
                                icon: "pi pi-exclamation-triangle",
                                acceptLabel: t("modal.yes"),
                                rejectLabel: t("modal.no"),
                                acceptClassName: "p-button-danger",
                                accept: () => props.onDeleteTutorSlot(tutorSlot),
                            });
                        }}/>
                    </div>
                </div>
            </div>
        );
    }

    let content = null;
    if(target?.kind === "group" && group) {
        content = renderGroupSections(target.groupName);
    } else if(target?.kind === "tutorSlot") {
        content = renderTutorSlotSections(target.slot);
    }

    return (
        <Sidebar visible={!!target && !!content} position="bottom" className="atd-edit-sheet" onHide={onHide} blockScroll>
            <div className="atd-edit-inner">
                {renderHeader()}
                {content}
            </div>
        </Sidebar>
    );
};
