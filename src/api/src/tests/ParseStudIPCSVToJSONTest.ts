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
