#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <string>

static int computePriority(const std::string& type, int severity) {
    int base = severity;
    if (type == "fire") {
        base += 3;
    } else if (type == "ambulance") {
        base += 2;
    } else if (type == "police") {
        base += 1;
    }
    return std::min(base, 10);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::string type;
    std::string severityLine;

    if (!std::getline(std::cin, type) || !std::getline(std::cin, severityLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    const int severity = std::atoi(severityLine.c_str());
    std::cout << "{\"priority_score\":" << computePriority(type, severity) << "}";
    return 0;
}
