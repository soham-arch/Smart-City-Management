/*
 * fire_resource_calc.cpp — Fire Resource Calculator
 *
 * Determines recommended fire resources based on intensity and building type.
 *
 * Input (stdin):  Line 1: intensity (1-10)
 *                 Line 2: building_type (residential/commercial/industrial/open)
 * Output (stdout): JSON { trucks, firefighters, tankers, spreadRadius }
 *
 * Compiled to: server/bin/native_fire_resource_calc.exe
 */
#include <iostream>
#include <string>
#include <cmath>
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

    string intensityLine, buildingTypeLine;
    if (!getline(cin, intensityLine) || !getline(cin, buildingTypeLine)) {
        cout << "{\"error\":\"invalid input\"}";
        return 1;
    }

    int intensity = atoi(intensityLine.c_str());
    string buildingType = trim(buildingTypeLine);

    int trucks, firefighters, tankers;

    // Resource allocation based on intensity
    if (intensity <= 3) {
        trucks = 1; firefighters = 5; tankers = 1;
    } else if (intensity <= 6) {
        trucks = 2; firefighters = 10; tankers = 2;
    } else if (intensity <= 9) {
        trucks = 3; firefighters = 15; tankers = 3;
    } else {
        trucks = 5; firefighters = 25; tankers = 5;
    }

    // Commercial/industrial buildings need more resources
    if (buildingType == "industrial" || buildingType == "commercial") {
        trucks = (int)ceil(trucks * 1.3);
        firefighters = (int)ceil(firefighters * 1.2);
        tankers = (int)ceil(tankers * 1.3);
    }

    int spreadRadius = intensity * 15;

    cout << "{\"trucks\":" << trucks
         << ",\"firefighters\":" << firefighters
         << ",\"tankers\":" << tankers
         << ",\"spreadRadius\":" << spreadRadius << "}";

    return 0;
}
