#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <map>

using namespace std;

struct InjuryType {
    string name;
    int healing_days;
    int resource_weight;
    int initial_severity_bonus;
};

struct Patient {
    string id;
    string injury_type;
    int severity;
    int days_admitted;
    int healing_duration;
    int resource_weight;
    int effective_severity;
    string previous_ward; // track if patient was in ICU before
};

// Hardcoded injury type table
map<string, InjuryType> getInjuryTypes() {
    map<string, InjuryType> types;
    types["cardiac"]  = {"cardiac",  7,  3, 2};
    types["stroke"]   = {"stroke",   10, 3, 2};
    types["trauma"]   = {"trauma",   5,  2, 1};
    types["accident"] = {"accident", 6,  2, 1};
    types["other"]    = {"other",    3,  1, 0};
    return types;
}

int main() {
    // Read resource_capacity
    int resource_capacity;
    cin >> resource_capacity;

    // Read number of patients
    int n;
    cin >> n;
    cin.ignore(); // consume newline

    vector<Patient> patients(n);
    map<string, InjuryType> injuryTypes = getInjuryTypes();

    for (int i = 0; i < n; i++) {
        string line;
        getline(cin, line);
        
        istringstream iss(line);
        string patient_id, injury_type, sev_str, days_str, heal_str;
        
        getline(iss, patient_id, '\t');
        getline(iss, injury_type, '\t');
        getline(iss, sev_str, '\t');
        getline(iss, days_str, '\t');
        getline(iss, heal_str, '\t');

        patients[i].id = patient_id;
        patients[i].injury_type = injury_type;
        patients[i].severity = stoi(sev_str);
        patients[i].days_admitted = stoi(days_str);
        patients[i].healing_duration = stoi(heal_str);

        // Get resource weight from injury type table
        if (injuryTypes.count(injury_type)) {
            patients[i].resource_weight = injuryTypes[injury_type].resource_weight;
        } else {
            patients[i].resource_weight = 1;
        }

        // Compute effective severity (profit for knapsack)
        // Higher severity = higher priority for ICU
        // Patients who have been admitted longer than healing_duration have reduced severity
        int eff = patients[i].severity;
        if (patients[i].days_admitted >= patients[i].healing_duration) {
            eff = max(1, eff - 3);
        }
        // Add injury type bonus
        if (injuryTypes.count(injury_type)) {
            eff += injuryTypes[injury_type].initial_severity_bonus;
        }
        patients[i].effective_severity = eff;
    }

    // 0/1 Knapsack DP
    // Items = patients, weight = resource_weight, profit = effective_severity
    // Capacity = resource_capacity
    int W = resource_capacity;

    // dp[i][w] = max severity with first i patients and w resource units
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];
            if (patients[i - 1].resource_weight <= w) {
                int val = dp[i - 1][w - patients[i - 1].resource_weight] + patients[i - 1].effective_severity;
                if (val > dp[i][w]) {
                    dp[i][w] = val;
                }
            }
        }
    }

    // Backtrack to find selected patients (ICU admitted)
    vector<bool> selected(n, false);
    int w = W;
    for (int i = n; i > 0; i--) {
        if (dp[i][w] != dp[i - 1][w]) {
            selected[i - 1] = true;
            w -= patients[i - 1].resource_weight;
        }
    }

    // Categorize patients
    vector<string> icu_admitted;
    vector<string> general_ward;
    vector<string> evicted_from_icu;

    for (int i = 0; i < n; i++) {
        if (selected[i]) {
            icu_admitted.push_back(patients[i].id);
        } else {
            general_ward.push_back(patients[i].id);
            // Note: The server will determine evictions by comparing with previous ward assignments
        }
    }

    int total_severity = dp[n][W];

    // Build JSON output
    cout << "{" << endl;
    
    // icu_admitted
    cout << "  \"icu_admitted\": [";
    for (size_t i = 0; i < icu_admitted.size(); i++) {
        cout << "\"" << icu_admitted[i] << "\"";
        if (i < icu_admitted.size() - 1) cout << ", ";
    }
    cout << "]," << endl;

    // general_ward
    cout << "  \"general_ward\": [";
    for (size_t i = 0; i < general_ward.size(); i++) {
        cout << "\"" << general_ward[i] << "\"";
        if (i < general_ward.size() - 1) cout << ", ";
    }
    cout << "]," << endl;

    // evicted_from_icu (empty - server will compute this)
    cout << "  \"evicted_from_icu\": []," << endl;

    // total_severity_served
    cout << "  \"total_severity_served\": " << total_severity << "," << endl;

    // dp_table_snapshot - full DP table
    cout << "  \"dp_table_snapshot\": [" << endl;
    for (int i = 0; i <= n; i++) {
        cout << "    [";
        for (int j = 0; j <= W; j++) {
            cout << dp[i][j];
            if (j < W) cout << ",";
        }
        cout << "]";
        if (i < n) cout << ",";
        cout << endl;
    }
    cout << "  ]" << endl;

    cout << "}" << endl;

    return 0;
}
