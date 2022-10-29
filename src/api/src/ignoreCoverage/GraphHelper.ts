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

                //console.log("Adding edge from "+from+" to "+to+" with capacity "+capacity+" and flow "+flow);
                //@ts-ignore
                g.addEdge(new jsgraphs.FlowEdge(fromId, toId, capacity));
                amountEdges++;
            }
        }

//        console.log("amountEdges: "+amountEdges);

        g.node(0).label = 'Source';
        g.node(1).label = 'Sink';

        return g;
    }

    static getMinimalRequiredTutorCapacity(unoptimizedJSON: any): number {
        //console.log("getMinimalRequiredTutorCapacity");
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

    static getMinCut(graphAndVerticeMaps: any){
        let g = GraphHelper.getJSGraphsFlowNetwork(graphAndVerticeMaps);
        let ff = new jsgraphs.FordFulkerson(g, graphAndVerticeMaps.source, graphAndVerticeMaps.sink);
        return ff.minCut(g);
    }

    static getTutorDistribution(unoptimizedJSON: any, tutorCapacity: number): any {
        let graphAndVerticeMaps = JSONToGraph.getGraphAndVerticeMaps(unoptimizedJSON, tutorCapacity);
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

    static getMaxFlow(g: any, source: number, sink: number){
        let ff = new jsgraphs.FordFulkerson(g, source, sink);
        return ff.value;
    }

    static getOptimizedDistribution(unoptimizedJSON: any){
        let minTutorCapacity = GraphHelper.getMinimalRequiredTutorCapacity(unoptimizedJSON);
        let tutorDistribution = GraphHelper.getTutorDistribution(unoptimizedJSON, minTutorCapacity);
        return tutorDistribution;
    }

}
