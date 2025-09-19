# Lets_Go_Algorithm_And_Conversion — Mongo Aggregation → C++ converter

This repo contains the **matching algorithm** for Lets Go and a tiny toolchain to embed it in the C++ server.  
Authoring happens in **MongoDB aggregation (JavaScript)** for readability; a small C++ program converts that spec into **C++/bsoncxx** so the server can execute the pipeline without shipping JS.

> **Stack:** MongoDB Aggregation Pipeline · JavaScript (authoring) · C++17 · bsoncxx · CMake  
> **Used by:** `Lets_Go_Server` (matching module)

---

## Why this exists (skim me)
- **Readable authoring:** write & review the algorithm as a plain Mongo **aggregation** in JS.
- **Zero JS at runtime:** compile the pipeline into C++ documents for the server (no script engine, fewer deps).
- **Performance & type safety:** avoid stringly-typed BSON builders and reduce marshal overhead.

---

## How it works

1. **Author the algorithm** in `MongoDBAggregation.js`  
   This is the human-readable source of truth (activities/categories, time windows, recency/inactivity penalties, etc.).

2. **Describe BSON bits** in `MongoStuff.txt`  
   A **JavaScript object-literal** that mirrors your aggregation stages and constants; kept simple for parsing.

3. **Convert to C++** with `main.cpp`  
   The converter reads `MongoStuff.txt` and emits **`MongoCppFunc.txt`** — a ready-to-paste C++ function using `bsoncxx` builders that represents the same pipeline.

4. **Embed in the server**  
   Copy the generated function (`MongoCppFunc.txt`) into the server’s matching module and compile there.  
   The server treats the converted C++ as **immutable** at runtime; edits start here → reconvert → paste.

---

## File tour

- **`MongoDBAggregation.js`** — human-readable **aggregation pipeline** (the matching rules).  
- **`MongoStuff.txt`** — JS object-literal describing BSON structures/constants for conversion.  
- **`main.cpp`** — small **converter** that outputs C++/bsoncxx code to `MongoCppFunc.txt`.  
- **`MongoCppFunc.txt`** — generated **C++ function** (output to paste into the server).  
- **`CMakeLists.txt`** — build script for the converter.  
- **Misc notes:** `MongoCppFunc.txt` and `MongoStuff.txt` are the key output/input artifacts for the workflow.

---

## Design notes
- **Author in JS, run in C++:** fast iteration and code review, with a zero-JS production runtime.
- **Deterministic generation:** same inputs → same C++ output (easy diffs in PRs).
- **Separation of concerns:** business logic here; execution/storage in the server repo.

---

## Related
- **Server (C++)** — stateless hub, gRPC/Protobuf, MongoDB  
  👉 [`Lets_Go_Server`](https://github.com/lets-go-app-pub/Lets_Go_Server)

## Status & compatibility
Portfolio reference. Converter targets the bsoncxx API used at the time; modern toolchains may require minor adjustments.

## License
MIT (see `LICENSE`)
