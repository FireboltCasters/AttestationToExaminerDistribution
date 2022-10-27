import ParseStudIPCSV from "./ParseStudIPCSV";
import jsgraphs from "js-graph-algorithms";

//const jsgraphs = require('js-graph-algorithms');

console.log("jsgraphs")
console.log(jsgraphs)
console.log(Object.keys(jsgraphs))

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

    static getGraph(graphRaw: any, nameToVertice: any, verticeToName: any): any {
        let amountOfVertices = Object.keys(nameToVertice).length;

        console.log("jsgraphs")
        console.log(jsgraphs)
        console.log(Object.keys(jsgraphs))

        let g = new jsgraphs.FlowNetwork(amountOfVertices);
        let fromIds = Object.keys(graphRaw);
        for(const fromId of fromIds) {
            let toIds = Object.keys(graphRaw[fromId]);
            for(const toId of toIds) {
                let fromName = verticeToName[fromId];
                let toName = verticeToName[toId];
                //@ts-ignore
                g.node(fromId).label = fromName;
                //@ts-ignore
                g.node(toId).label = toName;

                let capacity = graphRaw[fromId][toId];
                //console.log("Adding edge fromKey " +fromId +"("+ fromName + ") toKey "+ toId +"(" +toName+") with capaity: "+capacity);
                //@ts-ignore
                g.addEdge(new jsgraphs.FlowEdge(fromId, toId, capacity));
            }
        }

//        g.node(0).label = 'Source';
//        g.edge(0, 1).label = 'World';

        return g;
    }

    static getMinTutorCapacity(graphRaw: any, nameToVertice: any, verticeToName: any, initialTutorCapacity: number): number {
        console.log("getMinTutorCapacity");
        let graph = ParseStudIPCSV.getGraph(graphRaw, nameToVertice, initialTutorCapacity);
        let g = GraphHelper.getGraph(graph, nameToVertice, verticeToName);

        let maxFlow = GraphHelper.getMaxFlow(g);
        //console.log("maxFlow with "+initialTutorCapacity+" tutors ==> "+maxFlow);
        // binary search for the minimum tutor capacity
        let lowestTutorCapacity = initialTutorCapacity;
        let nextTutorCapacity = Math.floor(initialTutorCapacity / 2);
        while(lowestTutorCapacity != nextTutorCapacity) {
            let lastNextTutorCapacity = nextTutorCapacity;
            let newG = GraphHelper.getGraphFromGraphRaw(graphRaw, nameToVertice, verticeToName, nextTutorCapacity);
            let newMaxFlow = GraphHelper.getMaxFlow(newG);
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
        let graph = ParseStudIPCSV.getGraph(graphRaw, nameToVertice, tutorCapacity);
        let g = GraphHelper.getGraph(graph, nameToVertice, verticeToName);
        return g;
    }

    static getTutorDistribution(graphRaw: any, nameToVertice: any, verticeToName: any, tutorCapacity: number): any {
        console.log("getTutorDistribution");
        console.log("tutorCapacity: "+tutorCapacity);

        let g = GraphHelper.getGraphFromGraphRaw(graphRaw, nameToVertice, verticeToName, tutorCapacity);

        let source = 0;
        let target = 1;
        let ff = new jsgraphs.FordFulkerson(g, source, target);
        let minCut = ff.minCut(g);

        for(let i = 0; i < minCut.length; ++i) {
            let e = minCut[i];
            console.log('min-cut: (' + e.from() + ", " + e.to() + ')');
        }

        let groups = graphRaw.groups;
        let slotVerticeToGroupVertice = {};
        for(let i = 0; i < groups.length; ++i) {
            let groupName = groups[i];
            //console.log("groupName: "+groupName);
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


        let tutors = graphRaw.tutors;
        let slotVerticeToTutorVerticeMap = {};
        for(let i = 0; i < tutors.length; ++i) {
            let tutorName = tutors[i];
            //console.log("tutorName: "+tutorName);
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
            let tutorName = verticeToName[tutorVertice];
            //@ts-ignore
            let groupVertice = slotVerticeToGroupVertice[slotVertice];
            let groupName = verticeToName[groupVertice];
            let slotName = verticeToName[slotVertice];

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

        console.log("slotVerticeToDetails: ");
        console.log(slotVerticeToDetails);
        console.log("+++++");
        console.log("amountChanges: "+amountChanges);

        //console.log("tutorVerticeToSlotVerticeMap: ");
        //console.log(tutorVerticeToSlotVerticeMap);
        let tutorAmountSlots = {};
        for(let tutorVertice in tutorVerticeToSlotVerticeMap) {
            //@ts-ignore
            let slots = tutorVerticeToSlotVerticeMap[tutorVertice];
            let tutorName = verticeToName[tutorVertice];
            //@ts-ignore
            tutorAmountSlots[tutorName] = slots.length;
        }
        console.log("tutorAmountSlots: ");
        console.log(tutorAmountSlots);
    }




    static getMaxFlow(g: any){
        let source = 0;
        let target = 1;
        let ff = new jsgraphs.FordFulkerson(g, source, target);
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
        return ff.value;
    }

}
