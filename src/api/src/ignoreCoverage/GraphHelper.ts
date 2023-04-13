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
        let maxIterations = 10;

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

    static getOptimizedDistribution(unoptimizedJSON: any){
        console.log("getOptimizedDistribution");
        let maxTutorCapacity = GraphHelper.getTutorCapacityWhereAllHaveSameMaximum(unoptimizedJSON);
        console.log("maxTutorCapacity: "+maxTutorCapacity);
        let optimizedJSONWhereAllTutorsHaveTheSameMaximum = GraphHelper.getTutorDistribution(unoptimizedJSON, maxTutorCapacity);
        let optimizedJSONWhereAllTutorsHaveTheSameMinimum = GraphHelper.getTutorOptimizationWhereAllHaveSameMinimum(optimizedJSONWhereAllTutorsHaveTheSameMaximum, maxTutorCapacity);
        return optimizedJSONWhereAllTutorsHaveTheSameMinimum;
    }

}
