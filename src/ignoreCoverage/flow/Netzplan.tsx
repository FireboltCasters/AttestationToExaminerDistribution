import React, {useState, useRef, Component, FunctionComponent, useEffect} from 'react';
import ReactFlow, {
    addEdge,
//    removeElements,
    Controls, isNode,
    Background,
    getOutgoers, isEdge, useEdgesState, useNodesState, ReactFlowProvider, ReactFlowInstance, getBezierPath
} from 'react-flow-renderer';
import { Toast } from 'primereact/toast';
import {GraphHelper} from "./GraphHelper";
import {NetzplanNodeEditable} from "./NetzplanNodeEditable";
import {SidebarNodes} from "./SidebarNodes";
import {MyToolbar} from "./MyToolbar";
import NetzplanHelper from "./NetzplanHelper";
import App from "../../App";
import {PrecedenceGraph} from "../../api/src";
import ButtonEdge from './ButtonEdge.js';

const edgeNormal = "#444444";
const edgeCritical = "#ff2222";

let id = 1;
const getId = () => {
    let date = new Date();

    return `Activity_${date.getTime()}`
};

export const Netzplan : FunctionComponent = (props) => {

    const toast = useRef(null);
    const reactFlowWrapper = React.createRef<HTMLDivElement>();
    const [nodeTypes, setNodetypes] = useState({});
    const [reloadNumber, setReloadNumber] = useState(0)
    const [autocalc, setAutoCalc] = useState(true)
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>()
    //@ts-ignore
    const [nodes, setNodes, onNodesChange] = useNodesState(NetzplanHelper.getInitialNodes());
    //@ts-ignore
    const [edges, setEdges, onEdgesChange] = useEdgesState(NetzplanHelper.getInitialEdges());
    const onConnect = async (params: any) => {
        //@ts-ignore
        setEdges((eds) => {
            let nextEdges = addEdge({
                style: NetzplanHelper.defaultEdgeStyle,
                animated: true, ...params,
                type: 'buttonedge'
            }, eds);
            checkAutoCalc(undefined, nextEdges)
            return nextEdges;
        })
    };

    async function checkAutoCalc(passedNodes?: any, passedEdges?: any){
        if(autocalc){
            await calcNetzplan(passedNodes, passedEdges)
        }
    }

    async function autoLayoutElements(passedNodes?: any, passedEdges?: any){
        console.log("passedNodes");
        console.log(passedNodes);

        let useNodes = !!passedNodes ? passedNodes : nodes;
        let useEdges = !!passedEdges ? passedEdges : edges;

        console.log("useNodes:");
        console.log(useNodes);
        console.log("Finished");

        let layoutedElements: any = GraphHelper.getLayoutedElements(useNodes, useEdges, GraphHelper.DEFAULT_NODE_WIDTH, NetzplanHelper.NODE_HEIGHT);

        console.log("layoutedElements")
        console.log(layoutedElements)

        setNodes([])
        setEdges([])
        setReloadNumber(reloadNumber+1);
        await sleep(500);
        setNodes(layoutedElements)
        setEdges(useEdges)
        await sleep(500);
        fitView();
        setReloadNumber(reloadNumber+1);
    }

    async function sleep(milliseconds: number) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async function reset(){
        //@ts-ignore
        await calcNetzplan(NetzplanHelper.getInitialNodes(), NetzplanHelper.getInitialEdges());
        setReloadNumber(reloadNumber+1);
        fitView()
    }

    function fitView(){
        if(reactFlowInstance!=null){
            reactFlowInstance?.fitView()
        }
    }

    function getNetzplanJSONFromReactFlowElements(passedNodes?: any, passedEdges?: any){
        let graphJSON = {};
        for(let i=0; i<passedNodes.length; i++){
            let element = passedNodes[i];
            let reactFlowChildren = getOutgoers(element, passedNodes, passedEdges);
            let children = [];
            for(let j=0; j<reactFlowChildren.length; j++){
                let child = reactFlowChildren[j];
                children.push(child.id+"");
            }
            let label = element.id;
            let data = element.data;
            let graphElement = {
                children: children,
                //@ts-ignore
                duration: data?.duration || 0
            }
            //@ts-ignore
            graphJSON[label] = graphElement;
        }
        return graphJSON;
    }

    function calcNetzplan(passedNodes?: any, passedEdges?: any){
        let useNodes: any = passedNodes || nodes;
        let useEdges: any = passedEdges || edges;

        let startNodeLabel: string = NetzplanHelper.initNodeName;
        let graphJSON = getNetzplanJSONFromReactFlowElements(useNodes, useEdges);
        console.log(graphJSON);
        try{
            let precedenceGraph = new PrecedenceGraph(graphJSON, startNodeLabel);
            console.log(precedenceGraph);
            updateElementsByCalcedNetzplan(precedenceGraph.getGraph(), useNodes, useEdges);
        } catch (err){
            if(toast.current!=null){
                //@ts-ignore
                toast.current.show({severity:'error', summary: 'Error', detail:err.message, life: 3000});
            }
        }
    }

    async function updateElementsByCalcedNetzplan(calcedNetzplan: any, useNodes: any, useEdges: any){
        let newNodes = [];
        for(let node of useNodes){
            let id = node.id;
            let netzplanNode = calcedNetzplan[id];
            //@ts-ignore
            node.data.buffer = netzplanNode?.buffer;
            //@ts-ignore
            node.data.earliestStart = netzplanNode?.earliestStart;
            //@ts-ignore
            node.data.earliestEnd = netzplanNode?.earliestEnd;
            //@ts-ignore
            node.data.latestStart = netzplanNode?.latestStart;
            //@ts-ignore
            node.data.latestEnd = netzplanNode?.latestEnd;
            newNodes.push(node);
        }

        let newEdges = [];
        for(let edge of useEdges){
            let source = edge.source;
            let target = edge.target;
            let sourceNode = calcedNetzplan[source];
            let targetNode = calcedNetzplan[target];

            if(!!sourceNode && !!targetNode){
                let isCritical = PrecedenceGraph.isCriticalPath(sourceNode, targetNode);
                edge.style = {...NetzplanHelper.defaultEdgeStyle};
                if(isCritical){
                    edge.style.stroke= edgeCritical;
                } else {
                    edge.style.stroke= edgeNormal;
                }
            }
            newEdges.push(edge);
        }

        setNodes([])
        setEdges([])
        await sleep(100);
        setNodes(newNodes);
        setEdges(newEdges);
        setReloadNumber(reloadNumber+1)
    }

    function onInit(_reactFlowInstance: any) {
        console.log("On Load");
        console.log(_reactFlowInstance);
        setReactFlowInstance(_reactFlowInstance)
    }

    function onDragOver(event: any) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    function onDrop(event: any) {
        console.log("On Drop Event!");
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        console.log("type: ", type);
        let data = JSON.parse(event.dataTransfer.getData('application/customData'));
        console.log(data);

        //@ts-ignore
        const reactFlowBounds: any = reactFlowWrapper.current.getBoundingClientRect();
        console.log(reactFlowBounds)

        console.log(reactFlowWrapper.current);
        if(reactFlowInstance!=null){
            //@ts-ignore
            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            let newId = getId();

            data = Object.assign(data,{id: newId, instance: {
                    setNodeDuration: setNodeDuration,
                    setNodeLabel: setNodeLabel,
                }});

            const newNode = {
                id: newId,
                type,
                position,
                data: data,
            };
            setNodes(nodes.concat(newNode))
        }
    };

    async function setNodeDuration(nodeId: any, duration: any){
        setNodeDataProperty(nodeId, "duration", duration)
    }
    App.netzplanRef.setNodeDuration = setNodeDuration

    async function setNodeLabel(nodeId: any, label: any){
        setNodeDataProperty(nodeId, "label", label)
    }
    App.netzplanRef.setNodeLabel = setNodeLabel

    async function setNodeDataProperty(nodeId: any, key: any, value: any){
        let elementsCopy = nodes;
        let newElements = [];
        for(let i=0; i<elementsCopy.length; i++){
            let element = elementsCopy[i];
            if(element.id === nodeId){
                let data = element.data;
                //@ts-ignore
                data[key] = value;
                element.data = data;
            }

            element.data.buffer = undefined;
            //@ts-ignore
            element.data.earliestStart = undefined;
            //@ts-ignore
            element.data.earliestEnd = undefined;
            //@ts-ignore
            element.data.latestStart = undefined;
            //@ts-ignore
            element.data.latestEnd = undefined
            elementsCopy[i] = element;
            newElements.push(element);
        }

        let newEdges = NetzplanHelper.applyDefaultEdgeStyle(JSON.parse(JSON.stringify(edges)));
        setEdges(newEdges)
        setNodes(newElements);
        setReloadNumber(reloadNumber+1)
        await checkAutoCalc(newElements, newEdges)
    }

    async function myOnNodesChange(nodesChanges: any){
        let filteredChanges = []
        let wasRemoved = false;
        let removedNodes = [];

        for(let nodeChange of nodesChanges){
            if(nodeChange?.type==="remove"){
                if(nodeChange.id===NetzplanHelper.initNodeName){
                    //prevent from deletion
                } else {
                    wasRemoved = true;
                    filteredChanges.push(nodeChange)
                    removedNodes.push(nodeChange);
                }
            } else {
                filteredChanges.push(nodeChange)
            }
        }
        onNodesChange(filteredChanges);

        if(wasRemoved){
            let newEdges = NetzplanHelper.applyDefaultEdgeStyle(JSON.parse(JSON.stringify(edges)));
            setEdges(newEdges)

            let newNodes = [];
            for(let node of nodes){
                let notBeingRemoved = true;
                for(let removedNode of removedNodes){
                    if(removedNode.id===node.id){
                        notBeingRemoved = false;
                    }
                }
                if(notBeingRemoved){
                    newNodes.push(node);
                }
            }
            setNodes(newNodes)

            checkAutoCalc(newNodes, newEdges);
        }
    }

    useEffect(() => {
        document.title = "Precedence Diagram Demo"
        const nodeTypes = Object.assign({}, NetzplanNodeEditable.getNodeType())
        //@ts-ignore
        setNodetypes(nodeTypes);
        calcNetzplan()
        autoLayoutElements()
    }, [])

        let height = 700;

    async function removeEdge(event: any, id: any){
        let newEdges = [];
        for(let edge of edges){
            if(edge.id!==id){
                newEdges.push(edge)
            }
        }
        setEdges(newEdges);
        await checkAutoCalc(undefined, newEdges);
    }

    const edgeTypes: any = {
        buttonedge: (props: any) => {return ButtonEdge(props, removeEdge)},
    };

    return (
            <ReactFlowProvider key={reloadNumber+1+""}>
                <Toast ref={toast}></Toast>
                <div style={{width: "100%", height: "100vh"}}>
                        <div style={{display: "flex", flexDirection: "row", height: "100%"}}>
                            <div style={{display: "flex", flex: 3}}>
                                <ReactFlow
                                    fitView
                                    ref={reactFlowWrapper}
                                    key={reloadNumber+""}
                                    nodes={nodes} edges={edges}
                                    onConnect={onConnect}
                                    onNodesChange={myOnNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    edgeTypes={edgeTypes}
                                    //                    onElementsRemove={onElementsRemove}
                                    //onNodesChange={onNodesChange}
                                    onInit={onInit}
                                    onDrop={onDrop}
                                    onDragOver={onDragOver}
                                    nodeTypes={nodeTypes}
                                    snapToGrid={true}
                                    style={{alignContent: "flex-end"}}
                                >
                                    <Controls />
                                    <Background />
                                </ReactFlow>
                            </div>
                            <div style={{display: "flex", flex: 1, flexDirection: "column", backgroundColor: "#DDDDDD"}}>
                                <MyToolbar autocalc={autocalc} setAutoCalc={setAutoCalc} handleCalc={calcNetzplan} handleLayout={autoLayoutElements} handleClear={reset} nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} setReloadNumber={setReloadNumber} reloadNumber={reloadNumber} />
                                <SidebarNodes nodeTypes={nodeTypes} />
                            </div>
                        </div>
                </div>
            </ReactFlowProvider>
        );
}
