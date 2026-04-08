/*
 * knapsack.cpp — 0/1 Knapsack Dynamic Programming
 *
 * Selects the optimal subset of hospitals/stations that maximize value
 * (beds, resources) while staying within a weight budget (distance).
 *
 * Input (stdin):  Line 1: capacity (max weight)
 *                 Line 2: item count
 *                 Lines 3+: id\tname\tweight\tvalue (tab-separated)
 * Output (stdout): JSON with selected_ids, selected_names, total_value
 *
 * Algorithm: Classic 0/1 Knapsack DP with backtracking — O(n * capacity)
 * Compiled to: server/bin/native_knapsack.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cstdlib>

using namespace std;

// Item struct to store hospital/station info
struct Item {
    string id;
    string name;
    int weight;
    int value;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    // Read capacity and item count
    string capacityLine, countLine;
    if (!getline(cin, capacityLine) || !getline(cin, countLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int capacity = atoi(capacityLine.c_str());
    int itemCount = atoi(countLine.c_str());

    // Read items (tab-separated: id \t name \t weight \t value)
    vector<Item> items;
    for (int i = 0; i < itemCount; i++) {
        string line;
        if (!getline(cin, line)) break;

        stringstream ss(line);
        string id, name, wStr, vStr;
        getline(ss, id, '\t');
        getline(ss, name, '\t');
        getline(ss, wStr, '\t');
        getline(ss, vStr, '\t');

        items.push_back({id, name, atoi(wStr.c_str()), atoi(vStr.c_str())});
    }

    int n = items.size();

    // DP table: dp[i][j] = max value using first i items with capacity j
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w]; // don't take item i
            if (items[i - 1].weight <= w) {
                int takeIt = dp[i - 1][w - items[i - 1].weight] + items[i - 1].value;
                dp[i][w] = max(dp[i][w], takeIt);
            }
        }
    }

    // Backtrack to find which items were selected
    vector<Item> selected;
    int remaining = capacity;
    for (int i = n; i > 0; i--) {
        if (dp[i][remaining] != dp[i - 1][remaining]) {
            selected.push_back(items[i - 1]);
            remaining -= items[i - 1].weight;
        }
    }
    reverse(selected.begin(), selected.end());

    // Output JSON
    cout << "{\"selected_ids\":[";
    for (int i = 0; i < selected.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\"" << selected[i].id << "\"";
    }

    cout << "],\"selected_names\":[";
    for (int i = 0; i < selected.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\"" << selected[i].name << "\"";
    }

    cout << "],\"total_value\":" << dp[n][capacity] << "}";
    return 0;
}
