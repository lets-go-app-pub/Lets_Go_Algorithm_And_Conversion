These are some of the files used in writing the matching algorithm using the MongoDB aggregation pipeline. The algorithm is written in javascript and converted into C++. The most important files in here are.

1) MongoDBAggregation.js; This is the MongoDB aggregation pipeline that is the "algorithm". However, it is in javascript.
2) main.cpp; This is a C++ program that will convert the contents of MongoStuff.txt (Javascript object literal) file into C++ that can be used for the MongoDB aggregation pipeline. It will output to MongoCppFunc.txt.
