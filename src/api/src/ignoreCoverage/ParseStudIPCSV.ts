const csv = require('csvtojson')

export default class ParseStudIPCSV {

    static getAllTutorsDict(nodes: any): any {
        let tutors = {}
        for(const element of nodes) {
            let node = element
            let tutor = ParseStudIPCSV.getTutorFromNode(node)
            if(tutor != undefined) {
                // @ts-ignore
                tutors[tutor] = true
            }
        }
        return tutors
    }

    static getTutorFromNode(node: any): string {
        let ort = node["Ort"]
        ort = ort.replace(")", "")
        ort = ort.replace("(", "")
        return ort
    }

    static getOnlySlotTimeAndDay(slot: string): string {
        let parts = slot.split("-")
        return parts[0]+"-"+parts[1]
    }

    static getGroupToSelectedSlotMapping(nodes: any, slotsDict: any){
        let mapping = {}
        for(const element of nodes) {
            let node = element
            let group = ParseStudIPCSV.getGroupFromNode(node)
            let slot = ParseStudIPCSV.getSlotFromNode(node)
            if(group != undefined && slot != undefined) {
                // @ts-ignore
                mapping[group] = slot
            }
        }
        return mapping
    }

    static getGroupToSlotMapping(nodes: any, slotsDict: any): any {
        let mapping = {}
        for(const element of nodes) {
            let node = element
            let group = ParseStudIPCSV.getGroupFromNode(node)
            let slot = ParseStudIPCSV.getSlotFromNode(node)
            if(group != undefined && slot != undefined) {
                let slotTimeAndDay = ParseStudIPCSV.getOnlySlotTimeAndDay(slot)
                if(slotTimeAndDay != undefined) {
                    let slotsDictKeys = Object.keys(slotsDict)
                    for(const slotDictKey of slotsDictKeys) {
                        let slotDictKeyTimeAndDay = ParseStudIPCSV.getOnlySlotTimeAndDay(slotDictKey)
                        if(slotTimeAndDay == slotDictKeyTimeAndDay) {
                            // @ts-ignore
                            if(mapping[group] == undefined) {
                                // @ts-ignore
                                mapping[group] = {}
                            }
                            // @ts-ignore
                            mapping[group][slotDictKey] = true
                        }
                    }
                }
            }
        }
        return mapping
    }

    static getAllSlots(nodes: any): any {
        let slots = {}
        for(const element of nodes) {
            let node = element
            let slot = ParseStudIPCSV.getSlotFromNode(node)
            if(slot != undefined) {
                // @ts-ignore
                slots[slot] = true
            }
        }
        return slots
    }

    static getWeekday(date: Date): string{
        let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return weekdays[date.getDay()];
    }

    static getSlotFromNode(node: any): string {
        let datum = node["Datum"]
        let date = new Date(datum)
        let day = ParseStudIPCSV.getWeekday(date)
        return day+"-"+node["Beginn"]+"-"+ParseStudIPCSV.getTutorFromNode(node);
    }

    static getAllGroups(nodes: any): any {
        let groups = {}
        for(const element of nodes) {
            let node = element
            let group = ParseStudIPCSV.getGroupFromNode(node)
            if(group != undefined) {
                // @ts-ignore
                groups[group] = true
            }
        }
        return groups
    }

    static getGroupFromNode(node: any): any {
        let person = node["Person"]
        if(person == "") {
            return undefined
        }
        if(person != undefined) {
            person = person.replace("\n", " & ")
        }
        return person
    }

    static getTutorFromSlot(slot: string): string {
        let parts = slot.split("-")
        return parts[2]
    }

    static getSlotToTutorMapping(slotDicts: any): any {
        let result = {}
        let slots = Object.keys(slotDicts)
        for(const slot of slots) {
            let tutor = ParseStudIPCSV.getTutorFromSlot(slot)
            // @ts-ignore
            result[slot] = tutor
        }
        return result
    }

    static getSourceEdges(groupDicts: any): any {
        let result = {}
        let groups = Object.keys(groupDicts)
        for(const group of groups) {
            // @ts-ignore
            result[group] = true
        }
        return result
    }

    static getSinkEdges(tutorDicts: any): any {
        let result = {}
        let tutors = Object.keys(tutorDicts)
        for(const tutor of tutors) {
            // @ts-ignore
            result[tutor] = true
        }
        return result
    }

    static async parse(s: string): Promise<any> {
        let output = await csv({delimiter: ";"}).fromString(s)
        let result = {
            groups: [],
            slots: [],
            tutors: [],
            groupToSlotMapping: {},
            slotToTutorMapping: {},
            sourceEdges: {},
            sinkEdges: {}
        };

        let tutorDicts = ParseStudIPCSV.getAllTutorsDict(output)
        let tutors = Object.keys(tutorDicts)
        // @ts-ignore
        result.tutors = tutors;

        let slotDicts = ParseStudIPCSV.getAllSlots(output)
        let slots = Object.keys(slotDicts)
        // @ts-ignore
        result.slots = slots;

        let groupDicts = ParseStudIPCSV.getAllGroups(output)
        let groups = Object.keys(groupDicts)
        // @ts-ignore
        result.groups = groups;

        let groupToSlotMapping = ParseStudIPCSV.getGroupToSlotMapping(output, slotDicts)
        // @ts-ignore
        result.groupToSlotMapping = groupToSlotMapping;

        let groupToSelectedSlotMapping = ParseStudIPCSV.getGroupToSelectedSlotMapping(output, slotDicts)
        // @ts-ignore
        result.groupToSelectedSlotMapping = groupToSelectedSlotMapping;

        let slotToTutorMapping = ParseStudIPCSV.getSlotToTutorMapping(slotDicts)
        // @ts-ignore
        result.slotToTutorMapping = slotToTutorMapping;

        let sourceEdges = ParseStudIPCSV.getSourceEdges(groupDicts)
        // @ts-ignore
        result.sourceEdges = sourceEdges;

        let sinkEdges = ParseStudIPCSV.getSinkEdges(tutorDicts)
        // @ts-ignore
        result.sinkEdges = sinkEdges;

        return result;
    }

    static getHelpingMapVerticiesToName(mappingHelper: any): any {
        let result = {}
        let keys = Object.keys(mappingHelper)
        for(const key of keys) {
            let value = mappingHelper[key]
            // @ts-ignore
            result[value] = key
        }
        return result
    }

    static getHelpingMapToVertices(parsed: any): any {
        let mapping = {};

        let source = 0;
        let sink = 1;

        // @ts-ignore
        mapping["source"] = source;
        // @ts-ignore
        mapping["sink"] = sink;

        let latestVertex = 2;

        for(const group of parsed.groups) {
            // @ts-ignore
            mapping[group] = latestVertex;
            latestVertex++;
        }

        for(const slot of parsed.slots) {
            // @ts-ignore
            mapping[slot] = latestVertex;
            latestVertex++;
        }

        for(const tutor of parsed.tutors) {
            // @ts-ignore
            mapping[tutor] = latestVertex;
            latestVertex++;
        }

        return mapping;
    }

    static getGraph(parsed: any, mapping: any, tutorCapacity: number): any {
        let result = {}
        let source = 0;
        let sink = 1;

        let defaultCapacity = 1;

        let sourceEdges = Object.keys(parsed.sourceEdges)
        for(const sourceEdge of sourceEdges) {
            // @ts-ignore
            if(result[source] == undefined) {
                // @ts-ignore
                result[source] = {}
            }
            // @ts-ignore
            result[source][mapping[sourceEdge]] = defaultCapacity
        }

        let groupToSlotMapping = parsed.groupToSlotMapping
        let groups = Object.keys(groupToSlotMapping)
        for(const group of groups) {
            // @ts-ignore
            let slots = groupToSlotMapping[group]
            let slotsArray = Object.keys(slots)
            for(const slot of slotsArray) {
                // @ts-ignore
                if(result[mapping[group]] == undefined) {
                    // @ts-ignore
                    result[mapping[group]] = {}
                }
                // @ts-ignore
                result[mapping[group]][mapping[slot]] = defaultCapacity
            }
        }

        let slotToTutorMapping = parsed.slotToTutorMapping
        let slots = Object.keys(slotToTutorMapping)
        for(const slot of slots) {
            // @ts-ignore
            let tutor = slotToTutorMapping[slot]
            // @ts-ignore
            if(result[mapping[slot]] == undefined) {
                // @ts-ignore
                result[mapping[slot]] = {}
            }
            // @ts-ignore
            result[mapping[slot]][mapping[tutor]] = defaultCapacity
        }

        let sinkEdges = Object.keys(parsed.sinkEdges)
        for(const sinkEdge of sinkEdges) {
            // @ts-ignore
            if(result[mapping[sinkEdge]] == undefined) {
                // @ts-ignore
                result[mapping[sinkEdge]] = {}
            }
            // @ts-ignore
            result[mapping[sinkEdge]][sink] = tutorCapacity
        }

        return result
    }

}
