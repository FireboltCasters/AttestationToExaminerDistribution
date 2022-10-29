//@ignore-file

import JSONToGraph from "./JSONToGraph";
import ExampleCSVContent from "./ExampleCSVContent";
import GraphHelper from "./GraphHelper";
import ParseStudIPCSVToJSON from "./ParseStudIPCSVToJSON";

async function main(){
    let tutors = [];

    console.log("Try parsing");
    let unoptimizedJSON = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(ExampleCSVContent.getExampleCSVContent());
    //unoptimizedJSON = ExampleCSVContent.getExampleParsedJSON();

    console.log("++++  Output +++++");
    console.log(JSON.stringify(unoptimizedJSON, null, 2));
    console.log("++++++++++++++++++");

    console.log("++++ Optimized JSON +++++");
    let optimizedJSON = GraphHelper.getOptimizedDistribution(unoptimizedJSON);
    console.log(JSON.stringify(optimizedJSON, null, 2));
    console.log("++++++++++++++++++");

    console.log("++++ Groups unoptimized for Tutor +++++");
    let groupsForTutorUnoptimized = ParseStudIPCSVToJSON.getGroupsForTutors(unoptimizedJSON);
    //console.log(JSON.stringify(groupsForTutorOptimized, null, 2));
    tutors = Object.keys(groupsForTutorUnoptimized);
    for(let i = 0; i < tutors.length; i++){
        console.log(tutors[i] + ": " + groupsForTutorUnoptimized[tutors[i]].length);
    }
    console.log("++++++++++++++++++");

    console.log("++++ Groups optimized for Tutor +++++");
    let groupsForTutorOptimized = ParseStudIPCSVToJSON.getGroupsForTutors(optimizedJSON);
    //console.log(JSON.stringify(groupsForTutorOptimized, null, 2));
    tutors = Object.keys(groupsForTutorOptimized);
    for(let i = 0; i < tutors.length; i++){
        console.log(tutors[i] + ": " + groupsForTutorOptimized[tutors[i]].length);
    }
    console.log("++++++++++++++++++");



/**
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
*/

}

main();

