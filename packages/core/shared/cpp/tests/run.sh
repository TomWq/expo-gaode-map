#!/bin/bash
set -e

# Compile the test
clang++ -std=c++17 \
    test_main.cpp \
    ../GeometryEngine.cpp \
    ../ColorParser.cpp \
    ../ClusterEngine.cpp \
    ../QuadTree.cpp \
    -o test_runner

# Run the test
./test_runner

# Clean up
rm test_runner
