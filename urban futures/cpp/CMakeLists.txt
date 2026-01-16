cmake_minimum_required(VERSION 3.10)
project(ImpactModel)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(nlohmann_json QUIET)

# If nlohmann/json is not found, use FetchContent
if(NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.11.2
    )
    FetchContent_MakeAvailable(json)
endif()

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/impact_model.cpp
    src/main.cpp
)

# Create executable
add_executable(impact_model ${SOURCES})

# Link libraries
if(TARGET nlohmann_json::nlohmann_json)
    target_link_libraries(impact_model nlohmann_json::nlohmann_json)
endif()




