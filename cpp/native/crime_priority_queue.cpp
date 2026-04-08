/*
 * crime_priority_queue.cpp — Max-Heap Crime Priority Queue
 *
 * Manages a priority queue of reported crimes using a max-heap.
 * Tracks heap insertion steps (bubble-up swaps) for frontend visualization.
 *
 * Input (stdin):  Line 1: count
 *                 Lines 2+: crime_id\tcrime_type\tseverity\tunits_needed\treported_at_unix
 * Output (stdout): JSON with sorted_queue[], heap_insertion_steps[], total_pending
 *
 * Algorithm: Manual max-heap with bubble-up tracking — O(n log n)
 * Compiled to: server/bin/native_crime_priority_queue.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <ctime>
#include <cstdlib>

using namespace std;

// Base priority for each crime type
map<string, int> crimeTypeBase = {
    {"murder_assault",   10},
    {"robbery",          9},
    {"hit_and_run",      8},
    {"burglary",         7},
    {"accident",         6},
    {"domestic_dispute", 5},
    {"theft_reported",   3},
    {"noise_complaint",  1}
};

struct Crime {
    string crime_id;
    string crime_type;
    int severity;
    int units_needed;
    long reported_at;
    int priority_score;
};

// Compute priority from type + severity + time since report
int computePriority(string crime_type, int severity, long reported_at) {
    int base = 1;
    if (crimeTypeBase.count(crime_type))
        base = crimeTypeBase[crime_type];

    long now = (long)time(NULL);
    int time_bonus = max(0, (int)((now - reported_at) / 60));
    return min(10, base + (severity / 3) + min(time_bonus, 3));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string nLine;
    if (!getline(cin, nLine)) {
        cout << "{\"error\":\"no input\"}";
        return 1;
    }

    int n = atoi(nLine.c_str());
    if (n <= 0) {
        cout << "{\"sorted_queue\":[],\"heap_insertion_steps\":[],\"total_pending\":0}";
        return 0;
    }

    // Read all crimes
    vector<Crime> crimes(n);
    for (int i = 0; i < n; i++) {
        string line;
        if (!getline(cin, line)) break;

        stringstream ss(line);
        string id, type, sevStr, unitsStr, timeStr;
        getline(ss, id, '\t');
        getline(ss, type, '\t');
        getline(ss, sevStr, '\t');
        getline(ss, unitsStr, '\t');
        getline(ss, timeStr, '\t');

        crimes[i].crime_id = id;
        crimes[i].crime_type = type;
        crimes[i].severity = atoi(sevStr.c_str());
        crimes[i].units_needed = atoi(unitsStr.c_str());
        crimes[i].reported_at = atol(timeStr.c_str());
        crimes[i].priority_score = computePriority(type, crimes[i].severity, crimes[i].reported_at);
    }

    // Build max-heap manually, tracking insertion steps for the LAST crime
    vector<Crime> heap;
    vector<string> steps_json;

    for (int i = 0; i < n; i++) {
        heap.push_back(crimes[i]);
        int pos = heap.size() - 1;

        // Track swaps for visualization
        vector<pair<int, int>> swaps;

        // Bubble up (max-heap: higher priority goes up)
        while (pos > 0) {
            int parent = (pos - 1) / 2;
            if (heap[pos].priority_score > heap[parent].priority_score ||
                (heap[pos].priority_score == heap[parent].priority_score &&
                 heap[pos].reported_at < heap[parent].reported_at)) {
                swaps.push_back({pos, parent});
                swap(heap[pos], heap[parent]);
                pos = parent;
            } else {
                break;
            }
        }

        // Only record steps for the last inserted crime (for animation)
        if (i == n - 1) {
            int initialPos = heap.size() - 1;

            // Step 1: insert at bottom
            stringstream s1;
            s1 << "{\"step\":1,\"action\":\"insert\",\"crime_id\":\""
               << crimes[i].crime_id << "\",\"position\":" << initialPos
               << ",\"swapped_with\":null}";
            steps_json.push_back(s1.str());

            // Bubble-up steps
            int stepNum = 2;
            for (int j = 0; j < swaps.size(); j++) {
                stringstream sn;
                sn << "{\"step\":" << stepNum
                   << ",\"action\":\"bubble_up\",\"crime_id\":\""
                   << crimes[i].crime_id << "\",\"position\":"
                   << swaps[j].second << ",\"swapped_with\":"
                   << swaps[j].first << "}";
                steps_json.push_back(sn.str());
                stepNum++;
            }
        }
    }

    // Sort by priority descending for display
    vector<Crime> sorted_crimes = heap;
    sort(sorted_crimes.begin(), sorted_crimes.end(), [](const Crime& a, const Crime& b) {
        if (a.priority_score != b.priority_score)
            return a.priority_score > b.priority_score;
        return a.reported_at < b.reported_at;
    });

    // Output JSON
    cout << "{\"sorted_queue\":[";
    for (int i = 0; i < sorted_crimes.size(); i++) {
        if (i > 0) cout << ",";
        cout << "{\"crime_id\":\"" << sorted_crimes[i].crime_id
             << "\",\"crime_type\":\"" << sorted_crimes[i].crime_type
             << "\",\"priority_score\":" << sorted_crimes[i].priority_score
             << ",\"severity\":" << sorted_crimes[i].severity
             << ",\"units_needed\":" << sorted_crimes[i].units_needed
             << ",\"heap_position\":" << i << "}";
    }

    cout << "],\"heap_insertion_steps\":[";
    for (int i = 0; i < steps_json.size(); i++) {
        if (i > 0) cout << ",";
        cout << steps_json[i];
    }

    cout << "],\"total_pending\":" << n << "}";
    return 0;
}
