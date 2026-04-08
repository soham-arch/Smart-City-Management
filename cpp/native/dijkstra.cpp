#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <queue>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct Edge {
    std::string to;
    double weight;
};

static std::string escapeJson(const std::string& value) {
    std::string escaped;
    for (size_t i = 0; i < value.size(); ++i) {
        const char ch = value[i];
        if (ch == '\\' || ch == '"') {
            escaped.push_back('\\');
        }
        escaped.push_back(ch);
    }
    return escaped;
}

static std::vector<std::string> splitTab(const std::string& line) {
    std::vector<std::string> parts;
    std::stringstream ss(line);
    std::string part;
    while (std::getline(ss, part, '\t')) {
        parts.push_back(part);
    }
    return parts;
}

static std::string toRoundedString(double value) {
    std::ostringstream out;
    out << std::fixed << std::setprecision(1) << (std::round(value * 10.0) / 10.0);
    return out.str();
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string mode;
    std::string start;
    std::string target;
    std::string countLine;

    if (!std::getline(std::cin, mode) ||
        !std::getline(std::cin, start) ||
        !std::getline(std::cin, target) ||
        !std::getline(std::cin, countLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int edgeCount = std::atoi(countLine.c_str());
    std::unordered_map<std::string, std::vector<Edge> > graph;
    std::vector<std::string> nodeOrder;
    std::unordered_map<std::string, bool> seen;

    for (int i = 0; i < edgeCount; ++i) {
        std::string line;
        if (!std::getline(std::cin, line)) {
            std::cout << "{\"error\":\"missing edge data\"}";
            return 1;
        }

        std::vector<std::string> parts = splitTab(line);
        if (parts.size() < 3) {
            continue;
        }

        const std::string& from = parts[0];
        const std::string& to = parts[1];
        const double weight = std::atof(parts[2].c_str());

        graph[from].push_back(Edge{to, weight});
        graph[to].push_back(Edge{from, weight});

        if (!seen[from]) {
            nodeOrder.push_back(from);
            seen[from] = true;
        }
        if (!seen[to]) {
            nodeOrder.push_back(to);
            seen[to] = true;
        }
    }

    if (!seen[start]) {
        std::cout << "{\"error\":\"start node not found\"}";
        return 1;
    }

    std::unordered_map<std::string, double> dist;
    std::unordered_map<std::string, std::string> prev;
    for (size_t i = 0; i < nodeOrder.size(); ++i) {
        dist[nodeOrder[i]] = std::numeric_limits<double>::infinity();
        prev[nodeOrder[i]] = "";
    }

    typedef std::pair<double, std::string> HeapItem;
    std::priority_queue<HeapItem, std::vector<HeapItem>, std::greater<HeapItem> > pq;

    dist[start] = 0.0;
    pq.push(std::make_pair(0.0, start));

    while (!pq.empty()) {
        HeapItem item = pq.top();
        pq.pop();

        const double currentDist = item.first;
        const std::string current = item.second;

        if (currentDist > dist[current]) {
            continue;
        }

        if (mode == "single" && current == target) {
            break;
        }

        const std::vector<Edge>& neighbors = graph[current];
        for (size_t i = 0; i < neighbors.size(); ++i) {
            const Edge& edge = neighbors[i];
            const double nextDist = currentDist + edge.weight;
            if (nextDist < dist[edge.to]) {
                dist[edge.to] = nextDist;
                prev[edge.to] = current;
                pq.push(std::make_pair(nextDist, edge.to));
            }
        }
    }

    if (mode == "single") {
        if (!seen[target] || !std::isfinite(dist[target])) {
            std::cout << "{\"path\":[],\"total_distance\":-1}";
            return 0;
        }

        std::vector<std::string> path;
        std::string cursor = target;
        while (!cursor.empty()) {
            path.push_back(cursor);
            cursor = prev[cursor];
        }
        std::reverse(path.begin(), path.end());

        if (path.empty() || path.front() != start) {
            std::cout << "{\"path\":[],\"total_distance\":-1}";
            return 0;
        }

        std::cout << "{\"path\":[";
        for (size_t i = 0; i < path.size(); ++i) {
            if (i > 0) {
                std::cout << ",";
            }
            std::cout << "\"" << escapeJson(path[i]) << "\"";
        }
        std::cout << "],\"total_distance\":" << toRoundedString(dist[target]) << "}";
        return 0;
    }

    std::cout << "{\"distances\":{";
    for (size_t i = 0; i < nodeOrder.size(); ++i) {
        if (i > 0) {
            std::cout << ",";
        }
        const std::string& node = nodeOrder[i];
        std::cout << "\"" << escapeJson(node) << "\":";
        if (std::isfinite(dist[node])) {
            std::cout << toRoundedString(dist[node]);
        } else {
            std::cout << "null";
        }
    }

    std::cout << "},\"prev\":{";
    bool firstPrev = true;
    for (size_t i = 0; i < nodeOrder.size(); ++i) {
        const std::string& node = nodeOrder[i];
        if (prev[node].empty()) {
            continue;
        }
        if (!firstPrev) {
            std::cout << ",";
        }
        std::cout << "\"" << escapeJson(node) << "\":\"" << escapeJson(prev[node]) << "\"";
        firstPrev = false;
    }
    std::cout << "}}";

    return 0;
}
