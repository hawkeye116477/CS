var AiOS_About = {

    initialize: async function () {
        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID("tgsidebar@franklindm", function (addon) {
            document.getElementById("aboutHeader").setAttribute("title", addon.name);
            document.getElementById("aboutHeader").setAttribute("description", addon.version);

            document.getElementById("macTitle").setAttribute("value", addon.name);
            document.getElementById("macVersion").setAttribute("value", addon.version);
        });

        AiOS_HELPER.rememberAppInfo(document.getElementById("aiosAbout"));

        // List of languages where this extension is translated
        /* let languages = ['ar-SA', 'be-BY', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-GB', 'en-US', 'es-AR', 'es-ES', 'et-EE', 'fi-FI',
            'fr-FR', 'he-IL', 'hr-HR', 'hu-HU', 'hy-AM', 'it-IT', 'ja-JP', 'ko-KR', 'lt-LT', 'nb-NO', 'nl-NL', 'pl-PL',
            'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'sk-SK', 'sq-AL', 'sr-RS', 'sv-SE', 'tl', 'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-TW']; */
        let languages = ["de", "en-GB", "en-US", "es-AR", "es-ES", "fr-FR", "it-IT", "pl", "ru-RU", "tl", "zh-CN"];

        // Populate translator table contents
        let bundleTranslators = Services.strings.createBundle("chrome://aios/content/translators.properties");
        let rowsElement = document.getElementById("trans.grid").children[1];
        for (let lang in languages) {
            // Create objects to be inserted
            let row = document.createElement("row");
            let content1 = document.createElement("text");
            let content2 = document.createElement("text");
            let content3 = document.createElement("text");
            // Language name
            content1.setAttribute("value", await AiOS_About.getLangName(languages[lang]));
            // Language tag
            content2.setAttribute("value", languages[lang]);
            // Language translator(s)
            let tranName;
            try {
                tranName = bundleTranslators.GetStringFromName("trans." + languages[lang] + ".name");
            } catch (e) {
                if (languages[lang].includes("-")) {
                    tranName = bundleTranslators.GetStringFromName("trans." + languages[lang].slice(0, -3) + ".name");
                } else {
                    AiOS_HELPER.log("Please check if the translator(s) of '" + await AiOS_About.getLangName(languages[lang]) + "' is listed in translators.properties\nAdditional info: " + e);
                }
            }
            content3.setAttribute("value", tranName);
            // Append elements as child of row
            row.appendChild(content1);
            row.appendChild(content2);
            row.appendChild(content3);
            // Insert row into rowsElement
            rowsElement.appendChild(row);
        }
    },

    getLangName: async function (abCD) {
        // Function to get language name and region from browser strings
        var abCDPairs = abCD.toLowerCase().split("-"); // ab[-cd]
        var useABCDFormat = abCDPairs.length > 1;
        var ab = useABCDFormat ? abCDPairs[0] : abCD;
        var cd = useABCDFormat ? abCDPairs[1] : "";
        if (ab) {
            let language = "";
            try {
                language = await document.l10n.formatValue("language-name-" + ab);
            } catch (e) {
                // continue
            }

            let region = "";
            if (useABCDFormat) {
                try {
                    region = await document.l10n.formatValue("region-name-" + cd);
                } catch (e) {
                    // continue
                }
            }

            let name = "";
            if (useABCDFormat) {
                name = language + "/" + region;
            } else {
                name = language;
            }
            return name;
        }
    }
};
