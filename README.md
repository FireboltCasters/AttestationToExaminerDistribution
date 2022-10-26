<h1><a href="https://github.com/FireboltCasters/AttestationToExaminerDistribution"><img src="https://raw.githubusercontent.com/FireboltCasters/AttestationToExaminerDistribution/main/icon.png" width="100" heigth="100" /></a><a href="https://github.com/FireboltCasters/AttestationToExaminerDistribution">attestation-to-examiner-distribution</a></h1><h2>A library to calculate the critical path in an given precedence-diagram</h2>

<p align="center">
  <a href="https://badge.fury.io/js/attestation-to-examiner-distribution.svg"><img src="https://badge.fury.io/js/attestation-to-examiner-distribution.svg" alt="npm package" /></a>
  <a href="https://img.shields.io/github/license/FireboltCasters/PrecedenceDiagramMethod"><img src="https://img.shields.io/github/license/FireboltCasters/PrecedenceDiagramMethod" alt="MIT" /></a>
  <a href="https://img.shields.io/github/last-commit/FireboltCasters/PrecedenceDiagramMethod?logo=git"><img src="https://img.shields.io/github/last-commit/FireboltCasters/PrecedenceDiagramMethod?logo=git" alt="last commit" /></a>
  <a href="https://www.npmjs.com/package/attestation-to-examiner-distribution"><img src="https://img.shields.io/npm/dm/attestation-to-examiner-distribution.svg" alt="downloads week" /></a>
  <a href="https://www.npmjs.com/package/attestation-to-examiner-distribution"><img src="https://img.shields.io/npm/dt/attestation-to-examiner-distribution.svg" alt="downloads total" /></a>
  <a href="https://github.com/google/gts" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/code%20style-google-blueviolet.svg"/></a>
  <a href="https://shields.io/" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/uses-TypeScript-blue.svg"/></a>
  <a href="https://github.com/marketplace/actions/lint-action"><img src="https://img.shields.io/badge/uses-Lint%20Action-blue.svg"/></a>
</p>


<p align="center">
  <a href="https://github.com/FireboltCasters/PrecedenceDiagramMethod/actions/workflows/npmPublish.yml"><img src="https://github.com/FireboltCasters/PrecedenceDiagramMethod/actions/workflows/npmPublish.yml/badge.svg" alt="Npm publish" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=alert_status" alt="Quality Gate" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=bugs" alt="Bugs" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=coverage" alt="Coverage" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=code_smells" alt="Code Smells" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=duplicated_lines_density" alt="Duplicated Lines (%)" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=sqale_rating" alt="Maintainability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=reliability_rating" alt="Reliability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=security_rating" alt="Security Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=sqale_index" alt="Technical Debt" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_PrecedenceDiagramMethod"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_PrecedenceDiagramMethod&metric=vulnerabilities" alt="Vulnerabilities" /></a>
</p>

## Demo

Live Demo: https://fireboltcasters.github.io/PrecedenceDiagramMethod/

<img src="https://raw.githubusercontent.com/FireboltCasters/PrecedenceDiagramMethod/main/Demo.gif" alt="Coverage" />

## Installtion

```
npm install attestation-to-examiner-distribution
```

## Usage

```ts
import {PrecedenceGraph} from "attestation-to-examiner-distribution";


let exampleGraph = {
    "StartLabel": {
        "children": [
            "Marketing",
            "Documentation"
        ],
        "duration": 0
    },
    "Marketing": {
        "children": [
            "Publishing"
        ],
        "duration": 3
    },
    "Documentation": {
        "children": [
            "Publishing"
        ],
        "duration": 4
    },
    "Publishing": {
        "children": [],
        "duration": 2
    }
}

let instance = new PrecedenceGraph(exampleGraph, "StartLabel");
let calcedGraph = instance.getGraph();
let criticalPath = instance.getCriticalPaths();
```

Each node will have to be in the following format:

```
<NameOfTheActiticy>: {
    "children": [<Array of children names>],
    "duraion": <DurationOfTheActivity>
}
```


Each node will have the following fields

## Node fields

- duration: number
- buffer: number
- earliestStart: number
- earliestEnd: number
- latestStart: number
- latestEnd: number
- children: [Node]
- parents: [Node]

## Documentation

You can also use additional methods:

### instance ()

---

Get the current precedence graph
```ts
instance.getGraph()
```
---

Get the start node label of the precedence graph
```ts
instance.getStartNode()
```
---

Returns is a connection between a child and a parent is critical (no buffer)
```ts
instance.isCriticalPath(parentId, childId)
```
---

Get the start node label of the precedence graph
```ts
instance.getStartNode()
```
---

Gets all ciritcal paths
```ts
instance. isCriticalPath()
```
---


### static

Returns true if the loop has a directed loop
```ts
PrecedenceGraph.hasLoop(graph)
```
---

Resets all calced times on a graph and returns a copy
```ts
PrecedenceGraph.resetCalcedTimesGraph(graph)
```
---

Calculates the forward precedence graph from a given startLabel and returns a copy
```ts
PrecedenceGraph.calcForwardGraph(graph, startLabel)
```
---

Returns the highest earliest end on a given graph
```ts
PrecedenceGraph.getFromAllEarliestEndsTheLatest(graph)
```
---

Sets the highest earliest end to the latest end of all leaf nodes
```ts
PrecedenceGraph.setLatestStartToAllLeafes(graph)
```
---

Calculates the backward precedence graph
```ts
PrecedenceGraph.calcBackwardGraph(graph)
```
---

Returns all leaves of a given graph
```ts
PrecedenceGraph.getAllLeafes(graph)
```
---

There a more functions which I wont describe here further. More information has to be read from the source code.

## Contributors

The FireboltCasters

<a href="https://github.com/FireboltCasters/PrecedenceDiagramMethod"><img src="https://contrib.rocks/image?repo=FireboltCasters/PrecedenceDiagramMethod" alt="Contributors" /></a>
