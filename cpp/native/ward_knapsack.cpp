/*
 * ward_knapsack.cpp — ICU Ward Allocation using 0/1 Knapsack
 *
 * Decides which patients should be in ICU vs General ward.
 * Uses 0/1 Knapsack DP where profit = effective severity, weight = resource weight.
 *
 * Input (stdin):  Line 1: resource_capacity (icu_beds_total * 2)
 *                 Lines 2+: id\tinjury_type\tseverity\tward (tab-separated)
 * Output (stdout): JSON with icu_admitted[], general_ward[], dp_table_snapshot
 *
 * Algorithm: 0/1 Knapsack DP — O(n * capacity)
 * Compiled to: server/bin/native_ward_knapsack.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <map>

using namespace std;

// Injury type lookup table
struct InjuryType {
    string name;
    int healing_days;
    int resource_weight;
    int severity_bonus;
};

map<string, InjuryType> injuryTypes = {
    {"cardiac", {"cardiac", 7, 3, 3}},
    {"trauma",  {"trauma",  5, 2, 2}},
    {"stroke",  {"stroke",  6, 3, 3}},
    {"burn",    {"burn",    8, 2, 1}},
    {"accident",{"accident",5, 2, 2}},
    {"other",   {"other",   3, 1, 0}}
};

struct Patient {
    string id;
    string injury_type;
    int severity;
    string ward;
    int effective_severity; // profit for knapsack
    int resource_weight;    // weight for knapsack
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string capLine;
    if (!getline(cin, capLine)) {
        cout << "{\"error\":\"no input\"}";
        return 1;
    }

    int capacity = atoi(capLine.c_str());
    if (capacity <= 0) capacity = 16;

    // Read patients
    vector<Patient> patients;
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;

        stringstream ss(line);
        string id, injury, sevStr, ward;
        getline(ss, id, '\t');
        getline(ss, injury, '\t');
        getline(ss, sevStr, '\t');
        getline(ss, ward, '\t');

        int severity = atoi(sevStr.c_str());

        // Look up injury type for bonus and weight
        int bonus = 0, weight = 1;
        if (injuryTypes.count(injury)) {
            bonus = injuryTypes[injury].severity_bonus;
            weight = injuryTypes[injury].resource_weight;
        }

        int effective = min(10, severity + bonus);
        patients.push_back({id, injury, severity, ward, effective, weight});
    }

    int n = patients.size();
    if (n == 0) {
        cout << "{\"icu_admitted\":[],\"general_ward\":[],\"dp_table_snapshot\":[]}";
        return 0;
    }

    // 0/1 Knapsack DP
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];
            if (patients[i - 1].resource_weight <= w) {
                int takeIt = dp[i - 1][w - patients[i - 1].resource_weight] + patients[i - 1].effective_severity;
                dp[i][w] = max(dp[i][w], takeIt);
            }
        }
    }

    // Backtrack: find which patients go to ICU
    vector<bool> inICU(n, false);
    int remaining = capacity;
    for (int i = n; i > 0; i--) {
        if (dp[i][remaining] != dp[i - 1][remaining]) {
            inICU[i - 1] = true;
            remaining -= patients[i - 1].resource_weight;
        }
    }

    // Build output
    cout << "{\"icu_admitted\":[";
    bool first = true;
    for (int i = 0; i < n; i++) {
        if (!inICU[i]) continue;
        if (!first) cout << ",";
        cout << "{\"id\":\"" << patients[i].id
             << "\",\"injury_type\":\"" << patients[i].injury_type
             << "\",\"severity\":" << patients[i].severity
             << ",\"effective_severity\":" << patients[i].effective_severity
             << ",\"resource_weight\":" << patients[i].resource_weight << "}";
        first = false;
    }

    cout << "],\"general_ward\":[";
    first = true;
    for (int i = 0; i < n; i++) {
        if (inICU[i]) continue;
        if (!first) cout << ",";
        cout << "{\"id\":\"" << patients[i].id
             << "\",\"injury_type\":\"" << patients[i].injury_type
             << "\",\"severity\":" << patients[i].severity << "}";
        first = false;
    }

    // DP table snapshot (first 5 rows for display)
    cout << "],\"dp_table_snapshot\":[";
    int showRows = min(n, 5);
    for (int i = 0; i <= showRows; i++) {
        if (i > 0) cout << ",";
        cout << "[";
        int showCols = min(capacity, 10);
        for (int w = 0; w <= showCols; w++) {
            if (w > 0) cout << ",";
            cout << dp[i][w];
        }
        cout << "]";
    }
    cout << "]}";

    return 0;
}
