/*
 * sorting.cpp — Merge Sort for Distance-Based Sorting
 *
 * Sorts hospital/station candidates by distance from the incident.
 *
 * Input (stdin):  Line 1: count
 *                 Lines 2+: id\tname\tdistance (tab-separated)
 * Output (stdout): JSON with sorted_ids[] and ordered[] array
 *
 * Algorithm: Merge Sort — O(n log n), stable sort
 * Compiled to: server/bin/native_sorting.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <cstdlib>

using namespace std;

struct Candidate {
    string id;
    string name;
    double distance;
};

// Merge sort implementation
void merge(vector<Candidate>& arr, int left, int mid, int right) {
    vector<Candidate> temp;
    int i = left, j = mid + 1;

    while (i <= mid && j <= right) {
        if (arr[i].distance <= arr[j].distance)
            temp.push_back(arr[i++]);
        else
            temp.push_back(arr[j++]);
    }
    while (i <= mid) temp.push_back(arr[i++]);
    while (j <= right) temp.push_back(arr[j++]);

    for (int k = 0; k < temp.size(); k++)
        arr[left + k] = temp[k];
}

void mergeSort(vector<Candidate>& arr, int left, int right) {
    if (left >= right) return;
    int mid = (left + right) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string countLine;
    if (!getline(cin, countLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int count = atoi(countLine.c_str());

    // Read candidates (tab-separated: id \t name \t distance)
    vector<Candidate> candidates;
    for (int i = 0; i < count; i++) {
        string line;
        if (!getline(cin, line)) break;

        stringstream ss(line);
        string id, name, dStr;
        getline(ss, id, '\t');
        getline(ss, name, '\t');
        getline(ss, dStr, '\t');

        candidates.push_back({id, name, atof(dStr.c_str())});
    }

    // Sort by distance using merge sort
    if (candidates.size() > 1)
        mergeSort(candidates, 0, candidates.size() - 1);

    // Output JSON
    cout << fixed << setprecision(1);

    cout << "{\"sorted_ids\":[";
    for (int i = 0; i < candidates.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\"" << candidates[i].id << "\"";
    }

    cout << "],\"ordered\":[";
    for (int i = 0; i < candidates.size(); i++) {
        if (i > 0) cout << ",";
        cout << "{\"id\":\"" << candidates[i].id
             << "\",\"name\":\"" << candidates[i].name
             << "\",\"distance\":" << candidates[i].distance << "}";
    }
    cout << "]}";

    return 0;
}
