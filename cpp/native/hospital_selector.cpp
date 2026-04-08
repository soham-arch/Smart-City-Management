#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

/*
 * hospital_selector.cpp — C++ binary for selecting the best hospital
 *
 * Uses a distance-weighted composite scoring formula to pick the optimal
 * hospital from a set of candidates (output of knapsack).
 *
 * Input (stdin):
 *   Line 1: <count> — number of candidate hospitals
 *   Line 2: <selected_ids_csv> — comma-separated IDs from knapsack selection (or "none")
 *   Lines 3..N+2: <id>\t<name>\t<distance>\t<value>\t<beds_available>\t<icu_beds_available>
 *
 * Output (stdout, JSON):
 *   { "selected_id": "...", "selected_name": "...", "score": 123.5, "distance": 4.2 }
 */

struct Hospital {
    std::string id;
    std::string name;
    double distance;
    int value;
    int beds_available;
    int icu_beds_available;
    bool in_knapsack_selection;
};

static std::string escapeJson(const std::string& s) {
    std::string out;
    for (size_t i = 0; i < s.size(); ++i) {
        char c = s[i];
        if (c == '\\' || c == '"') out.push_back('\\');
        out.push_back(c);
    }
    return out;
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

static std::vector<std::string> splitComma(const std::string& s) {
    std::vector<std::string> parts;
    std::stringstream ss(s);
    std::string part;
    while (std::getline(ss, part, ',')) {
        // Trim whitespace
        size_t start = part.find_first_not_of(" \t");
        size_t end = part.find_last_not_of(" \t");
        if (start != std::string::npos) {
            parts.push_back(part.substr(start, end - start + 1));
        }
    }
    return parts;
}

static std::string toFixed1(double v) {
    std::ostringstream out;
    out << std::fixed << std::setprecision(1) << v;
    return out.str();
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string countLine, selectedIdsLine;
    if (!std::getline(std::cin, countLine) || !std::getline(std::cin, selectedIdsLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int count = std::atoi(countLine.c_str());
    std::vector<std::string> selectedIds = splitComma(selectedIdsLine);

    // Build a set of selected IDs for quick lookup
    std::vector<Hospital> hospitals;

    for (int i = 0; i < count; i++) {
        std::string line;
        if (!std::getline(std::cin, line)) break;
        std::vector<std::string> parts = splitTab(line);
        if (parts.size() < 6) continue;

        Hospital h;
        h.id = parts[0];
        h.name = parts[1];
        h.distance = std::atof(parts[2].c_str());
        h.value = std::atoi(parts[3].c_str());
        h.beds_available = std::atoi(parts[4].c_str());
        h.icu_beds_available = std::atoi(parts[5].c_str());
        h.in_knapsack_selection = false;

        for (size_t s = 0; s < selectedIds.size(); s++) {
            if (selectedIds[s] == h.id) {
                h.in_knapsack_selection = true;
                break;
            }
        }

        hospitals.push_back(h);
    }

    if (hospitals.empty()) {
        std::cout << "{\"error\":\"no hospitals\"}";
        return 1;
    }

    // Filter to knapsack-selected hospitals if any exist
    std::vector<Hospital*> pool;
    for (size_t i = 0; i < hospitals.size(); i++) {
        if (hospitals[i].in_knapsack_selection) {
            pool.push_back(&hospitals[i]);
        }
    }
    // If no knapsack matches, use all
    if (pool.empty()) {
        for (size_t i = 0; i < hospitals.size(); i++) {
            pool.push_back(&hospitals[i]);
        }
    }

    // Score: value / max(distance, 0.1), tiebreaker: closer first
    Hospital* best = pool[0];
    double bestScore = best->value / std::max(best->distance, 0.1);

    for (size_t i = 1; i < pool.size(); i++) {
        double score = pool[i]->value / std::max(pool[i]->distance, 0.1);
        if (score - bestScore > 0.01) {
            best = pool[i];
            bestScore = score;
        } else if (std::abs(score - bestScore) <= 0.01 && pool[i]->distance < best->distance) {
            best = pool[i];
            bestScore = score;
        }
    }

    std::cout << "{\"selected_id\":\"" << escapeJson(best->id)
              << "\",\"selected_name\":\"" << escapeJson(best->name)
              << "\",\"score\":" << toFixed1(bestScore)
              << ",\"distance\":" << toFixed1(best->distance)
              << "}";

    return 0;
}
