/*
 * hospital_selector.cpp — Best Hospital Selection
 *
 * Picks the optimal hospital from knapsack-selected candidates
 * using a distance-weighted scoring formula: score = value / distance.
 *
 * Input (stdin):  Line 1: count
 *                 Line 2: selected_ids (comma-separated from knapsack, or "none")
 *                 Lines 3+: id\tname\tdistance\tvalue\tbeds\ticu_beds (tab-separated)
 * Output (stdout): JSON { selected_id, selected_name, score, distance }
 *
 * Compiled to: server/bin/native_hospital_selector.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cstdlib>
#include <cmath>
#include <iomanip>

using namespace std;

struct Hospital {
    string id;
    string name;
    double distance;
    int value;
    int beds_available;
    int icu_beds_available;
    bool in_knapsack;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string countLine, selectedLine;
    if (!getline(cin, countLine) || !getline(cin, selectedLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int count = atoi(countLine.c_str());

    // Parse comma-separated selected IDs from knapsack
    vector<string> selectedIds;
    stringstream idStream(selectedLine);
    string idToken;
    while (getline(idStream, idToken, ',')) {
        // Trim whitespace
        int s = idToken.find_first_not_of(" \t");
        int e = idToken.find_last_not_of(" \t");
        if (s != string::npos)
            selectedIds.push_back(idToken.substr(s, e - s + 1));
    }

    // Read hospitals
    vector<Hospital> hospitals;
    for (int i = 0; i < count; i++) {
        string line;
        if (!getline(cin, line)) break;

        stringstream ss(line);
        string id, name, distStr, valStr, bedsStr, icuStr;
        getline(ss, id, '\t');
        getline(ss, name, '\t');
        getline(ss, distStr, '\t');
        getline(ss, valStr, '\t');
        getline(ss, bedsStr, '\t');
        getline(ss, icuStr, '\t');

        // Check if this hospital was selected by knapsack
        bool selected = false;
        for (int j = 0; j < selectedIds.size(); j++) {
            if (selectedIds[j] == id) { selected = true; break; }
        }

        hospitals.push_back({id, name, atof(distStr.c_str()),
                            atoi(valStr.c_str()), atoi(bedsStr.c_str()),
                            atoi(icuStr.c_str()), selected});
    }

    if (hospitals.empty()) {
        cout << "{\"error\":\"no hospitals\"}";
        return 1;
    }

    // Filter to knapsack-selected hospitals (fallback to all if none selected)
    vector<Hospital*> pool;
    for (int i = 0; i < hospitals.size(); i++) {
        if (hospitals[i].in_knapsack) pool.push_back(&hospitals[i]);
    }
    if (pool.empty()) {
        for (int i = 0; i < hospitals.size(); i++) pool.push_back(&hospitals[i]);
    }

    // Score = value / distance — higher is better
    Hospital* best = pool[0];
    double bestScore = best->value / max(best->distance, 0.1);

    for (int i = 1; i < pool.size(); i++) {
        double score = pool[i]->value / max(pool[i]->distance, 0.1);
        if (score > bestScore + 0.01) {
            best = pool[i];
            bestScore = score;
        } else if (abs(score - bestScore) <= 0.01 && pool[i]->distance < best->distance) {
            best = pool[i];
            bestScore = score;
        }
    }

    cout << fixed << setprecision(1);
    cout << "{\"selected_id\":\"" << best->id
         << "\",\"selected_name\":\"" << best->name
         << "\",\"score\":" << bestScore
         << ",\"distance\":" << best->distance << "}";

    return 0;
}
