from __future__ import annotations

import argparse
import calendar
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
import sys

import openpyxl
from openpyxl import Workbook


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import build_stock_cover_v3_all_months as core  # noqa: E402


DEFAULT_OUTPUT_ROOT = core.REPORT_DIR / "outputs"
RAW_STOCK_DIRS = [
    core.REPORT_DIR / "CloudViu Stock Raw Data",
    core.RAW_DIR,
]
CODE_HEADER = core.HEADERS[11]
GROUP_CODE_HEADER = core.HEADERS[12]
REPORT_CONFIGS = {
    "stock-cover-day": {
        "channel": "TT",
        "folder": "stock_cover_monthly",
        "filename_prefix": "Raw data Stock Cover Day",
    },
    "stock-latest": {
        "channel": "MT",
        "folder": "stock_latest_monthly",
        "filename_prefix": "Raw data Stock Latest",
    },
}


def parse_report_month(value: str) -> tuple[int, int]:
    text = value.strip()
    if text.casefold() == "latest":
        return latest_report_month()
    for fmt in ("%Y-%m", "%Y_%m", "%b-%Y", "%b %Y", "%B-%Y", "%B %Y"):
        try:
            dt = datetime.strptime(text, fmt)
            return dt.year, dt.month
        except ValueError:
            pass
    raise argparse.ArgumentTypeError("Use report month format like 2026-05, May 2026, or latest")


def latest_report_month() -> tuple[int, int]:
    months = []
    for raw_dir in RAW_STOCK_DIRS:
        if not raw_dir.exists():
            continue
        for path in raw_dir.glob("*.xlsx"):
            parsed = core.raw_month_from_name(path.name)
            if parsed:
                months.append((parsed[0], parsed[1], path.name))
    if not months:
        raise argparse.ArgumentTypeError(
            "Cannot detect latest report month because no date-based raw stock filename was found."
        )
    year, month, _name = sorted(months)[-1]
    return year, month


def output_default(report_year: int, report_month: int, report_type: str) -> Path:
    month_name = calendar.month_abbr[report_month]
    config = REPORT_CONFIGS[report_type]
    folder = DEFAULT_OUTPUT_ROOT / config["folder"]
    return folder / f"{config['filename_prefix']} - {month_name} {report_year}.xlsx"


def choose_raw_file(report_year: int, report_month: int, explicit_raw: Path | None = None) -> Path:
    if explicit_raw:
        if not explicit_raw.exists():
            raise FileNotFoundError(f"Raw stock file not found: {explicit_raw}")
        return explicit_raw

    candidates = []
    for raw_dir in RAW_STOCK_DIRS:
        if not raw_dir.exists():
            continue
        for path in raw_dir.glob("*.xlsx"):
            parsed = core.raw_month_from_name(path.name)
            if parsed == (report_year, report_month):
                priority = 1 if core.re.search(r"\b(28|29|30|31)\b", path.name) else 0
                candidates.append((priority, path.name, path))
    if not candidates:
        cloudviu_candidates = []
        for raw_dir in RAW_STOCK_DIRS:
            if raw_dir.exists():
                cloudviu_candidates.extend(sorted(raw_dir.glob("CloudViu Stock Raw Data*.xlsx")))
        if len(cloudviu_candidates) == 1:
            return cloudviu_candidates[0]
        if len(cloudviu_candidates) > 1:
            cloudviu_text = ", ".join(path.name for path in cloudviu_candidates)
            raise FileNotFoundError(
                f"More than one CloudViu Stock Raw Data file found: {cloudviu_text}\n"
                "Please rerun with --raw-stock-file \"full path to file\" so the correct month is explicit."
            )
        available = []
        for raw_dir in RAW_STOCK_DIRS:
            if not raw_dir.exists():
                continue
            for path in raw_dir.glob("*.xlsx"):
                parsed = core.raw_month_from_name(path.name)
                if parsed:
                    available.append((parsed[0], parsed[1], path.name))
        available_text = ", ".join(
            f"{year}-{month:02d}: {name}" for year, month, name in sorted(available)
        ) or "none"
        raise FileNotFoundError(
            f"No raw stock file found for report month {report_year}-{report_month:02d}\n"
            f"Raw stock folders checked: {', '.join(str(path) for path in RAW_STOCK_DIRS)}\n"
            f"Available raw stock report months: {available_text}\n"
            "If the file is named CloudViu Stock Raw Data.xlsx, keep only one such file in the folder or rerun with --raw-stock-file \"full path to file\"."
        )
    return sorted(candidates)[-1][2]


def add_agg(target, row, idx):
    stock = row[idx["#Total Stock"]] or 0
    stock_baht = row[idx["Total Stock (Baht)"]] or 0
    sell = row[idx["Sell in (1+2+3)/3"]] or 0
    sell_baht = row[idx[" Total Sell in (Baht) "]] or 0
    target["rows"] += 1
    target["stores"].add((row[idx[CODE_HEADER]], row[idx["Store Name"]]))
    target["skus"].add(row[idx["Product Name"]])
    target["stock"] += stock
    target["stock_baht"] += stock_baht
    target["sell"] += sell
    target["sell_baht"] += sell_baht


def output_store_name(store_row):
    return store_row.get("Store Name (SCVD)") or store_row.get("Store Name (CloudViu)") or store_row.get("Store Name (Group)")


def group_output_stores(selected_store_keys, stores):
    grouped = defaultdict(list)
    for store_key in selected_store_keys:
        store_row = stores[store_key]
        grouped[store_row["_store_code"]].append(store_key)
    return grouped



def build_monthly_workbook(
    report_year: int,
    report_month: int,
    output: Path,
    raw_file: Path | None = None,
    report_type: str = "stock-cover-day",
) -> dict:
    config = REPORT_CONFIGS[report_type]
    channel_filter = config["channel"]
    selected_raw = choose_raw_file(report_year, report_month, raw_file)
    label = core.month_label(report_year, report_month)
    months = [(report_year, report_month)]

    stores, by_code, canonical = core.load_store_master()
    product_by_exact, product_by_norm, pcode_by_name, product_master_by_name = core.load_product_master()
    rsp_by_name = core.load_rsp()
    sell_in, sell_in_exceptions = core.load_sell_in(months, canonical)
    selected_store_keys = [key for key, store in stores.items() if store.get("Channel") == channel_filter]
    raw_idx = {header: index for index, header in enumerate(core.HEADERS)}

    products, stock, raw_store_keys, stock_exceptions = core.load_raw_month(
        report_year,
        report_month,
        selected_raw,
        stores,
        by_code,
        product_by_exact,
        product_by_norm,
        rsp_by_name,
    )
    month_sell_in = core.resolve_month_sell_in(
        report_year,
        report_month,
        products,
        sell_in,
        rsp_by_name,
        pcode_by_name,
        product_master_by_name,
        label,
    )

    wb = Workbook(write_only=False)
    ws_raw = wb.active
    ws_raw.title = "Raw Data"
    ws_raw.append(core.HEADERS)

    channel = defaultdict(lambda: {"rows": 0, "stores": set(), "skus": set(), "stock": 0, "stock_baht": 0, "sell": 0, "sell_baht": 0})
    pgroup = defaultdict(lambda: {"rows": 0, "stores": set(), "skus": set(), "stock": 0, "stock_baht": 0, "sell": 0, "sell_baht": 0})
    store_summary = defaultdict(lambda: {"meta": None, "skus": set(), "stock": 0, "stock_baht": 0, "sell": 0, "sell_baht": 0})

    output_store_groups = group_output_stores(selected_store_keys, stores)
    for store_code, grouped_store_keys in sorted(output_store_groups.items(), key=lambda item: item[0]):
        store_key = grouped_store_keys[0]
        store_row = stores[store_key]
        store_name = output_store_name(store_row)
        store_group = store_row.get("Store Name (Group)") or store_name

        for product_name in sorted(products):
            product = products[product_name]
            current = sum(stock.get((key, product_name), {}).get("current", 0) for key in grouped_store_keys)
            new = sum(stock.get((key, product_name), {}).get("new", 0) for key in grouped_store_keys)
            total = current + new
            rsp = product["rsp"] or 0
            sell_values = [0, 0, 0]
            sell_baht = 0
            for key in grouped_store_keys:
                sell_data = month_sell_in.get((key, product_name))
                if not sell_data:
                    continue
                for index, value in enumerate(sell_data["qty"]):
                    sell_values[index] += value
                sell_baht += sell_data["baht"]
            sell_avg = sum(sell_values) / 3

            row = [
                store_row.get("Area"),
                store_row.get("Sales Region (TT)"),
                product["P_Group"],
                product["Category"],
                product["P_Code"],
                product["Product SKU"],
                product["Product Name"],
                product["Size"],
                product["Brand"],
                product["Segment"],
                product["Group"],
                store_code,
                store_row.get("Group Code"),
                store_row.get("Channel"),
                store_row.get("Type"),
                store_name,
                store_row.get("Province (EN)"),
                core.report_date(report_year, report_month),
                store_code,
                product["product_id"],
                f"{store_code}{product['Product Name']}",
                f"{product['Product SKU']}{store_group}",
                rsp,
                current,
                new,
                total,
                total * rsp,
                sell_values[0],
                sell_values[1],
                sell_values[2],
                sell_avg,
                sell_baht,
                label,
                report_year,
            ]
            ws_raw.append(row)
            add_agg(channel[row[raw_idx["Channel"]]], row, raw_idx)
            add_agg(pgroup[(row[raw_idx["P_Group"]], row[raw_idx["Category"]])], row, raw_idx)

            st_key = (store_code, store_name)
            target = store_summary[st_key]
            target["meta"] = [
                label,
                row[raw_idx["Area"]],
                row[raw_idx["New Region"]],
                store_code,
                row[raw_idx[GROUP_CODE_HEADER]],
                row[raw_idx["Channel"]],
                row[raw_idx["Type"]],
                store_name,
                row[raw_idx["Province"]],
            ]
            target["skus"].add(product_name)
            target["stock"] += total
            target["stock_baht"] += total * rsp
            target["sell"] += sell_avg
            target["sell_baht"] += sell_baht

    core.style_sheet(ws_raw)
    core.set_widths(ws_raw, {3: 24, 4: 24, 6: 28, 7: 42, 16: 34, 21: 42, 22: 42})

    channel_rows = [
        [key, data["rows"], len(data["stores"]), len(data["skus"]), data["stock"], data["stock_baht"], data["sell"], data["sell_baht"], core.cvd(data["stock_baht"], data["sell_baht"])]
        for key, data in sorted(channel.items(), key=lambda item: str(item[0]))
    ]
    core.write_sheet(wb, "Summary By Channel", ["Channel", "Rows", "Stores", "SKUs", "Total Stock", "Total Stock (Baht)", "Sell-in Qty", "Total Sell-in (Baht)", "CVD"], channel_rows)

    pgroup_rows = [
        [pg, cat, data["rows"], len(data["stores"]), len(data["skus"]), data["stock"], data["stock_baht"], data["sell"], data["sell_baht"], core.cvd(data["stock_baht"], data["sell_baht"])]
        for (pg, cat), data in sorted(pgroup.items(), key=lambda item: (str(item[0][0]), str(item[0][1])))
    ]
    core.write_sheet(wb, "Summary By P_Group", ["P_Group", "Category", "Rows", "Stores", "SKUs", "Total Stock", "Total Stock (Baht)", "Sell-in Qty", "Total Sell-in (Baht)", "CVD"], pgroup_rows, {1: 24, 2: 24})

    store_rows = [
        data["meta"] + [len(data["skus"]), data["stock"], data["stock_baht"], data["sell"], data["sell_baht"], core.cvd(data["stock_baht"], data["sell_baht"])]
        for (_code, _name), data in sorted(store_summary.items(), key=lambda item: (str(item[0][0]), str(item[0][1])))
    ]
    core.write_sheet(wb, "Summary By Store", ["Month", "Area", "New Region", "Nestlเธฃเธ Code", "Nestlเธฃเธ Group Code", "Channel", "Type", "Store Name", "Province", "SKUs", "Total Stock", "Total Stock (Baht)", "Sell-in Qty", "Total Sell-in (Baht)", "CVD"], store_rows, {8: 34})

    stock_exception_rows = [list(key) + [value["rows"], value["qty"]] for key, value in sorted(stock_exceptions.items(), key=lambda item: tuple(str(part) for part in item[0]))]
    core.write_sheet(wb, "Stock Mapping Exceptions", ["Month", "Store Code", "Outlet ID", "Outlet Name", "Product Name", "Reason", "Source Rows", "Qty"], [[label] + row for row in stock_exception_rows], {5: 42, 6: 38}, "9C6500")

    sell_exception_rows = [list(key) + [value["rows"], value["qty"]] for key, value in sorted(sell_in_exceptions.items(), key=lambda item: tuple(str(part) for part in item[0]))]
    core.write_sheet(wb, "Sell-in Mapping Exceptions", ["Month", "Customer Code", "Customer Name", "Product Name", "Reason", "Source Rows", "Qty"], sell_exception_rows, {3: 34, 4: 42, 5: 32}, "9C6500")

    output.parent.mkdir(parents=True, exist_ok=True)
    wb.save(output)

    return {
        "output": str(output),
        "report_type": report_type,
        "channel": channel_filter,
        "report_month": label,
        "raw_stock_file": str(selected_raw),
        "rows": ws_raw.max_row - 1,
        "stores": len(output_store_groups),
        "products": len(products),
        "raw_stock_stores": len(raw_store_keys),
        "stock_exception_qty": sum(value["qty"] for value in stock_exceptions.values()),
        "sell_in_exception_qty": sum(value["qty"] for value in sell_in_exceptions.values()),
        "stock_baht": sum(row[5] for row in channel_rows),
        "sell_in_baht": sum(row[7] for row in channel_rows),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build monthly raw data workbook for Stock Cover Day reporting.",
    )
    parser.add_argument("--report-month", required=True, type=parse_report_month, help="Report month, e.g. 2026-05, May 2026, or latest")
    parser.add_argument("--raw-stock-file", type=Path, help="Optional explicit CloudViu stock raw data file. If omitted, the script auto-selects from Raw Data Stock.")
    parser.add_argument(
        "--report-type",
        choices=["both", "stock-cover-day", "stock-latest"],
        default="both",
        help="Which monthly raw data file to build. Default builds both TT and MT files.",
    )
    parser.add_argument("--output", type=Path, help="Output .xlsx path. Use only when --report-type is not both.")
    args = parser.parse_args()

    report_year, report_month = args.report_month
    if args.output and args.report_type == "both":
        print("ERROR: --output can only be used when --report-type is stock-cover-day or stock-latest.")
        raise SystemExit(1)
    report_types = ["stock-cover-day", "stock-latest"] if args.report_type == "both" else [args.report_type]
    results = []
    try:
        for report_type in report_types:
            output = args.output or output_default(report_year, report_month, report_type)
            results.append(build_monthly_workbook(report_year, report_month, output, args.raw_stock_file, report_type))
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(1)
    print(json.dumps(results[0] if len(results) == 1 else results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
