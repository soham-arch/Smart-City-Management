/*
 * bed_manager.cpp — Hospital Bed Allocation
 *
 * Ensures 1 patient admitted = exactly 1 bed consumed.
 *
 * Actions:
 *   "admit"     — decrement beds for patient_count patients
 *   "discharge" — increment beds for patient_count patients
 *   "count"     — given patient counts, compute available beds
 *
 * Input format: action\t...fields (tab-separated, single line)
 * Output: JSON { beds_available, icu_beds_available, beds_changed, icu_beds_changed }
 *
 * Compiled to: server/bin/native_bed_manager.exe
 */
#include <iostream>
#include <sstream>
#include <string>
#include <algorithm>
#include <cstdlib>

using namespace std;

// Remove leading/trailing whitespace
string trim(string s) {
    int start = s.find_first_not_of(" \t\r\n");
    int end = s.find_last_not_of(" \t\r\n");
    if (start == string::npos) return "";
    return s.substr(start, end - start + 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    string line;
    if (!getline(cin, line)) {
        cout << "{\"error\":\"no input\"}";
        return 1;
    }

    stringstream iss(line);
    string action;
    getline(iss, action, '\t');
    action = trim(action);

    if (action == "count") {
        // count \t beds_total \t icu_beds_total \t icu_patient_count \t general_patient_count
        string bt, ibt, ipc, gpc;
        getline(iss, bt, '\t');
        getline(iss, ibt, '\t');
        getline(iss, ipc, '\t');
        getline(iss, gpc, '\t');

        int beds_total = atoi(bt.c_str());
        int icu_beds_total = atoi(ibt.c_str());
        int icu_patients = atoi(ipc.c_str());
        int general_patients = atoi(gpc.c_str());

        // 1 patient = 1 bed
        int icu_available = max(0, icu_beds_total - icu_patients);
        int beds_available = max(0, beds_total - icu_patients - general_patients);

        cout << "{\"beds_available\":" << beds_available
             << ",\"icu_beds_available\":" << icu_available
             << ",\"beds_changed\":0"
             << ",\"icu_beds_changed\":0}";
        return 0;
    }

    // admit / discharge: action \t beds_total \t beds_available \t icu_total \t icu_available \t ward \t count
    string bt, ba, ibt, iba, ward, pc;
    getline(iss, bt, '\t');
    getline(iss, ba, '\t');
    getline(iss, ibt, '\t');
    getline(iss, iba, '\t');
    getline(iss, ward, '\t');
    getline(iss, pc, '\t');

    int beds_total = atoi(bt.c_str());
    int beds_available = atoi(ba.c_str());
    int icu_beds_total = atoi(ibt.c_str());
    int icu_beds_available = atoi(iba.c_str());
    ward = trim(ward);
    int patient_count = atoi(pc.c_str());
    if (patient_count <= 0) patient_count = 1;

    int beds_changed = 0, icu_beds_changed = 0;

    if (action == "admit") {
        // 1 patient = 1 bed consumed
        if (ward == "icu") {
            icu_beds_changed = -patient_count;
            icu_beds_available = max(0, icu_beds_available - patient_count);
        }
        beds_changed = -patient_count;
        beds_available = max(0, beds_available - patient_count);

    } else if (action == "discharge") {
        // 1 patient discharged = 1 bed freed
        if (ward == "icu") {
            icu_beds_changed = patient_count;
            icu_beds_available = min(icu_beds_total, icu_beds_available + patient_count);
        }
        beds_changed = patient_count;
        beds_available = min(beds_total, beds_available + patient_count);

    } else {
        cout << "{\"error\":\"unknown action: " << action << "\"}";
        return 1;
    }

    cout << "{\"beds_available\":" << beds_available
         << ",\"icu_beds_available\":" << icu_beds_available
         << ",\"beds_changed\":" << beds_changed
         << ",\"icu_beds_changed\":" << icu_beds_changed << "}";

    return 0;
}
