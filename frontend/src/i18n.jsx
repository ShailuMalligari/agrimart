import React, { createContext, useContext, useState } from "react";

const translations = {
  en: {
    appTitle: "AGRIMART", tagline: "Farm to home, direct — now with voice",
    marketplace: "Marketplace", cart: "Cart", voiceAssistant: "Voice Assistant", orders: "Orders",
    login: "Login", logout: "Logout", register: "Register",
    name: "Full Name", phone: "Phone Number", password: "Password", address: "Delivery Address",
    useMyLocation: "📍 Use my current location", selectRole: "I am a",
    farmer: "Farmer", customer: "Customer", admin: "Admin",
    farmerDashboard: "Farmer Dashboard", adminDashboard: "Admin Dashboard",
    addProduct: "Add Product", productName: "Product Name", category: "Category",
    price: "Price (₹)", unit: "Unit", stock: "Stock", productImage: "Product Photo",
    welcomeBack: "Welcome", dontHaveAccount: "Don't have an account?", alreadyHaveAccount: "Already have an account?",
    bundles: "Recipe Kits", subscriptions: "Subscriptions", earnings: "Earnings", offers: "Offers",
    nearYou: "Near You", verified: "Verified Farmer",
  },
  hi: {
    appTitle: "एग्रीमार्ट", tagline: "खेत से घर तक, सीधे — अब आवाज़ के साथ",
    marketplace: "बाज़ार", cart: "कार्ट", voiceAssistant: "आवाज़ सहायक", orders: "ऑर्डर",
    login: "लॉगिन", logout: "लॉगआउट", register: "पंजीकरण करें",
    name: "पूरा नाम", phone: "फ़ोन नंबर", password: "पासवर्ड", address: "डिलीवरी पता",
    useMyLocation: "📍 मेरा वर्तमान स्थान उपयोग करें", selectRole: "मैं हूँ",
    farmer: "किसान", customer: "ग्राहक", admin: "व्यवस्थापक",
    farmerDashboard: "किसान डैशबोर्ड", adminDashboard: "व्यवस्थापक डैशबोर्ड",
    addProduct: "उत्पाद जोड़ें", productName: "उत्पाद का नाम", category: "श्रेणी",
    price: "कीमत (₹)", unit: "इकाई", stock: "स्टॉक", productImage: "उत्पाद की फोटो",
    welcomeBack: "स्वागत है", dontHaveAccount: "खाता नहीं है?", alreadyHaveAccount: "पहले से खाता है?",
    bundles: "रेसिपी किट", subscriptions: "सदस्यता", earnings: "कमाई", offers: "ऑफ़र्स",
    nearYou: "आपके पास", verified: "सत्यापित किसान",
  },
  te: {
    appTitle: "అగ్రిమార్ట్", tagline: "పొలం నుండి ఇంటికి, నేరుగా — ఇప్పుడు వాయిస్‌తో",
    marketplace: "మార్కెట్‌ప్లేస్", cart: "కార్ట్", voiceAssistant: "వాయిస్ అసిస్టెంట్", orders: "ఆర్డర్లు",
    login: "లాగిన్", logout: "లాగ్అవుట్", register: "నమోదు చేసుకోండి",
    name: "పూర్తి పేరు", phone: "ఫోన్ నంబర్", password: "పాస్‌వర్డ్", address: "డెలివరీ చిరునామా",
    useMyLocation: "📍 నా ప్రస్తుత లొకేషన్ ఉపయోగించండి", selectRole: "నేను",
    farmer: "రైతు", customer: "వినియోగదారు", admin: "అడ్మిన్",
    farmerDashboard: "రైతు డాష్‌బోర్డ్", adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
    addProduct: "ఉత్పత్తిని జోడించండి", productName: "ఉత్పత్తి పేరు", category: "వర్గం",
    price: "ధర (₹)", unit: "యూనిట్", stock: "స్టాక్", productImage: "ఉత్పత్తి ఫోటో",
    welcomeBack: "స్వాగతం", dontHaveAccount: "ఖాతా లేదా?", alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా?",
    bundles: "వంటకాల కిట్‌లు", subscriptions: "సబ్‌స్క్రిప్షన్‌లు", earnings: "సంపాదన", offers: "ఆఫర్‌లు",
    nearYou: "మీ దగ్గర", verified: "ధృవీకరించిన రైతు",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
