import json, time, secrets, string, os

class KeySystemLogic:
    def __init__(self):
        self.cur_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_file = os.path.join(self.cur_dir, "khoadz_database.json")
        self.conf_file = os.path.join(self.cur_dir, "setting.json")
        self._init_files()

    def _init_files(self):
        if not os.path.exists(self.db_file):
            with open(self.db_file, "w", encoding="utf-8") as f: json.dump({}, f)
        if not os.path.exists(self.conf_file):
            default = {
                "app_name": "KHOADZ PREMIUM", 
                "max_slots": 5, 
                "test_duration": 30, 
                "api_port": 5000, 
                "secret_salt": "KHOA_DZ_2026"
            }
            with open(self.conf_file, "w", encoding="utf-8") as f: json.dump(default, f, indent=4)

    def load_conf(self):
        with open(self.conf_file, "r", encoding="utf-8") as f: return json.load(f)

    def get_db(self):
        try:
            with open(self.db_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def save_db(self, data):
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def create_key(self):
        conf = self.load_conf()
        db = self.get_db()
        if len(db) >= conf['max_slots']: return None, "FULL"
        dur = conf['test_duration']
        chaos = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(25))
        key = f"KHOA-{dur}S-{chaos}"
        db[key] = {"KEY": key, "HWID": "NOT_LINKED", "expire_ts": time.time() + dur}
        self.save_db(db)
        return key, "SUCCESS"

    def renew_key(self, key_id):
        db = self.get_db()
        if key_id in db:
            conf = self.load_conf()
            db[key_id]['expire_ts'] = time.time() + conf.get('test_duration', 30)
            self.save_db(db)
            return True
        return False