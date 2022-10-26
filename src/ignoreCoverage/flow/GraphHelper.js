import dagre from 'dagre';
import {isNode} from "react-flow-renderer";

export class GraphHelper{

    static DEFAULT_NODE_WIDTH = 150;
    static DEFAULT_NODE_HEIGHT = 50;

    static getLayoutedElements(nodes, edges, nodeWidth, nodeHeight){
        const dagreGraph = new dagre.graphlib.Graph();
        let layoutedElements = GraphHelper._layoutElements(dagreGraph,nodes, edges, nodeWidth, nodeHeight);
        return layoutedElements;
    }

    static _layoutElements(dagreGraph, nodes, edges, nodeWidth=GraphHelper.DEFAULT_NODE_WIDTH, nodeHeight=GraphHelper.DEFAULT_NODE_HEIGHT){
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        let direction = "TB"; //'LR'; 'TB';
        dagreGraph.setGraph({ rankdir: direction });

        nodes.forEach((el) => {
            dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
        });

        edges.forEach((el) => {
            dagreGraph.setEdge(el.source, el.target);
        });

        dagre.layout(dagreGraph);
        const isHorizontal = direction === 'LR';
        const layoutedElements = nodes.map((el) => {
            const nodeWithPosition = dagreGraph.node(el.id);
            el.targetPosition = isHorizontal ? 'left' : 'top';
            el.sourcePosition = isHorizontal ? 'right' : 'bottom';
            // we need to pass a slighltiy different position in order to notify react flow about the change
            // @TODO how can we change the position handling so that we dont need this hack?
            el.position = { x: nodeWithPosition.x + Math.random() / 1000, y: nodeWithPosition.y };
            return el;
        });

        return layoutedElements;
    }



}