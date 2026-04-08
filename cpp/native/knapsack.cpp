/*
 * knapsack.cpp — 0/1 Knapsack Dynamic Programming (C++ Binary)
 *
 * Selects the optimal subset of hospitals/stations that maximize value
 * (beds, resources) while staying within a weight budget (distance).
 *
 * Input (stdin):  Line 1: <capacity>
 *                 Line 2+: id\tname\tweight\tvalue (tab-separated, one item per line)
 * Output (stdout): JSON with selected_ids, total_value, total_weight, dp_table
 *
 * Algorithm: Classic 0/1 Knapsack DP with backtracking — O(n * capacity)
 * Compiled to: server/bin/native_knapsack.exe
 */
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Item {
    std::string id;
    std::string name;
    int weight;
    int value;
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

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string capacityLine;
    std::string countLine;

    if (!std::getline(std::cin, capacityLine) || !std::getline(std::cin, countLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    const int capacity = std::atoi(capacityLine.c_str());
    const int itemCount = std::atoi(countLine.c_str());

    std::vector<Item> items;
    for (int i = 0; i < itemCount; ++i) {
        std::string line;
        if (!std::getline(std::cin, line)) {
            break;
        }
        std::vector<std::string> parts = splitTab(line);
        if (parts.size() < 4) {
            continue;
        }
        Item item;
        item.id = parts[0];
        item.name = parts[1];
        item.weight = std::atoi(parts[2].c_str());
        item.value = std::atoi(parts[3].c_str());
        items.push_back(item);
    }

    const int n = static_cast<int>(items.size());
    std::vector<std::vector<int> > dp(n + 1, std::vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; ++i) {
        for (int w = 0; w <= capacity; ++w) {
            dp[i][w] = dp[i - 1][w];
            if (items[i - 1].weight <= w) {
                const int candidate = dp[i - 1][w - items[i - 1].weight] + items[i - 1].value;
                if (candidate > dp[i][w]) {
                    dp[i][w] = candidate;
                }
            }
        }
    }

    std::vector<Item> selected;
    int remaining = capacity;
    for (int i = n; i > 0; --i) {
        if (dp[i][remaining] != dp[i - 1][remaining]) {
            selected.push_back(items[i - 1]);
            remaining -= items[i - 1].weight;
        }
    }
    std::reverse(selected.begin(), selected.end());

    std::cout << "{\"selected_ids\":[";
    for (size_t i = 0; i < selected.size(); ++i) {
        if (i > 0) {
            std::cout << ",";
        }
        std::cout << "\"" << escapeJson(selected[i].id) << "\"";
    }

    std::cout << "],\"selected_names\":[";
    for (size_t i = 0; i < selected.size(); ++i) {
        if (i > 0) {
            std::cout << ",";
        }
        std::cout << "\"" << escapeJson(selected[i].name) << "\"";
    }

    std::cout << "],\"total_value\":" << dp[n][capacity] << "}";
    return 0;
}
