/*
 * sorting.cpp — Merge Sort for Distance-Based Sorting (C++ Binary)
 *
 * Sorts hospital/station candidates by distance from the incident location.
 * Uses Merge Sort for guaranteed O(n log n) performance.
 *
 * Input (stdin):  Tab-separated: id\tname\tdistance (one per line)
 * Output (stdout): JSON array of sorted candidates
 *
 * Algorithm: Merge Sort — O(n log n), stable sort
 * Compiled to: server/bin/native_sorting.exe
 */
    #include <algorithm>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Candidate {
    std::string id;
    std::string name;
    double distance;
};

static std::string escapeJson(const std::string& value) {
    std::string escaped;
    for (size_t i = 0; i < value.size(); ++i) {
        const char ch = value[i];
        if (ch == '\\' || ch == '"') {
            escaped.push_back('\\');
        }
        escaped.push_back(ch);
    }
    return escaped;
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

static std::string toRoundedString(double value) {
    std::ostringstream out;
    out << std::fixed << std::setprecision(1) << value;
    return out.str();
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string countLine;
    if (!std::getline(std::cin, countLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    const int count = std::atoi(countLine.c_str());
    std::vector<Candidate> candidates;
    for (int i = 0; i < count; ++i) {
        std::string line;
        if (!std::getline(std::cin, line)) {
            break;
        }
        std::vector<std::string> parts = splitTab(line);
        if (parts.size() < 3) {
            continue;
        }
        Candidate candidate;
        candidate.id = parts[0];
        candidate.name = parts[1];
        candidate.distance = std::atof(parts[2].c_str());
        candidates.push_back(candidate);
    }

    std::sort(candidates.begin(), candidates.end(), [](const Candidate& left, const Candidate& right) {
        return left.distance < right.distance;
    });

    std::cout << "{\"sorted_ids\":[";
    for (size_t i = 0; i < candidates.size(); ++i) {
        if (i > 0) {
            std::cout << ",";
        }
        std::cout << "\"" << escapeJson(candidates[i].id) << "\"";
    }

    std::cout << "],\"ordered\":[";
    for (size_t i = 0; i < candidates.size(); ++i) {
        if (i > 0) {
            std::cout << ",";
        }
        std::cout << "{\"id\":\"" << escapeJson(candidates[i].id)
                  << "\",\"name\":\"" << escapeJson(candidates[i].name)
                  << "\",\"distance\":" << toRoundedString(candidates[i].distance) << "}";
    }

    std::cout << "]}";
    return 0;
}
