/*
 * priority.cpp — Emergency Priority Score Calculator
 *
 * Computes a priority score for an incident based on type and severity.
 * Fire gets +3, ambulance +2, police +1.
 *
 * Input (stdin):  Line 1: type (fire/ambulance/police)
 *                 Line 2: severity (1-10)
 * Output (stdout): JSON { "priority_score": N }
 *
 * Algorithm: Simple weighted scoring — O(1)
 * Compiled to: server/bin/native_priority.exe
 */
#include <iostream>
#include <string>
#include <algorithm>
#include <cstdlib>

using namespace std;

int computePriority(string type, int severity) {
    int base = severity;
    if (type == "fire")        base += 3;
    else if (type == "ambulance") base += 2;
    else if (type == "police")    base += 1;
    return min(base, 10);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string type, severityLine;
    if (!getline(cin, type) || !getline(cin, severityLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int severity = atoi(severityLine.c_str());
    cout << "{\"priority_score\":" << computePriority(type, severity) << "}";

    return 0;
}
