# Локальный просмотр сайта: веб-сервер для этой папки, который отдаёт файлы частями (запросы Range).
# Без этого браузер не перематывает целую запись матна, а Safari вообще не проигрывает записи.
# Его запускают start-mac.command и start-windows.bat; вручную — python3 serve.py 8080. На хостинг он не нужен.
import http.server, io, mimetypes, os, re, sys

for t, ext in (("text/javascript", ".js"), ("application/json", ".json"), ("audio/mp4", ".m4a")):
    mimetypes.add_type(t, ext)
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        m = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        path = self.translate_path(self.path)
        if not m or not any(m.groups()) or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        start, end = (int(a), min(int(b) if b else size - 1, size - 1)) if a else (max(0, size - int(b)), size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        with open(path, "rb") as f:
            f.seek(start)
            part = f.read(end - start + 1)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(len(part)))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return io.BytesIO(part)


try:
    http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8080), Handler).serve_forever()
except KeyboardInterrupt:
    pass
