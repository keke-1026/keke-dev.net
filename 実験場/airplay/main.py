import socket
import threading
import time
import plistlib  # 追加: Apple形式のデータを作成するライブラリ
from zeroconf import IPVersion, ServiceInfo, Zeroconf

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def handle_client(client_socket, addr):
    print(f"\n[接続検知] iPhone ({addr[0]}) と通信を開始します。")
    try:
        while True:
            data = client_socket.recv(4096)
            if not data:
                break
            
            request_text = data.decode('utf-8', errors='ignore')
            
            header_text = request_text.split('\r\n\r\n')[0]
            print("\n--- iPhoneからのリクエスト ---")
            print(header_text)
            print("----------------------------")
            
            cseq = "0"
            for line in header_text.split('\r\n'):
                if line.upper().startswith("CSEQ:"):
                    cseq = line.split(":")[1].strip()
            
            if "GET /info" in request_text:
                print("-> [応答] 厳格なApple様式（バイナリ形式）で情報を返します...")
                
                # AppleTVの情報を辞書で定義
                info_dict = {
                    "macAddress": "00:11:22:33:44:55",
                    "model": "AppleTV3,2",
                    "pi": "b08f5a79-db29-4384-b456-a4784d9e6055",
                    "vv": 2,
                    "features": 130367356919,  # mDNSで設定した 0x1E5A7FFFF7 の10進数
                    "statusFlags": 68
                }
                
                # Python標準機能でAppleのバイナリplist形式に変換
                body_bytes = plistlib.dumps(info_dict, fmt=plistlib.FMT_BINARY)
                
                response_headers = (
                    "RTSP/1.0 200 OK\r\n"
                    f"CSeq: {cseq}\r\n"
                    "Content-Type: application/x-apple-binary-plist\r\n"
                    f"Content-Length: {len(body_bytes)}\r\n"
                    "Server: AirTunes/220.68\r\n"
                    "\r\n"
                )
                
                # ヘッダー（文字列）とボディ（バイナリ）を結合して送信
                client_socket.sendall(response_headers.encode('utf-8') + body_bytes)
                
            else:
                print(f"-> [応答] {request_text.split(' ')[0]} リクエストを受理 (200 OK)")
                response = (
                    "RTSP/1.0 200 OK\r\n"
                    f"CSeq: {cseq}\r\n"
                    "Server: AirTunes/220.68\r\n"
                    "\r\n"
                )
                client_socket.sendall(response.encode('utf-8'))
                
    except Exception as e:
        print(f"通信エラー: {e}")
    finally:
        client_socket.close()
        print(f"\n[切断] iPhone ({addr[0]}) との通信が終了しました。")

def rtsp_server(ip, port):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((ip, port))
    server_socket.listen(5)
    print(f"\n[TCP server] {port}番ポートでiPhoneからの通信を待機中...\n")

    try:
        while True:
            client_socket, addr = server_socket.accept()
            client_thread = threading.Thread(target=handle_client, args=(client_socket, addr), daemon=True)
            client_thread.start()
    except Exception as e:
        pass
    finally:
        server_socket.close()

def main():
    local_ip = get_local_ip()
    port = 7000
    service_name = "My_AirPlay_Receiver"

    server_thread = threading.Thread(target=rtsp_server, args=(local_ip, port), daemon=True)
    server_thread.start()

    desc = {
        "deviceid": "00:11:22:33:44:55",
        "features": "0x5A7FFFF7,0x1E",
        "model": "AppleTV3,2",
        "srcvers": "220.68",
        "flags": "0x4",
    }

    info = ServiceInfo(
        "_airplay._tcp.local.",
        f"{service_name}._airplay._tcp.local.",
        addresses=[socket.inet_aton(local_ip)],
        port=port,
        properties=desc,
        server=f"{service_name}.local.",
    )

    zeroconf = Zeroconf(ip_version=IPVersion.V4Only)
    print(f"AirPlayデバイスを登録中... (IP: {local_ip}, Port: {port})")
    zeroconf.register_service(info)
    print("登録完了。iPhoneの画面ミラーリングを開いてタップしてみてください。")
    print("終了するには Ctrl + C を押してください。")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n停止処理中...")
        zeroconf.unregister_service(info)
        zeroconf.close()
        print("停止しました。")

if __name__ == "__main__":
    main()