import ParseStudIPCSVToJSON from "../ignoreCoverage/ParseStudIPCSVToJSON";
import JSONToGraph from "../ignoreCoverage/JSONToGraph";

const csv30 = 'Datum;Beginn;Ende;Person;Ort;Notiz;Grund\n' +
    '18.04.2023;08:00;08:30;"GroupA";"Nils Baumgartner (Präsenz)";;\n' +
    '18.04.2023;08:30;09:00;"GroupB";"Nils Baumgartner (Online unter Vorbehalt, sonst in Präsenz)";;\n' +
    '18.04.2023;09:00;09:30;"";"Nils Baumgartner";;\n' +
    '18.04.2023;08:00;08:30;"";"Kolmogorov";;\n';

test('Tutor name and condition are split', () => {
    expect(ParseStudIPCSVToJSON.parseTutorAndCondition("Nils Baumgartner (Online unter Vorbehalt, sonst in Präsenz)"))
        .toEqual({tutor: "Nils Baumgartner", condition: "Online unter Vorbehalt, sonst in Präsenz"});
    expect(ParseStudIPCSVToJSON.parseTutorAndCondition(" Kolmogorov "))
        .toEqual({tutor: "Kolmogorov", condition: undefined});
});

test('Tutors with conditions are merged and conditions are kept per slot', async () => {
    let json = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(csv30);
    expect(Object.keys(json.tutors).sort()).toEqual(["Kolmogorov", "Nils Baumgartner"]);
    expect(json.tutors["Nils Baumgartner"]["Tuesday"]).toEqual({"08:00": true, "08:30": true, "09:00": true});
    expect(json.tutorSlotConditions).toEqual({
        "Nils Baumgartner": {
            "Tuesday": {
                "08:00": "Präsenz",
                "08:30": "Online unter Vorbehalt, sonst in Präsenz",
            }
        }
    });
    expect(json.groups["GroupA"].selectedSlot.tutor).toBe("Nils Baumgartner");
    expect(json.rawSlots.length).toBe(4);
    expect(json.rawSlots[1].raw["Ort"]).toBe("Nils Baumgartner (Online unter Vorbehalt, sonst in Präsenz)");
});

test('Slot duration is detected and used for the timeslots', async () => {
    let json = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(csv30);
    expect(json.slotDurationMinutes).toBe(30);
    let timeslots = JSONToGraph.getTimeslots(json);
    expect(timeslots.slice(0, 3)).toEqual(["08:00", "08:30", "09:00"]);
    expect(timeslots[timeslots.length - 1]).toBe("19:30");

    let csv20 = csv30.replace(/08:30;09:00/, "08:20;08:40");
    let json20 = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(csv20);
    expect(json20.slotDurationMinutes).toBe(20);
});

test('Slot duration is inferred for plans without slotDurationMinutes', () => {
    expect(JSONToGraph.getSlotDurationMinutes(undefined)).toBe(20);
    let plan = {tutors: {"A": {"Monday": {"08:00": true, "08:30": true}}}, groups: {}};
    expect(JSONToGraph.getSlotDurationMinutes(plan)).toBe(30);
    // times off the grid are always shown
    let planOffGrid = {tutors: {"A": {"Monday": {"08:00": true, "08:30": true, "08:45": true}}}, groups: {}, slotDurationMinutes: 30};
    expect(JSONToGraph.getTimeslots(planOffGrid).slice(0, 4)).toEqual(["08:00", "08:30", "08:45", "09:00"]);
});

test('Decimal tutor multipliers are mapped to integers for the calculation', () => {
    expect(JSONToGraph.getIntegerTutorMultipliers({tutors: {A: {}, B: {}}, tutorMultipliers: {A: 1, B: 1.5}})).toEqual({A: 2, B: 3});
    expect(JSONToGraph.getIntegerTutorMultipliers({tutors: {A: {}, B: {}, C: {}}, tutorMultipliers: {A: "0,5", B: 0.75}})).toEqual({A: 2, B: 3, C: 4});
    expect(JSONToGraph.getIntegerTutorMultipliers({tutors: {A: {}, B: {}}, tutorMultipliers: {A: 2, B: 4}})).toEqual({A: 1, B: 2});
    expect(JSONToGraph.getIntegerTutorMultipliers({tutors: {A: {}, B: {}}, tutorMultipliers: {A: 0, B: 1}})).toEqual({A: 0, B: 1});
});

test('Optimization respects decimal multipliers', () => {
    const GraphHelper = require("../ignoreCoverage/GraphHelper").default;
    let tutors: any = {A: {Monday: {}}, B: {Monday: {}}};
    let groups: any = {};
    for(let i = 0; i < 10; i++) {
        let time = JSONToGraph.minutesToTime(8 * 60 + i * 30);
        tutors.A.Monday[time] = true;
        tutors.B.Monday[time] = true;
        groups["G" + i] = {members: ["G" + i], selectedSlot: {tutor: "A", day: "Monday", time}, possibleSlots: {Monday: {[time]: true}}};
    }
    let plan = {groups, tutors, tutorMultipliers: {A: 1, B: 1.5}};
    let optimized = GraphHelper.getOptimizedDistribution(plan);
    let counts: any = {A: 0, B: 0};
    for(const name of Object.keys(optimized.groups)) {
        counts[optimized.groups[name].selectedSlot.tutor]++;
    }
    expect(counts).toEqual({A: 4, B: 6});
});

test('Location modes are detected from the conditions', () => {
    expect(JSONToGraph.getLocationMode("Präsenz")).toBe("onsite");
    expect(JSONToGraph.getLocationMode("vor Ort")).toBe("onsite");
    expect(JSONToGraph.getLocationMode("Online")).toBe("online");
    expect(JSONToGraph.getLocationMode("Online unter Vorbehalt, sonst vor Ort")).toBe("online-reserved");
    expect(JSONToGraph.getLocationMode("Online unter Vorbehalt, sonst in Präsenz")).toBe("online-reserved");
    expect(JSONToGraph.getLocationMode(undefined)).toBe("unspecified");
});

test('Optimization does not switch groups between on-site and online', () => {
    const GraphHelper = require("../ignoreCoverage/GraphHelper").default;
    let tutors: any = {A: {Monday: {}}, B: {Monday: {}}};
    let tutorSlotConditions: any = {A: {Monday: {}}, B: {Monday: {}}};
    let groups: any = {};
    for(let i = 0; i < 6; i++) {
        let time = JSONToGraph.minutesToTime(8 * 60 + i * 30);
        tutors.A.Monday[time] = true;
        tutors.B.Monday[time] = true;
        tutorSlotConditions.A.Monday[time] = "vor Ort";
        tutorSlotConditions.B.Monday[time] = "Online unter Vorbehalt, sonst vor Ort";
        groups["G" + i] = {members: ["G" + i], selectedSlot: {tutor: "A", day: "Monday", time}, possibleSlots: {Monday: {[time]: true}}};
    }
    let plan = {groups, tutors, tutorSlotConditions};
    let optimized = GraphHelper.getOptimizedDistribution(plan);
    for(const name of Object.keys(optimized.groups)) {
        expect(optimized.groups[name].selectedSlot.tutor).toBe("A");
    }

    // with the same condition the groups are distributed
    let sameConditions: any = {A: {Monday: {}}, B: {Monday: {}}};
    for(const time of Object.keys(tutors.A.Monday)) {
        sameConditions.A.Monday[time] = "vor Ort";
        sameConditions.B.Monday[time] = "Präsenz";
    }
    let optimizedSame = GraphHelper.getOptimizedDistribution({groups, tutors, tutorSlotConditions: sameConditions});
    let counts: any = {A: 0, B: 0};
    for(const name of Object.keys(optimizedSame.groups)) {
        counts[optimizedSame.groups[name].selectedSlot.tutor]++;
    }
    expect(counts).toEqual({A: 3, B: 3});
});

test('Single groups are only merged with the same location mode', () => {
    const GraphHelper = require("../ignoreCoverage/GraphHelper").default;
    let plan: any = {
        tutors: {A: {Monday: {"08:00": true}}, B: {Monday: {"08:00": true}}},
        tutorSlotConditions: {A: {Monday: {"08:00": "vor Ort"}}, B: {Monday: {"08:00": "Online unter Vorbehalt, sonst vor Ort"}}},
        groups: {
            X: {members: ["X"], selectedSlot: {tutor: "A", day: "Monday", time: "08:00"}, possibleSlots: {Monday: {"08:00": true}}},
            Y: {members: ["Y"], selectedSlot: {tutor: "B", day: "Monday", time: "08:00"}, possibleSlots: {Monday: {"08:00": true}}},
        },
    };
    let merged = GraphHelper.mergeSingleGroups(plan);
    expect(Object.keys(merged.groups).sort()).toEqual(["X", "Y"]);
});
