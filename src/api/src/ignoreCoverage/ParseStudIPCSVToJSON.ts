import JSONToGraph from "./JSONToGraph";

const csv = require('csvtojson')

export default class ParseStudIPCSVToJSON {

    static getAllTutorsDict(nodes: any): any {
        let tutors = {}
        for(const element of nodes) {
            let node = element
            let tutor = ParseStudIPCSVToJSON.getTutorFromNode(node)
            if(tutor != undefined) {
                // @ts-ignore
                if(!tutors[tutor]) {
                    // @ts-ignore
                    tutors[tutor] = {}
                }
                // @ts-ignore
                let slotForTutor = ParseStudIPCSVToJSON.getSlotFromNode(node)
                // @ts-ignore
                if(!tutors[tutor][slotForTutor.day]) {
                    // @ts-ignore
                    tutors[tutor][slotForTutor.day] = {}
                }
                // @ts-ignore
                tutors[tutor][slotForTutor.day][slotForTutor.time] = true;
            }
        }
        return tutors
    }

    /**
     * Splits the raw "Ort" field into the tutor name and an optional condition in brackets.
     * e.g. "Nils Baumgartner (Online unter Vorbehalt, sonst in Präsenz)"
     *   => {tutor: "Nils Baumgartner", condition: "Online unter Vorbehalt, sonst in Präsenz"}
     */
    static parseTutorAndCondition(rawOrt: any): {tutor: string, condition: string | undefined} {
        let raw = (rawOrt === undefined || rawOrt === null) ? "" : (""+rawOrt).trim();
        let match = raw.match(/^([^(]*?)\s*\(([\s\S]*)\)\s*$/);
        if(match && match[1].trim().length > 0) {
            let condition = match[2].trim();
            return {tutor: match[1].trim(), condition: condition.length > 0 ? condition : undefined};
        }
        return {tutor: raw, condition: undefined};
    }

    static getTutorFromNode(node: any): string {
        return ParseStudIPCSVToJSON.parseTutorAndCondition(node["Ort"]).tutor
    }

    static getConditionFromNode(node: any): string | undefined {
        return ParseStudIPCSVToJSON.parseTutorAndCondition(node["Ort"]).condition
    }

    /**
     * Normalizes a time like "8:00" to "08:00"
     */
    static normalizeTime(time: any): string {
        let minutes = JSONToGraph.timeToMinutes(time);
        if(isNaN(minutes)) {
            return time;
        }
        return JSONToGraph.minutesToTime(minutes);
    }

    /**
     * Detects the smallest slot duration (e.g. 20 or 30 minutes) by using "Ende" - "Beginn" of each row.
     * Falls back to the smallest distance between two start times of a tutor at a day.
     */
    static detectSlotDurationMinutes(nodes: any): number {
        let smallest: number | undefined = undefined;
        for(const node of nodes) {
            let duration = JSONToGraph.timeToMinutes(node["Ende"]) - JSONToGraph.timeToMinutes(node["Beginn"]);
            if(!isNaN(duration) && duration > 0 && (smallest === undefined || duration < smallest)) {
                smallest = duration;
            }
        }
        if(smallest !== undefined) {
            return smallest;
        }

        let startsPerTutorAndDate: Record<string, number[]> = {};
        for(const node of nodes) {
            let key = ParseStudIPCSVToJSON.getTutorFromNode(node) + "-" + node["Datum"];
            let start = JSONToGraph.timeToMinutes(node["Beginn"]);
            if(!isNaN(start)) {
                startsPerTutorAndDate[key] = startsPerTutorAndDate[key] || [];
                startsPerTutorAndDate[key].push(start);
            }
        }
        for(const key of Object.keys(startsPerTutorAndDate)) {
            let starts = startsPerTutorAndDate[key].sort((a, b) => a - b);
            for(let i = 1; i < starts.length; i++) {
                let diff = starts[i] - starts[i-1];
                if(diff > 0 && (smallest === undefined || diff < smallest)) {
                    smallest = diff;
                }
            }
        }
        return smallest || JSONToGraph.DEFAULT_SLOT_DURATION_MINUTES;
    }

    /**
     * Collects for every tutor and slot the condition (text in brackets) the tutor added in Stud.IP.
     * The condition belongs to the tutor at this slot, not to the group.
     */
    static getAllTutorSlotConditions(nodes: any): any {
        let conditions: any = {}
        for(const node of nodes) {
            let condition = ParseStudIPCSVToJSON.getConditionFromNode(node)
            if(condition !== undefined) {
                let slot = ParseStudIPCSVToJSON.getSlotFromNode(node)
                conditions[slot.tutor] = conditions[slot.tutor] || {}
                conditions[slot.tutor][slot.day] = conditions[slot.tutor][slot.day] || {}
                conditions[slot.tutor][slot.day][slot.time] = condition
            }
        }
        return conditions
    }

    /**
     * Keeps the raw information of every row of the CSV, enriched with the parsed tutor and condition
     */
    static getRawSlots(nodes: any): any[] {
        let rawSlots = []
        for(const node of nodes) {
            let slot = ParseStudIPCSVToJSON.getSlotFromNode(node)
            rawSlots.push({
                tutor: slot.tutor,
                condition: ParseStudIPCSVToJSON.getConditionFromNode(node),
                day: slot.day,
                time: slot.time,
                raw: node,
            })
        }
        return rawSlots
    }

    static getSlotFromNode(node: any): any {
        let datum = node["Datum"]
        let splits = datum.split(".");
        let date = new Date();

        date.setFullYear(parseInt(splits[2]), parseInt(splits[1]) - 1, parseInt(splits[0]));
//        date.setDate(parseInt(splits[0]))
  //      date.setFullYear(parseInt(splits[2]))
    //    date.setMonth(parseInt(splits[1]) - 1)

        let day = ParseStudIPCSVToJSON.getWeekday(date)
        let tutor = ParseStudIPCSVToJSON.getTutorFromNode(node)

        let slot = {
            tutor: tutor,
            day: day,
            time: ParseStudIPCSVToJSON.normalizeTime(node["Beginn"]),
        }
        return slot;
    }

    static getWeekday(date: Date): string{
        return JSONToGraph.getWeekdayByNumber(date.getDay());
    }

    static getAllGroups(nodes: any): any {
        let groups = {}
        let tutorSlotToGroupMembersInformations = {}

        // since not all group members are in the same row, we need to collect them first
        for(const element of nodes) {
            let node = element
            let slotsForGroup = ParseStudIPCSVToJSON.getSlotFromNode(node)
            let tutor = slotsForGroup.tutor
            let day = slotsForGroup.day
            let time = slotsForGroup.time
            let slotId = tutor + "-" + day + "-" + time // get the slot id
            // @ts-ignore
            let tutorSlotToGroupMembersInformation = tutorSlotToGroupMembersInformations[slotId] || {
                slot: slotsForGroup,
                groupMembers: []
            }

            let members = tutorSlotToGroupMembersInformation.groupMembers
            let groupMembers = ParseStudIPCSVToJSON.getGroupMembersFromNode(node) // get the group member
            if(!!groupMembers && groupMembers.length>0) {
                for(const groupMember of groupMembers){
                    members.push(groupMember) // add the group member to the list of group members
                }
                tutorSlotToGroupMembersInformation.groupMembers = members
            }
            // @ts-ignore
            tutorSlotToGroupMembersInformations[slotId] = tutorSlotToGroupMembersInformation
        }

        let slotKeys = Object.keys(tutorSlotToGroupMembersInformations)
        for(const slotKey of slotKeys) {
            // @ts-ignore
            let tutorSlotToGroupMembersInformation = tutorSlotToGroupMembersInformations[slotKey]
            let slotsForGroup = tutorSlotToGroupMembersInformation.slot

            let groupMembers = tutorSlotToGroupMembersInformation.groupMembers

            if(groupMembers != undefined && groupMembers.length>0) {
                let groupId = groupMembers.join(" & ");

                // @ts-ignore
                if(!groups[groupId]) {
                    // @ts-ignore
                    groups[groupId] = {}
                }

                // @ts-ignore
                groups[groupId]["members"] = groupMembers;

                // @ts-ignore
                if(!groups[groupId]["selectedSlot"]) {
                    // @ts-ignore
                    groups[groupId]["selectedSlot"] = slotsForGroup
                }

                // @ts-ignore
                if(!groups[groupId]["possibleSlots"]) {
                    // @ts-ignore
                    groups[groupId]["possibleSlots"] = {}
                }

                // @ts-ignore
                if (!groups[groupId]["possibleSlots"][slotsForGroup.day]) {
                    // @ts-ignore
                    groups[groupId]["possibleSlots"][slotsForGroup.day] = {}
                }
                // @ts-ignore
                groups[groupId]["possibleSlots"][slotsForGroup.day][slotsForGroup.time] = true;
            }
        }
        return groups
    }

    static getGroupMembersFromNode(node: any): any {
        let person = node["Person"]
        if(person === undefined || person === null || person == "") {
            return undefined
        }
        if(person.length>0){
            if(person.includes("\n")) {
                let parts = person.split("\n")
                return parts
            }
            return [person]
        }
        return undefined
    }

    static getTutorFromSlot(slot: string): string {
        let parts = slot.split("-")
        return parts[2]
    }

    static async parseStudIPCSVToJSON(s: string): Promise<any> {
        let output = await csv({delimiter: ";"}).fromString(s)
        let result = {
            groups: {},
            tutors: {},
            tutorMultipliers: {},
            slotDurationMinutes: ParseStudIPCSVToJSON.detectSlotDurationMinutes(output),
            tutorSlotConditions: ParseStudIPCSVToJSON.getAllTutorSlotConditions(output),
            rawSlots: ParseStudIPCSVToJSON.getRawSlots(output),
        };

        let tutorDicts = ParseStudIPCSVToJSON.getAllTutorsDict(output)
        // @ts-ignore
        result.tutors = tutorDicts;

        let tutorNames = Object.keys(tutorDicts)
        for(const tutorName of tutorNames) {
            // @ts-ignore
            result.tutorMultipliers[tutorName] = 1;
        }


        let groupDicts = ParseStudIPCSVToJSON.getAllGroups(output)
        // @ts-ignore
        result.groups = groupDicts;

        return result;
    }

    static getGroupsForTutors(parsedAsJSON: any){
        if(!parsedAsJSON) {
            return {}
        }
        let tutorNames = Object.keys(parsedAsJSON.tutors)
        let tutorsWithGroups = {}
        let groupNames = Object.keys(parsedAsJSON.groups)
        for(const groupName of groupNames) {
            let group = parsedAsJSON.groups[groupName]
            let tutorName = group.selectedSlot.tutor
            if(tutorName != undefined) {
                // @ts-ignore
                if(!tutorsWithGroups[tutorName]) {
                    // @ts-ignore
                    tutorsWithGroups[tutorName] = []
                }
                // @ts-ignore
                tutorsWithGroups[tutorName].push({
                    group: groupName,
                    day: group.selectedSlot.day,
                    time: group.selectedSlot.time,
                })
            }
        }
        return tutorsWithGroups
    }

}
