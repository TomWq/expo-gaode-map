import AMapFoundationKit
import AMapLocationKit
import MAMapKit
import Foundation

extension Notification.Name {
    static let gaodeMapPrivacyStatusDidChange = Notification.Name("ExpoGaodeMapPrivacyStatusDidChange")
}

enum GaodeMapPrivacyManager {
    private enum StorageKeys {
        static let hasShow = "expo.gaodemap.privacy.hasShow"
        static let hasContainsPrivacy = "expo.gaodemap.privacy.hasContainsPrivacy"
        static let hasAgree = "expo.gaodemap.privacy.hasAgree"
        static let privacyVersion = "expo.gaodemap.privacy.currentVersion"
        static let agreedPrivacyVersion = "expo.gaodemap.privacy.agreedVersion"
    }

    private static let defaults = UserDefaults.standard

    private(set) static var hasShow = false
    private(set) static var hasContainsPrivacy = false
    private(set) static var hasAgree = false
    private(set) static var privacyVersion: String?
    private(set) static var agreedPrivacyVersion: String?
    private(set) static var restoredFromStorage = false

    static var isReady: Bool {
        hasShow && hasContainsPrivacy && hasAgree
    }

    static func restorePersistedState() {
        hasShow = defaults.bool(forKey: StorageKeys.hasShow)
        hasContainsPrivacy = defaults.bool(forKey: StorageKeys.hasContainsPrivacy)
        hasAgree = defaults.bool(forKey: StorageKeys.hasAgree)
        privacyVersion = defaults.string(forKey: StorageKeys.privacyVersion)
        agreedPrivacyVersion = defaults.string(forKey: StorageKeys.agreedPrivacyVersion)
        restoredFromStorage = true

        if let version = privacyVersion,
           let agreedVersion = agreedPrivacyVersion,
           version != agreedVersion {
            clearConsentPersistedState(keepCurrentVersion: true)
        }

        applyPrivacyState()
    }

    static func setPrivacyShow(_ show: Bool, hasContainsPrivacy: Bool) {
        let previousStatus = status()
        hasShow = show
        self.hasContainsPrivacy = hasContainsPrivacy
        persistState()
        applyPrivacyState()
        notifyIfNeeded(previousStatus: previousStatus)
    }

    static func setPrivacyAgree(_ agree: Bool) {
        let previousStatus = status()
        hasAgree = agree
        agreedPrivacyVersion = agree ? privacyVersion : nil
        persistState()
        applyPrivacyState()
        notifyIfNeeded(previousStatus: previousStatus)
    }

    static func setPrivacyVersion(_ version: String) {
        let previousStatus = status()
        privacyVersion = version.trimmingCharacters(in: .whitespacesAndNewlines)
        if privacyVersion?.isEmpty == true {
            privacyVersion = nil
        }

        if let currentVersion = privacyVersion,
           let agreedVersion = agreedPrivacyVersion,
           currentVersion != agreedVersion {
            clearConsentPersistedState(keepCurrentVersion: true)
        } else {
            persistState()
        }

        applyPrivacyState()
        notifyIfNeeded(previousStatus: previousStatus)
    }

    static func resetPrivacyConsent() {
        let previousStatus = status()
        clearConsentPersistedState(keepCurrentVersion: false)
        applyPrivacyState()
        notifyIfNeeded(previousStatus: previousStatus)
    }

    static func applyPrivacyState() {
        let showStatus: AMapPrivacyShowStatus = hasShow ? .didShow : .notShow
        let infoStatus: AMapPrivacyInfoStatus = hasContainsPrivacy ? .didContain : .notContain
        let agreeStatus: AMapPrivacyAgreeStatus = hasAgree ? .didAgree : .notAgree

        MAMapView.updatePrivacyShow(showStatus, privacyInfo: infoStatus)
        MAMapView.updatePrivacyAgree(agreeStatus)
        AMapLocationManager.updatePrivacyShow(showStatus, privacyInfo: infoStatus)
        AMapLocationManager.updatePrivacyAgree(agreeStatus)
    }

    static func status() -> [String: Any] {
        [
            "hasShow": hasShow,
            "hasContainsPrivacy": hasContainsPrivacy,
            "hasAgree": hasAgree,
            "isReady": isReady,
            "privacyVersion": privacyVersion ?? NSNull(),
            "agreedPrivacyVersion": agreedPrivacyVersion ?? NSNull(),
            "restoredFromStorage": restoredFromStorage,
        ]
    }

    private static func persistState() {
        defaults.set(hasShow, forKey: StorageKeys.hasShow)
        defaults.set(hasContainsPrivacy, forKey: StorageKeys.hasContainsPrivacy)
        defaults.set(hasAgree, forKey: StorageKeys.hasAgree)
        defaults.set(privacyVersion, forKey: StorageKeys.privacyVersion)
        defaults.set(agreedPrivacyVersion, forKey: StorageKeys.agreedPrivacyVersion)
    }

    private static func clearConsentPersistedState(keepCurrentVersion: Bool) {
        hasShow = false
        hasContainsPrivacy = false
        hasAgree = false
        agreedPrivacyVersion = nil

        defaults.set(false, forKey: StorageKeys.hasShow)
        defaults.set(false, forKey: StorageKeys.hasContainsPrivacy)
        defaults.set(false, forKey: StorageKeys.hasAgree)
        defaults.removeObject(forKey: StorageKeys.agreedPrivacyVersion)

        if keepCurrentVersion {
            defaults.set(privacyVersion, forKey: StorageKeys.privacyVersion)
        } else {
            privacyVersion = nil
            defaults.removeObject(forKey: StorageKeys.privacyVersion)
        }
    }

    private static func notifyIfNeeded(previousStatus: [String: Any]) {
        let currentStatus = status()
        guard NSDictionary(dictionary: previousStatus).isEqual(to: currentStatus) == false else {
            return
        }

        NotificationCenter.default.post(
            name: .gaodeMapPrivacyStatusDidChange,
            object: nil,
            userInfo: currentStatus
        )
    }
}
