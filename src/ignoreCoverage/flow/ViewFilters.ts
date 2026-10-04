import PlanEditHelper from "../../api/src/ignoreCoverage/PlanEditHelper";
import {getSlotKey, SlotRef} from "./PlanTypes";

/**
 * Filters only change what is shown in the plan, never the plan itself.
 */
export type ViewFilter =
    // hides all slots of the tutor except the kept one (and the kept group, even when it is moved)
    | {kind: "otherSlotsOfTutor", tutor: string, keepSlot: SlotRef, keepGroup?: string}
    // hides all slots of the tutor
    | {kind: "hideTutor", tutor: string}
    // shows only single groups, everything else is hidden
    | {kind: "onlySingleGroups"};

export function getFilterKey(filter: ViewFilter): string {
    switch(filter.kind) {
        case "otherSlotsOfTutor":
            return "other:" + filter.tutor;
        case "hideTutor":
            return "tutor:" + filter.tutor;
        default:
            return filter.kind;
    }
}

/**
 * Adds the filter, a filter with the same key is replaced
 */
export function setFilter(filters: ViewFilter[], filter: ViewFilter): ViewFilter[] {
    let key = getFilterKey(filter);
    return [...filters.filter((f) => getFilterKey(f) !== key), filter];
}

export function removeFilter(filters: ViewFilter[], key: string): ViewFilter[] {
    return filters.filter((f) => getFilterKey(f) !== key);
}

export function hasFilter(filters: ViewFilter[], key: string): boolean {
    return filters.some((f) => getFilterKey(f) === key);
}

function isTutorSlotHidden(filters: ViewFilter[], slot: SlotRef, groupName?: string): boolean {
    for(const filter of filters) {
        if(filter.kind === "hideTutor" && filter.tutor === slot.tutor) {
            return true;
        }
        if(filter.kind === "otherSlotsOfTutor" && filter.tutor === slot.tutor && getSlotKey(filter.keepSlot) !== getSlotKey(slot)
            && !(groupName !== undefined && filter.keepGroup === groupName)) {
            return true;
        }
    }
    return false;
}

export function isGroupVisible(filters: ViewFilter[], plan: any, groupName: string): boolean {
    let slot: SlotRef | undefined = plan?.groups?.[groupName]?.selectedSlot;
    if(!slot) {
        return false;
    }
    if(isTutorSlotHidden(filters, slot, groupName)) {
        return false;
    }
    if(hasFilter(filters, "onlySingleGroups") && PlanEditHelper.getMembers(plan, groupName).length !== 1) {
        return false;
    }
    return true;
}

export function isFreeTutorSlotVisible(filters: ViewFilter[], slot: SlotRef): boolean {
    if(hasFilter(filters, "onlySingleGroups")) {
        return false;
    }
    return !isTutorSlotHidden(filters, slot);
}
