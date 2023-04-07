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

    static getTutorFromNode(node: any): string {
        let ort = node["Ort"]
        return ort
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
            time: node["Beginn"],
        }
        return slot;
    }

    static getWeekday(date: Date): string{
        return JSONToGraph.getWeekdayByNumber(date.getDay());
    }

    static getAllGroups(nodes: any): any {
        let groups = {}
        for(const element of nodes) {
            let node = element
            let groupMembers = ParseStudIPCSVToJSON.getGroupMembersFromNode(node)

            if(groupMembers != undefined) {
                let groupId = groupMembers.join(" & ");
                console.log("------")
                console.log("groupMembers: "+groupMembers)

                // @ts-ignore
                let slotsForGroup = ParseStudIPCSVToJSON.getSlotFromNode(node)
                console.log("slotsForGroup");
                console.log(slotsForGroup);

                // @ts-ignore
                if(!groups[groupId]) {
                    // @ts-ignore
                    groups[groupId] = {}
                }

                // @ts-ignore
                //groups[groupId]["members"] = groupMembers;

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
        if(person == "") {
            return undefined
        }
        if(person != undefined) {
            person = person.split("\n")
        }
        return person
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
