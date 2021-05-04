#!/bin/bash

SCRIPT_PATH=$(dirname "$(realpath -s "$0")")
MAIN_PATH=$(git -C "$SCRIPT_PATH" rev-parse --show-toplevel)
TEMP_PATH="$MAIN_PATH"/src_temp
ARTIFACTS_PATH="$MAIN_PATH"/artifacts

cd "$MAIN_PATH"/src || exit

mkdir "$TEMP_PATH"
cp -r "$MAIN_PATH"/src/* "$TEMP_PATH"/

cd "$TEMP_PATH" || exit
UNUSED_LOCALES=("ar-SA" "be-BY" "cs-CZ" "da" "el" "et-EE" "fi" "he" "hr-HR" "hu-HU" "hy-AM" "ja-JP" "ko-KR" "lt-LT" "nb-NO" "nl" "pt-BR" "pt-PT" "ro" "sk-SK" "sq-AL" "sr" "sv-SE" "tr" "uk" "vi" "zh-TW")

for UL in "${UNUSED_LOCALES[@]}"; do
    rm -rf ./locale/"$UL"
done

if [ ! -d "$ARTIFACTS_PATH" ]; then
    mkdir "$ARTIFACTS_PATH"
fi

echo "Removing old xpi file"

if [ -f "$ARTIFACTS_PATH"/CS.xpi ]; then
    rm -rf "$ARTIFACTS_PATH"/CS.xpi
fi

echo "Creating xpi file"
zip -r9 "$ARTIFACTS_PATH"/CS.xpi ./*

rm -rf "$TEMP_PATH"
