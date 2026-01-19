#include "ColorParser.hpp"
#include <algorithm>
#include <sstream>
#include <vector>
#include <map>
#include <cmath>

namespace gaodemap {

static uint32_t argb(uint8_t a, uint8_t r, uint8_t g, uint8_t b) {
    return (static_cast<uint32_t>(a) << 24) |
           (static_cast<uint32_t>(r) << 16) |
           (static_cast<uint32_t>(g) << 8) |
           static_cast<uint32_t>(b);
}

static uint32_t parseHex(const std::string& hexStr) {
    std::string cleanHex = hexStr;
    if (cleanHex.empty()) return 0;
    if (cleanHex[0] == '#') {
        cleanHex = cleanHex.substr(1);
    }

    uint32_t val = 0;
    try {
        val = std::stoul(cleanHex, nullptr, 16);
    } catch (...) {
        return 0;
    }

    if (cleanHex.length() == 6) {
        // RRGGBB -> 0xFFRRGGBB
        return 0xFF000000 | val;
    } else if (cleanHex.length() == 8) {
        // AARRGGBB -> AARRGGBB (Android style)
        // Wait, web usually uses #RRGGBBAA.
        // Android Color.parseColor("#RRGGBB") or "#AARRGGBB".
        // Let's assume Android style #AARRGGBB for consistency with existing Kotlin code.
        return val;
    } else if (cleanHex.length() == 3) {
        // RGB -> RRGGBB
        uint32_t r = (val >> 8) & 0xF;
        uint32_t g = (val >> 4) & 0xF;
        uint32_t b = val & 0xF;
        return 0xFF000000 | (r << 20) | (r << 16) | (g << 12) | (g << 8) | (b << 4) | b;
    } else if (cleanHex.length() == 4) {
        // ARGB -> AARRGGBB
        uint32_t a = (val >> 12) & 0xF;
        uint32_t r = (val >> 8) & 0xF;
        uint32_t g = (val >> 4) & 0xF;
        uint32_t b = val & 0xF;
        return (a << 28) | (a << 24) | (r << 20) | (r << 16) | (g << 12) | (g << 8) | (b << 4) | b;
    }
    
    return 0;
}

static uint32_t parseRgba(const std::string& str) {
    // rgba(r, g, b, a) or rgb(r, g, b)
    bool hasAlpha = str.find("rgba") == 0;
    size_t start = str.find('(');
    size_t end = str.find(')');
    if (start == std::string::npos || end == std::string::npos) return 0;

    std::string content = str.substr(start + 1, end - start - 1);
    std::stringstream ss(content);
    std::string segment;
    std::vector<std::string> parts;
    
    while (std::getline(ss, segment, ',')) {
        parts.push_back(segment);
    }

    if (parts.size() < 3) return 0;

    try {
        int r = std::stoi(parts[0]);
        int g = std::stoi(parts[1]);
        int b = std::stoi(parts[2]);
        int a = 255;

        if (hasAlpha && parts.size() >= 4) {
            float alphaFloat = std::stof(parts[3]);
            a = static_cast<int>(alphaFloat * 255.0f);
        }

        return argb(
            static_cast<uint8_t>(std::max(0, std::min(255, a))),
            static_cast<uint8_t>(std::max(0, std::min(255, r))),
            static_cast<uint8_t>(std::max(0, std::min(255, g))),
            static_cast<uint8_t>(std::max(0, std::min(255, b)))
        );
    } catch (...) {
        return 0;
    }
}

static const std::map<std::string, uint32_t> NAMED_COLORS = {
    {"red", 0xFFFF0000},
    {"blue", 0xFF0000FF},
    {"green", 0xFF00FF00},
    {"yellow", 0xFFFFFF00},
    {"black", 0xFF000000},
    {"white", 0xFFFFFFFF},
    {"gray", 0xFF888888},
    {"grey", 0xFF888888},
    {"cyan", 0xFF00FFFF},
    {"magenta", 0xFFFF00FF},
    {"transparent", 0x00000000}
};

uint32_t parseColor(const std::string& colorString) {
    std::string str = colorString;
    // Remove whitespace
    str.erase(std::remove_if(str.begin(), str.end(), ::isspace), str.end());
    // Lowercase for named colors check
    std::string lowerStr = str;
    std::transform(lowerStr.begin(), lowerStr.end(), lowerStr.begin(), ::tolower);

    if (NAMED_COLORS.count(lowerStr)) {
        return NAMED_COLORS.at(lowerStr);
    }

    if (lowerStr.find("rgb") == 0) {
        return parseRgba(str); // pass original str with potential spaces if needed, but we removed them
    }

    if (lowerStr.find("#") == 0 || std::all_of(lowerStr.begin(), lowerStr.end(), ::isxdigit)) {
        return parseHex(str);
    }

    return 0; // Default black -> Default failure (0)
}

}
