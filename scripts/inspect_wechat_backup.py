from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path


ROOT = Path(
    r"D:\其余\WeChat Files\wxid_lnnk3p04zjse22\BackupFiles"
    r"\iphone_02e189d2cdebea7f733eb1efb5890c13"
)

if len(sys.argv) > 1:
    candidate = Path(sys.argv[1])
    if (candidate / "Backup.db").exists():
        ROOT = candidate
    else:
        backup_dirs = sorted(
            path
            for path in candidate.iterdir()
            if path.is_dir() and (path / "Backup.db").exists()
        )
        if not backup_dirs:
            raise SystemExit(f"No WeChat backup set found under: {candidate}")
        ROOT = backup_dirs[0]


def display_value(value: object) -> object:
    if isinstance(value, bytes):
        return {
            "type": "blob",
            "length": len(value),
            "head_hex": value[:64].hex(),
        }
    return value


for name in ("BAK_0_TEXT", "BAK_0_MEDIA", "Backup.db"):
    path = ROOT / name
    if not path.exists():
        continue
    with path.open("rb") as handle:
        head = handle.read(96)
    print(
        json.dumps(
            {
                "file": name,
                "size": path.stat().st_size,
                "head_hex": head.hex(),
                "head_ascii": "".join(
                    chr(byte) if 32 <= byte <= 126 else "." for byte in head
                ),
                "block_aligned_16": path.stat().st_size % 16 == 0,
                "sqlite_header": head.startswith(b"SQLite format 3\x00"),
            },
            ensure_ascii=False,
        )
    )

connection = sqlite3.connect(ROOT / "Backup.db")
connection.row_factory = sqlite3.Row
try:
    tables = connection.execute(
        """
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
        """
    ).fetchall()

    for table in tables:
        name = table["name"]
        columns = [
            dict(row)
            for row in connection.execute(f'PRAGMA table_info("{name}")').fetchall()
        ]
        count = connection.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
        sample_rows = connection.execute(f'SELECT * FROM "{name}" LIMIT 5').fetchall()
        samples = [
            {key: display_value(row[key]) for key in row.keys()} for row in sample_rows
        ]
        print(
            json.dumps(
                {
                    "table": name,
                    "sql": table["sql"],
                    "columns": columns,
                    "count": count,
                    "samples": samples,
                },
                ensure_ascii=False,
            )
        )
except sqlite3.DatabaseError as error:
    print(
        json.dumps(
            {
                "file": "Backup.db",
                "sqlite": False,
                "diagnosis": "encrypted-or-unsupported",
                "message": str(error),
            },
            ensure_ascii=False,
        )
    )
finally:
    connection.close()
