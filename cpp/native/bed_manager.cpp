#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>

/*
 * bed_manager.cpp — C++ binary for hospital bed allocation
 *
 * Ensures 1 patient admitted = exactly 1 bed consumed.
 *
 * Input format (stdin, tab-separated on one line):
 *   action \t beds_total \t beds_available \t icu_beds_total \t icu_beds_available \t ward \t patient_count
 *
 * Actions:
 *   "admit"     — decrement beds for patient_count patients
 *   "discharge" — increment beds for patient_count patients
 *   "count"     — given total patients in each ward, compute available beds
 *
 * For "count" action, the format is:
 *   count \t beds_total \t icu_beds_total \t icu_patient_count \t general_patient_count
 *
 * Output (stdout, JSON):
 *   { "beds_available": N, "icu_beds_available": N, "beds_changed": N, "icu_beds_changed": N }
 */

static std::string trim(const std::string& s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    size_t end = s.find_last_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    return s.substr(start, end - start + 1);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string line;
    if (!std::getline(std::cin, line)) {
        std::cout << "{\"error\":\"no input\"}";
        return 1;
    }

    std::istringstream iss(line);
    std::string action;
    std::getline(iss, action, '\t');
    action = trim(action);

    if (action == "count") {
        // count \t beds_total \t icu_beds_total \t icu_patient_count \t general_patient_count
        std::string bt_s, ibt_s, ipc_s, gpc_s;
        std::getline(iss, bt_s, '\t');
        std::getline(iss, ibt_s, '\t');
        std::getline(iss, ipc_s, '\t');
        std::getline(iss, gpc_s, '\t');

        int beds_total = std::atoi(bt_s.c_str());
        int icu_beds_total = std::atoi(ibt_s.c_str());
        int icu_patient_count = std::atoi(ipc_s.c_str());
        int general_patient_count = std::atoi(gpc_s.c_str());

        // 1 patient = 1 bed, simple subtraction
        int icu_beds_available = std::max(0, icu_beds_total - icu_patient_count);
        int total_occupied = icu_patient_count + general_patient_count;
        int beds_available = std::max(0, beds_total - total_occupied);

        std::cout << "{\"beds_available\":" << beds_available
                  << ",\"icu_beds_available\":" << icu_beds_available
                  << ",\"beds_changed\":0"
                  << ",\"icu_beds_changed\":0"
                  << "}";
        return 0;
    }

    // admit / discharge format:
    // action \t beds_total \t beds_available \t icu_beds_total \t icu_beds_available \t ward \t patient_count
    std::string bt_s, ba_s, ibt_s, iba_s, ward, pc_s;
    std::getline(iss, bt_s, '\t');
    std::getline(iss, ba_s, '\t');
    std::getline(iss, ibt_s, '\t');
    std::getline(iss, iba_s, '\t');
    std::getline(iss, ward, '\t');
    std::getline(iss, pc_s, '\t');

    int beds_total = std::atoi(bt_s.c_str());
    int beds_available = std::atoi(ba_s.c_str());
    int icu_beds_total = std::atoi(ibt_s.c_str());
    int icu_beds_available = std::atoi(iba_s.c_str());
    ward = trim(ward);
    int patient_count = std::atoi(pc_s.c_str());
    if (patient_count <= 0) patient_count = 1;

    int beds_changed = 0;
    int icu_beds_changed = 0;

    if (action == "admit") {
        // 1 patient = 1 bed consumed
        if (ward == "icu") {
            icu_beds_changed = -patient_count;
            icu_beds_available = std::max(0, icu_beds_available - patient_count);
        }
        // All patients (ICU or general) consume from total beds pool
        beds_changed = -patient_count;
        beds_available = std::max(0, beds_available - patient_count);
    } else if (action == "discharge") {
        // 1 patient discharged = 1 bed freed
        if (ward == "icu") {
            icu_beds_changed = patient_count;
            icu_beds_available = std::min(icu_beds_total, icu_beds_available + patient_count);
        }
        beds_changed = patient_count;
        beds_available = std::min(beds_total, beds_available + patient_count);
    } else {
        std::cout << "{\"error\":\"unknown action: " << action << "\"}";
        return 1;
    }

    std::cout << "{\"beds_available\":" << beds_available
              << ",\"icu_beds_available\":" << icu_beds_available
              << ",\"beds_changed\":" << beds_changed
              << ",\"icu_beds_changed\":" << icu_beds_changed
              << "}";

    return 0;
}
