export interface SlotRef {
    tutor: string;
    day: string;
    time: string;
}

/**
 * Pure helper functions to edit a plan by hand.
 * Every function returns a new plan and never changes the given one.
 */
export default class PlanEditHelper {

    static clone(plan: any): any {
        return JSON.parse(JSON.stringify(plan));
    }

    /**
     * Returns the members of a group. Older plans may have groups without members, then the group name is the member.
     */
    static getMembers(plan: any, groupName: string): string[] {
        let members = plan?.groups?.[groupName]?.members;
        return Array.isArray(members) && members.length > 0 ? members : [groupName];
    }

    static getGroupNameFromMembers(members: string[]): string {
        return members.join(" & ");
    }

    static isSameSlot(a: SlotRef | undefined, b: SlotRef | undefined): boolean {
        return !!a && !!b && a.tutor === b.tutor && a.day === b.day && a.time === b.time;
    }

    static tutorHasSlot(plan: any, slot: SlotRef): boolean {
        return !!plan?.tutors?.[slot.tutor]?.[slot.day]?.[slot.time];
    }

    static getGroupNamesAtSlot(plan: any, slot: SlotRef): string[] {
        let groups = plan?.groups || {};
        return Object.keys(groups).filter((groupName) => PlanEditHelper.isSameSlot(groups[groupName]?.selectedSlot, slot));
    }

    static isTutorSlotFree(plan: any, slot: SlotRef): boolean {
        return PlanEditHelper.tutorHasSlot(plan, slot) && PlanEditHelper.getGroupNamesAtSlot(plan, slot).length === 0;
    }

    /**
     * Returns a group name which is not used yet (except by the ignored group names)
     */
    static getUniqueGroupName(plan: any, wantedName: string, ignoredGroupNames: string[] = []): string {
        let groups = plan?.groups || {};
        let name = wantedName;
        let counter = 2;
        while(groups[name] !== undefined && !ignoredGroupNames.includes(name)) {
            name = wantedName + " (" + counter + ")";
            counter++;
        }
        return name;
    }

    static addPossibleSlot(group: any, day: string, time: string) {
        group.possibleSlots = group.possibleSlots || {};
        group.possibleSlots[day] = group.possibleSlots[day] || {};
        group.possibleSlots[day][time] = true;
    }

    static mergePossibleSlots(target: any, source: any) {
        let possibleSlots = source?.possibleSlots || {};
        for(const day of Object.keys(possibleSlots)) {
            for(const time of Object.keys(possibleSlots[day] || {})) {
                PlanEditHelper.addPossibleSlot(target, day, time);
            }
        }
    }

    static moveGroupToSlot(plan: any, groupName: string, slot: SlotRef): any {
        let newPlan = PlanEditHelper.clone(plan);
        let group = newPlan.groups?.[groupName];
        if(!group) {
            return newPlan;
        }
        group.selectedSlot = {...(group.selectedSlot || {}), tutor: slot.tutor, day: slot.day, time: slot.time};
        return newPlan;
    }

    static swapGroups(plan: any, groupNameA: string, groupNameB: string): any {
        let newPlan = PlanEditHelper.clone(plan);
        let groupA = newPlan.groups?.[groupNameA];
        let groupB = newPlan.groups?.[groupNameB];
        if(!groupA || !groupB) {
            return newPlan;
        }
        let slotA = groupA.selectedSlot;
        groupA.selectedSlot = groupB.selectedSlot;
        groupB.selectedSlot = slotA;
        return newPlan;
    }

    /**
     * Merges the source group into the target group. The merged group keeps the slot of the target group.
     */
    static mergeGroups(plan: any, sourceGroupName: string, targetGroupName: string): {plan: any, groupName: string} {
        let newPlan = PlanEditHelper.clone(plan);
        let source = newPlan.groups?.[sourceGroupName];
        let target = newPlan.groups?.[targetGroupName];
        if(!source || !target || sourceGroupName === targetGroupName) {
            return {plan: newPlan, groupName: targetGroupName};
        }
        let members: string[] = [];
        for(const member of [...PlanEditHelper.getMembers(newPlan, targetGroupName), ...PlanEditHelper.getMembers(newPlan, sourceGroupName)]) {
            if(!members.includes(member)) {
                members.push(member);
            }
        }
        let merged = {
            ...target,
            members: members,
            selectedSlot: PlanEditHelper.clone(target.selectedSlot),
            possibleSlots: PlanEditHelper.clone(target.possibleSlots || {}),
        };
        PlanEditHelper.mergePossibleSlots(merged, source);

        delete newPlan.groups[sourceGroupName];
        delete newPlan.groups[targetGroupName];
        let groupName = PlanEditHelper.getUniqueGroupName(newPlan, PlanEditHelper.getGroupNameFromMembers(members));
        newPlan.groups[groupName] = merged;
        return {plan: newPlan, groupName: groupName};
    }

    /**
     * Sets the members of a group. The group is renamed to the joined member names. No members => group is deleted.
     */
    static setGroupMembers(plan: any, groupName: string, members: string[]): {plan: any, groupName: string | undefined} {
        let cleanedMembers = members.map((member) => member.trim()).filter((member) => member.length > 0);
        let newPlan = PlanEditHelper.clone(plan);
        let group = newPlan.groups?.[groupName];
        if(!group) {
            return {plan: newPlan, groupName: undefined};
        }
        delete newPlan.groups[groupName];
        if(cleanedMembers.length === 0) {
            return {plan: newPlan, groupName: undefined};
        }
        group.members = cleanedMembers;
        let newGroupName = PlanEditHelper.getUniqueGroupName(newPlan, PlanEditHelper.getGroupNameFromMembers(cleanedMembers));
        newPlan.groups[newGroupName] = group;
        return {plan: newPlan, groupName: newGroupName};
    }

    static deleteGroup(plan: any, groupName: string): any {
        let newPlan = PlanEditHelper.clone(plan);
        if(newPlan.groups) {
            delete newPlan.groups[groupName];
        }
        return newPlan;
    }

    static addGroup(plan: any, members: string[], slot: SlotRef): {plan: any, groupName: string | undefined} {
        let cleanedMembers = members.map((member) => member.trim()).filter((member) => member.length > 0);
        let newPlan = PlanEditHelper.clone(plan);
        if(cleanedMembers.length === 0) {
            return {plan: newPlan, groupName: undefined};
        }
        newPlan.groups = newPlan.groups || {};
        let groupName = PlanEditHelper.getUniqueGroupName(newPlan, PlanEditHelper.getGroupNameFromMembers(cleanedMembers));
        let group = {
            members: cleanedMembers,
            selectedSlot: {tutor: slot.tutor, day: slot.day, time: slot.time},
            possibleSlots: {},
        };
        PlanEditHelper.addPossibleSlot(group, slot.day, slot.time);
        newPlan.groups[groupName] = group;
        return {plan: newPlan, groupName: groupName};
    }

    /**
     * Moves a single member out of its group into a new group at the same slot
     */
    static splitMemberFromGroup(plan: any, groupName: string, member: string): {plan: any, groupName: string | undefined} {
        let group = plan?.groups?.[groupName];
        if(!group) {
            return {plan: PlanEditHelper.clone(plan), groupName: undefined};
        }
        let remainingMembers = PlanEditHelper.getMembers(plan, groupName).filter((m: string) => m !== member);
        let newPlan = PlanEditHelper.setGroupMembers(plan, groupName, remainingMembers).plan;
        newPlan.groups = newPlan.groups || {};
        let newGroupName = PlanEditHelper.getUniqueGroupName(newPlan, member);
        newPlan.groups[newGroupName] = {
            members: [member],
            selectedSlot: PlanEditHelper.clone(group.selectedSlot),
            possibleSlots: PlanEditHelper.clone(group.possibleSlots || {}),
        };
        return {plan: newPlan, groupName: newGroupName};
    }

    /**
     * Splits a group into single groups at the same slot
     */
    static splitGroup(plan: any, groupName: string): any {
        let group = plan?.groups?.[groupName];
        let newPlan = PlanEditHelper.deleteGroup(plan, groupName);
        if(!group) {
            return newPlan;
        }
        for(const member of PlanEditHelper.getMembers(plan, groupName)) {
            let memberGroupName = PlanEditHelper.getUniqueGroupName(newPlan, member);
            newPlan.groups[memberGroupName] = {
                members: [member],
                selectedSlot: PlanEditHelper.clone(group.selectedSlot),
                possibleSlots: PlanEditHelper.clone(group.possibleSlots || {}),
            };
        }
        return newPlan;
    }

    static getGroupNamesWithMember(plan: any, member: string): string[] {
        let groups = plan?.groups || {};
        return Object.keys(groups).filter((groupName) => (groups[groupName]?.members || []).includes(member));
    }

    /**
     * Moves a member from one group into another group
     */
    static moveMemberToGroup(plan: any, sourceGroupName: string, member: string, targetGroupName: string): {plan: any, groupName: string | undefined} {
        if(sourceGroupName === targetGroupName) {
            return {plan: PlanEditHelper.clone(plan), groupName: targetGroupName};
        }
        let source = plan?.groups?.[sourceGroupName];
        let target = plan?.groups?.[targetGroupName];
        if(!source || !target) {
            return {plan: PlanEditHelper.clone(plan), groupName: undefined};
        }
        let remainingMembers = PlanEditHelper.getMembers(plan, sourceGroupName).filter((m: string) => m !== member);
        let newPlan = PlanEditHelper.setGroupMembers(plan, sourceGroupName, remainingMembers).plan;
        let targetMembers = [...PlanEditHelper.getMembers(plan, targetGroupName)];
        if(!targetMembers.includes(member)) {
            targetMembers.push(member);
        }
        return PlanEditHelper.setGroupMembers(newPlan, targetGroupName, targetMembers);
    }

    /**
     * Moves an offered slot of a tutor to another day and time.
     * The condition of the slot and all groups which are assigned to this slot are moved too.
     */
    static moveTutorSlot(plan: any, from: SlotRef, toDay: string, toTime: string): any {
        let newPlan = PlanEditHelper.clone(plan);
        let to: SlotRef = {tutor: from.tutor, day: toDay, time: toTime};
        if(PlanEditHelper.isSameSlot(from, to) || !PlanEditHelper.tutorHasSlot(newPlan, from) || PlanEditHelper.tutorHasSlot(newPlan, to)) {
            return newPlan;
        }
        let tutorSlots = newPlan.tutors[from.tutor];
        delete tutorSlots[from.day][from.time];
        if(Object.keys(tutorSlots[from.day]).length === 0) {
            delete tutorSlots[from.day];
        }
        tutorSlots[toDay] = tutorSlots[toDay] || {};
        tutorSlots[toDay][toTime] = true;

        let condition = newPlan.tutorSlotConditions?.[from.tutor]?.[from.day]?.[from.time];
        if(condition !== undefined) {
            newPlan = PlanEditHelper.setTutorSlotCondition(newPlan, from, undefined);
            newPlan = PlanEditHelper.setTutorSlotCondition(newPlan, to, condition);
        }

        for(const groupName of PlanEditHelper.getGroupNamesAtSlot(newPlan, from)) {
            newPlan = PlanEditHelper.moveGroupToSlot(newPlan, groupName, to);
        }
        return newPlan;
    }

    static addTutorSlot(plan: any, slot: SlotRef): any {
        let newPlan = PlanEditHelper.clone(plan);
        newPlan.tutors = newPlan.tutors || {};
        newPlan.tutors[slot.tutor] = newPlan.tutors[slot.tutor] || {};
        newPlan.tutors[slot.tutor][slot.day] = newPlan.tutors[slot.tutor][slot.day] || {};
        newPlan.tutors[slot.tutor][slot.day][slot.time] = true;
        newPlan.tutorMultipliers = newPlan.tutorMultipliers || {};
        if(newPlan.tutorMultipliers[slot.tutor] === undefined) {
            newPlan.tutorMultipliers[slot.tutor] = 1;
        }
        return newPlan;
    }

    static deleteTutorSlot(plan: any, slot: SlotRef): any {
        let newPlan = PlanEditHelper.clone(plan);
        let daySlots = newPlan.tutors?.[slot.tutor]?.[slot.day];
        if(daySlots) {
            delete daySlots[slot.time];
            if(Object.keys(daySlots).length === 0) {
                delete newPlan.tutors[slot.tutor][slot.day];
            }
        }
        return PlanEditHelper.setTutorSlotCondition(newPlan, slot, undefined);
    }

    static setTutorSlotCondition(plan: any, slot: SlotRef, condition: string | undefined): any {
        let newPlan = PlanEditHelper.clone(plan);
        let cleaned = condition?.trim();
        if(cleaned) {
            newPlan.tutorSlotConditions = newPlan.tutorSlotConditions || {};
            newPlan.tutorSlotConditions[slot.tutor] = newPlan.tutorSlotConditions[slot.tutor] || {};
            newPlan.tutorSlotConditions[slot.tutor][slot.day] = newPlan.tutorSlotConditions[slot.tutor][slot.day] || {};
            newPlan.tutorSlotConditions[slot.tutor][slot.day][slot.time] = cleaned;
            return newPlan;
        }
        let conditionsForDay = newPlan.tutorSlotConditions?.[slot.tutor]?.[slot.day];
        if(conditionsForDay) {
            delete conditionsForDay[slot.time];
            if(Object.keys(conditionsForDay).length === 0) {
                delete newPlan.tutorSlotConditions[slot.tutor][slot.day];
            }
            if(Object.keys(newPlan.tutorSlotConditions[slot.tutor]).length === 0) {
                delete newPlan.tutorSlotConditions[slot.tutor];
            }
        }
        return newPlan;
    }

    /**
     * Returns all offered slots of all tutors, sorted by day, time and tutor
     */
    static getAllTutorSlots(plan: any, weekdayOrder: string[]): SlotRef[] {
        let slots: SlotRef[] = [];
        let tutors = plan?.tutors || {};
        for(const tutor of Object.keys(tutors)) {
            for(const day of Object.keys(tutors[tutor] || {})) {
                for(const time of Object.keys(tutors[tutor][day] || {})) {
                    slots.push({tutor, day, time});
                }
            }
        }
        return slots.sort((a, b) =>
            (weekdayOrder.indexOf(a.day) - weekdayOrder.indexOf(b.day)) ||
            a.time.localeCompare(b.time) ||
            a.tutor.localeCompare(b.tutor)
        );
    }
}
