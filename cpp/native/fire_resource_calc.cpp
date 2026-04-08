#include <cmath>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>

/*
 * fire_resource_calc.cpp — C++ binary for fire resource computation
 *
 * Determines the recommended fire resources based on fire intensity
 * and building type.
 *
 * Input (stdin):
 *   Line 1: <intensity>       (integer 1-10)
 *   Line 2: <building_type>   ("residential", "commercial", "industrial", etc.)
 *
 * Output (stdout, JSON):
 *   { "trucks": N, "firefighters": N, "tankers": N, "spreadRadius": N }
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

    std::string intensityLine, buildingTypeLine;
    if (!std::getline(std::cin, intensityLine) || !std::getline(std::cin, buildingTypeLine)) {
        std::cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int intensity = std::atoi(intensityLine.c_str());
    std::string buildingType = trim(buildingTypeLine);

    int trucks, firefighters, tankers;

    if (intensity <= 3) {
        trucks = 1;
        firefighters = 5;
        tankers = 1;
    } else if (intensity <= 6) {
        trucks = 2;
        firefighters = 10;
        tankers = 2;
    } else if (intensity <= 9) {
        trucks = 3;
        firefighters = 15;
        tankers = 3;
    } else {
        trucks = 5;
        firefighters = 25;
        tankers = 5;
    }

    // Commercial / industrial buildings need more resources
    if (buildingType == "industrial" || buildingType == "commercial") {
        trucks = static_cast<int>(std::ceil(trucks * 1.3));
        firefighters = static_cast<int>(std::ceil(firefighters * 1.2));
        tankers = static_cast<int>(std::ceil(tankers * 1.3));
    }

    int spreadRadius = intensity * 15;

    std::cout << "{\"trucks\":" << trucks
              << ",\"firefighters\":" << firefighters
              << ",\"tankers\":" << tankers
              << ",\"spreadRadius\":" << spreadRadius
              << "}";

    return 0;
}
