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
        
        // 如果是数字类型
        if let number = colorValue as? Int {
            return UIColor(hex: number)
        }
        
        // 如果是字符串类型
        if let string = colorValue as? String {
            return parseColorString(string)
        }
        
        return nil
    }
    
    /**
     * 解析字符串颜色值
     */
    private static func parseColorString(_ colorString: String) -> UIColor? {
        let trimmedString = colorString.trimmingCharacters(in: .whitespacesAndNewlines)
        
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
     * 解析十六进制颜色
     */
    private static func parseHexColor(_ hexString: String) -> UIColor? {
        var hex = hexString.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var alpha: CGFloat = 1.0
        
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
                // 尝试 ARGB 格式（Android 风格）
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
