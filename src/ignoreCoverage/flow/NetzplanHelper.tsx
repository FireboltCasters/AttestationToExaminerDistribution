import graph from "./graph.json";

export default class NetzplanHelper{

    static NODE_HEIGHT = 78;

    static initNodeName = "Start";

    static defaultEdgeStyle = {
        strokeDasharray: 10,    // <--- This line
        strokeDashoffset: -10,
        strokeWidth: 5,
        animation: "dashdraw 1.5s linear infinite"
    }

    static removeEdgeStyle(edges: any){
        for(let edge of edges){
            delete edge.style;
            delete edge.animated;
            delete edge.targetHandle;
            delete edge.sourceHandle;
            delete edge.type;
        }
        return edges;
    }

    static applyDefaultEdgeStyle(edges: any){
        for(let edge of edges){
            edge.style = NetzplanHelper.defaultEdgeStyle
            edge.animated = true;
            edge.type = 'buttonedge';
        }
        return edges;
    }

    static getInitialNodes(){
        return JSON.parse(JSON.stringify(graph.nodes))
    }

    static getInitialEdges(){
        return JSON.parse(JSON.stringify( NetzplanHelper.applyDefaultEdgeStyle(graph.edges)))
    }

}