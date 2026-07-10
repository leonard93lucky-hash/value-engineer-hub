// 1. API & ASSETS
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ve-document-generator.vercel.app/api";
export const LOGO_HEADER = "/privy_sow_side.png";
export const LOGO_URL = "/Privy_Logo_Red.png";

// 2. OPTIONS (Gunakan Huruf Besar di awal ID agar sinkron dengan PDF & DEFAULTS)
export const PROVIDER_OPTIONS = [
    { id: "Megvii", label: "Megvii (Required)" },
    { id: "FoL1", label: "FoL v1" },
    { id: "FoL2", label: "FoL v2" },
    { id: "FoL3", label: "FoL v3 (Default)" },
    { id: "OZ", label: "OZ" },
    { id: "TSI", label: "TSI" }
];

export const THRESHOLD_OPTIONS = [
    { id: "50", label: "50 (Default for v3)" },
    { id: "80", label: "80 (For v2 & v1)" }
];

export const MASKING_THRESHOLD_OPTIONS = [
    { id: "True", label: "True (Default)" },
    { id: "False", label: "False" }
];

export const FACEFLOW_OPTIONS = [
    { id: "1", label: "1 (Default)" },
    { id: "2", label: "2" }
];

export const UI_SCREEN_OPTIONS = [
    { id: "Show", label: "Show (Default)" },
    { id: "Hide", label: "Hide" }
];

export const UI_CUSTOM_OPTIONS = [
    { id: "Default", label: "Standard (Default)" },
    { id: "Custom", label: "Custom" }
];

export const SCANNER_SHAPE_OPTIONS = [
    { id: "Ellipse", label: "Ellipse (Default)" }, // SINKRON: E besar
    { id: "Circle", label: "Circle" }
];

export const ENV_TYPE_OPTIONS = ["Staging", "Production"];
export const MERCHANT_APPS_OPTIONS = ["Native", "Flutter", "Cordova", "React Native"];

// 3. DEFAULTS (Single Source of Truth)
export const DEFAULTS = {
    basic: {
        livenessProviders: ["Megvii", "FoL3"],
        livenessThreshold: "50",
        maskingThreshold: "True",
        livenessFaceFlow: "1",
        isOtherChecked: false,
        otherProvider: ""
    },
    ui: {
        onboardingScreen: "Show",
        onboardingScreenCustomText: "",
        loadingScreen: "Show",
        loadingScreenCustomText: "",
        resultScreen: "Show",
        resultScreenCustomText: "",
        navigationBar: "Show",
        navigationBarCustomText: "",
        footnote: "Show",
        footnoteCustomText: "",
        footer: "Show",
        footerCustomText: "",
        buttonColor: "Red",
        buttonWording: "I'm Ready!",
        faceScannerShape: "Ellipse",
        frameOverlay: "White",
        instructionColor: "Black",
        instructionBg: "White",
        livenessAnimation: "Show",
        livenessCountdown: "Show",
        defaultLanguage: "Bahasa Indonesia",
        defaultLanguageCustomText: "",
        supportAndroid: "Yes",
    },
    liveness: {
        randomInstruction: ["Blink Eyes", "Smile", "Open Mouth"], // Default 
        faceValidation: ["Face Detection", "Face Position", "Face Distance", "Face Angle", "Brightness Detection", "Multiple Face Detection"], // Default 
        timeout: "15",
        maxAttempt: "5",
    },
    // Update di lib/constants.ts pada bagian assets
    assets: {
        logoMerchant: "Privy",
        mainIllustration: "Privy",
        illustrationImage1: "Privy",
        illustrationImage2: "Privy",
        illustrationImage3: "Privy",
        termOfUse: "Privy Term of Use", // Default value
        termOfUseID: "",               // Link ID kustom 
        termOfUseEN: "",               // Link EN kustom 
        privacyPolicy: "Privy Privacy Policy", // Default value
        privacyPolicyID: "",           // Link ID kustom 
        privacyPolicyEN: "",           // Link EN kustom 
    }
};

// 4. HELPERS
export const getRomanMonth = (dateStr: string) => {
    if (!dateStr) return "I";
    const month = new Date(dateStr).getMonth() + 1;
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return romans[month - 1] || "I";
};

export const formatDateIndo = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
    if (dateStr.toUpperCase() === "TBC") return "TBC";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback: return apa adanya
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};