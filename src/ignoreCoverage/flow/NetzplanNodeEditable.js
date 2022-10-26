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
        let duration = undefined;
        let label = undefined;
        let data = this.props.data;
        if(!!data){
            if(!!data.label){
                label = data.label;
            } else {
                label = data.id;
            }
            duration = data.duration;
        }

        this.state = {
            label: label,
            duration: duration,
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

    renderForSidebar(){
        return(
                <div style={this.outerHolderSidebarStyle}>
                    <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                        {"Activity"}
                    </div>
                    <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                        {"Duration"}{" "}{"("+"Buffer"+")"}
                    </div>
                    <div style={{flexDirection: "row", display: "flex"}}>
                        <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                            {"earliest start"}
                        </div>
                        <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                            {"earliest finish"}
                        </div>
                    </div>
                    <div style={{flexDirection: "row", display: "flex"}}>
                        <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                            {"latest start"}
                        </div>
                        <div style={{...centerStyle, ...this.outerHolderSidebarFontStyle}} >
                            {"latest finish"}
                        </div>
                    </div>
                </div>
        )
    }

    onChangeDuration(event){
        this.setState({
            duration: event.value
        });
    }

    onBlurDuration(event){
        let id = this.props.data.id;
        App.netzplanRef.setNodeDuration(id, this.state.duration);
    }

    renderDurationInput(){
        return <InputNumber onBlur={this.onBlurDuration.bind(this)} inputStyle={NetzplanNodeEditable.inputStyle} value={this.state.duration} onChange={this.onChangeDuration.bind(this)}/>;
    }


    onChangeLabel(event){
        this.setState({
            label: event.target.value
        });
    }

    onBlurLabel(event){
        let id = this.props.data.id;
        App.netzplanRef.setNodeLabel(id, this.state.label);
    }

    renderLabelInput(){
        return <InputText onBlur={this.onBlurLabel.bind(this)}  style={this.labelInputStyle} value={this.state.label} onChange={this.onChangeLabel.bind(this)}/>;
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
            return this.renderForSidebar()
        }

        let topContent = <Handle type="target" position={Position.Top}/>;
        let bottomContent = <Handle type="source" position={Position.Bottom} />;


        return (
            <>
                {topContent}
                <div className="p-grid p-nogutter" style={this.outerHolderStyle}>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {this.renderLabelInput()}
                    </div>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {this.renderDurationInput()}{" "}{this.renderPuffer(data)}
                    </div>
                    <div style={{flexDirection: "row", display: "flex"}}>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {""+data.earliestStart+" (e. s.)"}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {""+data.earliestEnd+" (e. e.)"}
                        </div>
                    </div>
                    <div style={{flexDirection: "row", display: "flex"}}>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {""+data.latestStart+" (l. s.)"}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {""+data.latestEnd+" (l. e.)"}
                        </div>
                    </div>
                </div>
                {bottomContent}
            </>
        );
    }
}
