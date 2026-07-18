import base64
import io
import re
import zipfile
from pathlib import Path
import struct
import zlib


SOURCE = Path(r"C:\Work\Nestle\Report\(5th) Stock Cover Day\Stock Monthly.xlsx")
OUT_DIR = Path(r"C:\Users\User\Documents\Whiskora\outputs\stock_monthly_mashup")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(SOURCE) as zf:
        raw = zf.read("customXml/item40.xml")

    text = raw.decode("utf-16")
    payload = re.sub(r"<[^>]+>", "", text).strip()
    data = base64.b64decode(payload)
    (OUT_DIR / "DataMashup.bin").write_bytes(data)
    print("DataMashup bytes", len(data))

    offsets = [m.start() for m in re.finditer(b"PK\x03\x04", data)]
    print("PK offsets", offsets[:20], "count", len(offsets))

    for idx, offset in enumerate(offsets):
        try:
            with zipfile.ZipFile(io.BytesIO(data[offset:])) as package:
                names = package.namelist()
                print("ZIP", idx, "offset", offset, "entries", len(names))
                for name in names[:50]:
                    print(" ", name, package.getinfo(name).file_size)
                target = OUT_DIR / f"zip_{idx}"
                target.mkdir(exist_ok=True)
                package.extractall(target)
        except Exception as exc:
            print("ZIP_FAIL", idx, offset, repr(exc))

    # Excel's DataMashup package stores useful files as local ZIP entries even
    # when the central directory is not useful to Python's zipfile module.
    for offset in offsets:
        (
            signature,
            _version,
            _flag,
            compression_method,
            _mtime,
            _mdate,
            _crc,
            compressed_size,
            _uncompressed_size,
            name_len,
            extra_len,
        ) = struct.unpack_from("<IHHHHHIIIHH", data, offset)
        if signature != 0x04034B50 or compression_method != 8:
            continue
        name_start = offset + 30
        name = data[name_start : name_start + name_len].decode("utf-8")
        body_start = name_start + name_len + extra_len
        compressed = data[body_start : body_start + compressed_size]
        body = zlib.decompress(compressed, -15)
        out_path = OUT_DIR / name.replace("/", "_")
        out_path.write_bytes(body)
        print("EXTRACTED", name, len(body), "->", out_path)


if __name__ == "__main__":
    main()
