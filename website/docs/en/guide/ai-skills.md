# AI Productivity Assistant (AI Skills)

To provide you with a "supercharged" experience when developing Gaode Map features, we have prepared a set of deeply integrated **Skill Knowledge Bases (Skills)** specifically for AI coding assistants like **Cursor / Trae**.

These knowledge bases are meticulously tuned and include all `expo-gaode-map` API specifications, native configuration pitfalls, and high-performance development best practices.

## 📦 Download & Installation

You can download and use these AI skill files directly in your project:

<div style="margin: 20px 0;">
  <a href="../../expo-gaode-map-skills.zip" download style="display: inline-block; background: #3eaf7c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    🚀 Download Cursor/Trae Skill Pack (.zip)
  </a>
</div>

**Installation Steps:**
1. Download the zip file above and unzip it.
2. You will see an `expo-gaode-map-skills` folder; open it.
3. Copy the `.cursor` directory inside directly to your project's root directory.
   - *Note: `.cursor` may be hidden on some systems. Ensure "Show Hidden Files" is enabled or use terminal/drag-and-drop.*
4. If your project already has a `.cursor` directory, merge the unzipped `skills` folder into your project's `.cursor/skills` folder.

---

## 🌟 Why Use AI Skills?

When using AI assistants (such as Cursor's Composer or Trae's Agent) to write code, loading these skill files ensures:

- **Zero API Errors**: The AI will accurately call this library's APIs, completely eliminating "fabricated" method names.
- **Optimal Performance**: AI will automatically suggest using the C++ aggregation engine or trajectory simplification tools instead of inefficient JS solutions.
- **Automatic Platform Handling**: AI is aware of the different configuration requirements for Android and iOS regarding location permissions and foreground services.

---

## 🛠️ How to Use in Development?

If you are using Cursor or Trae, you can let the AI assist you better in the following ways:

### 1. Task-Oriented Guidance (Mention Skills)
Type `@` in the chat box and search for the corresponding skill file name to let the AI "load knowledge" for a specific task:
- **Need High-Performance Markers?** -> Type `@marker-and-clustering.md`
- **Need Geofencing Judgment?** -> Type `@geometry-utils.md`
- **Need Background Location?** -> Type `@location-and-tracking.md`

### 2. Global Efficiency (Composer / Agent)
When developing complex features (e.g., implementing map interaction for a ride-hailing app), tell the AI directly:
> "Referring to the specifications in @SKILL.md, help me implement a map page with path planning and smooth real-time location movement."

---

## 📚 Skill Module Quick Reference

| Module Name | Use Case |
| :--- | :--- |
| **map-view-core.md** | Basic map display, camera control (zoom, rotate, move). |
| **marker-and-clustering.md** | Mass marker clustering, custom markers, click interaction. |
| **geometry-utils.md** | **(Recommended)** Coordinate conversion, distance/area calculation, trajectory simplification, spatial relationship judgment. |
| **location-and-tracking.md** | Location dot, permission requests, Android foreground service configuration. |
| **navigation.md** | Driving/walking/cycling path planning, native navigation view. |
| **search.md** | POI search, reverse geocoding (coordinates to address). |
| **web-api.md** | Integration of Gaode Web services at the data layer. |

---

## 💡 Developer Tips
Although these files are primarily for AI, if you need to quickly check the correct parameter format for an API, opening the corresponding `.md` file is often more intuitive than browsing TypeScript type definitions.
