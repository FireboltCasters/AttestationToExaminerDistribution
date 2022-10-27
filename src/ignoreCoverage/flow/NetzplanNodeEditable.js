import React, {Component, memo} from 'react';

import {Handle, Position} from "react-flow-renderer";
import {GraphHelper} from "./GraphHelper";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {Netzplan} from "./Netzplan";
import NetzplanHelper from "./NetzplanHelper";
import App from "../../App";

const zoom = 1;

const fontStyle = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: "black",
    fontSize: 8*zoom+"px",
    fontFamily: "Helvetica",
};

const borderStyle = {
    border: "1px solid black",
}

const centerStyle = Object.assign(fontStyle,borderStyle);

export class NetzplanNodeEditable extends Component {

    static inputStyle = {textAlign: "center", height: (GraphHelper.DEFAULT_NODE_HEIGHT/4)+"px", width: (GraphHelper.DEFAULT_NODE_WIDTH/2)+"px"}

    static getNodeTypeName(){
        return "ReactFlowNetzplanNode";
    }

    static getMemoRenderer(){
        const component = React.memo(({ data }) => {
            return <NetzplanNodeEditable data={data} />
        });
        return component;
    }

    static getNodeType(){
        return {
            [NetzplanNodeEditable.getNodeTypeName()]: NetzplanNodeEditable.getMemoRenderer(),
        }
    }

    static getElementStyle(){
        let ratio = 188.0/105.0;
        let height = 60*zoom;
        let width = height*ratio;

        return(
            {
                background: "white",
                width: width,
                height: height,
                color: "#fff",
                boxShadow: "5px 5px 5px 0px rgba(0,0,0,.10)"
            }
        )
    }

    constructor(props) {
        super(props);
        let label = undefined;
        let type = undefined;
        let data = this.props.data;
        if(!!data){
            if(!!data.type){
                type = data.type;
            } else {
                type = "undefined";
            }
            if(!!data.label){
                label = data.label;
            } else {
                label = data.id;
            }
        }

        this.state = {
            label: label,
            type: type,
        }

        this.labelInputStyle = {textAlign: "center", height: (NetzplanHelper.NODE_HEIGHT/4)+"px", width: (GraphHelper.DEFAULT_NODE_WIDTH)+"px"}
        this.outerHolderStyle = {
            backgroundColor: "white",
            width: GraphHelper.DEFAULT_NODE_WIDTH,
            height: NetzplanHelper.NODE_HEIGHT
        };
        this.outerHolderSidebarStyle = {
            backgroundColor: "white",
            width: GraphHelper.DEFAULT_NODE_WIDTH*2,
        };
        let fontSize = 18;
        this.outerHolderSidebarFontStyle = {
            fontSize: fontSize+"px"
        };
    }

    renderType(){
        return <div style={this.labelInputStyle} >{this.state.type}</div>;
    }

    renderLabel(){
        return <div style={this.labelInputStyle} >{this.state.label}</div>;
    }

    renderPuffer(data){
        let buffer = data.buffer;
        if(buffer===undefined){
            return "Duration"
        }

        return(
            "(buffer: "+data.buffer+")"
        )
    }

    render() {
        let data = this.props.data;
        if(!data){ //Sidebar
            return null;
        }

        let topContent = <Handle type="target" position={Position.Top}/>;
        let bottomContent = <Handle type="source" position={Position.Bottom} />;


        return (
            <div style={{backgroundColor: "orange", width: GraphHelper.DEFAULT_NODE_WIDTH, height: NetzplanHelper.NODE_HEIGHT}}>
                {topContent}
                <div className="p-col-12 p-nogutter" style={centerStyle} >
                    {this.renderType()}
                </div>
                <div className="p-col-12 p-nogutter" style={centerStyle} >
                    {this.renderLabel()}
                </div>
                {bottomContent}
            </div>
        );
    }
}
