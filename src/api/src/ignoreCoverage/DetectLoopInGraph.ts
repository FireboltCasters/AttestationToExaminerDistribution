
export default class DetectLoopInGraph {
    private graph: any;

    constructor(graphJSON: any) {
        let graph = JSON.parse(JSON.stringify(graphJSON));
        this.graph = graph;
    }

    // Returns true if the graph contains a
    // cycle, else false.
    // This function is a variation of DFS() in
    // https://www.geeksforgeeks.org/archives/18212
    isCyclic() {
        // Mark all the vertices as not visited and
        // not part of recursion stack
        let visited: any[] = [];
        let recStack: any[] = [];
        let nodes: any[] = Object.keys(this.graph)
        for(let node of nodes)
        {
            visited[node]=false;
            recStack[node]=false;
        }


        // Call the recursive helper function to
        // detect cycle in different DFS trees
        for(let node of nodes)
            if (this.isCyclicUtil(node, visited, recStack))
                return true;

        return false;
    }


    // This function is a variation of DFSUtil() in
    // https://www.geeksforgeeks.org/archives/18212
    private isCyclicUtil(label: any,visited: any[],recStack: any[]) {
        // Mark the current node as visited and
        // part of recursion stack
        if (recStack[label])
            return true;

        if (visited[label])
            return false;

        visited[label] = true;

        recStack[label] = true;
        let children: any[] = this.graph[label].children;

        for(let child of children)
            if (this.isCyclicUtil(child, visited, recStack))
                return true;

        recStack[label] = false;

        return false;
    }

}
