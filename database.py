"""SQLite storage for the public university catalog."""

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Generator, List

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "universities.sqlite3"
SCHEMA_PATH = BASE_DIR / "schema.sql"
SEED_PATH = BASE_DIR / "universities_seed.json"
SEED_VERSION = "catalog-seed-v1"

INSERT_SQL = """
    INSERT INTO universities (
        id, name, country, flag, city, qs_rank, the_rank, shanghai_rank,
        residency_available, degrees_json, funding_type, funding_by_degree_json,
        campus_image, campus_image_source, campus_image_credit, req_cv, req_video,
        req_interview, req_tests, sat_required, essays_json, official_url
    ) VALUES (
        :id, :name, :country, :flag, :city, :qs_rank, :the_rank, :shanghai_rank,
        :residency_available, :degrees_json, :funding_type, :funding_by_degree_json,
        :campus_image, :campus_image_source, :campus_image_credit, :req_cv, :req_video,
        :req_interview, :req_tests, :sat_required, :essays_json, :official_url
    )
"""


@contextmanager
def _connect(database_path: Path) -> Generator[sqlite3.Connection, None, None]:
    connection = sqlite3.connect(str(database_path))
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _seed_values(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item["id"],
        "name": item["name"],
        "country": item["country"],
        "flag": item.get("flag", "🎓"),
        "city": item["city"],
        "qs_rank": int(item.get("qsRank", 0)),
        "the_rank": int(item.get("theRank", 0)),
        "shanghai_rank": int(item.get("shanghaiRank", 0)),
        "residency_available": int(bool(item.get("residencyAvailable", False))),
        "degrees_json": json.dumps(item.get("degrees", []), ensure_ascii=False),
        "funding_type": item.get("fundingType", "Self-funded"),
        "funding_by_degree_json": json.dumps(item.get("fundingByDegree", {}), ensure_ascii=False),
        "campus_image": item.get("campusImage", ""),
        "campus_image_source": item.get("campusImageSource", ""),
        "campus_image_credit": item.get("campusImageCredit", ""),
        "req_cv": item.get("reqCV", ""),
        "req_video": item.get("reqVideo", ""),
        "req_interview": item.get("reqInterview", ""),
        "req_tests": item.get("reqTests", ""),
        "sat_required": int(bool(item.get("satRequired", False))),
        "essays_json": json.dumps(item.get("essays", []), ensure_ascii=False),
        "official_url": item.get("officialUrl", ""),
    }


def initialize_database(
    database_path: Path = DATABASE_PATH,
    seed_path: Path = SEED_PATH,
) -> None:
    """Create tables and import the starter catalog once, without overwriting edits."""
    database_path.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with _connect(database_path) as connection:
        connection.executescript(schema)
        seeded = connection.execute(
            "SELECT value FROM catalog_meta WHERE key = 'seed_version'"
        ).fetchone()
        if seeded is not None:
            return

        universities = json.loads(seed_path.read_text(encoding="utf-8"))
        if not isinstance(universities, list):
            raise ValueError("University seed file must contain a JSON array")
        if connection.execute("SELECT COUNT(*) FROM universities").fetchone()[0] == 0:
            connection.executemany(INSERT_SQL, [_seed_values(item) for item in universities])
        connection.execute(
            "INSERT INTO catalog_meta (key, value) VALUES ('seed_version', ?)",
            (SEED_VERSION,),
        )


def list_universities(database_path: Path = DATABASE_PATH) -> List[Dict[str, Any]]:
    """Return catalog rows in the camelCase format consumed by the browser."""
    with _connect(database_path) as connection:
        rows = connection.execute(
            "SELECT * FROM universities ORDER BY name COLLATE NOCASE, id"
        ).fetchall()

    result: List[Dict[str, Any]] = []
    for row in rows:
        result.append(
            {
                "id": row["id"],
                "name": row["name"],
                "country": row["country"],
                "flag": row["flag"],
                "city": row["city"],
                "qsRank": row["qs_rank"],
                "theRank": row["the_rank"],
                "shanghaiRank": row["shanghai_rank"],
                "residencyAvailable": bool(row["residency_available"]),
                "degrees": json.loads(row["degrees_json"]),
                "fundingType": row["funding_type"],
                "fundingByDegree": json.loads(row["funding_by_degree_json"]),
                "campusImage": row["campus_image"],
                "campusImageSource": row["campus_image_source"],
                "campusImageCredit": row["campus_image_credit"],
                "reqCV": row["req_cv"],
                "reqVideo": row["req_video"],
                "reqInterview": row["req_interview"],
                "reqTests": row["req_tests"],
                "satRequired": bool(row["sat_required"]),
                "essays": json.loads(row["essays_json"]),
                "officialUrl": row["official_url"],
            }
        )
    return result


def add_university(
    item: Dict[str, Any],
    database_path: Path = DATABASE_PATH,
) -> None:
    """Insert one catalog entry; duplicate IDs are reported by SQLite."""
    with _connect(database_path) as connection:
        connection.execute(INSERT_SQL, _seed_values(item))
