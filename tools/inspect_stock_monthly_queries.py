from pathlib import Path


SOURCE = Path(r"C:\Users\User\Documents\Whiskora\outputs\stock_monthly_mashup\Formulas_Section1.m")


def find_query(text, name):
    marker = f'shared #"{name}"'
    start = text.find(marker)
    if start < 0:
        marker = f"shared {name}"
        start = text.find(marker)
    if start < 0:
        return None
    next_start = text.find("\nshared #", start + 1)
    if next_start < 0:
        next_start = len(text)
    return text[start:next_start]


def main():
    text = SOURCE.read_text(encoding="utf-8-sig")
    print("### Query Names")
    for part in text.split("\nshared ")[1:]:
        print(part.split(" =", 1)[0].strip())
    for name in [
        "Raw Data Stock",
        "Transform File (4)",
        "Transform Sample File (4)",
        "Sell-In",
        "Store Master",
        "Store Master (2)",
        "Product Master",
        "Product Master (2)",
        "Master Attibute",
        "Month",
        "RSP",
    ]:
        print(f"\n### {name}")
        query = find_query(text, name)
        if query is None:
            print("not found")
        else:
            print(query[:6000])


if __name__ == "__main__":
    main()
