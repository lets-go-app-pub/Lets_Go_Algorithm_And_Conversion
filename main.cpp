// MakeListOfNames.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace std;
int numberSpaced = 4; //used for indenting in generate names & genders
int maxNumberOfItemsPerLine = 2; //used in generate cpp file from mongoDB shell

void indent(int numSpaces, ofstream& fout) {
    for (int j = 0; j < numSpaces; j++) {
        fout << ' ';
    }
}

void generateNames() {

    ifstream fin("C:\\data\\Names.txt");
    vector<string> names;
    string dummyString;

    getline(fin, dummyString);

    while (fin.good()) {

        names.push_back(dummyString);
        getline(fin, dummyString);
    }

    fin.close();

    ofstream fout("C:\\data\\NamesCppSwitch.txt");

    fout << "#include <string>\n\n";

    fout << "void pickRandomName(int value) { \n";

    indent(numberSpaced, fout);

    fout << "switch(value) { \n";

    for (int i = 0; i < names.size(); i++) {

        indent(numberSpaced * 2, fout);

        fout << "case " << i << ":\n";

        indent(numberSpaced * 3, fout);

        fout << "return " << '"' << names[i] << '"' << "; \n";

    }

    indent(numberSpaced, fout);

    fout << "}\n";

    fout << "}\n";

    fout.close();

}

void generateGenderOthers() {

    ifstream fin("C:\\data\\Genders.txt");
    vector<string> genderNames;

    string dummyString;
    getline(fin, dummyString);

    while (fin.good()) {

        char nextChar = fin.get();
        string genderName;

        while (nextChar != '-') {
            genderName.push_back(nextChar);
            nextChar = fin.get();
        }

        genderNames.push_back(genderName);
        getline(fin, dummyString);
    }

    fin.close();

    ofstream fout("C:\\data\\GenderCppSwitch.txt");

    fout << "#include <string>\n\n";

    fout << "std::string pickRandomGenderOther(int value) { \n";

    indent(numberSpaced, fout);

    fout << "switch(value) { \n";

    for (int i = 0; i < genderNames.size(); i++) {

        indent(numberSpaced * 2, fout);

        fout << "case " << i << ":\n";

        indent(numberSpaced * 3, fout);

        fout << "return " << '"' << genderNames[i] << '"' << "; \n";

    }

    indent(numberSpaced, fout);

    fout << "}\n";

    fout << "}\n";

    fout.close();

}

//returns false if s is not changed more than the "" being removed
//true if it is changed
bool convertStringToVariable(std::string& s) {

    const std::string startingString = s;
    std::string tempString = s;

    if (tempString.front() == '"') {
        tempString.erase(0, 1);
    }
    if (tempString.back() == '"') {
        tempString.pop_back();
    }

    //The numbers must be before stol() and stod() are checked.
    if (tempString == "000") {
        s = "bsoncxx::types::b_int64{ 0 }";
        return true;
    }
    else if (tempString == "001") {
        s = "bsoncxx::types::b_int64{ 1 }";
        return true;
    }
    else if (tempString == "0000") {
        s = "bsoncxx::types::b_double{ 0 }";
        return true;
    }
    else if (tempString == "0001") {
        s = "bsoncxx::types::b_double{ 1 }";
        return true;
    }

    try {
        long val = stol(tempString);
        s = to_string(val);
        return true;
    } catch (const std::invalid_argument& e) {}

    try {
        double val = stod(tempString);
        s = to_string(val);
        return true;
    } catch (const std::invalid_argument& e) {}

    if (tempString == "true") {
        s = "true";
    }
    else if (tempString == "false") {
        s = "false";
    }

    else if (tempString == "dFr") {
        s = "user_account_keys::LAST_TIME_FIND_MATCHES_RAN";
    }
    else if (tempString == "$dFr") {
        s = "'$' + user_account_keys::LAST_TIME_FIND_MATCHES_RAN";
    }
    else if (tempString == "distanceToUser") {
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_DISTANCE_KEY";
    }
    else if (tempString == "$distanceToUser") {
        s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_DISTANCE_KEY";
    }
    else if (tempString == "matchLocation") {
        s = "user_account_keys::LOCATION";
    }
    else if (tempString == "$matchLocation") {
        s = "'$' + user_account_keys::LOCATION";
    }
    else if (tempString == "$matchLocation.coordinates") {
        s = "'$' + user_account_keys::LOCATION + ";
        s += '"';
        s += ".coordinates";
        s += '"';
    }
    else if (tempString == "USER_LONGITUDE") {
        s = "bsoncxx::types::b_double{ userAccountValues.longitude }";
    }
    else if (tempString == "USER_LATITUDE") {
        s = "bsoncxx::types::b_double{ userAccountValues.latitude }";
    }
    else if (tempString == "USER_LATITUDE_IN_RADIANS") {
        s = "bsoncxx::types::b_double{ userAccountValues.latitude*M_PI/180.0 }";
    }
    else if (tempString == "PI_OVER_180") {
        s = "M_PI/180.0";
    }
    else if (tempString == "categories") {
        s = "user_account_keys::CATEGORIES";
    }
    else if (tempString == "timeFrameData") {
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA";
    }
    else if (tempString == "$$timeFrameData.timeFrames") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + '.' + user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "$$cArr.timeFrames") {
        s = "\"$$\" + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY + '.' + user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "$$timeFrameData.totalTime") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "$$timeFrameData.totalOverlapTime") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_OVERLAP_TIME_VAR";
    }
    else if (tempString == "$$timeFrameData.betweenTimesArray") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIMES_ARRAY_VAR";
    }
    else if (tempString == "$$timeFrameData.matchExpirationTime") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
    }
    else if (tempString == "$$timeFrameData._test") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIMEFRAME_DATA + ";
        s += '"';
        s += "._test";
        s += '"';
    }
    else if (tempString == "$categories") {
        s = "'$' + user_account_keys::CATEGORIES";
    }
    else if (tempString == "$categories.timeFrames") {
        s = "'$' + user_account_keys::CATEGORIES + '.' + user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "$categories.activityCategoryValue") {
        s = "'$' + user_account_keys::CATEGORIES + '.' + user_account_keys::categories::INDEX_VALUE";
    }
    else if (tempString == "$categories.totalMatchTime") {
        s = "'$' + user_account_keys::CATEGORIES + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "totalTime" || tempString == "totalMatchTime") {
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "$totalMatchTime") {
        s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "$$this.totalMatchTime") {
        s = '"';
        s += "$$this.";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "$$cArr.totalMatchTime") {
        s = "\"$$\" + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "$$value.totalTime") {
        s = '"';
        s += "$$value.";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
    }
    else if (tempString == "timeFrames") {
        s = "user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "$timeFrames") {
        s = "'$' + user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "$$value.timeFrames") {
        s = '"';
        s += "$$value.";
        s += '"';
        s += " + user_account_keys::categories::TIMEFRAMES";
    }
    else if (tempString == "previousTime") { //variable
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TIME_VAR";
    }
    else if (tempString == "$$value.previousTime") {
        s = '"';
        s += "$$value.";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TIME_VAR";
    }
    else if (tempString == "previousTimeAboveNow") { //variable
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TIME_IS_ABOVE_NOW_VAR";
    }
    else if (tempString == "$$value.previousTimeAboveNow") {
        s = '"';
        s += "$$value.";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TIME_IS_ABOVE_NOW_VAR";
    }
    else if (tempString == "timeAboveNow") { //variable
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_IS_ABOVE_NOW_VAR";
    }
    else if (tempString == "$$timeAboveNow") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_IS_ABOVE_NOW_VAR";
    }
    else if (tempString == "time") {
        s = "user_account_keys::categories::timeframes::TIME";
    }
    else if (tempString == "$$this.time") {
        s = '"';
        s += "$$this.";
        s += '"';
        s += " + user_account_keys::categories::timeframes::TIME";
    }
    else if (tempString == "$$this.user") {
        s = '"';
        s += "$$this.";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TIMEFRAMES_USER";
    }
    else if (tempString == "user") {
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TIMEFRAMES_USER";
    }
    else if (tempString == "startStopValue") {
        s = "user_account_keys::categories::timeframes::START_STOP_VALUE";
    }
    else if (tempString == "$$this.startStopValue") {
        s = '"';
        s += "$$this.";
        s += '"';
        s += " + user_account_keys::categories::timeframes::START_STOP_VALUE";
    }
    else if (tempString == "EARLIEST_START_TIME") {
        s = "bsoncxx::types::b_int64{userAccountValues.earliestTimeFrameStartTimestamp.count()}";
    }
    else if (tempString == "EARLIEST_START_TIME+1") {
        s = "bsoncxx::types::b_int64{userAccountValues.earliestTimeFrameStartTimestamp.count() + 1}";
    }
    else if (tempString == "MY_CURRENT_TIME") {
        s = "bsoncxx::types::b_int64{userAccountValues.currentTimestamp.count()}";
    }
    else if (tempString == "MY_CURRENT_TIME+1") {
        s = "bsoncxx::types::b_int64{userAccountValues.currentTimestamp.count() + 1}";
    }
    else if (tempString == "MAX_POSSIBLE_TIME") {
        s = "bsoncxx::types::b_int64{userAccountValues.endOfTimeFrameTimestamp.count()}";
    }
    else if (tempString == "TOTAL_TIME_FRAME") {
        s = "bsoncxx::types::b_int64{userAccountValues.endOfTimeFrameTimestamp.count() - userAccountValues.earliestTimeFrameStartTimestamp.count()}";
    }
    else if (tempString == "activityCategoryValue") {
        s = "user_account_keys::categories::INDEX_VALUE";
    }
    else if (tempString == "$activityCategoryValue") {
        s = "'$' + user_account_keys::categories::INDEX_VALUE";
    }
    else if (tempString == "timeFramesArray") { //variable
        s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_FRAMES_ARRAY_VAR";
    }
    else if (tempString == "$$timeFramesArray") {
        s = '"';
        s += "$$";
        s += '"';
        s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_FRAMES_ARRAY_VAR";
    }
    if (startingString == s) { //string has not been found

        if (tempString == "ACTIVITY_FIRST" ||
        tempString == "USER_TIMEFRAME_ACTIVITY_FIRST" ||
        tempString == "ACTIVITY_SECOND" ||
        tempString == "USER_TIMEFRAME_ACTIVITY_SECOND" ||

        tempString == "CATEGORY_FIRST" ||
        tempString == "USER_TIMEFRAME_CATEGORY_FIRST" ||
        tempString == "CATEGORY_SECOND" ||
        tempString == "USER_TIMEFRAME_CATEGORY_SECOND" ||

        tempString == "NUMBER_BIGGER_THAN_UNIX_TIMESTAMP" ||
        tempString == "PREVIOUSLY_MATCHED_ACCOUNTS" ||

        (tempString.size() == 1 && isdigit(tempString[0])) || //single digit positive number
        (tempString.size() == 2 && tempString[0] == '-' && isdigit(tempString[1]))) { //single digit negative number
            s = tempString; //will return value w/o quotes so it will compile error if not a variable
        }
        else if(tempString == "OVERLAPPING_CATEGORY_TIMES_WEIGHT") {
            s = "matching_algorithm::OVERLAPPING_CATEGORY_TIMES_WEIGHT";
        }
        else if(tempString == "OVERLAPPING_ACTIVITY_TIMES_WEIGHT") {
            s = "matching_algorithm::OVERLAPPING_ACTIVITY_TIMES_WEIGHT";
        }
        else if(tempString == "SHORT_TIMEFRAME_CATEGORY_OVERLAP_WEIGHT") {
            s = "matching_algorithm::SHORT_TIMEFRAME_CATEGORY_OVERLAP_WEIGHT";
        }
        else if(tempString == "SHORT_TIMEFRAME_ACTIVITY_OVERLAP_WEIGHT") {
            s = "matching_algorithm::SHORT_TIMEFRAME_ACTIVITY_OVERLAP_WEIGHT";
        }
        else if(tempString == "BETWEEN_CATEGORY_TIMES_WEIGHT") {
            s = "matching_algorithm::BETWEEN_CATEGORY_TIMES_WEIGHT";
        }
        else if(tempString == "BETWEEN_ACTIVITY_TIMES_WEIGHT") {
            s = "matching_algorithm::BETWEEN_ACTIVITY_TIMES_WEIGHT";
        }
        else if(tempString == "ACTIVITY_MATCH_WEIGHT") {
            s = "matching_algorithm::ACTIVITY_MATCH_WEIGHT";
        }
        else if(tempString == "CATEGORIES_MATCH_WEIGHT") {
            s = "matching_algorithm::CATEGORIES_MATCH_WEIGHT";
        }
        else if (tempString == "timeStats") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR";
        }
        else if (tempString == "$$timeStats.timeFrames") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + user_account_keys::categories::TIMEFRAMES";
        }
        else if (tempString == "$timeStats.totalOverlapTime") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_OVERLAP_TIME_VAR";
        }
        else if (tempString == "$timeStats.totalMatchTime") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_TIME_FOR_MATCH";
        }
        else if (tempString == "$timeStats.betweenTimesArray") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIMES_ARRAY_VAR";
        }
        else if (tempString == "$timeStats.totalUserTime") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_USER_TIME_VAR";
        }
        else if (tempString == "$$this.totalUserTime") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_USER_TIME_VAR";
        }
        else if (tempString == "$timeStats.matchExpirationTime") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
        }
        else if (tempString == "$$timeStats._test") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + _test";
        }
        else if (tempString == "userIndex") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_USER_INDEX_VAR";
        }
        else if (tempString == "$$value.userIndex") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_USER_INDEX_VAR";
        }
        else if (tempString == "matchIndex") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_INDEX_VAR";
        }
        else if (tempString == "$$value.matchIndex") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_INDEX_VAR";
        }
        else if (tempString == "userArrayVal") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_USER_ARRAY_VAL_VAR";
        }
        else if (tempString == "$$userArrayVal") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_USER_ARRAY_VAL_VAR";
        }
        else if(tempString == "MATCH_CATEGORIES_AND_ACTIVITIES") {
            s = "bsoncxx::types::b_bool{userAccountValues.algorithmSearchOptions == AlgorithmSearchOptions::MATCH_CATEGORIES_AND_ACTIVITIES}";
        }
        else if(tempString == "CATEGORY_ENUM_TYPE") {
            s = "AccountCategoryType::CATEGORY_TYPE";
        }
        else if(tempString == "ACTIVITY_ENUM_TYPE") {
            s = "AccountCategoryType::ACTIVITY_TYPE";
        }
        else if (tempString == "$$this.activityCategoryValue") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + user_account_keys::categories::INDEX_VALUE";
        }
        else if (tempString == "cArr") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY";
        }
        else if (tempString == "$$cArr") {
            s = "\"$$\" + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY";
        }
        else if (tempString == "$$cArr.activityCategoryValue") {
            s = "\"$$\" + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY + '.' + user_account_keys::categories::INDEX_VALUE";
        }
        else if (tempString == "categoryActivityType") {
            s = "user_account_keys::categories::TYPE";
        }
        else if (tempString == "$categoryActivityType") {
            s = "'$' + user_account_keys::categories::TYPE";
        }
        else if (tempString == "$$this.categoryActivityType") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + user_account_keys::categories::TYPE";
        }
        else if (tempString == "$$cArr.categoryActivityType") {
            s = "\"$$\" + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORIES_TEMP_NAME_KEY + '.' + user_account_keys::categories::TYPE";
        }
        else if (tempString == "$categories.categoryActivityType") {
            s = "'$' + user_account_keys::CATEGORIES + '.' + user_account_keys::categories::TYPE";
        }
        else if (tempString == "$$userArrayVal.time") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_USER_ARRAY_VAL_VAR + '.' + user_account_keys::categories::timeframes::TIME";
        }
        else if (tempString == "$$userArrayVal.startStopValue") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_USER_ARRAY_VAL_VAR + '.' + user_account_keys::categories::timeframes::START_STOP_VALUE";
        }
        else if (tempString == "matchArrayVal") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_ARRAY_VAL_VAR";
        }
        else if (tempString == "$$matchArrayVal") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_ARRAY_VAL_VAR";
        }
        else if (tempString == "$$matchArrayVal.time") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_ARRAY_VAL_VAR + '.' + user_account_keys::categories::timeframes::TIME";
        }
        else if (tempString == "$$matchArrayVal.startStopValue") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_ARRAY_VAL_VAR + '.' + user_account_keys::categories::timeframes::START_STOP_VALUE";
        }
        else if (tempString == "arrayElementMatch") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_ARRAY_ELEMENT_MATCH_VAR";
        }
        else if (tempString == "$$arrayElementMatch") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_ARRAY_ELEMENT_MATCH_VAR";
        }
        else if (tempString == "totalOverlapTime") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_OVERLAP_TIME_VAR";
        }
        else if (tempString == "$$this.totalOverlapTime") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_OVERLAP_TIME_VAR";
        }
        else if (tempString == "$$value.totalOverlapTime") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_OVERLAP_TIME_VAR";
        }
        else if (tempString == "betweenTimesArray") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIMES_ARRAY_VAR";
        }
        else if (tempString == "$$this.betweenTimesArray") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIMES_ARRAY_VAR";
        }
        else if (tempString == "$$value.betweenTimesArray") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIMES_ARRAY_VAR";
        }
        else if (tempString == "nestedValue") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_NESTED_VALUE_VAR";
        }
        else if (tempString == "$$value.nestedValue") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_NESTED_VALUE_VAR";
        }
        else if (tempString == "overlapStartTime") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_START_TIME_VAR";
        }
        else if (tempString == "$$value.overlapStartTime") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_START_TIME_VAR";
        }
        else if (tempString == "matchExpirationTime") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
        }
        else if (tempString == "$matchExpirationTime") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
        }
        else if (tempString == "matchingActivities") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHING_ACTIVITIES_FIELD";
        }
        else if (tempString == "$matchingActivities") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHING_ACTIVITIES_FIELD";
        }
        else if (tempString == "$$this.matchExpirationTime") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
        }
        else if (tempString == "$$value.matchExpirationTime") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_VAR";
        }
        else if (tempString == "matchExpirationTimeSetTo") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_SET_TO_VAR";
        }
        else if (tempString == "$matchExpirationTimeSetTo") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_SET_TO_VAR";
        }
        else if (tempString == "$$value.matchExpirationTimeSetTo") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_EXPIRATION_TIME_SET_TO_VAR";
        }
        else if (tempString == "betweenStopTime") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_STOP_TIME_VAR";
        }
        else if (tempString == "$$value.betweenStopTime") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_STOP_TIME_VAR";
        }
        else if (tempString == "previousTypeUser") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TYPE_USER_VAR";
        }
        else if (tempString == "$$value.previousTypeUser") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_PREVIOUS_TYPE_USER_VAR";
        }
        else if (tempString == "currNestedValue") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_CURRENT_NESTED_VALUE_VAR";
        }
        else if (tempString == "$$currNestedValue") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_CURRENT_NESTED_VALUE_VAR";
        }
        else if (tempString == "betweenTimeValue") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIME_VALUE_VAR";
        }
        else if (tempString == "$$betweenTimeValue") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIME_VALUE_VAR";
        }
        else if (tempString == "expirationOverlapCheck") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_EXPIRATION_OVERLAP_CHECK_VAR";
        }
        else if (tempString == "$$expirationOverlapCheck") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_EXPIRATION_OVERLAP_CHECK_VAR";
        }
        else if (tempString == "betweenCheck") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_CHECK_VAR";
        }
        else if (tempString == "$$betweenCheck") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_CHECK_VAR";
        }
        else if (tempString == "betweenCheckSecond") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_CHECK_SECOND_VAR";
        }
        else if (tempString == "$$betweenCheckSecond") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_CHECK_SECOND_VAR";
        }
        else if (tempString == "expirationBetweenCheck") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_EXPIRATION_BETWEEN_CHECK_VAR";
        }
        else if (tempString == "$$expirationBetweenCheck") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_EXPIRATION_BETWEEN_CHECK_VAR";
        }
        else if (tempString == "matchStatistics") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_STATISTICS_VAR";
        }
        else if (tempString == "USER_ACTIVITIES") {
            s = "userActivitiesMongoDBArray";
        }
        else if (tempString == "USER_CATEGORIES") {
            s = "userCategoriesMongoDBArray";
        }
        else if (tempString == "$matchStatistics") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCH_STATISTICS_VAR";
        }
        else if (tempString == "activityStatistics") {
            s = "user_account_keys::accounts_list::ACTIVITY_STATISTICS";
        }
        else if (tempString == "$activityStatistics") {
            s = "'$' + user_account_keys::accounts_list::ACTIVITY_STATISTICS";
        }
        else if (tempString == "$timeStats.activityStatistics") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + user_account_keys::accounts_list::ACTIVITY_STATISTICS";
        }
        else if (tempString == "$$value.activityStatistics") {
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + user_account_keys::accounts_list::ACTIVITY_STATISTICS";
        }
        else if (tempString == "totalUserTime") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TOTAL_USER_TIME_VAR";
        }
        else if (tempString == "currentTime") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_MATCH_RAN_VAR";
        }
        else if (tempString == "earliestStartTime") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_EARLIEST_START_TIME_VAR";
        }
        else if (tempString == "maxPossibleTime") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MAX_POSSIBLE_TIME_VAR";
        }
        else if (tempString == "finalPoints") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_FINAL_POINTS_VAR";
        }
        else if (tempString == "$finalPoints") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_FINAL_POINTS_VAR";
        }
        else if (tempString == "MAX_BETWEEN_TIME") {
            s = "bsoncxx::types::b_int64{matching_algorithm::MAX_BETWEEN_TIME_WEIGHT_HELPER.count()}";
        }
        else if (tempString == "PREVIOUSLY_MATCHED_WEIGHT") {
            s = "matching_algorithm::PREVIOUSLY_MATCHED_WEIGHT";
        }
        else if (tempString == "INACTIVE_ACCOUNT_WEIGHT") {
            s = "matching_algorithm::INACTIVE_ACCOUNT_WEIGHT";
        }
        else if (tempString == "PREVIOUSLY_MATCHED_FALLOFF_TIME") {
            s = "bsoncxx::types::b_int64{matching_algorithm::PREVIOUSLY_MATCHED_FALLOFF_TIME.count()}";
        }
        else if (tempString == "true") {
            s = "true";
        }
        else if (tempString == "timeFalloff") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_FALL_OFF_VAR";
        }
        else if (tempString == "$timeFalloff") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_FALL_OFF_VAR";
        }
        else if (tempString == "$$this.previousOID") {
            s = '"';
            s += "$$this.";
            s += '"';
            s += " + user_account_keys::previously_matched_accounts::OID";
        }
        else if (tempString == "numerator") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_NUMERATOR_VAR";
        }
        else if (tempString == "$$numerator") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_NUMERATOR_VAR";
        }
        else if (tempString == "denominator") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_DENOMINATOR_VAR";
        }
        else if (tempString == "$$denominator") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_DENOMINATOR_VAR";
        }
        else if (tempString == "overlapTimeWeight") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_TIME_WEIGHT_VAR";
        }
        else if (tempString == "$$overlapTimeWeight") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_TIME_WEIGHT_VAR";
        }
        else if (tempString == "betweenTimeWeight") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIME_WEIGHT_VAR";
        }
        else if (tempString == "$$betweenTimeWeight") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_BETWEEN_TIME_WEIGHT_VAR";
        }
        else if (tempString == "overlapRatio") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_RATIO_VAR";
        }
        else if (tempString == "$$overlapRatio") { //variable
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_RATIO_VAR";
        }
        else if (tempString == "$$value.overlapRatio") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_OVERLAP_RATIO_VAR";
        }
        else if (tempString == "shortOverlapTimeWeight") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_TIME_WEIGHT_VAR";
        }
        else if (tempString == "$$shortOverlapTimeWeight") { //variable
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_TIME_WEIGHT_VAR";
        }
        else if (tempString == "$$value.shortOverlapTimeWeight") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_TIME_WEIGHT_VAR";
        }
        else if (tempString == "shortOverlapPoints") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_POINTS_VAR";
        }
        else if (tempString == "$$shortOverlapPoints") { //variable
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_POINTS_VAR";
        }
        else if (tempString == "$$value.shortOverlapPoints") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_SHORT_OVERLAP_POINTS_VAR";
        }
        else if (tempString == "inactivityPointsToSubtract") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_INACTIVITY_POINTS_TO_SUBTRACT_KEY";
        }
        else if (tempString == "$inactivityPointsToSubtract") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_INACTIVITY_POINTS_TO_SUBTRACT_KEY";
        }
        else if (tempString == "$$inactivityPointsToSubtract") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_INACTIVITY_POINTS_TO_SUBTRACT_KEY";
        }
        else if (tempString == "categoryOrActivityPoints") {
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORY_OR_ACTIVITY_POINTS_KEY";
        }
        else if (tempString == "$categoryOrActivityPoints") {
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORY_OR_ACTIVITY_POINTS_KEY";
        }
        else if (tempString == "$$value.categoryOrActivityPoints") { //variable
            s = '"';
            s += "$$value.";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORY_OR_ACTIVITY_POINTS_KEY";
        }
        else if (tempString == "$timeStats.categoryOrActivityPoints") { //variable
            s = "'$' + algorithm_pipeline_field_names::MONGO_PIPELINE_TIME_STATS_VAR + '.' + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORY_OR_ACTIVITY_POINTS_KEY";
        }
        else if (tempString == "$$categoryOrActivityPoints") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_CATEGORY_OR_ACTIVITY_POINTS_KEY";
        }
        else if (tempString == "matchedID") { //variable
            s = "algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHED_ID_VAR";
        }
        else if (tempString == "$$matchedID") {
            s = '"';
            s += "$$";
            s += '"';
            s += " + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHED_ID_VAR";
        }
        else if (tempString == "$$matchedID.lastTimeMatched") {
            s = R"("$$" + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHED_ID_VAR + "." + user_account_keys::previously_matched_accounts::TIMESTAMP)";
        }
        else if (tempString == "$$matchedID.numberTimesMatched") {
            s = R"("$$" + algorithm_pipeline_field_names::MONGO_PIPELINE_MATCHED_ID_VAR + "." + user_account_keys::previously_matched_accounts::NUMBER_TIMES_MATCHED)";
        } else {
            return false;
        }
    }

    return true;
}

std::string generateIndentation(const std::string& indent, int number_indents) {
    std::string return_value;

    for(int i = 0; i < number_indents; i++) {
        return_value += indent;
    }

    return return_value;
}

enum class LayerTypes {
    ARRAY_TYPE_LAYER,
    DOCUMENT_TYPE_LAYER_FIRST,
    DOCUMENT_TYPE_LAYER_SECOND
};

void extractString(
        std::string &s,
        ofstream& f_out,
        std::vector<LayerTypes>& layer_types,
        int number_indents,
        const std::string& indent = "    "
        ) {

    if(!layer_types.empty()) {
        switch (layer_types.back()) {
            case LayerTypes::ARRAY_TYPE_LAYER:
                f_out << "\n" << generateIndentation(indent, number_indents);
                break;
            case LayerTypes::DOCUMENT_TYPE_LAYER_FIRST:
                layer_types[layer_types.size() - 1] = LayerTypes::DOCUMENT_TYPE_LAYER_SECOND;
                break;
            case LayerTypes::DOCUMENT_TYPE_LAYER_SECOND:
                layer_types[layer_types.size() - 1] = LayerTypes::DOCUMENT_TYPE_LAYER_FIRST;
                f_out << "\n" << generateIndentation(indent, number_indents);
                break;
        }
    }

    if (!s.empty()) {

        f_out << "<< ";

        if (s.front() != '"') {
            s.insert(s.begin(), '"');
        }
        if (s.back() != '"') {
            s.push_back('"');
        }

        convertStringToVariable(s);

        f_out << s << ' ';
    }

    s.clear();
}

void convertMongoDBAggregateShellCommandsToCpp() {

    const std::string indent = "    ";
    ifstream f_in("../MongoStuff.txt");
    vector<char> fileInChars;
    std::vector<LayerTypes> layer_types;
    char dummyChar;

    dummyChar = f_in.get();
    bool insideComment = false;

    while (f_in.good()) {

        if (insideComment && dummyChar == '\n') {
            insideComment = false;
        }
        else if (dummyChar == '/') {
            insideComment = true;
        }

        if(dummyChar != ' ' && dummyChar != '\n' && dummyChar != '\t' && !insideComment)
            fileInChars.emplace_back(dummyChar);
        dummyChar = f_in.get();
    }

    std::cout << "file size: " << fileInChars.size() << '\n';

    f_in.close();

    ofstream f_out("../MongoCppFunc.txt");
    std::string savedString;

    int number_indents = 0;

    f_out << "/*\n";

    for (char fileInChar : fileInChars) {

        switch(fileInChar) {
            case '{': {
                extractString(savedString, f_out, layer_types, number_indents, indent);

                if(!layer_types.empty() && layer_types.back() == LayerTypes::DOCUMENT_TYPE_LAYER_SECOND) {
                    layer_types[layer_types.size() - 1] = LayerTypes::DOCUMENT_TYPE_LAYER_FIRST;
                }

                layer_types.emplace_back(LayerTypes::DOCUMENT_TYPE_LAYER_SECOND);

                number_indents++;
                f_out << "<< open_document";//\n" << generateIndentation(indent, number_indents);
                break;
            }
            case '}': {
                extractString(savedString, f_out, layer_types, number_indents, indent);
                layer_types.pop_back();

                number_indents--;
                f_out << '\n' << generateIndentation(indent, number_indents) << "<< close_document";
                break;
            }
            case '[': {
                extractString(savedString, f_out, layer_types, number_indents, indent);

                if(!layer_types.empty() && layer_types.back() == LayerTypes::DOCUMENT_TYPE_LAYER_SECOND) {
                    layer_types[layer_types.size() - 1] = LayerTypes::DOCUMENT_TYPE_LAYER_FIRST;
                }

                layer_types.emplace_back(LayerTypes::ARRAY_TYPE_LAYER);

                number_indents++;
                f_out << "<< open_array" << generateIndentation(indent, number_indents);
                break;
            }
            case ']': {
                extractString(savedString, f_out, layer_types, number_indents, indent);
                layer_types.pop_back();

                number_indents--;
                f_out << '\n' << generateIndentation(indent, number_indents) << "<< close_array";
                break;
            }
            case ',':
            case ':': {
                extractString(savedString, f_out, layer_types, number_indents, indent);
                break;
            }
            default: {
                savedString.push_back(fileInChar);
            }
        }

    }

    f_out << "\n*/";

    f_out.close();

}

int main()
{
    std::cout << "Starting\n";

    convertMongoDBAggregateShellCommandsToCpp();

    std::cout << "Finished\n";
}

// Run program: Ctrl + F5 or Debug > Start Without Debugging menu
// Debug program: F5 or Debug > Start Debugging menu

// Tips for Getting Started: 
//   1. Use the Solution Explorer window to add/manage files
//   2. Use the Team Explorer window to connect to source control
//   3. Use the Output window to see build output and other messages
//   4. Use the Error List window to view errors
//   5. Go to Project > Add New Item to create new code files, or Project > Add Existing Item to add existing code files to the project
//   6. In the future, to open this project again, go to File > Open > Project and select the .sln file