#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <queue>
#include <map>
#include <ctime>
#include <algorithm>

using namespace std;

// Hardcoded crime type base priorities
static map<string, int> crimeTypeBase = {
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
    int heap_position;
};

int computeCrimePriority(const string& crime_type, int severity, long reported_at) {
    int base = 1;
    auto it = crimeTypeBase.find(crime_type);
    if (it != crimeTypeBase.end()) {
        base = it->second;
    }
    long now = (long)time(NULL);
    int time_bonus = max(0, (int)((now - reported_at) / 60));
    return min(10, base + (severity / 3) + min(time_bonus, 3));
}

// Comparator for max-heap
struct CrimeComparator {
    bool operator()(const Crime& a, const Crime& b) {
        if (a.priority_score != b.priority_score)
            return a.priority_score < b.priority_score; // max-heap
        return a.reported_at > b.reported_at; // older first on tie
    }
};

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

    vector<Crime> crimes(n);
    for (int i = 0; i < n; i++) {
        string line;
        if (!getline(cin, line)) break;

        // Parse: crime_id TAB crime_type TAB severity TAB units_needed TAB reported_at_unix
        stringstream ss(line);
        string token;

        getline(ss, crimes[i].crime_id, '\t');
        getline(ss, crimes[i].crime_type, '\t');

        getline(ss, token, '\t');
        crimes[i].severity = atoi(token.c_str());

        getline(ss, token, '\t');
        crimes[i].units_needed = atoi(token.c_str());

        getline(ss, token, '\t');
        crimes[i].reported_at = atol(token.c_str());

        crimes[i].priority_score = computeCrimePriority(
            crimes[i].crime_type,
            crimes[i].severity,
            crimes[i].reported_at
        );
    }

    // Build max-heap manually to track insertion steps for the LAST inserted crime
    // We'll use a vector-based heap to track positions
    vector<Crime> heap;
    vector<string> steps_json; // heap insertion steps for the last crime

    for (int i = 0; i < n; i++) {
        heap.push_back(crimes[i]);
        int pos = (int)heap.size() - 1;

        // Track steps only for the last inserted crime
        vector<pair<int,int>> swaps; // (from_pos, to_pos)

        // Bubble up
        int step_count = 0;
        while (pos > 0) {
            int parent = (pos - 1) / 2;
            if (heap[pos].priority_score > heap[parent].priority_score ||
                (heap[pos].priority_score == heap[parent].priority_score &&
                 heap[pos].reported_at < heap[parent].reported_at)) {
                swaps.push_back(make_pair(pos, parent));
                swap(heap[pos], heap[parent]);
                pos = parent;
                step_count++;
            } else {
                break;
            }
        }

        // Only record steps for the last inserted crime
        if (i == n - 1) {
            int initial_pos = (int)heap.size() - 1;

            // Step 1: insert
            stringstream s1;
            s1 << "{\"step\":1,\"action\":\"insert\",\"crime_id\":\""
               << crimes[i].crime_id << "\",\"position\":" << initial_pos
               << ",\"swapped_with\":null}";
            steps_json.push_back(s1.str());

            // Bubble-up steps
            int step_num = 2;
            for (size_t j = 0; j < swaps.size(); j++) {
                stringstream sn;
                sn << "{\"step\":" << step_num
                   << ",\"action\":\"bubble_up\",\"crime_id\":\""
                   << crimes[i].crime_id << "\",\"position\":"
                   << swaps[j].second << ",\"swapped_with\":"
                   << swaps[j].first << "}";
                steps_json.push_back(sn.str());
                step_num++;
            }
        }
    }

    // Sort by priority_score descending for output
    vector<Crime> sorted_crimes = heap;
    sort(sorted_crimes.begin(), sorted_crimes.end(), [](const Crime& a, const Crime& b) {
        if (a.priority_score != b.priority_score)
            return a.priority_score > b.priority_score;
        return a.reported_at < b.reported_at;
    });

    // Build JSON output
    cout << "{\"sorted_queue\":[";
    for (size_t i = 0; i < sorted_crimes.size(); i++) {
        if (i > 0) cout << ",";
        cout << "{\"crime_id\":\"" << sorted_crimes[i].crime_id
             << "\",\"crime_type\":\"" << sorted_crimes[i].crime_type
             << "\",\"priority_score\":" << sorted_crimes[i].priority_score
             << ",\"severity\":" << sorted_crimes[i].severity
             << ",\"units_needed\":" << sorted_crimes[i].units_needed
             << ",\"heap_position\":" << i << "}";
    }
    cout << "],\"heap_insertion_steps\":[";
    for (size_t i = 0; i < steps_json.size(); i++) {
        if (i > 0) cout << ",";
        cout << steps_json[i];
    }
    cout << "],\"total_pending\":" << n << "}";

    return 0;
}
