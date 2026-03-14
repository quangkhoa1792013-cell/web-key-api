from taokey import KeySystemLogic
import os, time, sys, msvcrt
from datetime import datetime

logic = KeySystemLogic()
msg, msg_time = "", 0

def monitor():
    global msg, msg_time
    os.system('') 
    sys.stdout.write("\033[2J") 
    while True:
        conf = logic.load_conf(); db = logic.get_db(); now = time.time()
        sys.stdout.write("\033[H") 
        width = 80
        print("=" * width)
        print(f"{conf['app_name']} ADMIN | {len(db)}/{conf['max_slots']} SLOTS".center(width))
        print("=" * width)
        
        keys_list = list(db.items())
        print(f"{'STT':<4} | {'MA KEY (25 CHARS)':<35} | {'TRANG THAI':<12} | {'CON LAI'}")
        print("-" * width)
        for i in range(conf['max_slots']):
            if i < len(keys_list):
                k, v = keys_list[i]
                left = int(v['expire_ts'] - now)
                status = "\033[92mACTIVE\033[0m" if left > 0 else "\033[91mEXPIRED\033[0m"
                print(f"[{i+1:02d}] | {k[:35]:<35} | {status:<21} | {max(0, left):02d}s")
            else:
                print(f"[{i+1:02d}] | {'(Empty)':<35} | {'-':<12} | -")
        
        print("-" * width)
        print(f" >> {msg if time.time()-msg_time < 2 else ''}".ljust(width))
        print(" [N] Tao Key | [Q] Thoat | [1-9] Renew nhanh ".center(width))

        start = time.time()
        while time.time() - start < 0.5:
            if msvcrt.kbhit():
                c = msvcrt.getch().decode().lower()
                if c == 'n': logic.create_key(); msg = "DA TAO KEY MOI!"; msg_time = time.time(); break
                if c.isdigit():
                    idx = int(c)-1
                    if 0 <= idx < len(keys_list): logic.renew_key(keys_list[idx][0]); msg = f"DA GIA HAN SLOT {c}!"; msg_time = time.time()
                    break
            time.sleep(0.02)

if __name__ == "__main__": monitor()