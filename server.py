"""Local development server for UniverSeeker and its SQLite-backed catalog API."""

import argparse
import json
import logging
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from database import DATABASE_PATH, BASE_DIR, initialize_database, list_universities


class UniverSeekerRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: object, directory: str = str(BASE_DIR), **kwargs: object) -> None:
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:
        if urlsplit(self.path).path == "/api/universities":
            try:
                payload = json.dumps(
                    list_universities(DATABASE_PATH),
                    ensure_ascii=False,
                ).encode("utf-8")
            except (OSError, ValueError, sqlite3.Error):
                logging.exception("Could not read the university catalog")
                self.send_error(500, "Could not read the university catalog")
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()

    def translate_path(self, path: str) -> str:
        resolved = Path(super().translate_path(path)).resolve()
        database_prefix = DATABASE_PATH.resolve().name
        if resolved.name == database_prefix or resolved.name.startswith(database_prefix + "-"):
            return str(BASE_DIR / "__private_database_file_not_found__")
        return str(resolved)


def create_server(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    initialize_database()
    return ThreadingHTTPServer((host, port), UniverSeekerRequestHandler)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the UniverSeeker local web server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    args = parser.parse_args()

    server = create_server(args.host, args.port)
    print("UniverSeeker is running at http://{}:{}/".format(*server.server_address))
    print("University catalog database: {}".format(DATABASE_PATH))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping UniverSeeker server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
