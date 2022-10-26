import DetectLoopInGraph from "./DetectLoopInGraph";

export default class PrecedenceGraph {
    public graph: any;
    public startNodeLabel: any;

    constructor(graph: any, startNodeLabel: any) {
        let graphCopy = JSON.parse(JSON.stringify(graph))
        this.startNodeLabel = startNodeLabel;

        let hasLoop = PrecedenceGraph.hasLoop(graphCopy);
        if(!hasLoop){
            let resettedGraph = PrecedenceGraph.resetCalcedTimesGraph(graphCopy);
            let forwardGraph = PrecedenceGraph.calcForwardGraph(resettedGraph, startNodeLabel);
            let backwardGraph = PrecedenceGraph.calcBackwardGraph(forwardGraph);
            this.graph = backwardGraph;
        } else {
            throw new Error("Graph has a directed loop");
        }
    }

    getGraph(): any{
        return this.graph;
    }

    getStartNode(): any{
        return this.startNodeLabel;
    }

    static hasLoop(graphJSON: any){
        let loopDetector = new DetectLoopInGraph(graphJSON);
        return loopDetector.isCyclic();
    }

    static resetCalcedTimesGraph(graphJSON: any){
        let copy = JSON.parse(JSON.stringify(graphJSON));
        let allNodeLabels = Object.keys(copy);
        for(let i=0; i<allNodeLabels.length; i++){
            let nodeLabel = allNodeLabels[i];
            let node = copy[nodeLabel];
            delete node.earliestStart;
            delete node.earliestEnd;
            delete node.latestStart;
            delete node.latestEnd;
            delete node.buffer;
            copy[nodeLabel] = node;
        }
        return JSON.parse(JSON.stringify(copy));
    }

    static calcForwardGraph(graph: any, startNodeLabel: any){
        let graphJSON = JSON.parse(JSON.stringify(graph))

        let startNode = graphJSON[startNodeLabel];
        startNode.earliestStart = 0;
        startNode.earliestEnd = startNode.duration;
        startNode.latestStart = 0;
        startNode.latestEnd = startNode.duration;
        graphJSON[startNodeLabel] = startNode;


        let listOfImpoveableNodes = [startNodeLabel];

        while(listOfImpoveableNodes.length > 0){
            let liftOfNextImproveableNodes = [];
            for(let i=0; i<listOfImpoveableNodes.length; i++){
                let parentLabel = listOfImpoveableNodes[i];
                let parent = graphJSON[parentLabel];

                let children = parent.children || [];
                parent.children = children;
                graphJSON[parentLabel] = parent;

                for(let j=0; j<children.length; j++){
                    let childLabel = children[j];
                    let child = graphJSON[childLabel];

                    let parents = child.parents || [];
                    parents.push(parentLabel);
                    child.parents = parents;

                    let childsEarliestStart = child.earliestStart;
                    if(childsEarliestStart==null || childsEarliestStart < parent.earliestEnd){
                        childsEarliestStart = parent.earliestEnd;
                        liftOfNextImproveableNodes.push(childLabel);
                    }
                    child.earliestStart = childsEarliestStart;
                    child.earliestEnd = childsEarliestStart + child.duration;

                    graphJSON[childLabel] = child;
                }

            }
            listOfImpoveableNodes = liftOfNextImproveableNodes;
        }

        return JSON.parse(JSON.stringify(graphJSON));
    }

    static getFromAllEarliestEndsTheLatest(graph: any){
        let graphJSON = JSON.parse(JSON.stringify(graph))
        let listOfLeafes = PrecedenceGraph.getAllLeafes(graphJSON);

        let highestEarliestEnd = 0;
        for(let leafLabel of listOfLeafes){
            let node = graphJSON[leafLabel];
            let earliestEnd = node.earliestEnd;
            if(earliestEnd > highestEarliestEnd){
                highestEarliestEnd = earliestEnd;
            }
        }
        return highestEarliestEnd;
    }

    static setLatestStartToAllLeafes(graph: any){
        let graphJSON = JSON.parse(JSON.stringify(graph))

        let highestEarliestEnd = PrecedenceGraph.getFromAllEarliestEndsTheLatest(graphJSON);

        let listOfLeafes = PrecedenceGraph.getAllLeafes(graphJSON);

        for(let leafLabel of listOfLeafes){
            let node = graphJSON[leafLabel];
            node.latestEnd = highestEarliestEnd;
            graphJSON[leafLabel] = node;
        }

        return graphJSON;
    }

    static calcBackwardGraph(graph: any){
        let graphJSON = PrecedenceGraph.setLatestStartToAllLeafes(graph);

        let listOfLeafes = PrecedenceGraph.getAllLeafes(graphJSON);

        for(let i=0; i<listOfLeafes.length; i++){
            let endNodeLabel = listOfLeafes[i];
            graphJSON = PrecedenceGraph.calcBackwardGraphForEndlabel(graphJSON, endNodeLabel);
        }
        return JSON.parse(JSON.stringify(graphJSON));
    }

    static calcBackwardGraphForEndlabel(graphJSON: any, endNodeLabel: any){
        let endNode = graphJSON[endNodeLabel];

        if(endNode.latestStart==null){
            endNode.latestStart = endNode.latestEnd-endNode.duration;
            endNode.buffer = endNode.latestEnd - endNode.earliestEnd;
        }

        graphJSON[endNodeLabel] = JSON.parse(JSON.stringify(endNode));

        let listOfImpoveableNodes = [endNodeLabel];

        while(listOfImpoveableNodes.length > 0){
            let liftOfNextImproveableNodes = [];
            for(let i=0; i<listOfImpoveableNodes.length; i++){
                let childLabel = listOfImpoveableNodes[i];
                let child = graphJSON[childLabel];

                let parents = child.parents;

                if(!!parents){
                    for(let j=0; j<parents.length; j++){
                        let parentLabel = parents[j];
                        let parent = JSON.parse(JSON.stringify(graphJSON[parentLabel]));

                        let parentsLatestEnd = parent.latestEnd;
                        if(parentsLatestEnd==null || parentsLatestEnd > child.latestStart){
                            parent.latestEnd = child.latestStart;
                            liftOfNextImproveableNodes.push(parentLabel);
                        }

                        parent.latestStart = parent.latestEnd - parent.duration;
                        parent.buffer = parent.latestEnd - parent.earliestEnd;

                        graphJSON[parentLabel] = JSON.parse(JSON.stringify(parent));
                    }
                }
            }
            listOfImpoveableNodes = liftOfNextImproveableNodes;
        }

        return graphJSON;
    }

   isCriticalPath(parentId: any, childId: any){
        let parent = this.graph[parentId];
        let child = this.graph[childId];
        return PrecedenceGraph.isCriticalPath(parent, child);
   }

    static isCriticalPath(parent: any, child: any){
        // buffer 0 is not enough
        //A --> B && B --> C && A --> C
        //crititcal path would be A-->B-->C but we dont want A-->C as critical path
        if(child.latestStart === parent.latestEnd && child.buffer===0 && parent.buffer === 0) {
            return true;
        }
        return false;
    }

    getCriticalPaths(){
        return PrecedenceGraph.getCriticalPaths(this.graph, this.startNodeLabel)
    }

    static getCriticalPaths(graphJSON: any, startNodeLabel: any): any[]{
        let criticalPaths: any[] = [];
        let parent = graphJSON[startNodeLabel];
        if(parent.buffer===0){
            let children = parent.children;
            if(children.length > 0){
                for(let i=0; i<children.length; i++){
                    let childLabel = children[i];
                    let child = graphJSON[childLabel];
                    if(PrecedenceGraph.isCriticalPath(parent, child)){
                        //A --> B && B --> C && A --> C
                        //crititcal path would be A-->B-->C but we dont want A-->C as critical path
                        let childsCriticalPaths = PrecedenceGraph.getCriticalPaths(graphJSON, childLabel);
                        for(let j=0; j<childsCriticalPaths.length; j++){
                            let childsCriticalPath = childsCriticalPaths[j];
                            let completedChildsCriticalPath = [startNodeLabel].concat(childsCriticalPath);
                            criticalPaths.push(completedChildsCriticalPath);
                        }
                    }
                }
                return criticalPaths;
            } else {
                return [startNodeLabel];
            }
        }
        return criticalPaths;
    }

    static getAllLeafes(graphJSON: any){
        let listOfLeafes = [];
        let allNodeLabels = Object.keys(graphJSON);
        for(let i=0; i<allNodeLabels.length; i++){
            let nodeLabel = allNodeLabels[i];
            let node = graphJSON[nodeLabel];
            if(node.children.length === 0){
                listOfLeafes.push(nodeLabel);
            }
        }
        return listOfLeafes;
    }

}
