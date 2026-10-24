#!/usr/bin/env bash
# Builds an installable Android APK of the game without the Android SDK.
# Tools come from Maven Central: apktool-lib (bundles aapt2 + framework resources),
# dalvik-dx (dex compiler) and the Android API stubs. Needs: JDK 17+, curl, unzip, zip, python3.
# Usage: android/build-apk.sh [versionCode] [versionName]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; GAME="$(cd "$HERE/.." && pwd)"
OUT="$HERE/build"; TOOLS="$HERE/.tools"; VC="${1:-1}"; VN="${2:-1.0}"
MC=https://repo1.maven.org/maven2
mkdir -p "$TOOLS" "$OUT"
fetch() { [ -s "$TOOLS/$1" ] || curl -fsSL -o "$TOOLS/$1" "$2"; }
fetch apktool-lib.jar "$MC/org/apktool/apktool-lib/3.0.3/apktool-lib-3.0.3.jar"
fetch dx.jar "$MC/com/jakewharton/android/repackaged/dalvik-dx/14.0.0_r21/dalvik-dx-14.0.0_r21.jar"
fetch android.jar "$MC/com/google/android/android/4.1.1.4/android-4.1.1.4.jar"
if [ ! -x "$TOOLS/aapt2" ]; then
  (cd "$TOOLS" && unzip -o -q apktool-lib.jar prebuilt/linux/aapt2 prebuilt/android-framework.jar && mv prebuilt/linux/aapt2 aapt2 && mv prebuilt/android-framework.jar framework.jar && rm -rf prebuilt && chmod +x aapt2)
fi
AAPT2="$TOOLS/aapt2"

echo "== resources"
rm -rf "$OUT"/*; mkdir -p "$OUT/res" "$OUT/assets" "$OUT/classes"
cp -r "$HERE/res/." "$OUT/res/"
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do mkdir -p "$OUT/res/mipmap-$d"; done
python3 - "$GAME/icons/icon-512.png" "$OUT/res" <<'PY'
import sys, struct, zlib
# write launcher icons at each density by nearest-neighbour downscaling the 512px icon (no image libraries needed)
src, res = sys.argv[1], sys.argv[2]
def read_png(p):
    d = open(p, 'rb').read(); pos = 8; idat = b''; w = h = 0
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]; body = d[pos+8:pos+8+ln]; pos += 12 + ln
        if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', body[:10]); assert bd == 8 and ct in (2, 6)
        elif typ == b'IDAT': idat += body
    bpp = 4 if ct == 6 else 3; raw = zlib.decompress(idat); stride = w * bpp; rows = []; prev = bytearray(stride); i = 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i+1:i+1+stride]); i += 1 + stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0; b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p_ = a + b - c; pa, pb, pc = abs(p_-a), abs(p_-b), abs(p_-c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(bytes(line)); prev = line
    return w, h, bpp, rows
def write_png(p, w, h, bpp, rows):
    raw = b''.join(b'\x00' + r for r in rows)
    ch = lambda t, b: struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    open(p, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6 if bpp == 4 else 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b''))
w, h, bpp, rows = read_png(src)
for dens, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    out = []
    for y in range(size):
        r = rows[y * h // size]; out.append(b''.join(r[(x * w // size) * bpp:(x * w // size) * bpp + bpp] for x in range(size)))
    write_png(f'{res}/mipmap-{dens}/ic_launcher.png', size, size, bpp, out)
PY
"$AAPT2" compile --dir "$OUT/res" -o "$OUT/res.zip"

echo "== game assets"
cp "$GAME/index.html" "$GAME/style.css" "$OUT/assets/"
cp -r "$GAME/js" "$GAME/icons" "$OUT/assets/"
[ -d "$GAME/fonts" ] && cp -r "$GAME/fonts" "$OUT/assets/" || true

echo "== link"
"$AAPT2" link -I "$TOOLS/framework.jar" --manifest "$HERE/AndroidManifest.xml" \
  --min-sdk-version 21 --target-sdk-version 29 --version-code "$VC" --version-name "$VN" \
  -A "$OUT/assets" -o "$OUT/unsigned.apk" "$OUT/res.zip" --auto-add-overlay

echo "== code"
javac -nowarn --release 8 -cp "$TOOLS/android.jar" -d "$OUT/classes" $(find "$HERE/src" -name '*.java') 2>&1 | grep -v -E 'JAVA_TOOL_OPTIONS|bootstrap|warning' || true
# dx 14 reads class files up to Java 7; the code uses no Java 8 features, so mark them as version 51
find "$OUT/classes" -name '*.class' -exec python3 -c "import sys; p=sys.argv[1]; b=bytearray(open(p,'rb').read()); b[6:8]=(51).to_bytes(2,'big'); open(p,'wb').write(b)" {} \;
java -cp "$TOOLS/dx.jar" com.android.dx.command.Main --dex --output="$OUT/classes.dex" "$OUT/classes" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
(cd "$OUT" && zip -q -j unsigned.apk classes.dex)

echo "== sign"
KS="$HERE/debug.keystore"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias sipahsalar -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Sipahi se Sipahsalar, O=Sipahsalar, C=PK" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
fi
cp "$OUT/unsigned.apk" "$OUT/signed.apk"
jarsigner -keystore "$KS" -storepass android -keypass android -sigalg SHA256withRSA -digestalg SHA-256 "$OUT/signed.apk" sipahsalar 2>&1 | grep -v -E 'JAVA_TOOL_OPTIONS|^$' || true

echo "== align"
python3 - "$OUT/signed.apk" "$OUT/SipahiSeSipahsalar.apk" <<'PY'
import sys, zipfile
# 4-byte align stored entries (what zipalign does), keeping every entry's bytes and the v1 signature intact
src, dst = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src); zout = zipfile.ZipFile(dst, 'w')
for info in zin.infolist():
    data = zin.read(info.filename)
    ni = zipfile.ZipInfo(info.filename, info.date_time); ni.compress_type = info.compress_type; ni.external_attr = info.external_attr; ni.create_system = info.create_system
    if ni.compress_type == zipfile.ZIP_STORED:
        hdr = 30 + len(info.filename.encode()); off = zout.fp.tell()
        ni.extra = b'\x00' * ((4 - (off + hdr) % 4) % 4)
    zout.writestr(ni, data)
zout.close()
PY
ls -la "$OUT/SipahiSeSipahsalar.apk"
echo "Built $OUT/SipahiSeSipahsalar.apk"
