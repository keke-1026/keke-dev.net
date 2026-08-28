API_KEY = "AIzaSyB5jfXZAvN7gHjwNtnlaMjBBLU2QsbuLIg"
CF_TOKEN = "eyJhIjoiZTY5ZTAzNWUzYTQzZDZjYmJlZmJiMGI3OGI1NDU5OWUiLCJ0IjoiZWY1YzZjYzMtYTVkMC00MWM1LWJkOTAtNjk0YjZhOTc1ZmRmIiwicyI6Ik1qUXhNbVl4WXpndFlqTmxOeTAwTUdJNUxXRmpNVFV0TVRoaE9HSmtaR1F4TkRGaiJ9"
CUSTOM_DOMAIN = "スクエアくん.jp"

# @markdown ### yt-dlp動作ver.1.1080
# @markdown <br>

# @markdown ### yt-dlp動作との変更点と注意点
# @markdown このver.1.1080は､前回yt-dlpから､googlevideo.comの取得と､動画直保存を削除しました｡<br>
# @markdown あと結構安定しません()<br>
# @markdown googlevideo.com利用､または動画直保存を利用したい場合は､前回版のyt-dlp動作をご利用ください｡<br>
# @markdown <br>
# @markdown また､YouTubeの解析に「yt-dlp」を使用しています｡YouTube側が､yt-dlpの使用を拒否する場合がございますので､その際は左上のランタイムから､「ランタイムを接続解除して削除」を選択し､右上の再接続を選択してください｡この方法でも再度同じエラーが出現する場合､少し時間を開けてからもう一度お試しください｡

# @markdown ### yt-dlp動作1.1080の利用規約やコードの利用規約
# @markdown yt-dlp動作ver.1.1080を使用する場合の利用規約です｡本規約の更新を行うものはkeke(私)とし､規約を変更し公開した時点でこの規約が設定されることに同意します｡(本利用規約は､yt-dlp動作には適用されません｡)<br>
# @markdown ### 1.利用制限について<br>
# @markdown 利用制限はとくにない｡ですが､本サービスでYouTube Data API v3を使用しています｡<br>
# @markdown 特に使用制限は決めませんが､このAPIKeyを悪用すること自体禁止します｡<br>
# @markdown ### 2.コピーの作成について
# @markdown コピーの作成についても許可をしますが､本規約の更新があった場合､その規約が適応され､コピーされていたとしても､本規約が利用されることに同意します｡<br>
# @markdown <br>
# @markdown ### 検索くん
search_query = "" # @param {type:"string"}
max_results = 10 # @param {type:"number"}

# @markdown ### YouTube動画ID
target_video_id = "" # @param {type:"string"}

# @markdown ### モード
# @markdown 最速モード...動画処理の最初が終了次第再生をスタート 安定はせずにめっちゃ止まります <br>
# @markdown 安定モード...動画処理がすべて終了して送信完了で再生スタート 安定すると思いきや結構安定しません() なので最速モードをおすすめします
playback_mode = "最速モード" # @param ["最速モード", "安定モード"]

import os
import subprocess
import threading
import time
import functools
import http.server
import socketserver
from IPython.display import display, Image, Markdown, HTML

try:
    from googleapiclient.discovery import build
    import yt_dlp
    if not os.path.exists('/usr/bin/cloudflared'):
        raise ImportError
except ImportError:
    !pip install -U google-api-python-client yt-dlp ffmpeg-python -q
    !apt -y install ffmpeg
    !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    !dpkg -i cloudflared-linux-amd64.deb
    from googleapiclient.discovery import build
    import yt_dlp

class SecureHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(403, "Forbidden")
        return None

def start_http_server(port, directory):
    Handler = functools.partial(SecureHTTPRequestHandler, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            httpd.serve_forever()
    except OSError:
        pass

def run_search_logic(query, count):
    if not query.strip():
        return

    youtube = build('youtube', 'v3', developerKey=API_KEY)
    request = youtube.search().list(
        q=query,
        part='snippet',
        maxResults=int(count),
        type='video'
    )
    response = request.execute()

    display(Markdown("---"))
    display(Markdown(f"### 検索結果: {query}"))

    for item in response['items']:
        v_id = item['id']['videoId']
        title = item['snippet']['title']
        thumb = item['snippet']['thumbnails']['medium']['url']

        display(Markdown(f"**{title}**"))
        display(Image(url=thumb, width=200))
        print(f"動画ID: {v_id}")
        print("-" * 20)

def create_player_html(video_dir, v_id, title, uploader, upload_date, thumbnail_url):
    if len(upload_date) == 8:
        upload_date = f"{upload_date[:4]}/{upload_date[4:6]}/{upload_date[6:]}"

    youtube_url = f"https://www.youtube.com/watch?v={v_id}"
    page_url = f"https://{CUSTOM_DOMAIN}/{v_id}/"

    html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>

    <link rel="icon" href="https://youtube.com/favicon.ico">

    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{uploader} ({upload_date})">
    <meta property="og:image" content="{thumbnail_url}">
    <meta property="og:url" content="{page_url}">
    <meta property="og:type" content="video.other">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{uploader} ({upload_date})">
    <meta name="twitter:image" content="{thumbnail_url}">

    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: sans-serif;
        }}
        video {{
            max-width: 100%;
            max-height: 90vh;
            outline: none;
        }}
        .metadata {{
            color: #333;
            font-size: 10px;
            padding: 24px;
            text-align: center;
            line-height: 1.5;
            letter-spacing: 0.5px;
        }}
        a {{ color: #333; text-decoration: none; transition: color 0.2s; }}
        a:hover {{ color: #555; text-decoration: underline; }}
    </style>
</head>
<body>
    <video id="video" controls autoplay crossorigin="anonymous" name="media"></video>
    <div class="metadata" id="video-metadata" style="display: none;">
        {title} / @{uploader} ({upload_date}) <a href="{youtube_url}" target="_blank">YouTubeはこちら</a>
    </div>

    <script>
        var video = document.getElementById('video');
        var metaData = document.getElementById('video-metadata');
        var videoSrc = 'stream.m3u8';

        function initPlayer() {{
            if (Hls.isSupported()) {{
                var hls = new Hls({{
                    maxBufferLength: 30,
                    maxMaxBufferLength: 600,
                }});

                hls.on(Hls.Events.MANIFEST_PARSED, function() {{
                    metaData.style.display = 'block';
                    video.play().catch(function() {{}});
                }});

                hls.on(Hls.Events.ERROR, function (event, data) {{
                    if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {{
                        setTimeout(function() {{ hls.loadSource(videoSrc); }}, 3000);
                    }}
                }});

                hls.loadSource(videoSrc);
                hls.attachMedia(video);
            }} else if (video.canPlayType('application/vnd.apple.mpegurl')) {{
                video.src = videoSrc;
                video.addEventListener('loadedmetadata', function() {{
                    metaData.style.display = 'block';
                    video.play().catch(function() {{}});
                }});
            }}
        }}
        initPlayer();
    </script>
</body>
</html>"""
    with open(os.path.join(video_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)

def process_video_logic(v_id):
    if not v_id.strip():
        return

    print(f"ID: {v_id} の処理を開始します...")
    url = f"https://www.youtube.com/watch?v={v_id}"
    cf_process = None
    ffmpeg_process = None

    try:
        base_dir = "/content/hls_stream"
        video_dir = os.path.join(base_dir, v_id)
        os.makedirs(video_dir, exist_ok=True)

        for f in os.listdir(video_dir):
            os.remove(os.path.join(video_dir, f))

        ydl_opts_video = {'format': 'bestvideo[height<=1080][vcodec^=avc1]', 'quiet': True}
        ydl_opts_audio = {'format': 'bestaudio[ext=m4a]', 'quiet': True}

        with yt_dlp.YoutubeDL(ydl_opts_video) as ydl_v:
            info_v = ydl_v.extract_info(url, download=False)
            video_url = info_v.get('url')
            title = info_v.get('title', '無題の動画')
            uploader = info_v.get('uploader', 'Unknown User')
            upload_date = info_v.get('upload_date', 'Unknown Date')
            thumbnail_url = info_v.get('thumbnail', '')

            v_width = info_v.get('width', 'Unknown')
            v_height = info_v.get('height', 'Unknown')
            v_fps = info_v.get('fps', 'Unknown')
            v_codec = info_v.get('vcodec', 'Unknown')

        with yt_dlp.YoutubeDL(ydl_opts_audio) as ydl_a:
            info_a = ydl_a.extract_info(url, download=False)
            audio_url = info_a.get('url')

        if video_url and audio_url:
            create_player_html(video_dir, v_id, title, uploader, upload_date, thumbnail_url)

            port = 8000
            server_thread = threading.Thread(target=start_http_server, args=(port, base_dir), daemon=True)
            server_thread.start()

            cf_cmd = ["cloudflared", "tunnel", "--no-autoupdate", "run", "--token", CF_TOKEN]
            cf_process = subprocess.Popen(cf_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            ffmpeg_cmd = [
                "ffmpeg", "-i", video_url, "-i", audio_url,
                "-c:v", "copy", "-c:a", "copy", "-f", "hls",
                "-hls_time", "5", "-hls_list_size", "0",
                "-hls_playlist_type", "vod",
                os.path.join(video_dir, "stream.m3u8")
            ]

            ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            m3u8_path = os.path.join(video_dir, "stream.m3u8")
            exact_url = f"https://{CUSTOM_DOMAIN}/{v_id}/"

            display(Markdown("---"))
            print(f"画質: {v_width} x {v_height}")
            print(f"ビデオコーデック: {v_codec}")

            if playback_mode == "安定モード":
                print("動画処理を実行しています。完了までしばらくお待ちください...")
                ffmpeg_process.wait()
                print("処理が完了しました。")
            else:
                print("ファイルの生成を待機しています...")
                while not os.path.exists(m3u8_path):
                    time.sleep(0.5)

            display(HTML(f"<h3>共有用URL: <a href='{exact_url}' target='_blank'>{exact_url}</a></h3>"))
            display(Markdown("---"))
            print("変換処理をバックグラウンドで実行中です。")

            while True:
                time.sleep(1)

        else:
            print("URLを取得できませんでした。")

    except KeyboardInterrupt:
        print("\n実行が手動で停止されました。配信を終了します。")
    except Exception as e:
        print(f"処理中にエラーが発生しました: {e}")
    finally:
        if cf_process:
            cf_process.terminate()
        if ffmpeg_process:
            ffmpeg_process.terminate()

if search_query.strip():
    run_search_logic(search_query.strip(), max_results)

if target_video_id.strip():
    process_video_logic(target_video_id.strip())

if not target_video_id.strip() and not search_query.strip():
    print("動画IDまたは検索ワードを入力して実行してください。")