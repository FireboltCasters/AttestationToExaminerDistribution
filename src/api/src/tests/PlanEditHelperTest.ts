import PlanEditHelper from "../ignoreCoverage/PlanEditHelper";

function getPlan(): any {
    return {
        groups: {
            "A & B": {members: ["A", "B"], selectedSlot: {tutor: "T1", day: "Monday", time: "08:00"}, possibleSlots: {"Monday": {"08:00": true}}},
            "C": {members: ["C"], selectedSlot: {tutor: "T2", day: "Monday", time: "08:30"}, possibleSlots: {"Monday": {"08:30": true}}},
        },
        tutors: {
            "T1": {"Monday": {"08:00": true, "08:30": true}},
            "T2": {"Monday": {"08:30": true}},
        },
        tutorMultipliers: {"T1": 1, "T2": 1},
        tutorSlotConditions: {"T1": {"Monday": {"08:30": "Präsenz"}}},
    };
}

test('Move and swap groups', () => {
    let plan = getPlan();
    let moved = PlanEditHelper.moveGroupToSlot(plan, "C", {tutor: "T1", day: "Monday", time: "08:30"});
    expect(moved.groups["C"].selectedSlot).toEqual({tutor: "T1", day: "Monday", time: "08:30"});
    expect(plan.groups["C"].selectedSlot.tutor).toBe("T2"); // original unchanged

    let swapped = PlanEditHelper.swapGroups(plan, "A & B", "C");
    expect(swapped.groups["A & B"].selectedSlot.tutor).toBe("T2");
    expect(swapped.groups["C"].selectedSlot.tutor).toBe("T1");
});

test('Merge groups keeps the slot of the target', () => {
    let {plan, groupName} = PlanEditHelper.mergeGroups(getPlan(), "C", "A & B");
    expect(groupName).toBe("A & B & C");
    expect(Object.keys(plan.groups)).toEqual(["A & B & C"]);
    expect(plan.groups[groupName].selectedSlot.time).toBe("08:00");
    expect(plan.groups[groupName].possibleSlots["Monday"]).toEqual({"08:00": true, "08:30": true});
});

test('Members can be edited, moved and split', () => {
    let edited = PlanEditHelper.setGroupMembers(getPlan(), "A & B", ["A", " ", "D"]);
    expect(edited.groupName).toBe("A & D");
    expect(edited.plan.groups["A & D"].members).toEqual(["A", "D"]);

    let moved = PlanEditHelper.moveMemberToGroup(getPlan(), "A & B", "B", "C");
    expect(Object.keys(moved.plan.groups).sort()).toEqual(["A", "C & B"]);

    let movedLast = PlanEditHelper.moveMemberToGroup(getPlan(), "C", "C", "A & B");
    expect(Object.keys(movedLast.plan.groups)).toEqual(["A & B & C"]);

    let split = PlanEditHelper.splitGroup(getPlan(), "A & B");
    expect(Object.keys(split.groups).sort()).toEqual(["A", "B", "C"]);
    expect(split.groups["B"].selectedSlot.time).toBe("08:00");

    let splitMember = PlanEditHelper.splitMemberFromGroup(getPlan(), "A & B", "A");
    expect(splitMember.groupName).toBe("A");
    expect(Object.keys(splitMember.plan.groups).sort()).toEqual(["A", "B", "C"]);
});

test('Tutor slots can be moved with condition and groups', () => {
    let plan = PlanEditHelper.moveTutorSlot(getPlan(), {tutor: "T1", day: "Monday", time: "08:30"}, "Tuesday", "10:00");
    expect(plan.tutors["T1"]).toEqual({"Monday": {"08:00": true}, "Tuesday": {"10:00": true}});
    expect(plan.tutorSlotConditions["T1"]).toEqual({"Tuesday": {"10:00": "Präsenz"}});

    let withGroup = PlanEditHelper.moveTutorSlot(getPlan(), {tutor: "T1", day: "Monday", time: "08:00"}, "Friday", "12:00");
    expect(withGroup.groups["A & B"].selectedSlot).toEqual({tutor: "T1", day: "Friday", time: "12:00"});

    // target already offered => nothing happens
    let blocked = PlanEditHelper.moveTutorSlot(getPlan(), {tutor: "T1", day: "Monday", time: "08:00"}, "Monday", "08:30");
    expect(blocked).toEqual(getPlan());

    let deleted = PlanEditHelper.deleteTutorSlot(getPlan(), {tutor: "T1", day: "Monday", time: "08:30"});
    expect(deleted.tutors["T1"]).toEqual({"Monday": {"08:00": true}});
    expect(deleted.tutorSlotConditions).toEqual({});

    expect(PlanEditHelper.isTutorSlotFree(getPlan(), {tutor: "T1", day: "Monday", time: "08:30"})).toBe(true);
    expect(PlanEditHelper.isTutorSlotFree(getPlan(), {tutor: "T1", day: "Monday", time: "08:00"})).toBe(false);
});

test('Groups can be added and deleted', () => {
    let {plan, groupName} = PlanEditHelper.addGroup(getPlan(), ["C"], {tutor: "T1", day: "Monday", time: "08:30"});
    expect(groupName).toBe("C (2)");
    expect(plan.groups["C (2)"].selectedSlot.tutor).toBe("T1");
    expect(Object.keys(PlanEditHelper.deleteGroup(plan, "C").groups).sort()).toEqual(["A & B", "C (2)"]);
});
