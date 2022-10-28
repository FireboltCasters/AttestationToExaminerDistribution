import JSONToGraph from "./JSONToGraph";
import jsgraphs from "js-graph-algorithms";

//const jsgraphs = require('js-graph-algorithms');

/**
 var jsgraphs = require('js-graph-algorithms');
 var g = new jsgraphs.FlowNetwork(8);
 g.addEdge(new jsgraphs.FlowEdge(0, 1, 10));
 g.addEdge(new jsgraphs.FlowEdge(0, 2, 5));
 g.addEdge(new jsgraphs.FlowEdge(0, 3, 15));
 g.addEdge(new jsgraphs.FlowEdge(1, 4, 9));
 g.addEdge(new jsgraphs.FlowEdge(1, 5, 15));
 g.addEdge(new jsgraphs.FlowEdge(1, 2, 4));
 g.addEdge(new jsgraphs.FlowEdge(2, 5, 8));
 g.addEdge(new jsgraphs.FlowEdge(2, 3, 4));
 g.addEdge(new jsgraphs.FlowEdge(3, 6, 16));
 g.addEdge(new jsgraphs.FlowEdge(4, 5, 15));
 g.addEdge(new jsgraphs.FlowEdge(4, 7, 10));
 g.addEdge(new jsgraphs.FlowEdge(5, 7, 10));
 g.addEdge(new jsgraphs.FlowEdge(5, 6, 15));
 g.addEdge(new jsgraphs.FlowEdge(6, 2, 6));
 g.addEdge(new jsgraphs.FlowEdge(6, 7, 10));

 g.node(2).label = 'Hello';
 g.edge(0, 1).label = 'World';

 var source = 0;
 var target = 7;
 var ff = new jsgraphs.FordFulkerson(g, source, target);
 console.log('max-flow: ' + ff.value);

 var minCut = ff.minCut(g);

 for(var i = 0; i < minCut.length; ++i) {
    var e = minCut[i];
    console.log('min-cut: (' + e.from() + ", " + e.to() + ')');
}
 */

export default class GraphHelper {

    static getJSGraphsFlowNetwork(graphAndVerticeMaps: any): any {
        let graphRaw = graphAndVerticeMaps.graph;
        let fromIds = Object.keys(graphRaw);
        let amountOfVertices = fromIds.length;
        console.log("amountOfVertices: "+amountOfVertices);

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

                console.log("Adding edge from "+from+" to "+to+" with capacity "+capacity+" and flow "+flow);
                //@ts-ignore
                g.addEdge(new jsgraphs.FlowEdge(fromId, toId, capacity));
                amountEdges++;
            }
        }

        console.log("amountEdges: "+amountEdges);

        g.node(0).label = 'Source';
        g.node(1).label = 'Sink';

        return g;
    }

    static getMinimalRequiredTutorCapacity(unoptimizedJSON: any): number {
        let amountGroups = Object.keys(unoptimizedJSON.groups).length;

        let initialTutorCapacity = amountGroups;
        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, initialTutorCapacity);

        let source = graphAndVerticeMaps.source;
        let sink = graphAndVerticeMaps.sink;

        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let maxFlow = GraphHelper.getMaxFlow(g, source, sink);
        //console.log("maxFlow with "+initialTutorCapacity+" tutors ==> "+maxFlow);
        // binary search for the minimum tutor capacity
        let lowestTutorCapacity = initialTutorCapacity;
        let nextTutorCapacity = Math.floor(initialTutorCapacity / 2);
        while(lowestTutorCapacity != nextTutorCapacity) {
            let lastNextTutorCapacity = nextTutorCapacity;
            let newgraphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, nextTutorCapacity);
            let newG = GraphHelper.getJSGraphsFlowNetwork(newgraphAndVerticeMaps);
            let newMaxFlow = GraphHelper.getMaxFlow(newG, source, sink);
            //console.log("maxFlow with "+nextTutorCapacity+" tutors ==> "+newMaxFlow);
            if(newMaxFlow >= maxFlow) {
//                console.log("newMaxFlow == maxFlow so we can lower the tutor capacity");
                lowestTutorCapacity = nextTutorCapacity;
                nextTutorCapacity = Math.floor(nextTutorCapacity / 2);
            } else {
  //              console.log("newMaxFlow != maxFlow so we have to increase the tutor capacity");
                nextTutorCapacity = Math.floor((lowestTutorCapacity + nextTutorCapacity) / 2);
                if(lastNextTutorCapacity == nextTutorCapacity) {
    //                console.log("lastNextTutorCapacity == nextTutorCapacity so we can't lower the tutor capacity anymore");
                    nextTutorCapacity = lowestTutorCapacity;
                    break;
                }
            }
        }

        return nextTutorCapacity;
    }

    static getGraphFromGraphRaw(graphRaw: any, nameToVertice: any, verticeToName: any, tutorCapacity: number): any {
        //@ts-ignore
        let graph = JSONToGraph.getGraph(graphRaw, nameToVertice, tutorCapacity);
        //@ts-ignore
        let g = GraphHelper.getJSGraphsFlowNetwork(graph, nameToVertice, verticeToName);
        return g;
    }

    static getTutorDistribution(unoptimizedJSON: any, tutorCapacity: number): any {
        console.log("getTutorDistribution with tutorCapacity "+tutorCapacity);
        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, tutorCapacity);
        console.log("graphAndVerticeMaps: "+JSON.stringify(graphAndVerticeMaps.graph, null, 2));
        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let maxFlow = GraphHelper.getMaxFlow(g, graphAndVerticeMaps.source, graphAndVerticeMaps.sink);
        console.log("maxFlow with "+tutorCapacity+" tutors ==> "+maxFlow);
        let ff = new jsgraphs.FordFulkerson(g, graphAndVerticeMaps.source, graphAndVerticeMaps.sink);
        let minCut = ff.minCut(g);
        console.log("minCut length: "+minCut.length);

        for(let i = 0; i < minCut.length; i++) {
            let e = minCut[i];
            console.log('min-cut: (' + e.from() + ", " + e.to() + ')');
            let currentFlow = graphAndVerticeMaps.graph[e.from()][e.to()].flow || 0;
            console.log(e);

            //@ts-ignore
            graphAndVerticeMaps.graph[e.from()][e.to()].flow = e.flow;
        }

        return graphAndVerticeMaps;

        //@ts-ignore
        let groups = graphRaw.groups;
        let slotVerticeToGroupVertice = {};
        for(let i = 0; i < groups.length; ++i) {
            let groupName = groups[i];
            //console.log("groupName: "+groupName);
            //@ts-ignore
            let groupVertice = nameToVertice[groupName];
            //console.log("groupVertice: "+groupVertice);
            for(let j = 0; j< minCut.length; ++j) {
                let e = minCut[j];
                if(e.from() == groupVertice) {
                    let slotVertice = e.to();
                    //@ts-ignore
                    slotVerticeToGroupVertice[slotVertice] = groupVertice;
                }
            }
        }

        //console.log("slotVerticeToGroupVertice: ");
        //console.log(slotVerticeToGroupVertice);

        //@ts-ignore
        let tutors = graphRaw.tutors;
        let slotVerticeToTutorVerticeMap = {};
        for(let i = 0; i < tutors.length; ++i) {
            let tutorName = tutors[i];
            //console.log("tutorName: "+tutorName);
            //@ts-ignore
            let tutorVertice = nameToVertice[tutorName];
            //console.log("tutorVertice: "+tutorVertice);
            for(let j = 0; j< minCut.length; ++j) {
                let e = minCut[j];
                if(e.to() == tutorVertice) {
                    let slotVertice = e.from();
                    //@ts-ignore
                    slotVerticeToTutorVerticeMap[slotVertice] = tutorVertice;
                }
            }
        }

        //console.log("slotVerticeToTutorVerticeMap: ");
        //console.log(slotVerticeToTutorVerticeMap);

        let tutorVerticeToSlotVerticeMap = {};
        for(let slotVertice in slotVerticeToTutorVerticeMap) {
            //@ts-ignore
            let tutorVertice = slotVerticeToTutorVerticeMap[slotVertice];
            //@ts-ignore
            if(tutorVerticeToSlotVerticeMap[tutorVertice] == undefined) {
                //@ts-ignore
                tutorVerticeToSlotVerticeMap[tutorVertice] = [];
            }
            //@ts-ignore
            tutorVerticeToSlotVerticeMap[tutorVertice].push(slotVertice);
        }

        //console.log("tutorVerticeToSlotVerticeMap: ");
        //console.log(tutorVerticeToSlotVerticeMap);


        let slotVerticeToDetails = {};
        let amountChanges = 0;

        let slotsVertices = Object.keys(slotVerticeToTutorVerticeMap);
        for(let i = 0; i < slotsVertices.length; ++i) {
            let slotVertice = slotsVertices[i];
            //@ts-ignore
            let tutorVertice = slotVerticeToTutorVerticeMap[slotVertice];
            //@ts-ignore
            let tutorName = verticeToName[tutorVertice];
            //@ts-ignore
            let groupVertice = slotVerticeToGroupVertice[slotVertice];
            //@ts-ignore
            let groupName = verticeToName[groupVertice];
            //@ts-ignore
            let slotName = verticeToName[slotVertice];
            //@ts-ignore
            let oldSlot = graphRaw.groupToSelectedSlotMapping[groupName];
            let slotChanged = oldSlot != slotName;
            if(slotChanged) {
                amountChanges++;
            }

            let details = {
                tutorName: tutorName,
                groupName: groupName,
                slotName: slotName,
                oldSlot: oldSlot,
                slotChanged: slotChanged
            };
            //@ts-ignore
            slotVerticeToDetails[slotVertice] = details;
        }

        /**
        console.log("slotVerticeToDetails: ");
        console.log(slotVerticeToDetails);
        console.log("+++++");
        console.log("amountChanges: "+amountChanges);
         */

        //console.log("tutorVerticeToSlotVerticeMap: ");
        //console.log(tutorVerticeToSlotVerticeMap);
        let tutorAmountSlots = {};
        for(let tutorVertice in tutorVerticeToSlotVerticeMap) {
            //@ts-ignore
            let slots = tutorVerticeToSlotVerticeMap[tutorVertice];
            //@ts-ignore
            let tutorName = verticeToName[tutorVertice];
            //@ts-ignore
            tutorAmountSlots[tutorName] = slots.length;
        }
        console.log("tutorAmountSlots: ");
        console.log(tutorAmountSlots);
    }




    static getMaxFlow(g: any, source: number, sink: number){
        let ff = new jsgraphs.FordFulkerson(g, source, sink);
        //console.log('max-flow: ' + ff.value);
/**
        var minCut = ff.minCut(g);

        for(var i = 0; i < minCut.length; ++i) {
            var e = minCut[i];
            console.log('min-cut: (' + e.from() + ", " + e.to() + ')');
        }
        return ff;

        var ff = new jsgraphs.FordFulkerson(g, source, target);
 */
        let value = ff.value;
        console.log("getMaxFlow: "+value);
        return ff.value;
    }

    static getOptimizedDistribution(unoptimizedJSON: any){
        let amountGroups = unoptimizedJSON.groups.length;
        let initialTutorCapacity = amountGroups;


        console.log("++++ Calc min tutor capacity +++++");
        let minTutorCapacity = GraphHelper.getMinimalRequiredTutorCapacity(unoptimizedJSON);
        console.log("minTutorCapacity: "+minTutorCapacity);
        console.log("+++++++++");

        console.log("++++ Calc tutorDistribution +++++");
        let tutorDistribution = GraphHelper.getTutorDistribution(unoptimizedJSON, minTutorCapacity);
        console.log(tutorDistribution.graph);
        console.log("+++++++++");


        let optimizedJSON = {};



        return optimizedJSON;
    }

}
