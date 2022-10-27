//@ignore-file

import ParseStudIPCSV from "./ParseStudIPCSV";
import ExampleCSVContent from "./ExampleCSVContent";
import GraphHelper from "./GraphHelper";

async function main(){
    console.log("Try parsing");
    let output = await ParseStudIPCSV.parse(ExampleCSVContent.getExampleCSVContent());
    console.log("++++  Output +++++");
    console.log(output);
    console.log("++++++++++++++++++");
    let nameToVertice = ParseStudIPCSV.getHelpingMapToVertices(output);
    console.log("++++  Name to Vertice +++++");
    console.log(nameToVertice)
    console.log("++++++++++++++++++");
    let verticeToName = ParseStudIPCSV.getHelpingMapVerticiesToName(nameToVertice);
    console.log("++++  Vertice to Name +++++");
    console.log(verticeToName)
    console.log("++++++++++++++++++");
    let tutorCapacity = 16;
    let minTutorCapacity = GraphHelper.getMinTutorCapacity(output, nameToVertice, verticeToName, tutorCapacity);
    console.log("++++  Min Tutor Capacity +++++");
    console.log(minTutorCapacity)
    console.log("++++++++++++++++++");
    let result = GraphHelper.getTutorDistribution(output, nameToVertice, verticeToName, minTutorCapacity);


}

main();

