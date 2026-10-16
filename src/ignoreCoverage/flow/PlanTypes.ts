import {SlotRef} from "../../api/src/ignoreCoverage/PlanEditHelper";
import JSONToGraph from "../../api/src/ignoreCoverage/JSONToGraph";

export type {SlotRef};

export type Selection =
    | {kind: "group", groupName: string, slot: SlotRef}
    | {kind: "tutorSlot", slot: SlotRef};

export type DragPayload =
    | {kind: "group", groupName: string}
    | {kind: "member", groupName: string, member: string}
    | {kind: "tutorSlot", slot: SlotRef};

export type EditTarget =
    | {kind: "group", groupName: string}
    | {kind: "tutorSlot", slot: SlotRef};

export function getSlotKey(slot: SlotRef | undefined): string {
    return slot ? slot.tutor + "|" + slot.day + "|" + slot.time : "";
}

export function getSelectionKey(selection: Selection): string {
    return selection.kind === "group" ? "g:" + selection.groupName : "t:" + getSlotKey(selection.slot);
}

/**
 * A stable color for every tutor of the plan, so the tutor can be recognized quickly.
 * The hues are spread with the golden angle, so neighbouring tutors get clearly different colors.
 */
export function getTutorColor(tutor: string | undefined, plan?: any): string {
    if(!tutor) {
        return "#94a3b8";
    }
    let tutorNames = Object.keys(plan?.tutors || {}).sort();
    let index = tutorNames.indexOf(tutor);
    if(index < 0) {
        let hash = 0;
        for(let i = 0; i < tutor.length; i++) {
            hash = (hash * 31 + tutor.charCodeAt(i)) | 0;
        }
        index = Math.abs(hash);
    }
    return "hsl(" + Math.round((index * 137.508 + 210) % 360) + ", 65%, 46%)";
}

/**
 * Hints for a group of the new plan, if its mode changed compared to the old plan:
 *  - the students switched the mode (e.g. "adopt" or a manual move)
 *  - the slot took over the mode of the group (e.g. "carry"), so the tutor has to switch
 */
export function getModeChangeHints(oldPlan: any, newPlan: any, groupName: string, t: (key: string, params?: Record<string, string | number>) => string): string[] {
    let hints: string[] = [];
    let newSlot = newPlan?.groups?.[groupName]?.selectedSlot;
    let oldSlot = oldPlan?.groups?.[groupName]?.selectedSlot;
    if(!oldPlan || !newPlan || !newSlot || !oldSlot) {
        return hints;
    }
    let format = (condition: string | undefined) => condition || t("mode.none");
    let groupCondition = JSONToGraph.getTutorSlotCondition(oldPlan, oldSlot.tutor, oldSlot.day, oldSlot.time);
    let newCondition = JSONToGraph.getTutorSlotCondition(newPlan, newSlot.tutor, newSlot.day, newSlot.time);
    if(JSONToGraph.getLocationMode(groupCondition) !== JSONToGraph.getLocationMode(newCondition)) {
        hints.push(t("mode.groupSwitched", {before: format(groupCondition), after: format(newCondition)}));
    }
    if(oldPlan.tutors?.[newSlot.tutor]?.[newSlot.day]?.[newSlot.time]) {
        let tutorCondition = JSONToGraph.getTutorSlotCondition(oldPlan, newSlot.tutor, newSlot.day, newSlot.time);
        if(JSONToGraph.getLocationMode(tutorCondition) !== JSONToGraph.getLocationMode(newCondition)) {
            hints.push(t("mode.slotChanged", {before: format(tutorCondition)}));
        }
    }
    return hints;
}
