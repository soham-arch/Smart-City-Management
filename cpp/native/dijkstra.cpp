/*
 * dijkstra.cpp — Dijkstra's Shortest Path Algorithm
 *
 * Computes shortest paths from a source node to all nodes in a weighted graph.
 * Used for: ambulance routing, police station routing, fire station routing.
 *
 * Input (stdin):  Line 1: mode ("single" or "all")
 *                 Line 2: start node id
 *                 Line 3: target node id
 *                 Line 4: edge count
 *                 Lines 5+: from\tto\tweight (tab-separated)
 * Output (stdout): JSON with path/distances
 *
 * Algorithm: Dijkstra with min-heap priority queue — O(E log V)
 * Compiled to: server/bin/native_dijkstra.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <queue>
#include <algorithm>
#include <cmath>
#include <iomanip>
#include <climits>

using namespace std;

// Edge in the graph
struct Edge {
    string to;
    double weight;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    // Read mode, start, target, edge count
    string mode, start, target, countLine;
    if (!getline(cin, mode) || !getline(cin, start) ||
        !getline(cin, target) || !getline(cin, countLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int edgeCount = atoi(countLine.c_str());

    // Build adjacency list graph
    map<string, vector<Edge>> graph;
    vector<string> nodeOrder;
    map<string, bool> seen;

    for (int i = 0; i < edgeCount; i++) {
        string line;
        if (!getline(cin, line)) break;

        // Parse tab-separated: from \t to \t weight
        stringstream ss(line);
        string from, to, wStr;
        getline(ss, from, '\t');
        getline(ss, to, '\t');
        getline(ss, wStr, '\t');

        double w = atof(wStr.c_str());

        // Undirected graph — add both directions
        graph[from].push_back({to, w});
        graph[to].push_back({from, w});

        if (!seen[from]) { nodeOrder.push_back(from); seen[from] = true; }
        if (!seen[to])   { nodeOrder.push_back(to);   seen[to] = true;   }
    }

    if (!seen[start]) {
        cout << "{\"error\":\"start node not found\"}";
        return 1;
    }

    // Initialize distances to infinity
    map<string, double> dist;
    map<string, string> prev;
    for (int i = 0; i < nodeOrder.size(); i++) {
        dist[nodeOrder[i]] = 1e18;
        prev[nodeOrder[i]] = "";
    }
    dist[start] = 0.0;

    // Min-heap: (distance, node)
    priority_queue<pair<double, string>, vector<pair<double, string>>, greater<pair<double, string>>> pq;
    pq.push({0.0, start});

    // Dijkstra's algorithm
    while (!pq.empty()) {
        double d = pq.top().first;
        string u = pq.top().second;
        pq.pop();

        // Skip if we already found a shorter path
        if (d > dist[u]) continue;

        // Early exit for single-target mode
        if (mode == "single" && u == target) break;

        // Relax all neighbors
        for (int i = 0; i < graph[u].size(); i++) {
            string v = graph[u][i].to;
            double newDist = d + graph[u][i].weight;
            if (newDist < dist[v]) {
                dist[v] = newDist;
                prev[v] = u;
                pq.push({newDist, v});
            }
        }
    }

    // Output JSON based on mode
    if (mode == "single") {
        // Reconstruct shortest path from start to target
        if (!seen[target] || dist[target] >= 1e17) {
            cout << "{\"path\":[],\"total_distance\":-1}";
            return 0;
        }

        vector<string> path;
        string cur = target;
        while (cur != "") {
            path.push_back(cur);
            cur = prev[cur];
        }
        reverse(path.begin(), path.end());

        if (path.empty() || path[0] != start) {
            cout << "{\"path\":[],\"total_distance\":-1}";
            return 0;
        }

        // Print path array
        cout << "{\"path\":[";
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) cout << ",";
            cout << "\"" << path[i] << "\"";
        }
        cout << fixed << setprecision(1);
        cout << "],\"total_distance\":" << dist[target] << "}";
    } else {
        // Print all distances
        cout << fixed << setprecision(1);
        cout << "{\"distances\":{";
        for (int i = 0; i < nodeOrder.size(); i++) {
            if (i > 0) cout << ",";
            cout << "\"" << nodeOrder[i] << "\":";
            if (dist[nodeOrder[i]] < 1e17)
                cout << dist[nodeOrder[i]];
            else
                cout << "null";
        }

        // Print previous nodes for path reconstruction
        cout << "},\"prev\":{";
        bool first = true;
        for (int i = 0; i < nodeOrder.size(); i++) {
            if (prev[nodeOrder[i]] == "") continue;
            if (!first) cout << ",";
            cout << "\"" << nodeOrder[i] << "\":\"" << prev[nodeOrder[i]] << "\"";
            first = false;
        }
        cout << "}}";
    }

    return 0;
}
