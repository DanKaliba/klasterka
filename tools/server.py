"""Lokální server pro vývoj: jako `python -m http.server`, ale zakáže cache,
aby prohlížeč po každé úpravě načetl nové JS (jinak míchá staré a nové soubory).

Spuštění z kořene projektu:  python tools/server.py  → http://localhost:8010/
"""
import http.server
import os
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8010
    http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
