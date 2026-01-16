CXX = g++
CXXFLAGS = -std=c++17 -Wall -O2
INCLUDES = -I./include -I./third_party/json/include
SRCDIR = src
OBJDIR = build
SOURCES = $(wildcard $(SRCDIR)/*.cpp)
OBJECTS = $(SOURCES:$(SRCDIR)/%.cpp=$(OBJDIR)/%.o)
TARGET = $(OBJDIR)/impact_model

# Download nlohmann/json if not present
JSON_DIR = third_party/json
JSON_URL = https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp

$(OBJDIR):
	mkdir -p $(OBJDIR)

$(JSON_DIR)/single_include/nlohmann/json.hpp:
	mkdir -p $(JSON_DIR)/single_include/nlohmann
	curl -L $(JSON_URL) -o $(JSON_DIR)/single_include/nlohmann/json.hpp

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp | $(OBJDIR) $(JSON_DIR)/single_include/nlohmann/json.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

$(TARGET): $(OBJECTS) | $(OBJDIR)
	$(CXX) $(OBJECTS) -o $(TARGET)

.PHONY: clean
clean:
	rm -rf $(OBJDIR)

.PHONY: all
all: $(TARGET)




