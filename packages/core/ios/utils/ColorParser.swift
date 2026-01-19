import ExpoModulesCore
import UIKit

class ColorParser {
    /**
     * 将颜色值转换为 UIColor
     * 支持格式：
     * - 数字：0xFF0000
     * - 十六进制字符串："#FF0000" 或 "FF0000"
     * - 颜色名称："red", "blue", "green" 等
     */
    static func parseColor(_ colorValue: Any?) -> UIColor? {
        guard let colorValue = colorValue else { return nil }
        
        if let number = colorValue as? Int {
            return UIColor(hex: number)
        }
        
        if let string = colorValue as? String {
            return parseColorString(string)
        }
        
        return nil
    }
    
    /**
     * 解析字符串颜色值
     */
    private static func parseColorString(_ colorString: String) -> UIColor? {
        // Try native parser first
        let nativeColor = ClusterNative.parseColor(with: colorString)
        if nativeColor != 0 {
            // ARGB -> UIColor
            let a = CGFloat((nativeColor >> 24) & 0xFF) / 255.0
            let r = CGFloat((nativeColor >> 16) & 0xFF) / 255.0
            let g = CGFloat((nativeColor >> 8) & 0xFF) / 255.0
            let b = CGFloat(nativeColor & 0xFF) / 255.0
            return UIColor(red: r, green: g, blue: b, alpha: a)
        }

        let trimmedString = colorString.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // 处理 rgba() 格式
        if trimmedString.hasPrefix("rgba(") {
            return parseRgbaColor(trimmedString)
        }
        
        // 处理 rgb() 格式
        if trimmedString.hasPrefix("rgb(") {
            return parseRgbColor(trimmedString)
        }
        
        // 处理十六进制格式
        if trimmedString.hasPrefix("#") {
            return parseHexColor(trimmedString)
        }
        
        // 处理颜色名称
        if let namedColor = parseNamedColor(trimmedString) {
            return namedColor
        }
        
        // 处理不带 # 的十六进制
        if trimmedString.count == 6 || trimmedString.count == 8 {
            return parseHexColor("#" + trimmedString)
        }
        
        return nil
    }
    
    /**
     * 解析 rgba(r, g, b, a) 格式
     */
    private static func parseRgbaColor(_ rgbaString: String) -> UIColor? {
        let content = rgbaString.replacingOccurrences(of: "rgba(", with: "").replacingOccurrences(of: ")", with: "")
        let components = content.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        
        guard components.count == 4,
              let r = Int(components[0]),
              let g = Int(components[1]),
              let b = Int(components[2]),
              let a = Double(components[3]) else {
            return nil
        }
        
        return UIColor(red: CGFloat(r) / 255.0, green: CGFloat(g) / 255.0, blue: CGFloat(b) / 255.0, alpha: CGFloat(a))
    }
    
    /**
     * 解析 rgb(r, g, b) 格式
     */
    private static func parseRgbColor(_ rgbString: String) -> UIColor? {
        let content = rgbString.replacingOccurrences(of: "rgb(", with: "").replacingOccurrences(of: ")", with: "")
        let components = content.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        
        guard components.count == 3,
              let r = Int(components[0]),
              let g = Int(components[1]),
              let b = Int(components[2]) else {
            return nil
        }
        
        return UIColor(red: CGFloat(r) / 255.0, green: CGFloat(g) / 255.0, blue: CGFloat(b) / 255.0, alpha: 1.0)
    }
    
    /**
     * 解析十六进制颜色
     */
    private static func parseHexColor(_ hexString: String) -> UIColor? {
        var hex = hexString.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        let alpha: CGFloat = 1.0
        
        // 处理 #RGB 格式
        if hex.count == 3 {
            let r = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 0)], count: 2)
            let g = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 1)], count: 2)
            let b = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 2)], count: 2)
            hex = r + g + b
        }
        
        // 处理 #RGBA 格式
        if hex.count == 4 {
            let r = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 0)], count: 2)
            let g = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 1)], count: 2)
            let b = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 2)], count: 2)
            let a = String(repeating: hex[hex.index(hex.startIndex, offsetBy: 3)], count: 2)
            hex = r + g + b + a
        }
        
        // 处理 #AARRGGBB 或 #RRGGBBAA 格式
        if hex.count == 8 {
            let scanner = Scanner(string: hex)
            var hexNumber: UInt64 = 0
            
            if scanner.scanHexInt64(&hexNumber) {
                let alphaARGB = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                let redARGB = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                let greenARGB = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                let blueARGB = CGFloat(hexNumber & 0x000000ff) / 255
                return UIColor(red: redARGB, green: greenARGB, blue: blueARGB, alpha: alphaARGB)
            }
        }
        
        // 处理 #RRGGBB 格式
        if hex.count == 6 {
            let scanner = Scanner(string: hex)
            var hexNumber: UInt64 = 0
            
            if scanner.scanHexInt64(&hexNumber) {
                let red = CGFloat((hexNumber & 0xff0000) >> 16) / 255
                let green = CGFloat((hexNumber & 0x00ff00) >> 8) / 255
                let blue = CGFloat(hexNumber & 0x0000ff) / 255
                return UIColor(red: red, green: green, blue: blue, alpha: alpha)
            }
        }
        
        return nil
    }
    
    /**
     * 解析颜色名称
     */
    private static func parseNamedColor(_ colorName: String) -> UIColor? {
        let colorMap: [String: UIColor] = [
            // 基础颜色
            "black": .black,
            "white": .white,
            "red": .red,
            "green": .green,
            "blue": .blue,
            "yellow": .yellow,
            "cyan": .cyan,
            "magenta": .magenta,
            "orange": .orange,
            "purple": .purple,
            "brown": .brown,
            "gray": .gray,
            "lightgray": .lightGray,
            "darkgray": .darkGray,
            "clear": .clear,
            
            // 常用颜色
            "pink": UIColor(red: 1.0, green: 0.75, blue: 0.8, alpha: 1.0),
            "lightblue": UIColor(red: 0.68, green: 0.85, blue: 0.9, alpha: 1.0),
            "lightgreen": UIColor(red: 0.56, green: 0.93, blue: 0.56, alpha: 1.0),
            "lightyellow": UIColor(red: 1.0, green: 1.0, blue: 0.88, alpha: 1.0),
            "lightcyan": UIColor(red: 0.88, green: 1.0, blue: 1.0, alpha: 1.0),
            "lightmagenta": UIColor(red: 1.0, green: 0.88, blue: 1.0, alpha: 1.0),
            "darkred": UIColor(red: 0.55, green: 0.0, blue: 0.0, alpha: 1.0),
            "darkgreen": UIColor(red: 0.0, green: 0.39, blue: 0.0, alpha: 1.0),
            "darkblue": UIColor(red: 0.0, green: 0.0, blue: 0.55, alpha: 1.0),
            "darkyellow": UIColor(red: 0.55, green: 0.55, blue: 0.0, alpha: 1.0),
            "darkcyan": UIColor(red: 0.0, green: 0.55, blue: 0.55, alpha: 1.0),
            "darkmagenta": UIColor(red: 0.55, green: 0.0, blue: 0.55, alpha: 1.0),
        ]
        
        return colorMap[colorName.lowercased()]
    }
}

// UIColor 扩展，支持从数字创建（ARGB 格式）
extension UIColor {
    convenience init(hex: Int) {
        let alpha = CGFloat((hex >> 24) & 0xFF) / 255.0
        let red = CGFloat((hex >> 16) & 0xFF) / 255.0
        let green = CGFloat((hex >> 8) & 0xFF) / 255.0
        let blue = CGFloat(hex & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue, alpha: alpha)
    }
    
    // 别名方法，与 hex 功能相同
    convenience init(argb: Int) {
        self.init(hex: argb)
    }
}
