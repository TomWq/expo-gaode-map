#pragma once

#include <string>
#include <cstdint>

namespace gaodemap {

// Returns color as ARGB integer (0xAARRGGBB)
// Returns 0 (transparent/black) if parsing fails, but 0 is also valid (transparent).
// Maybe return a bool success? Or default to Black (0xFF000000) or Transparent (0x00000000).
// Android defaults to Black in existing code.
uint32_t parseColor(const std::string& colorString);

}
