import JSONToGraph from "./JSONToGraph";
import jsgraphs from "js-graph-algorithms";

export default class GraphHelper {

    static getJSGraphsFlowNetwork(graphAndVerticeMaps: any): any {
        let graphRaw = graphAndVerticeMaps.graph;
        let fromIds = Object.keys(graphRaw);
        let amountOfVertices = fromIds.length;
        //console.log("amountOfVertices: "+amountOfVertices);

        let g = new jsgraphs.FlowNetwork(amountOfVertices);
        let amountEdges = 0;

        for(const fromId of fromIds) {
            //console.log("fromId: "+fromId);
            let toIds = Object.keys(graphRaw[fromId]);
            for(const toId of toIds) {
                //console.log("toId: "+toId);
                let edgeInformation = graphRaw[fromId][toId];
                let capacity = edgeInformation.capacity;
                let flow = edgeInformation.flow;
                let from = edgeInformation.from;
                let to = edgeInformation.to;

                //@ts-ignore
                g.addEdge(new jsgraphs.FlowEdge(fromId, toId, capacity));
                amountEdges++;
            }
        }

        g.node(0).label = 'Source';
        g.node(1).label = 'Sink';

        return g;
    }

    /**
     * Returns the maximum flow of the given graph by reducing the tutor capacity until the maximum flow is still reached.
     * @param unoptimizedJSON
     */
    static getTutorCapacityWhereAllHaveSameMaximum(unoptimizedJSON: any): number {
        console.log("============================================")
        console.log("getTutorCapacityWhereAllHaveSameMaximum");
        let amountGroups = Object.keys(unoptimizedJSON.groups).length;

        let initialTutorCapacity = amountGroups;

        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, initialTutorCapacity);

        let source = graphAndVerticeMaps.source;
        let sink = graphAndVerticeMaps.sink;

        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let maxFlow = GraphHelper.getMaxFlow(g, source, sink);

        // binary search for the minimum tutor capacity
        let lowestTutorCapacity = initialTutorCapacity;
        let nextTutorCapacity = Math.floor(initialTutorCapacity / 2);
        while(lowestTutorCapacity != nextTutorCapacity) {
            let lastNextTutorCapacity = nextTutorCapacity;
            let newgraphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, nextTutorCapacity);
            let newG = GraphHelper.getJSGraphsFlowNetwork(newgraphAndVerticeMaps);
            let newMaxFlow = GraphHelper.getMaxFlow(newG, source, sink);
            if(newMaxFlow >= maxFlow) {
                // newMaxFlow == maxFlow so we can lower the tutor capacity
                lowestTutorCapacity = nextTutorCapacity;
                nextTutorCapacity = Math.floor(nextTutorCapacity / 2);
            } else {
                // newMaxFlow != maxFlow so we have to increase the tutor capacity
                nextTutorCapacity = Math.floor((lowestTutorCapacity + nextTutorCapacity) / 2);
                if(lastNextTutorCapacity == nextTutorCapacity) {
                // lastNextTutorCapacity == nextTutorCapacity so we can't lower the tutor capacity anymore
                    nextTutorCapacity = lowestTutorCapacity;
                    break;
                }
            }
        }

        return nextTutorCapacity;
    }

    static getTutorOptimizationWhereAllHaveSameMinimum(unoptimizedJSON: any, maxTutorCapacity: any): number {
        console.log("Okay we have a optimized plan where we know that the maximum");
        console.log("tutor capacity is "+maxTutorCapacity);
        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, maxTutorCapacity);
        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let source = graphAndVerticeMaps.source;
        let sink = graphAndVerticeMaps.sink;
        let maxFlow = GraphHelper.getMaxFlow(g, source, sink);
        console.log("maxFlow: "+maxFlow);
        let currentMaxFlow = maxFlow;
        // so every tutor has the same upper bound, now we have to find the minimum tutor capacity, because it might be
        // that some tutors have a lower capacity and we want to shuffle them to the tutors with the higher capacity

        // Step 1: Get the tutors current individual capacities
        let currentDictTutorToIndividualDiff = {};

        let previousTutorDistribution = GraphHelper.getDictTutorToAmountGroups(unoptimizedJSON);
        console.log("previousTutorDistribution: ");
        console.log(previousTutorDistribution);
        let currentOptimizedJSON = JSON.parse(JSON.stringify(unoptimizedJSON));

        let keepOptimizing = true;
        let iteration = 0;
        let maxIterations = 1000;

        while(keepOptimizing && iteration < maxIterations) {
            iteration++;
            console.log("---- new iteration ----");

            let nextDictTutorToIndividualDiff = GraphHelper.getDictTutorToIndividualDiff(currentOptimizedJSON, maxTutorCapacity, currentDictTutorToIndividualDiff);
            console.log("nextDictTutorToIndividualDiff: ");
            console.log(JSON.stringify(nextDictTutorToIndividualDiff));

            graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(currentOptimizedJSON, maxTutorCapacity, nextDictTutorToIndividualDiff);
            g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
            source = graphAndVerticeMaps.source;
            sink = graphAndVerticeMaps.sink;
            currentMaxFlow = GraphHelper.getMaxFlow(g, source, sink);

            let nextOptimizedJSON = GraphHelper.getTutorDistributionFromGraphAndVerticeMaps(currentOptimizedJSON, graphAndVerticeMaps);

            // we dont need to add the diff to the tutor capacities, because we already did that in the previous step
            //let optimizedTutorDistribution = GraphHelper.getDictTutorToAmountGroups(optimizedJSONWhereAllTutorsHaveTheSameMaximum);
            //console.log("optimizedTutorDistribution: ");
            //console.log(optimizedTutorDistribution);

            let sameFlow = currentMaxFlow == maxFlow;

            let differentDistribution = JSON.stringify(currentDictTutorToIndividualDiff) != JSON.stringify(nextDictTutorToIndividualDiff);

            // when we have the same max flow and the distribution is different, we keep the new distribution
            if(sameFlow && differentDistribution) {
                currentDictTutorToIndividualDiff = nextDictTutorToIndividualDiff;
                currentOptimizedJSON = JSON.parse(JSON.stringify(nextOptimizedJSON));
                keepOptimizing = true;
            } else {
                console.log("Optimization finished!")
                console.log("sameFlow: "+sameFlow);
                console.log("differentDistribution: "+differentDistribution);
                keepOptimizing = false;
            }
        }

        console.log("=============================================");
        console.log("dictTutorToIndividualDiff: ");
        console.log(currentDictTutorToIndividualDiff);
        let finalTutorDistribution = GraphHelper.getDictTutorToAmountGroups(currentOptimizedJSON);
        console.log("finalTutorDistribution: ");
        console.log(finalTutorDistribution);

        return currentOptimizedJSON;
    }

    static getDictTutorToIndividualDiff(unoptimizedJSON: any, maxTutorCapacity: any, dictTutorToIndividualDiff: any){
        let copyDictTutorToIndividualDiff = JSON.parse(JSON.stringify(dictTutorToIndividualDiff));

        let tutorDistributionInformation = GraphHelper.getDictTutorDistributionInformation(unoptimizedJSON, maxTutorCapacity);
        let tutorHighestPercentageValue = undefined;
        let tutorHighestPercentageName = undefined;
        let tutorLowestPercentageValue = undefined;
        let tutorLowestPercentageName = undefined;
        let tutorKeys = Object.keys(tutorDistributionInformation);
        for(let tutorKey of tutorKeys){
            // @ts-ignore
            let tutorPercentage = tutorDistributionInformation[tutorKey].percentage;
            if(tutorHighestPercentageValue == undefined || tutorPercentage > tutorHighestPercentageValue){
                tutorHighestPercentageValue = tutorPercentage;
                tutorHighestPercentageName = tutorKey;
            }
            if(tutorLowestPercentageValue == undefined || tutorPercentage < tutorLowestPercentageValue){
                tutorLowestPercentageValue = tutorPercentage;
                tutorLowestPercentageName = tutorKey;
            }
        }

        console.log("- tutorHighestPercentageName: "+tutorHighestPercentageName)
        console.log("- tutorHighestPercentageValue: "+tutorHighestPercentageValue)
        console.log("- tutorLowestPercentageName: "+tutorLowestPercentageName)
        console.log("- tutorLowestPercentageValue: "+tutorLowestPercentageValue)

        if(tutorHighestPercentageName && tutorLowestPercentageName && tutorHighestPercentageName != tutorLowestPercentageName){
            let tutorHighestPercentageCurrentDiff = copyDictTutorToIndividualDiff[tutorHighestPercentageName] || 0;
            let tutorLowestPercentageCurrentDiff = copyDictTutorToIndividualDiff[tutorLowestPercentageName] || 0;

            if(tutorLowestPercentageCurrentDiff < 0 || tutorHighestPercentageCurrentDiff > 0){
                // if the person with the lowest percentage has a negative diff already, we dont want to increase it
                // this would cause a loop
                // if the person with the highest percentage has a positive diff already, we dont want to decrease it
                // this would cause a loop
                return copyDictTutorToIndividualDiff // we return the old dict
            } else {
                copyDictTutorToIndividualDiff[tutorHighestPercentageName] = tutorHighestPercentageCurrentDiff - 1;
                copyDictTutorToIndividualDiff[tutorLowestPercentageName] = tutorLowestPercentageCurrentDiff + 1;
            }
        }

        return copyDictTutorToIndividualDiff;
    }

    static getDictTutorDistributionInformation(unoptimizedJSON: any, maxTutorCapacity: any){
        let tutorDistribution = GraphHelper.getDictTutorToAmountGroups(unoptimizedJSON);
        let dictTutorDistributionInformation = {};
        for(let tutor in tutorDistribution){
            let amountGroups = tutorDistribution[tutor];
            let multiplier = unoptimizedJSON?.tutorMultipliers?.[tutor] || 1
            let aimedMaxCapacity = maxTutorCapacity * multiplier;
            // @ts-ignore
            dictTutorDistributionInformation[tutor] = {
                amountGroups: amountGroups,
                aimedMaxCapacity: aimedMaxCapacity,
                percentage: amountGroups / aimedMaxCapacity
            }
        }
        return dictTutorDistributionInformation;
    }

    static getGraphFromGraphRaw(graphRaw: any, nameToVertice: any, verticeToName: any, tutorCapacity: number): any {
        //@ts-ignore
        let graph = JSONToGraph.getGraph(graphRaw, nameToVertice, tutorCapacity);
        //@ts-ignore
        let g = GraphHelper.getJSGraphsFlowNetwork(graph, nameToVertice, verticeToName);
        return g;
    }

    static getMinCut(graphAndVerticeMaps: any){
        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let ff = new jsgraphs.FordFulkerson(g, graphAndVerticeMaps.source, graphAndVerticeMaps.sink);
        return ff.minCut(g);
    }

    static getMaxFlow(g: any, source: number, sink: number){
        let ff = new jsgraphs.FordFulkerson(g, source, sink);
        return ff.value;
    }

    static getTutorDistributionFromGraphAndVerticeMaps(unoptimizedJSON: any, graphAndVerticeMaps: any): any {
        let minCut = GraphHelper.getMinCut(graphAndVerticeMaps);

        for(let i = 0; i < minCut.length; i++) {
            let e = minCut[i];
            //@ts-ignore
            graphAndVerticeMaps.graph[e.from()][e.to()].flow = e.flow;
        }

        let optimizedJSON = JSON.parse(JSON.stringify(unoptimizedJSON));

        let groupNames = Object.keys(optimizedJSON.groups);
        for(const groupName of groupNames) {
            let groupVertice = graphAndVerticeMaps.nameToVertice[groupName];
            let slotNodesForGroup = graphAndVerticeMaps.graph[groupVertice];
            let slotNodeIdsForGroup = Object.keys(slotNodesForGroup);
            for(const slotNodeId of slotNodeIdsForGroup) {
                let slotNode = slotNodesForGroup[slotNodeId];
                let flow = slotNode.flow;
                if(flow > 0) {
                    let slotName = graphAndVerticeMaps.verticeToName[slotNodeId];
                    let slotWithName = graphAndVerticeMaps.slotsWithNames[slotName];
                    optimizedJSON.groups[groupName]["selectedSlot"] = slotWithName;
                }
            }
        }

        return optimizedJSON;
    }

    static getTutorDistribution(unoptimizedJSON: any, tutorCapacity: number): any {
        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, tutorCapacity);
        let optimizedJSON = GraphHelper.getTutorDistributionFromGraphAndVerticeMaps(unoptimizedJSON, graphAndVerticeMaps);
        return optimizedJSON;
    }

    static getDictTutorToAmountGroups(unoptimizedJSON: any, dictTutorToIndividualDiff?: any): any {
        let tutors = unoptimizedJSON.tutors;
        let tutorNames = Object.keys(tutors);
        let dictTutorToCapacity = {};
        for(const tutor of tutorNames) {
            // @ts-ignore
            dictTutorToCapacity[tutor] = 0;
        }
        let groups = unoptimizedJSON.groups;
        let groupKeys = Object.keys(groups);
        for(const groupKey of groupKeys) {
            let group = groups[groupKey];
            let selectedSlot = group.selectedSlot;
            let tutor = selectedSlot.tutor;
            // @ts-ignore
            if(dictTutorToCapacity[tutor] == undefined) {
                // @ts-ignore
                dictTutorToCapacity[tutor] = 1;
            } else {
                // @ts-ignore
                dictTutorToCapacity[tutor] += 1;
            }
        }

        if(!!dictTutorToIndividualDiff){
            let tutorKeysFromDictTutorToIndividualDiff = Object.keys(dictTutorToIndividualDiff);
            for(const tutorKey of tutorKeysFromDictTutorToIndividualDiff) {
                // @ts-ignore
                dictTutorToCapacity[tutorKey] += dictTutorToIndividualDiff[tutorKey];
            }
        }

        return dictTutorToCapacity;
    }

    static removeUnnecessarySwitchesInSameSlots(oldPlan: any, unoptimizedJSON: any): any {
        console.log("=====================================");
        console.log("removeUnnecessarySwitchesInSameSlots")
        let newPlan = JSON.parse(JSON.stringify(unoptimizedJSON));

        let timeslots = JSONToGraph.getTimeslots();
        for(let i=0; i<timeslots.length; i++) {
            let time = timeslots[i];
            let workingWeekdays = JSONToGraph.getWorkingWeekdays();
            for(let day of workingWeekdays){
                let groupsAtTimeAndDayWithDifferentTutor = []
                let oldGroups = oldPlan.groups;
                //@ts-ignore
                let newGroups = newPlan?.groups;
                let oldGroupNames = Object.keys(oldGroups);

                for(let i=0; i<oldGroupNames.length; i++) {
                    let groupName = oldGroupNames[i];
                    let oldSelectedSlot = oldGroups?.[groupName]?.selectedSlot;
                    let newSelectedSlot = newGroups?.[groupName]?.selectedSlot;
                    let oldSelectedTutor = oldSelectedSlot?.tutor;
                    let newSelectedTutor = newSelectedSlot?.tutor;
                    let useSelectedSlot = !!newSelectedSlot ? newSelectedSlot : oldSelectedSlot;

                    if (useSelectedSlot.day === day && useSelectedSlot.time === time && oldSelectedTutor !== newSelectedTutor) {
                        groupsAtTimeAndDayWithDifferentTutor.push(groupName);
                    }
                }
                if(groupsAtTimeAndDayWithDifferentTutor.length >= 2){
                    newPlan = this.removeUnnecessarySwitchesInSameSlot(oldPlan, newPlan, groupsAtTimeAndDayWithDifferentTutor, day, time);
                }
            }
        }

        return newPlan;
    }

    static removeUnnecessarySwitchesInSameSlot(oldPlan: any, newPlan: any, groupsAtTimeAndDay: any, day: any, time: any): any {
  //      console.log("====================================");
        console.log("removeUnnecessarySwitchesInSameSlot for day: " + day + " and time: " + time);

        let initialAmountOfSwitches = this.countAmountOfSwitchesInPlan(oldPlan, newPlan, groupsAtTimeAndDay);
//        console.log("initialAmountOfSwitches: " + initialAmountOfSwitches);
//        console.log("groupsAtTimeAndDay: ");
//        console.log(groupsAtTimeAndDay);
        let tutorsArray = this.getTutorsArrayForGroupsAtTimeAndDays(newPlan, groupsAtTimeAndDay);
        let tutorPermutations = this.getTutorPermutations(tutorsArray);

        let newPlanCopy = JSON.parse(JSON.stringify(newPlan));
        let bestPlan = newPlanCopy;
        let bestAmountOfSwitches = initialAmountOfSwitches;
        for(let i=0; i<tutorPermutations.length; i++) {
            let tutorPermutation = tutorPermutations[i];
            let newPlanWithSwitchedTutors = this.getPlanWithSwitchedTutors(newPlanCopy, tutorPermutation, groupsAtTimeAndDay);
            let amountOfSwitches = this.countAmountOfSwitchesInPlan(oldPlan, newPlanWithSwitchedTutors, groupsAtTimeAndDay);
//            console.log("Permutation "+i+" amountOfSwitches: " + amountOfSwitches);
            if(amountOfSwitches < bestAmountOfSwitches) {
                bestAmountOfSwitches = amountOfSwitches;
                bestPlan = newPlanWithSwitchedTutors;
            }
        }
        console.log("Saved " + (initialAmountOfSwitches - bestAmountOfSwitches) + " switches");

        // we need to check if there is any permutation of the which has less switches
        return bestPlan;
    }

    static getPlanWithSwitchedTutors(newPlan: any, tutorPermutationArray: any, groupsAtTimeAndDayArray: any): any {
        let newPlanCopy = JSON.parse(JSON.stringify(newPlan));
        for(let i=0; i<groupsAtTimeAndDayArray.length; i++) {
            let groupName = groupsAtTimeAndDayArray[i];
            let tutorName = tutorPermutationArray[i];
            let group = newPlanCopy.groups[groupName]
            group.selectedSlot.tutor = tutorName;
            newPlanCopy.groups[groupName] = group;
        }
        return newPlanCopy;
    }

    /**
     * Return all permutations of the tutorsArray
     *  input:  ["apple", "banana", "kiwi"]
     *
     * [["apple", "banana", "kiwi"]
     * ["apple", "kiwi", "banana"]
     * ["kiwi", "banana", "apple"]
     * ["kiwi", "apple", "banana"]
     * ["banana", "kiwi", "apple"]
     * ["banana",  "apple", "kiwi"]]
     *
     * @param tutorsArray
     * @returns all permutations of the tutorsArray
     */
    static getTutorPermutations(tutorsArray: any): any {
        let arr = tutorsArray;
        const output: any[][] = [];
        const n = arr.length;

        function swap(i: any, j: any) {
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        function generate(n: any, arr: any) {
            if (n === 1) {
                output.push([...arr]);
                return;
            }

            for (let i = 0; i < n; i++) {
                generate(n - 1, arr);
                if (n % 2 === 0) {
                    swap(i, n - 1);
                } else {
                    swap(0, n - 1);
                }
            }
        }

        generate(n, arr);
        return output;
    }

    static getTutorsArrayForGroupsAtTimeAndDays(newPlan: any, groupsAtTimeAndDay: any): any {
        let tutorsArray = [];
        for(let i=0; i<groupsAtTimeAndDay.length; i++) {
            let groupName = groupsAtTimeAndDay[i];
            let selectedSlot = newPlan.groups?.[groupName]?.selectedSlot;
            let tutor = selectedSlot?.tutor;
            tutorsArray.push(tutor);
        }
        return tutorsArray;
    }

    static countAmountOfSwitchesInPlan(oldPlan: any, newPlan: any, groupsAtTimeAndDay: any): number {
        let amountOfSwitches = 0;
        for(let i=0; i<groupsAtTimeAndDay.length; i++) {
            let groupName = groupsAtTimeAndDay[i];
            let oldSelectedSlot = oldPlan.groups?.[groupName]?.selectedSlot;
            let newSelectedSlot = newPlan.groups?.[groupName]?.selectedSlot;
            let oldSelectedTutor = oldSelectedSlot?.tutor;
            let newSelectedTutor = newSelectedSlot?.tutor;
            if(oldSelectedTutor !== newSelectedTutor){
                amountOfSwitches++;
            }
        }
        return amountOfSwitches;
    }

    static mergeSingleGroups(unoptimizedJSON: any): any {
        console.log("=====================================");
        console.log("mergeSingleGroups")
        let newPlan = JSON.parse(JSON.stringify(unoptimizedJSON));

        let timeslots = JSONToGraph.getTimeslots();
        for(let i=0; i<timeslots.length; i++) {
            let time = timeslots[i];
            let workingWeekdays = JSONToGraph.getWorkingWeekdays();
            for(let day of workingWeekdays){
                let oldGroups = unoptimizedJSON.groups;
                let oldGroupNames = Object.keys(oldGroups);

                let singleGroups = [];

                for(let i=0; i<oldGroupNames.length; i++) {
                    let currentGroupName = oldGroupNames[i];
                    let useSelectedSlot = oldGroups?.[currentGroupName]?.selectedSlot;

                    if (useSelectedSlot.day === day && useSelectedSlot.time === time) {
                        let currentGroup = oldGroups?.[currentGroupName];
                        let members = currentGroup.members;
                        if(members.length === 1){
                            console.log("Found single group: " + currentGroupName + " at " + day + " " + time)
                            singleGroups.push(currentGroupName);
                            if(singleGroups.length >= 2){
                                console.log("Found 2 single groups at the same time and day: " + singleGroups[0] + " and " + singleGroups[1])
                                // we have at least 2 single groups at the same time and day, so we can merge them
                                // lets get the two members
                                let otherGroupName = singleGroups[0];
                                let otherGroup = oldGroups?.[otherGroupName];
                                let otherGroupMember = otherGroup.members[0];
                                let currentGroupMember = currentGroup.members[0];

                                // lets add the member of the other group to the current group
                                let groupMembers = [otherGroupMember, currentGroupMember];
                                let groupId = groupMembers.join(" & ")

                                // lets create a new group
                                console.log("Creating new group: " + groupId + " with members: " + groupMembers)
                                newPlan.groups[groupId] = {};
                                newPlan.groups[groupId]["members"] = groupMembers;
                                newPlan.groups[groupId]["selectedSlot"] = JSON.parse(JSON.stringify(currentGroup.selectedSlot))
                                newPlan.groups[groupId]["possibleSlots"] = {}; // reset the possibleSlots
                                newPlan.groups[groupId]["possibleSlots"][day] = {};
                                newPlan.groups[groupId]["possibleSlots"][day][time] = true; // set the possibleSlot

                                // lets delete the other group
                                console.log("Deleting group: " + otherGroupName + " and " + currentGroupName);
                                delete newPlan.groups[otherGroupName];
                                delete newPlan.groups[currentGroupName];

                                singleGroups = [] // reset the array
                            }
                        }
                    }
                }
            }
        }

        return newPlan;
    }

    static getOptimizedDistribution(unoptimizedJSON: any){
        console.log("getOptimizedDistribution");
        let oldPlan = JSON.parse(JSON.stringify(unoptimizedJSON));
        let newPlan = JSON.parse(JSON.stringify(unoptimizedJSON));

        let optionRemoveUnnecessarySwitches = true;
        let optionOptimizeMinimum = true;

        let maxTutorCapacity = GraphHelper.getTutorCapacityWhereAllHaveSameMaximum(newPlan);
        console.log("maxTutorCapacity: "+maxTutorCapacity);
        newPlan = GraphHelper.getTutorDistribution(unoptimizedJSON, maxTutorCapacity);
        if(optionOptimizeMinimum) {
            newPlan = GraphHelper.getTutorOptimizationWhereAllHaveSameMinimum(newPlan, maxTutorCapacity);
        }

        if(optionRemoveUnnecessarySwitches) {
            newPlan = GraphHelper.removeUnnecessarySwitchesInSameSlots(oldPlan, newPlan);
        }

        return newPlan;
    }

}
