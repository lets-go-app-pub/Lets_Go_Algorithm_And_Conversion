//NOTE: will have to make sure incoming times from 'user' are up to date + 1
//NOTE: this can handle empty time frames for anytime and -1 values for the start time (from the match not the suer)
let MY_CURRENT_TIME = 2;
let EARLIEST_START_TIME = 2; //this will be + a variable in the actual program, just leaving it like this here for importing purposes
let MAX_POSSIBLE_TIME = 30;
let TOTAL_TIME_FRAME = MAX_POSSIBLE_TIME - EARLIEST_START_TIME;
let USER_ACTIVITIES = [1, 4];
let USER_CATEGORIES = [1, 4];

let PREVIOUSLY_MATCHED_ACCOUNTS = [
    {"pO": "reference_1", "numberTimesMatched": 1, "lastTimeMatched": 0},
];

let PREVIOUSLY_MATCHED_ACCOUNTS_DOC = {
    "reference_1": {"numberTimesMatched": 1, "lastTimeMatched": 0}
}

let ACTIVITY_FIRST = 1;
let USER_TIMEFRAME_ACTIVITY_FIRST = [
    {"time": 3, startStopValue: 1, user: true},
    {"time": 4, startStopValue: -1, user: true},
    {"time": 5, startStopValue: 1, user: true},
    {"time": 7, startStopValue: -1, user: true},
    {"time": 9, startStopValue: 1, user: true},
    {"time": 12, startStopValue: -1, user: true}
];
let ACTIVITY_FIRST_TOTAL_TIME = 7;

let ACTIVITY_SECOND = 4;
let USER_TIMEFRAME_ACTIVITY_SECOND = [
    {"time": 5, startStopValue: 1, user: true},
    {"time": 6, startStopValue: -1, user: true},
];
let ACTIVITY_SECOND_TOTAL_TIME = 1;

let CATEGORY_FIRST = 1;
let USER_TIMEFRAME_CATEGORY_FIRST = [
    {"time": 3, startStopValue: 1, user: true},
    {"time": 4, startStopValue: -1, user: true},
    {"time": 5, startStopValue: 1, user: true},
    {"time": 7, startStopValue: -1, user: true},
    {"time": 9, startStopValue: 1, user: true},
    {"time": 12, startStopValue: -1, user: true}
];
let CATEGORY_FIRST_TOTAL_TIME = 7;

let CATEGORY_SECOND = 4;
let USER_TIMEFRAME_CATEGORY_SECOND = [
    {"time": 5, startStopValue: 1, user: true},
    {"time": 6, startStopValue: -1, user: true},
];
let CATEGORY_SECOND_TOTAL_TIME = 1;

let NUMBER_BIGGER_THAN_UNIX_TIMESTAMP = 10000000000;

let OVERLAPPING_ACTIVITY_TIMES_WEIGHT = 5000;
let OVERLAPPING_CATEGORY_TIMES_WEIGHT = 5000;

let ACTIVITY_MATCH_WEIGHT = 1000;
let CATEGORIES_MATCH_WEIGHT = 10;

let BETWEEN_ACTIVITY_TIMES_WEIGHT = 100;
let BETWEEN_CATEGORY_TIMES_WEIGHT = 100;

let INACTIVE_ACCOUNT_WEIGHT = 0.01; //do not set this to 0
let PREVIOUSLY_MATCHED_WEIGHT = 5000;
let PREVIOUSLY_MATCHED_FALLOFF_TIME = 4;

let SHORT_TIMEFRAME_CATEGORY_OVERLAP_WEIGHT = 2;
let SHORT_TIMEFRAME_ACTIVITY_OVERLAP_WEIGHT = 2;

let MAX_BETWEEN_TIME = .5; //should be 60*60*2 for 2 hours, setting this to 0 will break the code
let MAX_NUMBER_OF_MATCHES = 40;

let CATEGORY_ENUM_TYPE = 1
let ACTIVITY_ENUM_TYPE = 0

let MATCHING_ACCOUNT_LAST_ACTIVE_TIME = "aT";
let MATCHING_ACCOUNT_VERIFIED_ACCOUNT_REFERENCE_KEY = "aR";
let MATCHING_ACCOUNT_VERIFIED_ACCOUNT_REFERENCE_KEY_MONGO = "$aR";

let TEMP_CATEGORY_ARRAY = "cA";

let MATCH_CATEGORIES_AND_ACTIVITIES = true

let USER_LONGITUDE = 4
let USER_LATITUDE = 4
let PI_OVER_180 = 3.14 / 180
let USER_LATITUDE_IN_RADIANS = USER_LATITUDE * PI_OVER_180

// time - user_account_keys::categories::timeframes::TIME - Changed to MongoDB Date
// lastTimeMatched - user_account_keys::previously_matched_accounts::TIMESTAMP - Changed to MongoDB Date

let DISTANCE = 5; //just used to translate over to c++ driver version
db.Testing.aggregate(
    [
        //NOTE: Every document coming into this aggregate pipeline should have at least 1 category matching
        //this will project only the activities that match the user
        {
            $project: {
                "dFr": 1,
                matchLocation: 1,
                categories: 1,
                matchingActivities: {
                    $filter: {
                        input: "$categories",
                        cond: {
                            $and: [
                                {
                                    $eq: [
                                        "$$this.categoryActivityType",
                                        ACTIVITY_ENUM_TYPE
                                    ]
                                },
                                {
                                    $in: [
                                        "$$this.activityCategoryValue",
                                        USER_ACTIVITIES
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        },
        //this will project the categories that match the user IF no activities matched in previous step
        {
            $project: {
                "dFr": 1,
                matchLocation: 1,
                categories: {
                    $cond: {
                        //if no matching activities found, filter for matching categories,
                        if: {
                            $and: [
                                MATCH_CATEGORIES_AND_ACTIVITIES,
                                {
                                    $eq: [
                                        {
                                            $size: "$matchingActivities"
                                        },
                                        0
                                    ]
                                }
                            ]
                        },
                        //no matching activities found
                        then: {
                            $filter: {
                                input: "$categories",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$this.categoryActivityType",
                                                CATEGORY_ENUM_TYPE
                                            ]
                                        },
                                        {
                                            $in: [
                                                "$$this.activityCategoryValue",
                                                USER_CATEGORIES
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        //matching activities found
                        else: "$matchingActivities"
                    }
                }
            }
        },
        //removes times that are from the past and replaces the most recent start time with present time
        //IMPORTANT: The time frames are expected to be ordered by time before this is called.
        //also calculates total amount of time the time frame represents
        {
            $addFields: {
                categories: {
                    $map: {
                        input: "$categories",
                        as: "cArr",
                        in: {
                            $let: {
                                vars: {
                                    timeFrameData: {
                                        $reduce: {
                                            input: "$$cArr.timeFrames",
                                            initialValue: {
                                                totalTime: 0,
                                                timeFrames: [],
                                                previousTime: 0,
                                                previousTimeAboveNow: false
                                            },
                                            in: {
                                                $let: {
                                                    vars: {
                                                        timeAboveNow: {
                                                            $gt: [
                                                                "$$this.time",
                                                                EARLIEST_START_TIME
                                                            ]
                                                        }
                                                    },
                                                    in: {
                                                        previousTimeAboveNow: "$$timeAboveNow",
                                                        previousTime: "$$this.time",
                                                        totalTime: {
                                                            $add: [
                                                                "$$value.totalTime",
                                                                {
                                                                    $cond: {
                                                                        if: {
                                                                            $and: [
                                                                                {
                                                                                    $eq: [
                                                                                        "$$this.startStopValue",
                                                                                        -1
                                                                                    ]
                                                                                },
                                                                                "$$timeAboveNow"
                                                                            ]
                                                                        },
                                                                        then: {
                                                                            $cond: {
                                                                                if: "$$value.previousTimeAboveNow",
                                                                                then: {$subtract: ["$$this.time", "$$value.previousTime"]},
                                                                                else: {$subtract: ["$$this.time", EARLIEST_START_TIME]}
                                                                            }
                                                                        },
                                                                        else: 000 //NOTE: converts to b_int64
                                                                    }
                                                                }
                                                            ]
                                                        },
                                                        timeFrames: {
                                                            $cond: {
                                                                if: "$$timeAboveNow",
                                                                then: {
                                                                    $cond: {
                                                                        if: {$and: [{$not: ["$$value.previousTimeAboveNow"]}, {$eq: ["$$this.startStopValue", -1]}]},
                                                                        then: {
                                                                            $concatArrays: ["$$value.timeFrames",
                                                                                [
                                                                                    {
                                                                                        time: EARLIEST_START_TIME + 1,
                                                                                        startStopValue: 1
                                                                                    },
                                                                                    {
                                                                                        time: "$$this.time",
                                                                                        startStopValue: "$$this.startStopValue"
                                                                                    }
                                                                                ]
                                                                            ]
                                                                        },
                                                                        else: {
                                                                            $concatArrays: [
                                                                                "$$value.timeFrames",
                                                                                [
                                                                                    {
                                                                                        time: "$$this.time",
                                                                                        startStopValue: "$$this.startStopValue"
                                                                                    }
                                                                                ]
                                                                            ]
                                                                        }
                                                                    }
                                                                },
                                                                else: "$$value.timeFrames"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: {$eq: [{$size: "$$timeFrameData.timeFrames"}, 0]},
                                        then: {
                                            categoryActivityType: "$$cArr.categoryActivityType",
                                            activityCategoryValue: "$$cArr.activityCategoryValue",
                                            totalMatchTime: TOTAL_TIME_FRAME,
                                            timeFrames: [
                                                {
                                                    time: EARLIEST_START_TIME + 1,
                                                    startStopValue: 1
                                                },
                                                {
                                                    time: MAX_POSSIBLE_TIME,
                                                    startStopValue: -1
                                                }
                                            ]
                                        },
                                        else: {
                                            categoryActivityType: "$$cArr.categoryActivityType",
                                            activityCategoryValue: "$$cArr.activityCategoryValue",
                                            totalMatchTime: "$$timeFrameData.totalTime",
                                            timeFrames: "$$timeFrameData.timeFrames"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        //NOTE: could be added to filter above but trimming time frames will be faster if done first
        //IMPORTANT: The time frames are expected to be ordered by time before this is called. And each activity should
        // have at least two times present (the start and stop time for anytime would be the minimum).
        //merges the match time frames with the user time frames
        {
            $addFields: {
                categories: {
                    $map: {
                        input: "$categories",
                        as: "cArr",
                        in: {
                            categoryActivityType: "$$cArr.categoryActivityType",
                            activityCategoryValue: "$$cArr.activityCategoryValue",
                            totalMatchTime: "$$cArr.totalMatchTime",

                            timeFrames: { //runs a merge on the two arrays and stores them in timeFrames
                                $let: {
                                    vars: {
                                        timeFramesArray: { //extracts the time frame array for the calling user that matches the activity/category index
                                            $cond: {
                                                if: {
                                                    $eq: [
                                                        "$$cArr.categoryActivityType",
                                                        CATEGORY_ENUM_TYPE
                                                    ]
                                                },
                                                //if category
                                                then: {
                                                    $switch: {
                                                        branches: [
                                                            {
                                                                case: {$eq: [CATEGORY_FIRST, "$$cArr.activityCategoryValue"]},
                                                                then: USER_TIMEFRAME_CATEGORY_FIRST
                                                            },
                                                            {
                                                                case: {$eq: [CATEGORY_SECOND, "$$cArr.activityCategoryValue"]},
                                                                then: USER_TIMEFRAME_CATEGORY_SECOND
                                                            },
                                                        ],
                                                        default: [
                                                            {
                                                                time: EARLIEST_START_TIME + 1,
                                                                startStopValue: 1
                                                            },
                                                            {
                                                                time: MAX_POSSIBLE_TIME,
                                                                startStopValue: -1
                                                            }
                                                        ]
                                                    }
                                                },
                                                //if activity
                                                else: {
                                                    $switch: {
                                                        branches: [
                                                            {
                                                                case: {$eq: [ACTIVITY_FIRST, "$$cArr.activityCategoryValue"]},
                                                                then: USER_TIMEFRAME_ACTIVITY_FIRST
                                                            },
                                                            {
                                                                case: {$eq: [ACTIVITY_SECOND, "$$cArr.activityCategoryValue"]},
                                                                then: USER_TIMEFRAME_ACTIVITY_SECOND
                                                            },
                                                        ],
                                                        default: [
                                                            {
                                                                time: EARLIEST_START_TIME + 1,
                                                                startStopValue: 1
                                                            },
                                                            {
                                                                time: MAX_POSSIBLE_TIME,
                                                                startStopValue: -1
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    in: {
                                        $let: {
                                            vars: {
                                                timeStats: {
                                                    $reduce: {
                                                        input: {
                                                            $range: [
                                                                0,
                                                                {
                                                                    $add: [
                                                                        {$size: "$$cArr.timeFrames"},
                                                                        {$size: "$$timeFramesArray"}
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        initialValue: {timeFrames: [], userIndex: 0, matchIndex: 0},//, test: []},
                                                        in: {
                                                            //every time frame array must be at least a size of 2 so default start of 0
                                                            $let: {
                                                                vars: {
                                                                    userArrayVal: {
                                                                        $cond: {
                                                                            if: {$lt: ["$$value.userIndex", {$size: "$$timeFramesArray"}]},
                                                                            then: {$arrayElemAt: ["$$timeFramesArray", "$$value.userIndex"]},
                                                                            else: {
                                                                                time: NUMBER_BIGGER_THAN_UNIX_TIMESTAMP,
                                                                                startStopValue: 0 //this is here because short-circuiting does not exist in pipeline
                                                                            }
                                                                        }
                                                                    },
                                                                    matchArrayVal: {
                                                                        $cond: {
                                                                            if: {$lt: ["$$value.matchIndex", {$size: "$$cArr.timeFrames"}]},
                                                                            then: {$arrayElemAt: ["$$cArr.timeFrames", "$$value.matchIndex"]},
                                                                            else: {
                                                                                time: NUMBER_BIGGER_THAN_UNIX_TIMESTAMP,
                                                                                startStopValue: 0 //this is here because short-circuiting does not exist in pipeline
                                                                            }
                                                                        }
                                                                    },
                                                                },
                                                                in: {
                                                                    //1 = insert user, 2 = insert match
                                                                    $let: {
                                                                        vars: {
                                                                            arrayElementMatch: {
                                                                                $cond: {
                                                                                    if: {
                                                                                        $or: [
                                                                                            {$lt: ["$$userArrayVal.time", "$$matchArrayVal.time"]},
                                                                                            {
                                                                                                $and: [
                                                                                                    {$eq: ["$$userArrayVal.time", "$$matchArrayVal.time"]},
                                                                                                    {$eq: ["$$userArrayVal.startStopValue", 1]}
                                                                                                ]
                                                                                            }
                                                                                        ]
                                                                                    },
                                                                                    then: false,
                                                                                    else: true
                                                                                }
                                                                            }
                                                                        },
                                                                        in: {
                                                                            timeFrames: {
                                                                                $cond: {
                                                                                    if: {
                                                                                        $eq: ["$$arrayElementMatch", false]
                                                                                    },
                                                                                    then: {
                                                                                        $concatArrays: ["$$value.timeFrames", ["$$userArrayVal"]]
                                                                                    },
                                                                                    else: {
                                                                                        $concatArrays: ["$$value.timeFrames", ["$$matchArrayVal"]]
                                                                                    }
                                                                                }
                                                                            },
                                                                            userIndex: {
                                                                                $cond: {
                                                                                    if: {$eq: ["$$arrayElementMatch", false]},
                                                                                    then: {$add: ["$$value.userIndex", 1]},
                                                                                    else: "$$value.userIndex"
                                                                                }
                                                                            },
                                                                            matchIndex: {
                                                                                $cond: {
                                                                                    if: {$eq: ["$$arrayElementMatch", true]},
                                                                                    then: {$add: ["$$value.matchIndex", 1]},
                                                                                    else: "$$value.matchIndex"
                                                                                }
                                                                            }
                                                                            // test: {$concatArrays: ["$$value.test", [{_userIndex: "$$value.userIndex", _userArrayVal: "$$userArrayVal",
                                                                            // _matchIndex: "$$value.matchIndex", _matchArrayVal: "$$matchArrayVal", _arrayElementMatch: "$$value.userIndex",
                                                                            // _matchSize: {$size: "$$cArr.timeFrames"}}]]}
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            },
                                            in: "$$timeStats.timeFrames"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        //NOTE: 000 will be translated into C++ bsoncxx::types::b_int64{ 0 }
        //NOTE: 001 will be translated into C++ bsoncxx::types::b_int64{ 1 }
        //calculates and projects overlap time and time between timeframes
        {
            $addFields: {
                categories: {
                    $map: {
                        input: "$categories",
                        as: "cArr",
                        in: {
                            $let: {
                                vars: {
                                    timeFrameData:
                                        {
                                            $reduce: {
                                                input: "$$cArr.timeFrames",
                                                initialValue: {
                                                    totalOverlapTime: 000,
                                                    betweenTimesArray: [],
                                                    nestedValue: 0,
                                                    overlapStartTime: 000,
                                                    betweenStopTime: 000,
                                                    previousTypeUser: false,
                                                    matchExpirationTime: 000,
                                                    matchExpirationTimeSetTo: 0 //functions like an enum 0 means unset; 1 means set to a 'before time'; 2 means set to an 'overlap time'
                                                },//, _test: []},
                                                in: {
                                                    $let: {
                                                        vars: {
                                                            currNestedValue: {$add: ["$$this.startStopValue", "$$value.nestedValue"]},
                                                            expirationOverlapCheck: {
                                                                $and: [
                                                                    {$lt: ["$$value.matchExpirationTimeSetTo", 2]},
                                                                    {$eq: ["$$this.startStopValue", -1]},
                                                                    {$eq: ["$$value.nestedValue", 2]}
                                                                    //{$eq: ["$$value.totalOverlapTime", 0]} //turning this off, want the final overlap time to be the expiration time if multiple exist
                                                                ]
                                                            }, //stop time set to overlap time
                                                            betweenCheck: {
                                                                $and: [
                                                                    {$ne: ["$$value.betweenStopTime", 0]},
                                                                    {$ne: ["$$value.previousTypeUser", "$$this.user"]},
                                                                    {$lt: [{$subtract: ["$$this.time", "$$value.betweenStopTime"]}, MAX_BETWEEN_TIME]}
                                                                ]
                                                            }, //stop time set to between time
                                                            betweenCheckSecond: {
                                                                $and: [
                                                                    {$ne: ["$$value.previousTypeUser", "$$this.user"]},
                                                                    {$eq: [{$subtract: ["$$this.time", "$$value.overlapStartTime"]}, 0]}
                                                                ]
                                                            } //if a start and stop time are directly on top of each other save as between time
                                                        },
                                                        in: {
                                                            totalOverlapTime: {
                                                                $add: [
                                                                    "$$value.totalOverlapTime",
                                                                    {
                                                                        $cond:
                                                                            {
                                                                                if: {$and: [{$eq: ["$$this.startStopValue", -1]}, {$eq: ["$$currNestedValue", 1]}]},
                                                                                then: {$subtract: ["$$this.time", "$$value.overlapStartTime"]},
                                                                                else: 000
                                                                            }
                                                                    }
                                                                ]
                                                            },
                                                            matchExpirationTime: {
                                                                $switch: {
                                                                    branches: [
                                                                        {
                                                                            case: "$$expirationOverlapCheck",
                                                                            then: "$$this.time"
                                                                        },
                                                                        {
                                                                            case: {$and: [{$eq: ["$$value.matchExpirationTimeSetTo", 0]}, {$or: ["$$betweenCheck", "$$betweenCheckSecond"]}]},
                                                                            then: "$$value.betweenStopTime"
                                                                        },
                                                                    ],
                                                                    default: "$$value.matchExpirationTime"
                                                                }
                                                            },
                                                            matchExpirationTimeSetTo: {
                                                                $switch: {
                                                                    branches: [
                                                                        {
                                                                            case: "$$expirationOverlapCheck",
                                                                            then: 2
                                                                        },
                                                                        {
                                                                            case: {
                                                                                $and: [
                                                                                    {$eq: ["$$value.matchExpirationTimeSetTo", 0]},
                                                                                    {$or: ["$$betweenCheck", "$$betweenCheckSecond"]}
                                                                                ]
                                                                            },
                                                                            then: 1
                                                                        },
                                                                    ],
                                                                    default: 0
                                                                }
                                                            },
                                                            betweenTimesArray: {
                                                                $switch: {
                                                                    branches: [
                                                                        {
                                                                            case: "$$betweenCheck",
                                                                            then: {$concatArrays: ["$$value.betweenTimesArray", [{$subtract: ["$$this.time", "$$value.betweenStopTime"]}]]}
                                                                        },
                                                                        {
                                                                            case: "$$betweenCheckSecond",
                                                                            then: {$concatArrays: ["$$value.betweenTimesArray", [000]]}
                                                                        }, //NOTE: 000 is on purpose, see above
                                                                    ],
                                                                    default: "$$value.betweenTimesArray"
                                                                }
                                                            },
                                                            overlapStartTime: {
                                                                $cond:
                                                                    {
                                                                        if: {
                                                                            $and: [
                                                                                {$eq: ["$$this.startStopValue", 1]},
                                                                                {$eq: ["$$currNestedValue", 2]}
                                                                            ]
                                                                        },
                                                                        then: "$$this.time",
                                                                        else: 000
                                                                    }
                                                            },
                                                            betweenStopTime: {
                                                                $cond:
                                                                    {
                                                                        if: {$eq: ["$$currNestedValue", 0]},
                                                                        then: "$$this.time",
                                                                        else: 000
                                                                    }
                                                            },
                                                            previousTypeUser: "$$this.user", //this can be either user==true OR user field does not exist
                                                            nestedValue: "$$currNestedValue",
                                                            // _test: {$concatArrays: ["$$value._test",[{totalOverlapTime: "$$value.totalOverlapTime",
                                                            // nestedValue: "$$value.nestedValue", overlapStartTime: "$$value.overlapStartTime", time: "$$this.time",
                                                            // startStopValue: "$$this.startStopValue", user: "$$this.user", matchExpirationTime: "$$value.matchExpirationTime",
                                                            // matchExpirationTimeSetTo: "$$value.matchExpirationTimeSetTo"}]]}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                },
                                in: {
                                    activityCategoryValue: "$$cArr.activityCategoryValue",
                                    categoryActivityType: "$$cArr.categoryActivityType",
                                    totalMatchTime: "$$cArr.totalMatchTime",
                                    totalUserTime: {
                                        $switch: {
                                            $cond: {
                                                if: {
                                                    $eq: [
                                                        "$$cArr.categoryActivityType",
                                                        CATEGORY_ENUM_TYPE
                                                    ]
                                                },
                                                //if category
                                                then: {
                                                    $switch: {
                                                        branches: [
                                                            {
                                                                case: {$eq: [CATEGORY_FIRST, "$$cArr.activityCategoryValue"]},
                                                                then: CATEGORY_SECOND_TOTAL_TIME
                                                            },
                                                            {
                                                                case: {$eq: [CATEGORY_SECOND, "$$cArr.activityCategoryValue"]},
                                                                then: CATEGORY_SECOND_TOTAL_TIME
                                                            },
                                                        ],
                                                        default: 001
                                                    }
                                                },
                                                //if activity
                                                else: {
                                                    $switch: {
                                                        branches: [
                                                            {
                                                                case: {$eq: [ACTIVITY_FIRST, "$$cArr.activityCategoryValue"]},
                                                                then: ACTIVITY_FIRST_TOTAL_TIME
                                                            },
                                                            {
                                                                case: {$eq: [ACTIVITY_SECOND, "$$cArr.activityCategoryValue"]},
                                                                then: ACTIVITY_SECOND_TOTAL_TIME
                                                            },
                                                        ],
                                                        default: 001
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    totalOverlapTime: "$$timeFrameData.totalOverlapTime",
                                    betweenTimesArray: "$$timeFrameData.betweenTimesArray",
                                    matchExpirationTime: {
                                        $cond: {
                                            if: {$eq: ["$$timeFrameData.matchExpirationTime", 0]},
                                            then: MAX_POSSIBLE_TIME,
                                            else: "$$timeFrameData.matchExpirationTime"
                                        }
                                    },
                                    //_test: "$$timeFrameData._test"
                                }
                            }
                        }
                    }
                }
            }
        },
        //NOTE: 0000 will be translated into C++ bsoncxx::types::b_double{ 0 }
        //calculate total points
        {
            $project: {
                "dFr": 1,
                matchLocation: 1,
                timeFalloff: {
                    $let: {
                        vars: {
                            matchedID: {
                                $reduce: {
                                    input: PREVIOUSLY_MATCHED_ACCOUNTS,
                                    initialValue: false,
                                    in: {
                                        $cond: {
                                            if: {$eq: ["$$this.previousOID", "$_id"]},
                                            then: "$$this",
                                            else: "$$value"
                                        }
                                    }
                                }
                            }
                        },
                        in: {
                            $cond: {
                                if: {$ne: ["$$matchedID", false]}, //if matchedID is not empty
                                then: {
                                    $let: {
                                        vars: {
                                            numerator:
                                                {$subtract: [MY_CURRENT_TIME, {"$toLong": "$$matchedID.lastTimeMatched"}]},
                                            denominator:
                                                {$multiply: [PREVIOUSLY_MATCHED_FALLOFF_TIME, "$$matchedID.numberTimesMatched"]}
                                        },
                                        in: {
                                            $cond: {
                                                if: {$and: [{$gt: ["$$denominator", 0]}, {$lt: ["$$numerator", "$$denominator"]}]},
                                                then: {$multiply: [-1, PREVIOUSLY_MATCHED_WEIGHT, {$subtract: [1, {$divide: ["$$numerator", "$$denominator"]}]}]},
                                                else: 0000
                                            }
                                        }
                                    }
                                },
                                else: 0000
                            }
                        }
                    }
                },
                inactivityPointsToSubtract: {
                    $multiply: [
                        {
                            $subtract:
                                [
                                    MY_CURRENT_TIME,
                                    {"$toLong": "$dFr"}
                                ]
                        },
                        INACTIVE_ACCOUNT_WEIGHT,
                        -1
                    ]
                },
                timeStats: {
                    $reduce: {
                        input: "$categories",
                        initialValue: {
                            matchExpirationTime: MAX_POSSIBLE_TIME,
                            categoryOrActivityPoints: 0,
                            activityStatistics: []
                        },
                        in: {
                            matchExpirationTime: {
                                $cond: {
                                    if: {$lt: ["$$this.matchExpirationTime", "$$value.matchExpirationTime"]},
                                    then: "$$this.matchExpirationTime",
                                    else: "$$value.matchExpirationTime"
                                }
                            },
                            categoryOrActivityPoints: {
                                $add:
                                    [
                                        "$$value.categoryOrActivityPoints",
                                        //add points for how well timeframes overlap
                                        {
                                            $let: {
                                                vars: {
                                                    overlapTimeWeight: {
                                                        $cond: {
                                                            if: {
                                                                $eq: [
                                                                    "$$this.categoryActivityType",
                                                                    CATEGORY_ENUM_TYPE
                                                                ]
                                                            },
                                                            then: OVERLAPPING_CATEGORY_TIMES_WEIGHT,
                                                            else: OVERLAPPING_ACTIVITY_TIMES_WEIGHT
                                                        }
                                                    },
                                                    shortOverlapTimeWeight: {
                                                        $cond: {
                                                            if: {
                                                                $eq: [
                                                                    "$$this.categoryActivityType",
                                                                    CATEGORY_ENUM_TYPE
                                                                ]
                                                            },
                                                            then: SHORT_TIMEFRAME_CATEGORY_OVERLAP_WEIGHT,
                                                            else: SHORT_TIMEFRAME_ACTIVITY_OVERLAP_WEIGHT
                                                        }
                                                    }
                                                },
                                                in: {
                                                    $cond: {
                                                        if: {$and: [
                                                                {$gt: ["$$this.totalOverlapTime", 0]},
                                                                {$gt: ["$$this.totalUserTime", 0]},
                                                                {$gt: ["$$this.totalMatchTime", 0]}
                                                            ]
                                                        },
                                                        then: {
                                                            $let: {
                                                                vars: {
                                                                    overlapRatio: {
                                                                        $cond: {
                                                                            if: {$gt: ["$$this.totalUserTime", "$$this.totalMatchTime"]},
                                                                            //NOTE: it is impossible for the values for totalUserTime and totalMatchTime to be 0 if totalOverlapTime is not 0
                                                                            then: {
                                                                                $divide: [
                                                                                    "$$this.totalOverlapTime",
                                                                                    "$$this.totalUserTime"
                                                                                ]
                                                                            },
                                                                            else: {
                                                                                $divide: [
                                                                                    "$$this.totalOverlapTime",
                                                                                    "$$this.totalMatchTime"
                                                                                ]
                                                                            }
                                                                        }
                                                                    },
                                                                    //added to the overlapTimeWeight to give shorter times more weight, see NOTE1 below for more info
                                                                    shortOverlapPoints: {
                                                                        $multiply: [
                                                                            {
                                                                                $subtract: [
                                                                                    1,
                                                                                    {
                                                                                        $divide: [
                                                                                            "$$this.totalOverlapTime",
                                                                                            TOTAL_TIME_FRAME
                                                                                        ]
                                                                                    }
                                                                                ]
                                                                            },
                                                                            "$$shortOverlapTimeWeight"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $multiply: [
                                                                        "$$overlapRatio",
                                                                        {
                                                                            $add: [
                                                                                "$$shortOverlapPoints",
                                                                                "$$overlapTimeWeight"
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        },
                                                        else: 0
                                                    }
                                                }
                                            }
                                        },
                                        //add points for how close timeframes
                                        {
                                            $let: {
                                                vars: {
                                                    betweenTimeWeight: {
                                                        $cond: {
                                                            if: {
                                                                $eq: [
                                                                    "$$this.categoryActivityType",
                                                                    CATEGORY_ENUM_TYPE
                                                                ]
                                                            },
                                                            then: BETWEEN_CATEGORY_TIMES_WEIGHT,
                                                            else: BETWEEN_ACTIVITY_TIMES_WEIGHT
                                                        }
                                                    }
                                                },
                                                in: {
                                                    $reduce: {
                                                        input: "$$this.betweenTimesArray",
                                                        initialValue: 0,
                                                        in: {
                                                            $add: [
                                                                "$$value",
                                                                {
                                                                    $multiply: [
                                                                        "$$betweenTimeWeight",
                                                                        {
                                                                            $subtract:
                                                                                [
                                                                                    1,
                                                                                    {
                                                                                        $divide:
                                                                                            [
                                                                                                "$$this",
                                                                                                MAX_BETWEEN_TIME
                                                                                            ]
                                                                                    }
                                                                                ]
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            $cond: {
                                                if: {
                                                    $eq: [
                                                        "$$this.categoryActivityType",
                                                        CATEGORY_ENUM_TYPE
                                                    ]
                                                },
                                                then: CATEGORIES_MATCH_WEIGHT,
                                                else: ACTIVITY_MATCH_WEIGHT
                                            }
                                        }
                                    ]
                            },
                            activityStatistics: {
                                $concatArrays: [
                                    "$$value.activityStatistics",
                                    [
                                        {
                                            activityCategoryValue: "$$this.activityCategoryValue",
                                            categoryActivityType: "$$this.categoryActivityType",
                                            totalUserTime: "$$this.totalUserTime",
                                            totalMatchTime: "$$this.totalMatchTime",
                                            totalOverlapTime: "$$this.totalOverlapTime",
                                            betweenTimesArray: "$$this.betweenTimesArray"
                                        }
                                    ]
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                finalPoints: {$add: ["$timeFalloff", "$timeStats.categoryOrActivityPoints", "$inactivityPointsToSubtract"]}
            }
        },
        //do the limit as soon as finalPoints can be calculated
        {$sort: {"finalPoints": -1}},
        {$limit: MAX_NUMBER_OF_MATCHES},
        //runs the final calculation and makes the document a bit 'neater'
        //NOTE: 0001 will be 1 with mongodb type double{}
        {
            $project: {
                distanceToUser: {
                    "$toDouble" : {
                        $let: {
            vars: {
                phi_two: {
                    $degreesToRadians: {
                        "$arrayElemAt": [
                            "$matchLocation.coordinates",
                            1
                        ]
                    }
                },
                delta_phi: {
                    $degreesToRadians: {
                        $subtract: [
                            {
                                "$arrayElemAt": [
                                    "$matchLocation.coordinates",
                                    1
                                ]
                            },
                            USER_LATITUDE
                        ]
                    }
                },
                delta_lambda: {
                    $degreesToRadians: {
                        $subtract: [
                            {
                                "$arrayElemAt": [
                                    "$matchLocation.coordinates",
                                    0
                                ]
                            },
                            USER_LONGITUDE
                        ]
                    }
                }
            },
            in: {
                $let: {
                    vars: {
                        sin_phi: {
                            $sin: {
                                $divide: [
                                    "$$delta_phi",
                                    2
                                ]
                            }
                        },
                        sin_lambda: {
                            $sin: {
                                $divide: [
                                    "$$delta_lambda",
                                    2
                                ]
                            }
                        }
                    },
                    in: {
                        $let: {
                            vars: {
                                temp_var: {
                                    $add: [
                                        {$multiply: ["$$sin_phi", "$$sin_phi"]},
                                        {
                                            $multiply: [
                                                {$cos: USER_LATITUDE_IN_RADIANS},
                                                {$cos: "$$phi_two"},
                                                {$multiply: ["$$sin_lambda", "$$sin_lambda"]}
                                            ]
                                        },
                                    ]
                                }
                            },
                            in: {
                                $multiply: [
                                    7917.51173148, //radius of earth in miles times 2 (converted from 6371 km then multiplied by 2)
                                    {
                                        $atan2: [
                                            {$sqrt: "$$temp_var"},
                                            {
                                                $sqrt: {
                                                    $subtract: [
                                                        1,
                                                        "$$temp_var"
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
                    }
                },
                matchExpirationTime: {
                    "$toLong" : "$timeStats.matchExpirationTime"
                },
                finalPoints: {
                    "$toDouble" : "$finalPoints"
                },
                matchStatistics: {
                    $mergeObjects: [{ //merge single document because the times don't seem to store in C++ with just the document used
                        "dFr": "$dFr",
                        currentTime: MY_CURRENT_TIME,
                        earliestStartTime: EARLIEST_START_TIME,
                        maxPossibleTime: MAX_POSSIBLE_TIME,
                        timeFalloff: {
                            "$toDouble" : "$timeFalloff"
                        },
                        categoryOrActivityPoints: {
                            "$toDouble" : "$timeStats.categoryOrActivityPoints"
                        },
                        inactivityPointsToSubtract: {
                            "$toDouble": "$inactivityPointsToSubtract"
                        },
                        activityStatistics: "$timeStats.activityStatistics",
                    }]
                }
            }
        },

    ]
).pretty()

/**
 * Below is a listing of an example document after each stage has completed (naming convention is from C++).
 */
/*generateProjectCategoriesPipelineStage()
{
    "_id" : { "$oid" : "61f2b11777235078b62119d2" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 9.6227307284960835192e-05,
    "aCa" : [
    {
        "tYp" : 0,
        "iAc" : 11,
        "aTf" : [

        ]
    }
]
}

generateAddFieldsTrimTimeFramePipelineStage()
{
    "_id" : { "$oid" : "61f2b11777235078b62119d2" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 9.6227307284960835192e-05,
    "aCa" : [
    {
        "tYp" : 0,
        "iAc" : 11,
        "tFm" : 1813500000,
        "aTf" : [
            {
                "dTf" : 1643577751109,
                "iSs" : 1
            },
            {
                "dTf" : 1645391251108,
                "iSs" : -1
            }
        ]
    }
]
}

generateAddTimeFramesMergeTimeFramesPipelineStage()
{
    "_id" : { "$oid" : "61f2b11777235078b62119d2" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 9.6227307284960835192e-05,
    "aCa" : [
    {
        "tYp" : 0,
        "iAc" : 11,
        "tFm" : 1813500000,
        "aTf" : [
            {
                "dTf" : 1643578370129,
                "iSs" : 1
            },
            {
                "dTf" : 1643578370129,
                "iSs" : 1
            },
            {
                "dTf" : 1645391870128,
                "iSs" : -1
            },
            {
                "dTf" : 1645391870128,
                "iSs" : -1
            }
        ]
    }
]
}

generateAddFieldsTimeFrameTimesStatsPipelineStage()
{
    "_id" : { "$oid" : "61f2b11777235078b62119d2" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 9.6227307284960835192e-05,
    "aCa" : [
    {
        "iAc" : 11,
        "tYp" : 0,
        "tFm" : 1813500000,
        "tUt" : 0,
        "tOp" : 1813499999,
        "bTa" : [

        ],
        "mEt" : 1645394881232
    }
]
}


generateProjectCalculateFinalTimePipelineStage()
{
    "_id" : { "$oid" : "61f2b11777235078b62119d2" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 9.6227307284960835192e-05,
    "tFo" : 0.0,
    "iPs" : -103761697.49078282714,
    "tSt" : {
    "mEt" : 1645399688253,
        "cAo" : 59999.99997298042581,
        "aCs" : null
}
}

generateAddFieldsFinalPoints()
{
    "_id" : { "$oid" : "61f2b1c377235078b624cd7e" },
    "dFr" : {
    "$date" : {
        "$numberLong" : "-1"
    }
},
    "dI" : 5.2567224997372861139,
    "tFo" : 0.0,
    "iPs" : -103761773.50505051017,
    "tSt" : {
    "mEt" : 1643630067413,
        "cAo" : 182154.71733246953227,
        "aCs" : [
        {
            "iAc" : 3,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 183591272,
            "tOp" : 183591271,
            "bTa" : [

            ]
        },
        {
            "iAc" : 5,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 740253441,
            "tOp" : 740253440,
            "bTa" : [

            ]
        },
        {
            "iAc" : 11,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 609074630,
            "tOp" : 609074629,
            "bTa" : [

            ]
        }
    ]
},
    "fPt" : -103579618.78771804273
}

generateProjectCleanUpPipelineStage()
{
    "_id" : { "$oid" : "61f2b1c377235078b624cd7e" },
    "dI" : 5.2567224997372861139,
    "fPt" : -103579643.19539994001,
    "mEt" : 1643630067413,
    "mSt" : {
    "dFr" : {
        "$date" : {
            "$numberLong" : "-1"
        }
    },
    "tMR" : 1643586889340,
        "eST" : 1643587789340,
        "mPt" : 1645401289340,
        "tFo" : 0.0,
        "cAo" : 182155.37410762376385,
        "iPs" : -103761798.56950756907,
        "aCs" : [
        {
            "iAc" : 3,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 183194251,
            "tOp" : 183194250,
            "bTa" : [

            ]
        },
        {
            "iAc" : 5,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 739856420,
            "tOp" : 739856419,
            "bTa" : [

            ]
        },
        {
            "iAc" : 11,
            "tYp" : 0,
            "tUt" : 0,
            "tFm" : 608677609,
            "tOp" : 608677608,
            "bTa" : [

            ]
        }
    ]
}
}*/

/**NOTE1:
 * shortOverlapPoints adds points for short overlapping timeframes, this is because of a situation
 * say userA has Golf 5:00-6:00 and Soccer for ANYTIME
 * match1 has Golf 5:00-6:00
 * match2 has Soccer for ANYTIME
 * ideally match1 is a better match for the user, however with only calculating overlaps
 *  match1 and match2 are equal, the document fixes this problem by acting as a tiebreaker of sorts
 * (1- timeStats.totalOverlapTime/TOTAL_TIME_FRAME) * SHORT_TIMEFRAME_OVERLAP_WEIGHT **/

// //OBSOLETE, must sort ALL existing unwound timeFrames simultaneously, merged the arrays instead
// //concatenates the user time frames to the match time frames
// {$project: { unique: { $concat: [ {$toString: "$_id"}, {$toString: "$categories.activity"} ] },
// "aR": "$aR", "aT": "$aT",
//   categories: { activity: "$categories.activity",
// totalMatchTime: "$categories.totalMatchTime",
// timeFrames: {$concatArrays: ["$categories.timeFrames", USER_TIMEFRAMES]}}}},
// {$unwind: { path: "$categories.timeFrames", preserveNullAndEmptyArrays: true }},
// //sorts all timeFrames
// {$sort: {"categories.timeFrames.time": 1}}, //secondary sort doesn't matter here, the difference in times is 0
// //groups unwound categories
// {$group: { _id: "$unique", storingID: {$first: "$_id"},
// "aR": {$first: "$aR"}, "dFr": {$first: "$aT"},
// activity: { $first: "$categories.activity" },
//  totalMatchTime: {$first: "$categories.totalMatchTime"}, timeFrames: { $push: "$categories.timeFrames"}}},

/*
db.Testing.aggregate(
    [
        //NOTE: Every document coming into this aggregate pipeline should have at least 1 category matching
        //this will project only the activities that match the user
        {
            $project: {
                "dFr": "$dFr",
                distanceToUser: "$distanceToUser",
                categories: "$categories",
                matchingActivities: {
                    $filter: {
                        input: "$categories",
                        cond: {
                            $and: [
                                {
                                    $eq: [
                                        "$$this.categoryActivityType",
                                        ACTIVITY_ENUM_TYPE
                                    ]
                                },
                                {
                                    $in: [
                                        "$$this.activityCategoryValue",
                                        USER_ACTIVITIES
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        },
        //this will project the categories that match the user IF no activities matched in previous step
        {
            $project: {
                "dFr": "$dFr",
                distanceToUser: "$distanceToUser",
                categories: {
                    $cond: {
                        //if no matching activities found, filter for matching categories,
                        if: {
                            $eq: [
                                {
                                    $size: "$matchingActivities"
                                },
                                0
                            ]
                        },
                        //no matching activities found
                        then: {
                            $filter: {
                                input: "$categories",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$this.categoryActivityType",
                                                CATEGORY_ENUM_TYPE
                                            ]
                                        },
                                        {
                                            $in: [
                                                "$$this.activityCategoryValue",
                                                USER_CATEGORIES
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        //matching activities found
                        else: "$matchingActivities"
                    }
                }
            }
        },
        {
            $unwind: "$categories"
        },
        //removes times that are from the past and replaces the most recent start time with present time
        //also calculates total amount of time the time frame represents
        {
            $project: {
                "dFr": "$dFr",
                distanceToUser: "$distanceToUser",
                categories: {
                    $let: {
                        vars: {
                            timeFrameData: {
                                $reduce: {
                                    input: "$categories.timeFrames",
                                    initialValue: {
                                        totalTime: 0,
                                        timeFrames: [],
                                        previousTime: 0,
                                        previousTimeAboveNow: false
                                    },
                                    in: {
                                        $let: {
                                            vars: {
                                                timeAboveNow: {
                                                    $gt: [
                                                        "$$this.time",
                                                        EARLIEST_START_TIME
                                                    ]
                                                }
                                            },
                                            in: {
                                                previousTimeAboveNow: "$$timeAboveNow",
                                                previousTime: "$$this.time",
                                                totalTime: {
                                                    $add: [
                                                        "$$value.totalTime",
                                                        {
                                                            $cond: {
                                                                if: {
                                                                    $and: [
                                                                        {
                                                                            $eq: [
                                                                                "$$this.startStopValue",
                                                                                -1
                                                                            ]
                                                                        },
                                                                        "$$timeAboveNow"
                                                                    ]
                                                                },
                                                                then: {
                                                                    $cond: {
                                                                        if: "$$value.previousTimeAboveNow",
                                                                        then: {$subtract: ["$$this.time", "$$value.previousTime"]},
                                                                        else: {$subtract: ["$$this.time", EARLIEST_START_TIME]}
                                                                    }
                                                                },
                                                                else: 000 //NOTE: converts to b_int64
                                                            }
                                                        }
                                                    ]
                                                },
                                                timeFrames: {
                                                    $cond: {
                                                        if: "$$timeAboveNow",
                                                        then: {
                                                            $cond: {
                                                                if: {$and: [{$not: ["$$value.previousTimeAboveNow"]}, {$eq: ["$$this.startStopValue", -1]}]},
                                                                then: {
                                                                    $concatArrays: ["$$value.timeFrames",
                                                                        [
                                                                            {
                                                                                time: EARLIEST_START_TIME + 1,
                                                                                startStopValue: 1
                                                                            },
                                                                            {
                                                                                time: "$$this.time",
                                                                                startStopValue: "$$this.startStopValue"
                                                                            }
                                                                        ]
                                                                    ]
                                                                },
                                                                else: {
                                                                    $concatArrays: [
                                                                        "$$value.timeFrames",
                                                                        [
                                                                            {
                                                                                time: "$$this.time",
                                                                                startStopValue: "$$this.startStopValue"
                                                                            }
                                                                        ]
                                                                    ]
                                                                }
                                                            }
                                                        },
                                                        else: "$$value.timeFrames"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        in: {
                            $cond: {
                                if: {$eq: [{$size: "$$timeFrameData.timeFrames"}, 0]},
                                then: {
                                    activityCategoryValue: "$categories.activityCategoryValue",
                                    categoryActivityType: "$categories.categoryActivityType",
                                    totalMatchTime: TOTAL_TIME_FRAME,
                                    timeFrames: [
                                        {
                                            time: EARLIEST_START_TIME + 1,
                                            startStopValue: 1
                                        },
                                        {
                                            time: MAX_POSSIBLE_TIME,
                                            startStopValue: -1
                                        }
                                    ]
                                },
                                else: {
                                    activityCategoryValue: "$categories.activityCategoryValue",
                                    categoryActivityType: "$categories.categoryActivityType",
                                    totalMatchTime: "$$timeFrameData.totalTime",
                                    timeFrames: "$$timeFrameData.timeFrames"
                                }
                            }
                        }
                    }
                }
            }
        },
        //NOTE: could be added to filter above but trimming time frames will be faster if done first
        //merges the match time frames with the user time frames
        {
            $project: {
                "dFr": "$dFr",
                activityCategoryValue: "$categories.activityCategoryValue",
                categoryActivityType: "$categories.categoryActivityType",
                totalMatchTime: "$categories.totalMatchTime",
                distanceToUser: "$distanceToUser",
                timeFrames: { //runs a merge on the two arrays and stores them in timeFrames
                    $let: {
                        vars: {
                            timeFramesArray: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            "$categories.categoryActivityType",
                                            CATEGORY_ENUM_TYPE
                                        ]
                                    },
                                    //if category
                                    then: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: {$eq: [CATEGORY_FIRST, "$categories.activityCategoryValue"]},
                                                    then: USER_TIMEFRAME_CATEGORY_FIRST
                                                },
                                                {
                                                    case: {$eq: [CATEGORY_SECOND, "$categories.activityCategoryValue"]},
                                                    then: USER_TIMEFRAME_CATEGORY_SECOND
                                                },
                                            ],
                                            default: [
                                                {
                                                    time: EARLIEST_START_TIME + 1,
                                                    startStopValue: 1
                                                },
                                                {
                                                    time: MAX_POSSIBLE_TIME,
                                                    startStopValue: -1
                                                }
                                            ]
                                        }
                                    },
                                    //if activity
                                    else: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: {$eq: [ACTIVITY_FIRST, "$categories.activityCategoryValue"]},
                                                    then: USER_TIMEFRAME_ACTIVITY_FIRST
                                                },
                                                {
                                                    case: {$eq: [ACTIVITY_SECOND, "$categories.activityCategoryValue"]},
                                                    then: USER_TIMEFRAME_ACTIVITY_SECOND
                                                },
                                            ],
                                            default: [
                                                {
                                                    time: EARLIEST_START_TIME + 1,
                                                    startStopValue: 1
                                                },
                                                {
                                                    time: MAX_POSSIBLE_TIME,
                                                    startStopValue: -1
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        in: {
                            $let: {
                                vars: {
                                    timeStats: {
                                        $reduce: {
                                            input: {
                                                $range: [
                                                    0,
                                                    {
                                                        $add: [
                                                            {$size: "$categories.timeFrames"},
                                                            {$size: "$$timeFramesArray"}
                                                        ]
                                                    }
                                                ]
                                            },
                                            initialValue: {timeFrames: [], userIndex: 0, matchIndex: 0},//, test: []},
                                            in: {
                                                //every time frame array must be at least a size of 2 so default start of 0
                                                $let: {
                                                    vars: {
                                                        userArrayVal: {
                                                            $cond: {
                                                                if: {$lt: ["$$value.userIndex", {$size: "$$timeFramesArray"}]},
                                                                then: {$arrayElemAt: ["$$timeFramesArray", "$$value.userIndex"]},
                                                                else: {time: NUMBER_BIGGER_THAN_UNIX_TIMESTAMP}
                                                            }
                                                        },
                                                        matchArrayVal: {
                                                            $cond: {
                                                                if: {$lt: ["$$value.matchIndex", {$size: "$categories.timeFrames"}]},
                                                                then: {$arrayElemAt: ["$categories.timeFrames", "$$value.matchIndex"]},
                                                                else: {time: NUMBER_BIGGER_THAN_UNIX_TIMESTAMP}
                                                            }
                                                        },
                                                    },
                                                    in: {
                                                        //1 = insert user, 2 = insert match
                                                        $let: {
                                                            vars: {
                                                                arrayElementMatch: {
                                                                    $cond: {
                                                                        if: {
                                                                            $or: [
                                                                                {$lt: ["$$userArrayVal.time", "$$matchArrayVal.time"]},
                                                                                {
                                                                                    $and: [
                                                                                        {$eq: ["$$userArrayVal.time", "$$matchArrayVal.time"]},
                                                                                        {$eq: ["$$userArrayVal.startStopValue", 1]}
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        },
                                                                        then: false,
                                                                        else: true
                                                                    }
                                                                }
                                                            },
                                                            in: {
                                                                timeFrames: {
                                                                    $cond: {
                                                                        if: {
                                                                            $eq: ["$$arrayElementMatch", false]
                                                                        },
                                                                        then: {
                                                                            $concatArrays: ["$$value.timeFrames", ["$$userArrayVal"]]
                                                                        },
                                                                        else: {
                                                                            $concatArrays: ["$$value.timeFrames", ["$$matchArrayVal"]]
                                                                        }
                                                                    }
                                                                },
                                                                userIndex: {
                                                                    $cond: {
                                                                        if: {$eq: ["$$arrayElementMatch", false]},
                                                                        then: {$add: ["$$value.userIndex", 1]},
                                                                        else: "$$value.userIndex"
                                                                    }
                                                                },
                                                                matchIndex: {
                                                                    $cond: {
                                                                        if: {$eq: ["$$arrayElementMatch", true]},
                                                                        then: {$add: ["$$value.matchIndex", 1]},
                                                                        else: "$$value.matchIndex"
                                                                    }
                                                                }
                                                                // test: {$concatArrays: ["$$value.test", [{_userIndex: "$$value.userIndex", _userArrayVal: "$$userArrayVal",
                                                                // _matchIndex: "$$value.matchIndex", _matchArrayVal: "$$matchArrayVal", _arrayElementMatch: "$$value.userIndex",
                                                                // _matchSize: {$size: "$categories.timeFrames"}}]]}
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                in: "$$timeStats.timeFrames"
                            }
                        }
                    }
                }
            }
        },
        //NOTE: 000 will be translated into C++ bsoncxx::types::b_int64{ 0 }
        //calculates and projects overlap time and time between timeframes
        {
            $project: {
                activityCategoryValue: "$activityCategoryValue",
                categoryActivityType: "$categoryActivityType",
                "dFr": "$dFr",
                distanceToUser: "$distanceToUser",
                timeStats: {
                    $let: {
                        vars: {
                            timeFrameData:
                                {
                                    $reduce: {
                                        input: "$timeFrames",
                                        initialValue: {
                                            totalOverlapTime: 000,
                                            betweenTimesArray: [],
                                            nestedValue: 0,
                                            overlapStartTime: 000,
                                            betweenStopTime: 000,
                                            previousTypeUser: false,
                                            matchExpirationTime: 000,
                                            matchExpirationTimeSetTo: 0
                                        },//, _test: []}, //in overlapStopTimeSetTo 1 means set to a 'before time' 2 means set to a 'overlap time'
                                        in: {
                                            $let: {
                                                vars: {
                                                    currNestedValue: {$add: ["$$this.startStopValue", "$$value.nestedValue"]},
                                                    expirationOverlapCheck: {
                                                        $and: [
                                                            {$lt: ["$$value.matchExpirationTimeSetTo", 2]},
                                                            {$eq: ["$$this.startStopValue", -1]},
                                                            {$eq: ["$$value.nestedValue", 2]},
                                                            {$eq: ["$$value.totalOverlapTime", 0]}
                                                        ]
                                                    }, //stop time set to overlap time
                                                    betweenCheck: {
                                                        $and: [
                                                            {$ne: ["$$value.betweenStopTime", 0]},
                                                            {$ne: ["$$value.previousTypeUser", "$$this.user"]},
                                                            {$lt: [{$subtract: ["$$this.time", "$$value.betweenStopTime"]}, MAX_BETWEEN_TIME]}
                                                        ]
                                                    }, //stop time set to between time
                                                    betweenCheckSecond: {
                                                        $and: [
                                                            {$ne: ["$$value.previousTypeUser", "$$this.user"]},
                                                            {$eq: [{$subtract: ["$$this.time", "$$value.overlapStartTime"]}, 0]}
                                                        ]
                                                    } //if a start and stop time are directly on top of each other save as between time
                                                },
                                                in: {
                                                    totalOverlapTime: {
                                                        $add: [
                                                            "$$value.totalOverlapTime",
                                                            {
                                                                $cond:
                                                                    {
                                                                        if: {$and: [{$eq: ["$$this.startStopValue", -1]}, {$eq: ["$$currNestedValue", 1]}]},
                                                                        then: {$subtract: ["$$this.time", "$$value.overlapStartTime"]},
                                                                        else: 000
                                                                    }
                                                            }
                                                        ]
                                                    },
                                                    matchExpirationTime: {
                                                        $switch: {
                                                            branches: [
                                                                {
                                                                    case: "$$expirationOverlapCheck",
                                                                    then: "$$this.time"
                                                                },
                                                                {
                                                                    case: {$and: [{$eq: ["$$value.matchExpirationTimeSetTo", 0]}, {$or: ["$$betweenCheck", "$$betweenCheckSecond"]}]},
                                                                    then: "$$value.betweenStopTime"
                                                                },
                                                            ],
                                                            default: "$$value.matchExpirationTime"
                                                        }
                                                    },
                                                    matchExpirationTimeSetTo: {
                                                        $switch: {
                                                            branches: [
                                                                {
                                                                    case: "$$expirationOverlapCheck",
                                                                    then: 2
                                                                },
                                                                {
                                                                    case: {
                                                                        $and: [
                                                                            {$eq: ["$$value.matchExpirationTimeSetTo", 0]},
                                                                            {$or: ["$$betweenCheck", "$$betweenCheckSecond"]}
                                                                        ]
                                                                    },
                                                                    then: 1
                                                                },
                                                            ],
                                                            default: "$$value.matchExpirationTimeSetTo"
                                                        }
                                                    },
                                                    betweenTimesArray: {
                                                        $switch: {
                                                            branches: [
                                                                {
                                                                    case: "$$betweenCheck",
                                                                    then: {$concatArrays: ["$$value.betweenTimesArray", [{$subtract: ["$$this.time", "$$value.betweenStopTime"]}]]}
                                                                },
                                                                {
                                                                    case: "$$betweenCheckSecond",
                                                                    then: {$concatArrays: ["$$value.betweenTimesArray", [000]]}
                                                                }, //NOTE: 000 is on purpose, see above
                                                            ],
                                                            default: "$$value.betweenTimesArray"
                                                        }
                                                    },
                                                    overlapStartTime: {
                                                        $cond:
                                                            {
                                                                if: {
                                                                    $and: [
                                                                        {$eq: ["$$this.startStopValue", 1]},
                                                                        {$eq: ["$$currNestedValue", 2]}
                                                                    ]
                                                                },
                                                                then: "$$this.time",
                                                                else: 000
                                                            }
                                                    },
                                                    betweenStopTime: {
                                                        $cond:
                                                            {
                                                                if: {$eq: ["$$currNestedValue", 0]},
                                                                then: "$$this.time",
                                                                else: 000
                                                            }
                                                    },
                                                    previousTypeUser: "$$this.user",
                                                    nestedValue: "$$currNestedValue",
                                                    // _test: {$concatArrays: ["$$value._test",[{totalOverlapTime: "$$value.totalOverlapTime",
                                                    // nestedValue: "$$value.nestedValue", overlapStartTime: "$$value.overlapStartTime", time: "$$this.time",
                                                    // startStopValue: "$$this.startStopValue", user: "$$this.user", matchExpirationTime: "$$value.matchExpirationTime",
                                                    // matchExpirationTimeSetTo: "$$value.matchExpirationTimeSetTo"}]]}
                                                }
                                            }
                                        }
                                    }
                                }
                        },
                        in: {
                            totalMatchTime: "$totalMatchTime",
                            totalUserTime: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {$eq: [ACTIVITY_FIRST, "$activityCategoryValue"]},
                                            then: ACTIVITY_FIRST_TOTAL_TIME
                                        },
                                        {
                                            case: {$eq: [ACTIVITY_SECOND, "$activityCategoryValue"]},
                                            then: ACTIVITY_SECOND_TOTAL_TIME
                                        },
                                    ],
                                    default: 000
                                }
                            },
                            totalOverlapTime: "$$timeFrameData.totalOverlapTime",
                            betweenTimesArray: "$$timeFrameData.betweenTimesArray",
                            matchExpirationTime: {
                                $cond: {
                                    if: {$eq: ["$$timeFrameData.matchExpirationTime", 0]},
                                    then: MAX_POSSIBLE_TIME,
                                    else: "$$timeFrameData.matchExpirationTime"
                                }
                            },
                            //_test: "$$timeFrameData._test"
                        }
                    }
                }
            }
        },
        //NOTE: 0000 will be translated into C++ bsoncxx::types::b_double{ 0 }
        //calculate total points
        {
            $group: {
                _id: "$_id",
                "dFr": {$first: "$dFr"},
                distanceToUser: {$first: "$distanceToUser"},
                matchExpirationTime: {$min: "$timeStats.matchExpirationTime"},
                timeFalloff: {
                    $first: {
                        $let: {
                            vars: {
                                matchedID: {
                                    $reduce: {
                                        input: PREVIOUSLY_MATCHED_ACCOUNTS,
                                        initialValue: 0000,
                                        in: {
                                            initialValue: {
                                                $cond: {
                                                    if: {$eq: ["$$this.previousOID", "$_id"]},
                                                    then: "$$this",
                                                    else: "$$value"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: {$ne: ["$$matchedID", [0]]}, //if matchedID is not empty
                                    then: {
                                        $let: {
                                            vars: {
                                                numerator:
                                                    {$subtract: [MY_CURRENT_TIME, {"$toLong": "$$matchedID.initialValue.lastTimeMatched"}]},
                                                denominator:
                                                    {$multiply: [PREVIOUSLY_MATCHED_FALLOFF_TIME, "$$matchedID.initialValue.numberTimesMatched"]}
                                            },
                                            in: {
                                                $cond: {
                                                    if: {$lt: ["$$numerator", "$$denominator"]},
                                                    then: {$multiply: [-1, PREVIOUSLY_MATCHED_WEIGHT, "$$matchedID.initialValue.numberTimesMatched", {$subtract: [1, {$divide: ["$$numerator", "$$denominator"]}]}]},
                                                    else: 0000
                                                }
                                            }
                                        }
                                    },
                                    else: 0000
                                }
                            }
                        }
                    }
                },
                inactivityPointsToSubtract: {
                    $first: {
                        $multiply: [
                            {
                                $subtract:
                                    [
                                        MY_CURRENT_TIME,
                                        {"$toLong": "$dFr"}
                                    ]
                            },
                            INACTIVE_ACCOUNT_WEIGHT,
                            -1
                        ]
                    }
                },
                categoryOrActivityPoints: {
                    $sum: {
                        $add:
                            [
                                //add points for how well timeframes overlap
                                {
                                    $let: {
                                        vars: {
                                            overlapTimeWeight: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$categoryActivityType",
                                                            CATEGORY_ENUM_TYPE
                                                        ]
                                                    },
                                                    then: OVERLAPPING_CATEGORY_TIMES_WEIGHT,
                                                    else: OVERLAPPING_ACTIVITY_TIMES_WEIGHT
                                                }
                                            },
                                            shortOverlapTimeWeight: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$categoryActivityType",
                                                            CATEGORY_ENUM_TYPE
                                                        ]
                                                    },
                                                    then: SHORT_TIMEFRAME_CATEGORY_OVERLAP_WEIGHT,
                                                    else: SHORT_TIMEFRAME_ACTIVITY_OVERLAP_WEIGHT
                                                }
                                            }
                                        },
                                        in: {
                                            $cond: {
                                                if: {$ne: ["$timeStats.totalOverlapTime", 0]},
                                                then: {
                                                    $let: {
                                                        vars: {
                                                            overlapRatio: {
                                                                $cond: {
                                                                    if: {$gt: ["$timeStats.totalUserTime", "$timeStats.totalMatchTime"]},
                                                                    //NOTE: it is impossible for the values for totalUserTime and totalMatchTime to be 0 if totalOverlapTime is not 0
                                                                    then: {
                                                                        $divide: [
                                                                            "$timeStats.totalOverlapTime",
                                                                            "$timeStats.totalUserTime"
                                                                        ]
                                                                    },
                                                                    else: {
                                                                        $divide: [
                                                                            "$timeStats.totalOverlapTime",
                                                                            "$timeStats.totalMatchTime"
                                                                        ]
                                                                    }
                                                                }
                                                            },
                                                            //added to the overlapTimeWeight to give shorter times more weight, see NOTE1 below for more info
                                                            shortOverlapPoints: {
                                                                $multiply: [
                                                                    {
                                                                        $subtract: [
                                                                            1,
                                                                            {
                                                                                $divide: [
                                                                                    "$timeStats.totalOverlapTime",
                                                                                    TOTAL_TIME_FRAME
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    "$$shortOverlapTimeWeight"
                                                                ]
                                                            }
                                                        },
                                                        in: {
                                                            $multiply: [
                                                                "$$overlapRatio",
                                                                {
                                                                    $add: [
                                                                        "$$shortOverlapPoints",
                                                                        "$$overlapTimeWeight"
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                else: 0
                                            }
                                        }
                                    }
                                },
                                //add points for how close timeframes
                                {
                                    $let: {
                                        vars: {
                                            betweenTimeWeight: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$categoryActivityType",
                                                            CATEGORY_ENUM_TYPE
                                                        ]
                                                    },
                                                    then: BETWEEN_CATEGORY_TIMES_WEIGHT,
                                                    else: BETWEEN_ACTIVITY_TIMES_WEIGHT
                                                }
                                            }
                                        },
                                        in: {
                                            $reduce: {
                                                input: "$timeStats.betweenTimesArray",
                                                initialValue: 0,
                                                in: {
                                                    $add: ["$$value", {
                                                        $multiply: [
                                                            "$$betweenTimeWeight",
                                                            {
                                                                $subtract:
                                                                    [
                                                                        1,
                                                                        {
                                                                            $divide:
                                                                                [
                                                                                    "$$this",
                                                                                    MAX_BETWEEN_TIME
                                                                                ]
                                                                        }
                                                                    ]
                                                            }
                                                        ]
                                                    }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    $cond: {
                                        if: {
                                            $eq: [
                                                "$categoryActivityType",
                                                CATEGORY_ENUM_TYPE
                                            ]
                                        },
                                        then: CATEGORIES_MATCH_WEIGHT,
                                        else: ACTIVITY_MATCH_WEIGHT
                                    }
                                }
                            ]
                    }
                },
                activityStatistics: {
                    $push: {
                        activityCategoryValue: "$activityCategoryValue",
                        categoryActivityType: "$categoryActivityType",
                        totalUserTime: "$timeStats.totalUserTime",
                        totalMatchTime: "$timeStats.totalMatchTime",
                        totalOverlapTime: "$timeStats.totalOverlapTime",
                        betweenTimesArray: "$timeStats.betweenTimesArray"
                    }
                }
            }
        },
        //runs the final calculation and makes the document a bit 'neater'
        {
            $project: {
                distanceToUser: "$distanceToUser",
                matchExpirationTime: "$matchExpirationTime",
                finalPoints: {$add: ["$timeFalloff", "$categoryOrActivityPoints", "$inactivityPointsToSubtract"]},
                matchStatistics: {
                    $mergeObjects: [{ //single merge because the times don't seem to store in C++ with just the document used
                        "dFr": "$dFr",
                        currentTime: MY_CURRENT_TIME,
                        earliestStartTime: EARLIEST_START_TIME,
                        maxPossibleTime: MAX_POSSIBLE_TIME,
                        timeFalloff: "$timeFalloff",
                        categoryOrActivityPoints: "$categoryOrActivityPoints",
                        inactivityPointsToSubtract: "$inactivityPointsToSubtract",
                        activityStatistics: "$activityStatistics",
                    }]
                }
            }
        },
        {$sort: {"finalPoints": -1}},
        //, "distanceToUser": 1}
        {$limit: MAX_NUMBER_OF_MATCHES},
    ]
).pretty()*/
