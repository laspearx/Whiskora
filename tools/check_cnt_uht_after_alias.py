from collections import defaultdict
from xml.etree.ElementTree import iterparse
from zipfile import ZipFile
import re


RAW_FILE = r"C:\Work\Nestle\Report\(5th) Stock Cover Day\Raw Data for Stock Cover Day Report May 2026.xlsx"
NS_MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NS_REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"
NS_DOC_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def n(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def col_name(ref):
    return re.sub(r"\d+", "", ref or "")


def load_shared_strings(zf):
    try:
        with zf.open("xl/sharedStrings.xml") as handle:
            strings = []
            text_parts = []
            for event, elem in iterparse(handle, events=("start", "end")):
                if event == "start" and elem.tag == f"{NS_MAIN}si":
                    text_parts = []
                elif event == "end" and elem.tag == f"{NS_MAIN}t":
                    text_parts.append(elem.text or "")
                elif event == "end" and elem.tag == f"{NS_MAIN}si":
                    strings.append("".join(text_parts))
                    elem.clear()
            return strings
    except KeyError:
        return []


def sheet_path(zf, sheet_name):
    workbook = "xl/workbook.xml"
    rels = "xl/_rels/workbook.xml.rels"
    target_id = None
    with zf.open(workbook) as handle:
        for _event, elem in iterparse(handle, events=("end",)):
            if elem.tag == f"{NS_MAIN}sheet" and elem.attrib.get("name") == sheet_name:
                target_id = elem.attrib.get(f"{NS_DOC_REL}id")
                break
    if not target_id:
        raise ValueError(f"Sheet not found: {sheet_name}")
    with zf.open(rels) as handle:
        for _event, elem in iterparse(handle, events=("end",)):
            if elem.tag == f"{NS_REL}Relationship" and elem.attrib.get("Id") == target_id:
                target = elem.attrib["Target"]
                target = target.lstrip("/")
                return target if target.startswith("xl/") else "xl/" + target
    raise ValueError(f"Relationship not found for {sheet_name}")


def cell_value(cell, shared_strings):
    value = cell.find(f"{NS_MAIN}v")
    if value is None:
        inline = cell.find(f"{NS_MAIN}is/{NS_MAIN}t")
        return inline.text if inline is not None else None
    text = value.text
    if cell.attrib.get("t") == "s":
        return shared_strings[int(text)]
    return text


def main():
    summary = defaultdict(lambda: {"stock_baht": 0, "sell_baht": 0, "sell1": 0, "sell2": 0, "sell3": 0, "products": set()})
    needed = {"C", "G", "O", "AA", "AB", "AC", "AD", "AF", "AG"}
    with ZipFile(RAW_FILE) as zf:
        shared_strings = load_shared_strings(zf)
        raw_sheet = sheet_path(zf, "Raw Data")
        with zf.open(raw_sheet) as handle:
            for _event, row in iterparse(handle, events=("end",)):
                if row.tag != f"{NS_MAIN}row":
                    continue
                row_num = int(row.attrib.get("r", "0"))
                if row_num == 1:
                    row.clear()
                    continue
                values = {}
                for cell in row:
                    col = col_name(cell.attrib.get("r"))
                    if col in needed:
                        values[col] = cell_value(cell, shared_strings)
                if values.get("C") != "CNT UHT":
                    row.clear()
                    continue
                key = (values.get("O"), values.get("AG"))
                data = summary[key]
                data["products"].add(values.get("G"))
                data["stock_baht"] += n(values.get("AA"))
                data["sell1"] += n(values.get("AB"))
                data["sell2"] += n(values.get("AC"))
                data["sell3"] += n(values.get("AD"))
                data["sell_baht"] += n(values.get("AF"))
                row.clear()

    print("Type\tMonth\tProducts\tStock Baht\tSell1\tSell2\tSell3\tSell Baht")
    for (type_name, month), data in sorted(summary.items(), key=lambda item: (str(item[0][0]), str(item[0][1]))):
        print(
            f"{type_name}\t{month}\t{len(data['products'])}\t"
            f"{round(data['stock_baht'], 2)}\t{round(data['sell1'], 2)}\t"
            f"{round(data['sell2'], 2)}\t{round(data['sell3'], 2)}\t{round(data['sell_baht'], 2)}"
        )


if __name__ == "__main__":
    main()
